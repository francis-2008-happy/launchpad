// Edit a job (issue #15): /employer/jobs/<job id>/edit
// Reuses the same form as "post a job", filled in with the job's current details.
//
// Only the job's owner can open it. Anyone else gets the "not found" page, so
// the page does not even reveal that the job exists.
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { JobForm } from "@/components/job-form";
import { updateJob } from "@/app/employer/jobs/actions";

export const metadata: Metadata = {
  title: "Edit job | LaunchPad",
};

type EditJobPageProps = { params: Promise<{ id: string }> };

export default function EditJobPage({ params }: EditJobPageProps) {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <Link href="/employer/dashboard" className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text hover:underline">
        ← Back to dashboard
      </Link>
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">Edit job</h1>
      <p className="mt-3 text-lg text-muted">Changes show up for candidates as soon as you save.</p>

      {/* The job id comes from the URL, which is only known when a request comes in. */}
      <Suspense fallback={<FormSkeleton />}>
        <JobEditor params={params} />
      </Suspense>
    </main>
  );
}

// Loads the job (only if it belongs to the signed-in employer's company) and the skills list.
async function JobEditor({ params }: EditJobPageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) notFound();

  const { data: company } = await supabase.from("companies").select("id").eq("owner_id", user.id).limit(1).maybeSingle();
  if (!company) notFound();

  const { data: job } = await supabase
    .from("jobs")
    .select("id, title, description, location, is_remote, job_skills(skill_id)")
    .eq("id", id)
    .eq("company_id", company.id)
    .maybeSingle();
  if (!job) notFound();

  const { data: skills } = await supabase.from("skills").select("id, name, category").order("name");

  return (
    <section aria-label="Job details" className="mt-10 rounded-2xl border border-border bg-card p-5 sm:p-8">
      <JobForm
        skills={skills ?? []}
        // bind() fixes the job id on the server, so the browser cannot change which job is saved.
        action={updateJob.bind(null, job.id)}
        initialValues={{
          title: job.title,
          description: job.description,
          location: job.location ?? "",
          isRemote: job.is_remote,
          skillIds: job.job_skills.map((jobSkill) => jobSkill.skill_id),
        }}
        submitLabel="Save changes"
        pendingLabel="Saving..."
      />
    </section>
  );
}

// Grey placeholder boxes with the same shape as the form, shown while loading.
function FormSkeleton() {
  return (
    <div aria-hidden="true" className="mt-10 animate-pulse space-y-6 rounded-2xl border border-border bg-card p-5 sm:p-8">
      <div className="h-12 rounded-xl bg-surface" />
      <div className="h-44 rounded-xl bg-surface" />
      <div className="h-12 rounded-xl bg-surface" />
      <div className="h-12 w-40 rounded-xl bg-surface" />
    </div>
  );
}
