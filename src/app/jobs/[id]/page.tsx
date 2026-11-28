
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { CompanyLogo } from "@/components/company-logo";
import { MatchAnalysisPanel } from "@/components/match-analysis";
import { ApplyButton } from "@/components/apply-button";
import { getMatchAnalysis } from "@/lib/matching/analyze";

export const metadata: Metadata = {
  title: "Job details | LaunchPad",
};

type JobDetailsPageProps = {
  params: Promise<{ id: string }>;
};

export default function JobDetailsPage({ params }: JobDetailsPageProps) {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
      <Link
        href="/jobs"
        className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text hover:underline"
      >
        ← Back to jobs
      </Link>

      <Suspense fallback={<JobDetailsSkeleton />}>
        <JobDetails params={params} />
      </Suspense>
    </main>
  );
}

async function JobDetails({ params }: JobDetailsPageProps) {
  const { id } = await params;

  const supabase = await createClient();

  // Retrieve the job, its company, and its required skills.
  const { data: job, error } = await supabase
    .from("jobs")
    .select(`
      id,
      title,
      description,
      location,
      timezone,
      is_remote,
      status,
      companies (
        name,
        description,
        website,
        logo_url
      ),
      job_skills (
        skills (
          id,
          name
        )
      )
    `)
    .eq("id", id)
    .eq("status", "open")
    .maybeSingle();

  // Missing jobs, closed jobs, and unavailable records show not found.
  if (error || !job) {
    notFound();
  }

  const company = Array.isArray(job.companies)
    ? job.companies[0]
    : job.companies;

  if (!company) {
    notFound();
  }

  const requiredSkills = job.job_skills.flatMap((jobSkill) => {
    if (!jobSkill.skills) return [];

    return Array.isArray(jobSkill.skills)
      ? jobSkill.skills
      : [jobSkill.skills];
  });

  return (
    <div className="mt-8 space-y-6">

      {/* Job heading */}
      <section className="rounded-2xl border border-border bg-card p-5 sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">

          <div className="min-w-0">
            <p className="text-sm font-semibold text-primary-text">
              Job opportunity
            </p>

            <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
              {job.title}
            </h1>

            <p className="mt-3 text-lg font-semibold">
              {company.name}
            </p>

            <div className="mt-4 flex flex-wrap gap-3 text-sm text-muted">
              {job.location && (
                <span>{job.location}</span>
              )}

              <span>
                {job.is_remote ? "Remote" : "On-site"}
              </span>
            </div>
          </div>

          <span className="inline-flex w-fit rounded-full bg-primary-soft px-4 py-2 text-sm font-semibold text-primary-text">
            Open
          </span>
        </div>
      </section>

      {/* Job description */}
      <section className="rounded-2xl border border-border bg-card p-5 sm:p-8">
        <h2 className="text-xl font-bold">
          About this role
        </h2>

        <div className="mt-4 whitespace-pre-wrap text-sm leading-7 text-muted">
          {job.description}
        </div>
      </section>

      {/* Job information */}
      <section className="rounded-2xl border border-border bg-card p-5 sm:p-8">
        <h2 className="text-xl font-bold">
          Job information
        </h2>

        <dl className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">

          <div>
            <dt className="text-sm font-semibold text-muted">
              Location
            </dt>
            <dd className="mt-1 font-medium">
              {job.location || "Not specified"}
            </dd>
          </div>

          <div>
            <dt className="text-sm font-semibold text-muted">
              Time zone
            </dt>
            <dd className="mt-1 font-medium">
              {job.timezone || "Not specified by employer"}
            </dd>
          </div>

          <div>
            <dt className="text-sm font-semibold text-muted">
              Work arrangement
            </dt>
            <dd className="mt-1 font-medium">
              {job.is_remote ? "Remote" : "On-site"}
            </dd>
          </div>

        </dl>
      </section>

      {/* Required skills */}
      <section className="rounded-2xl border border-border bg-card p-5 sm:p-8">
        <h2 className="text-xl font-bold">
          Required skills
        </h2>

        {requiredSkills.length > 0 ? (
          <div className="mt-5 flex flex-wrap gap-2">
            {requiredSkills.map((skill) => (
              <span
                key={skill.id}
                className="rounded-full bg-primary-soft px-4 py-2 text-sm font-semibold text-primary-text"
              >
                {skill.name}
              </span>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-muted">
            No specific skills listed.
          </p>
        )}
      </section>

      {/* AI match analysis (#77) */}
      <MatchSection jobId={job.id} />

      {/* Company profile */}
      <section className="rounded-2xl border border-border bg-card p-5 sm:p-8">
        <h2 className="text-xl font-bold">
          About the company
        </h2>

        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center">
          <CompanyLogo
            name={company.name}
            logoUrl={company.logo_url}
            size={80}
          />

          <div>
            <h3 className="text-lg font-bold">
              {company.name}
            </h3>

            {company.website && (
              <a
                href={company.website}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-block text-sm font-semibold text-primary-text hover:underline"
              >
                Visit company website ↗
              </a>
            )}
          </div>
        </div>

        <div className="mt-5 whitespace-pre-wrap text-sm leading-7 text-muted">
          {company.description || "No company description provided."}
        </div>
      </section>

      <ApplySection jobId={job.id} />

    </div>
  );
}

// "Analyze my match" for candidates (#77). Signed-out visitors get a sign-in
// prompt, and employers see nothing. Only the saved analysis is read here;
// the AI runs only when the candidate clicks the button.
async function MatchSection({ jobId }: { jobId: string }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <section className="rounded-2xl border border-border bg-card p-5 sm:p-8">
        <h2 className="text-xl font-bold">How well do you match?</h2>
        <p className="mt-2 text-sm text-muted">
          <Link href="/sign-in" className="font-semibold text-primary-text hover:underline">
            Sign in with GitHub
          </Link>{" "}
          to compare this job with the skills proven in your repositories.
        </p>
      </section>
    );
  }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "candidate") return null;

  const saved = await getMatchAnalysis(jobId, user.id);
  return <MatchAnalysisPanel jobId={jobId} saved={saved} />;
}

async function ApplySection({ jobId }: { jobId: string }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <section className="rounded-2xl border border-border bg-card p-5 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold">Interested in this opportunity?</h2>
            <p className="mt-2 text-sm text-muted">Sign in as a candidate to submit your application.</p>
          </div>
          <Link href="/sign-in" className="inline-flex min-h-12 items-center justify-center rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground sm:w-auto">
            Sign in to apply
          </Link>
        </div>
      </section>
    );
  }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "candidate") return null;

  const { data: application } = await supabase
    .from("applications")
    .select("id")
    .eq("job_id", jobId)
    .eq("candidate_id", user.id)
    .maybeSingle();

  return (
    <section className="rounded-2xl border border-border bg-card p-5 sm:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold">Interested in this opportunity?</h2>
          <p className="mt-2 text-sm text-muted">Take the next step toward your next career opportunity.</p>
        </div>
        <ApplyButton jobId={jobId} alreadyApplied={Boolean(application)} />
      </div>
    </section>
  );
}

// Loading placeholder while job information is retrieved.
function JobDetailsSkeleton() {
  return (
    <div aria-hidden="true" className="mt-8 animate-pulse space-y-6">
      <div className="h-48 rounded-2xl bg-surface" />
      <div className="h-52 rounded-2xl bg-surface" />
      <div className="h-40 rounded-2xl bg-surface" />
      <div className="h-40 rounded-2xl bg-surface" />
    </div>
  );
}
