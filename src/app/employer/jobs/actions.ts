// Server actions for an employer's jobs:
//   createJob     post a new job (issue #14)
//   updateJob     edit a job and its required skills (issue #15)
//   setJobStatus  close or reopen a job (issue #15)
//
// Each one checks who is signed in and that the job belongs to their company.
// Row Level Security in the database enforces the same rules again, so a
// request that skips these pages still cannot change someone else's job.
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { validateJob, type JobErrors, type JobInput } from "@/lib/validation/job";

// What the form shows after a submit. `values` sends back what was submitted
// (or saved), because React clears a form after its action runs.
export type JobFormState = {
  status: "idle" | "success" | "error";
  message?: string;
  errors?: JobErrors;
  values?: JobInput;
  savedAt?: number; // set after a successful save; also gives the form a fresh start
};

const INVALID_SKILL = "One of the skills is not valid. Please choose skills from the list.";

export async function createJob(_previous: JobFormState, formData: FormData): Promise<JobFormState> {
  const { supabase, companyId } = await getEmployerCompany();
  const values = readJobForm(formData);

  const result = validateJob(values);
  if (!result.ok) {
    return { status: "error", message: "Please fix the highlighted fields.", errors: result.errors, values };
  }
  const { skillIds, ...job } = result.data;

  if (!companyId) {
    return { status: "error", message: "Create your company profile before posting a job.", values };
  }
  if (!(await skillsExist(skillIds))) {
    return { status: "error", message: "Please fix the highlighted fields.", errors: { skillIds: INVALID_SKILL }, values };
  }

  const { data: newJob, error: jobError } = await supabase
    .from("jobs")
    .insert({ ...job, company_id: companyId })
    .select("id")
    .single();
  if (jobError) {
    console.error("Failed to create job:", jobError);
    return { status: "error", message: "We couldn't post your job. Please try again.", values };
  }

  const { error: jobSkillsError } = await supabase
    .from("job_skills")
    .insert(skillIds.map((skillId) => ({ job_id: newJob.id, skill_id: skillId })));
  if (jobSkillsError) {
    // A job must always have its skills, so undo the job instead of leaving it half saved.
    console.error("Failed to save job skills:", jobSkillsError);
    await supabase.from("jobs").delete().eq("id", newJob.id);
    return { status: "error", message: "We couldn't post your job. Please try again.", values };
  }

  revalidatePath("/employer/dashboard");
  // No `values`, so the form clears and is ready for the next job.
  return { status: "success", message: `"${job.title}" is posted and open to candidates.`, savedAt: Date.now() };
}

// Used with .bind(null, jobId), so the job id comes from the server, not the form.
export async function updateJob(jobId: string, _previous: JobFormState, formData: FormData): Promise<JobFormState> {
  const { supabase, companyId } = await getEmployerCompany();
  const values = readJobForm(formData);

  const result = validateJob(values);
  if (!result.ok) {
    return { status: "error", message: "Please fix the highlighted fields.", errors: result.errors, values };
  }
  const { skillIds, ...job } = result.data;

  if (!companyId || !(await ownsJob(jobId, companyId))) {
    return { status: "error", message: "We couldn't find this job.", values };
  }
  if (!(await skillsExist(skillIds))) {
    return { status: "error", message: "Please fix the highlighted fields.", errors: { skillIds: INVALID_SKILL }, values };
  }

  const { error: jobError } = await supabase.from("jobs").update(job).eq("id", jobId);
  if (jobError) {
    console.error("Failed to update job:", jobError);
    return { status: "error", message: "We couldn't save your changes. Please try again.", values };
  }

  // Replace the job's skills: add the new ones first, then remove the ones that
  // were taken off. Doing it in this order means the job never has zero skills.
  const { error: addError } = await supabase
    .from("job_skills")
    .upsert(
      skillIds.map((skillId) => ({ job_id: jobId, skill_id: skillId })),
      { onConflict: "job_id,skill_id", ignoreDuplicates: true },
    );
  const { error: removeError } = addError
    ? { error: null }
    : await supabase.from("job_skills").delete().eq("job_id", jobId).not("skill_id", "in", `(${skillIds.join(",")})`);
  if (addError || removeError) {
    console.error("Failed to update job skills:", addError ?? removeError);
    return { status: "error", message: "We saved the job details but couldn't update its skills. Please try again.", values };
  }

  revalidatePath("/employer/dashboard");
  revalidatePath(`/employer/jobs/${jobId}/edit`);
  return {
    status: "success",
    message: "Your changes are saved.",
    values: { ...values, skillIds },
    savedAt: Date.now(),
  };
}

// Used with .bind(null, jobId, "closed") or .bind(null, jobId, "open") on a button's form.
export async function setJobStatus(jobId: string, status: "open" | "closed"): Promise<void> {
  if (status !== "open" && status !== "closed") return;

  const { supabase, companyId } = await getEmployerCompany();
  if (!companyId) return;

  const { error } = await supabase.from("jobs").update({ status }).eq("id", jobId).eq("company_id", companyId);
  if (error) console.error("Failed to change job status:", error);

  revalidatePath("/employer/dashboard");
}

// ---------- Helpers (not actions; only used inside this file) ----------

// The signed-in employer's company id, or null if they have no company yet.
async function getEmployerCompany() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data: company } = await supabase
    .from("companies")
    .select("id")
    .eq("owner_id", user.id)
    .order("created_at")
    .limit(1)
    .maybeSingle();

  return { supabase, companyId: company?.id ?? null };
}

// Reads the job form. The skill picker sends one hidden "skillIds" input per chosen skill.
function readJobForm(formData: FormData): JobInput {
  return {
    title: String(formData.get("title") ?? ""),
    description: String(formData.get("description") ?? ""),
    location: String(formData.get("location") ?? ""),
    isRemote: formData.get("isRemote") === "on",
    skillIds: formData.getAll("skillIds").map(String),
  };
}

// True when every id is a real skill in the database.
async function skillsExist(skillIds: string[]) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("skills").select("id").in("id", skillIds);
  return !error && data.length === skillIds.length;
}

// True when the job belongs to the given company.
async function ownsJob(jobId: string, companyId: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("jobs").select("id").eq("id", jobId).eq("company_id", companyId).maybeSingle();
  return Boolean(data);
}
