// Employer dashboard: links to the company profile and "post a job", and lists
// the employer's jobs with edit, close, and reopen actions (issue #15).
// Each job links to its applicants, with the applicant count (issue #71).
//
// The parts that load data read the session cookie, so they sit inside
// <Suspense> and the rest of the page can still be pre-rendered.
import Link from "next/link";
import { Suspense } from "react";
import { ArrowRightIcon, BriefcaseIcon } from "@/components/icons";
import { CompanyLogo } from "@/components/company-logo";
import { PendingButton } from "@/components/pending-button";
import { setJobStatus } from "@/app/employer/jobs/actions";
import { createClient } from "@/lib/supabase/server";

export default function EmployerDashboard() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
      <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Employer dashboard</h1>
      <p className="mt-3 text-lg text-muted">Manage your company and the jobs you&apos;ve posted.</p>

      <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Link
          href="/employer/company"
          className="group flex items-start gap-4 rounded-2xl border border-border bg-card p-5 transition hover:border-primary sm:p-6"
        >
          <Suspense fallback={<CompanyIcon />}>
            <CompanyCardLogo />
          </Suspense>
          <span className="min-w-0">
            <span className="flex items-center gap-1 font-bold">
              Company profile
              <ArrowRightIcon className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </span>
            <span className="mt-1 block text-sm text-muted">Create or edit the company candidates see on your jobs.</span>
          </span>
        </Link>

        <Link
          href="/employer/jobs/new"
          className="group flex items-start gap-4 rounded-2xl border border-border bg-card p-5 transition hover:border-primary sm:p-6"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <BriefcaseIcon className="h-6 w-6" />
          </span>
          <span className="min-w-0">
            <span className="flex items-center gap-1 font-bold">
              Post a job
              <ArrowRightIcon className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </span>
            <span className="mt-1 block text-sm text-muted">Describe the role and the skills it needs.</span>
          </span>
        </Link>
      </div>

      <section aria-labelledby="your-jobs" className="mt-14">
        <Suspense fallback={<JobsSkeleton />}>
          <JobsList />
        </Suspense>
      </section>
    </main>
  );
}

// ---------- Company card ----------

// The employer's company logo, or a briefcase icon if they have no company yet.
async function CompanyCardLogo() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: company } = user
    ? await supabase
        .from("companies")
        .select("name, logo_url")
        .eq("owner_id", user.id)
        .order("created_at")
        .limit(1)
        .maybeSingle()
    : { data: null };

  if (!company) return <CompanyIcon />;
  return <CompanyLogo name={company.name} logoUrl={company.logo_url} size={44} />;
}

function CompanyIcon() {
  return (
    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary-text">
      <BriefcaseIcon className="h-6 w-6" />
    </span>
  );
}

// ---------- Jobs list (issue #15) ----------

const dateFormat = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" });

// Lists only this employer's jobs, newest first.
async function JobsList() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: company } = user
    ? await supabase.from("companies").select("id").eq("owner_id", user.id).order("created_at").limit(1).maybeSingle()
    : { data: null };

  // Only jobs from this employer's own company.
  const { data: jobs } = company
    ? await supabase
        .from("jobs")
        .select("id, title, location, is_remote, status, created_at, job_skills(skills(name)), applications(count)")
        .eq("company_id", company.id)
        .order("created_at", { ascending: false })
    : { data: null };

  const allJobs = jobs ?? [];
  const openCount = allJobs.filter((job) => job.status === "open").length;

  return (
    <>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="your-jobs" className="text-2xl font-extrabold tracking-tight">
          Your jobs
        </h2>
        {allJobs.length > 0 && (
          <p className="text-sm text-muted">
            {openCount} open · {allJobs.length - openCount} closed
          </p>
        )}
      </div>

      {allJobs.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-dashed border-border bg-surface px-6 py-12 text-center">
          <p className="font-semibold">You haven&apos;t posted any jobs yet</p>
          <p className="mt-2 text-sm text-muted">Post a job and candidates will be ranked by how well their proven skills match.</p>
          <Link
            href="/employer/jobs/new"
            className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary-hover"
          >
            Post your first job
          </Link>
        </div>
      ) : (
        <ul className="mt-5 grid grid-cols-1 gap-4">
          {allJobs.map((job) => {
            const isOpen = job.status === "open";
            const skillNames = job.job_skills.flatMap((jobSkill) => (jobSkill.skills ? [jobSkill.skills.name] : []));
            // applications(count) returns [{ count: n }]; RLS counts only this employer's applicants.
            const applicantCount = job.applications[0]?.count ?? 0;
            const details = [job.location, job.is_remote ? "Remote" : null, `Posted ${dateFormat.format(new Date(job.created_at))}`]
              .filter(Boolean)
              .join(" · ");

            return (
              <li
                key={job.id}
                className={`rounded-2xl border border-border bg-card p-5 sm:p-6 ${isOpen ? "" : "opacity-75"}`}
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-bold">{job.title}</h3>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          isOpen ? "bg-accent-soft text-accent-text" : "bg-surface text-muted"
                        }`}
                      >
                        {isOpen ? "Open" : "Closed"}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-muted">{details}</p>
                  </div>

                  <div className="flex shrink-0 flex-wrap gap-2">
                    <Link
                      href={`/employer/jobs/${job.id}/applicants`}
                      className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover sm:flex-none"
                    >
                      Applicants ({applicantCount})
                    </Link>
                    <Link
                      href={`/employer/jobs/${job.id}/edit`}
                      className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl border border-border px-4 text-sm font-semibold transition hover:border-primary hover:text-primary-text sm:flex-none"
                    >
                      Edit
                    </Link>
                    {/* bind() fixes the job id and the new status on the server. */}
                    <form action={setJobStatus.bind(null, job.id, isOpen ? "closed" : "open")} className="flex flex-1 sm:flex-none">
                      <PendingButton
                        pendingText={isOpen ? "Closing..." : "Reopening..."}
                        className={`inline-flex min-h-11 w-full items-center justify-center rounded-xl px-4 text-sm font-semibold transition ${
                          isOpen
                            ? "border border-border text-red-600 hover:border-red-500"
                            : "bg-primary text-primary-foreground hover:bg-primary-hover"
                        }`}
                      >
                        {isOpen ? "Close job" : "Reopen"}
                      </PendingButton>
                    </form>
                  </div>
                </div>

                {skillNames.length > 0 && (
                  <ul aria-label="Required skills" className="mt-4 flex flex-wrap gap-1.5">
                    {skillNames.map((name) => (
                      <li key={name} className="rounded-full bg-surface px-2.5 py-1 text-xs font-medium text-muted">
                        {name}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}

// Grey placeholder cards shown while the jobs load.
function JobsSkeleton() {
  return (
    <div aria-hidden="true" className="animate-pulse">
      <div className="h-8 w-40 rounded bg-surface" />
      <div className="mt-5 grid grid-cols-1 gap-4">
        {[0, 1].map((i) => (
          <div key={i} className="h-32 rounded-2xl border border-border bg-card" />
        ))}
      </div>
    </div>
  );
}
