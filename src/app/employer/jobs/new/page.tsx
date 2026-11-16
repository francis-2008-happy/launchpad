// Post a job page (issue #14): /employer/jobs/new
// The proxy already keeps signed-out users and candidates out of /employer pages.
//
// Loading the company and the skills list reads the session cookie, which is
// only known when a request comes in, so that part is wrapped in <Suspense>
// and the page heading can still be pre-rendered.
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { JobForm } from "@/components/job-form";
import { createJob } from "@/app/employer/jobs/actions";

export const metadata: Metadata = {
  title: "Post a job | LaunchPad",
};

export default function NewJobPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <Link href="/employer/dashboard" className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text hover:underline">
        ← Back to dashboard
      </Link>
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">Post a job</h1>
      <p className="mt-3 text-lg text-muted">
        List the skills the role really needs. Applicants are ranked by how well their proven skills match.
      </p>

      <Suspense fallback={<FormSkeleton />}>
        <JobEditor />
      </Suspense>
    </main>
  );
}

// Loads the employer's company and the skills list, then shows the form.
async function JobEditor() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: company } = user
    ? await supabase.from("companies").select("id").eq("owner_id", user.id).limit(1).maybeSingle()
    : { data: null };

  // Jobs belong to a company, so employers create their company profile first.
  if (!company) {
    return (
      <div className="mt-10 rounded-2xl border border-border bg-card p-6 sm:p-8">
        <p className="font-semibold">Create your company profile first</p>
        <p className="mt-2 text-sm text-muted">Every job shows the company that posted it, so candidates know who they are applying to.</p>
        <Link
          href="/employer/company"
          className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary-hover"
        >
          Create company profile
        </Link>
      </div>
    );
  }

  const { data: skills } = await supabase.from("skills").select("id, name, category").order("name");

  return (
    <section aria-label="Job details" className="mt-10 rounded-2xl border border-border bg-card p-5 sm:p-8">
      <JobForm skills={skills ?? []} action={createJob} submitLabel="Post job" pendingLabel="Posting..." />
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
