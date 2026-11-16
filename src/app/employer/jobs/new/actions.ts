// Server action for the "post a job" form (issue #14).
// It checks who is signed in, validates the input, then saves the job and its
// required skills. Row Level Security also makes sure an employer can only
// create jobs for a company they own, and only add skills to their own jobs.
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { validateJob, type JobErrors, type JobInput } from "@/lib/validation/job";

// What the form shows after a submit. `values` sends back what was submitted,
// because React clears a form after its action runs.
export type JobFormState = {
  status: "idle" | "success" | "error";
  message?: string;
  errors?: JobErrors;
  values?: JobInput;
  postedJobId?: string; // set after a successful post; also gives the form a fresh start
};

export async function createJob(_previous: JobFormState, formData: FormData): Promise<JobFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const values: JobInput = {
    title: String(formData.get("title") ?? ""),
    description: String(formData.get("description") ?? ""),
    location: String(formData.get("location") ?? ""),
    isRemote: formData.get("isRemote") === "on",
    // The skill picker sends one hidden "skillIds" input per chosen skill.
    skillIds: formData.getAll("skillIds").map(String),
  };

  const result = validateJob(values);
  if (!result.ok) {
    return { status: "error", message: "Please fix the highlighted fields.", errors: result.errors, values };
  }
  const { skillIds, ...job } = result.data;

  // Jobs belong to the employer's company, so they need one first.
  const { data: company } = await supabase
    .from("companies")
    .select("id")
    .eq("owner_id", user.id)
    .order("created_at")
    .limit(1)
    .maybeSingle();
  if (!company) {
    return { status: "error", message: "Create your company profile before posting a job.", values };
  }

  // Make sure every chosen skill really exists.
  const { data: skills, error: skillsError } = await supabase.from("skills").select("id").in("id", skillIds);
  if (skillsError || skills.length !== skillIds.length) {
    return {
      status: "error",
      message: "Please fix the highlighted fields.",
      errors: { skillIds: "One of the skills is not valid. Please choose skills from the list." },
      values,
    };
  }

  const { data: newJob, error: jobError } = await supabase
    .from("jobs")
    .insert({ ...job, company_id: company.id })
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
  return { status: "success", message: `"${job.title}" is posted and open to candidates.`, postedJobId: newJob.id };
}
