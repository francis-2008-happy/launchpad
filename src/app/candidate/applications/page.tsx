import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { CompanyLogo } from "@/components/company-logo";
import { STAGE_LABELS } from "@/lib/applications/stages";

export const metadata: Metadata = { title: "My applications | LaunchPad" };

const dateFormat = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

export default function ApplicationsPage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
      <Link href="/candidate/dashboard" className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text hover:underline">
        ← Back to dashboard
      </Link>
      <Suspense fallback={<ApplicationsSkeleton />}>
        <ApplicationsContent />
      </Suspense>
    </main>
  );
}

async function ApplicationsContent() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: applications } = await supabase
    .from("applications")
    .select("id, stage, created_at, job:jobs(id, title, companies(name, logo_url))")
    .eq("candidate_id", user.id)
    .order("created_at", { ascending: false });

  const rows = applications ?? [];

  return (
    <section className="mt-6">
      <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">My applications</h1>
      <p className="mt-2 text-muted">
        {rows.length} {rows.length === 1 ? "application" : "applications"}
      </p>

      {rows.length === 0 ? (
        <div className="mt-8 rounded-3xl border border-dashed border-border bg-surface px-6 py-14 text-center">
          <h2 className="text-xl font-bold">You haven&apos;t applied to a job yet</h2>
          <p className="mt-2 text-sm text-muted">Find a role that fits your verified skills and submit your first application.</p>
          <Link href="/jobs" className="mt-6 inline-flex min-h-12 items-center justify-center rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary-hover">
            Browse jobs
          </Link>
        </div>
      ) : (
        <ul className="mt-8 grid grid-cols-1 gap-4">
          {rows.map((application) => {
            const job = Array.isArray(application.job) ? application.job[0] : application.job;
            if (!job) return null;
            const company = Array.isArray(job.companies) ? job.companies[0] : job.companies;
            return (
              <li key={application.id} className="rounded-2xl border border-border bg-card p-5 sm:p-6" data-testid="application-card">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-center gap-4">
                    <CompanyLogo name={company?.name ?? "Company"} logoUrl={company?.logo_url ?? null} size={56} />
                    <div className="min-w-0">
                      <Link href={`/jobs/${job.id}`} className="text-lg font-bold hover:text-primary-text hover:underline">
                        {job.title}
                      </Link>
                      <p className="mt-1 text-sm font-medium text-muted">{company?.name ?? "Unknown company"}</p>
                      <p className="mt-1 text-xs text-muted">Applied {dateFormat.format(new Date(application.created_at))}</p>
                    </div>
                  </div>
                  <span className="w-fit shrink-0 rounded-full bg-primary-soft px-3 py-1.5 text-xs font-bold text-primary-text" data-testid="application-stage">
                    {STAGE_LABELS[application.stage]}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function ApplicationsSkeleton() {
  return (
    <div aria-hidden="true" className="mt-6 animate-pulse">
      <div className="h-10 w-64 rounded bg-surface" />
      <div className="mt-8 grid grid-cols-1 gap-4">
        {[0, 1, 2].map((i) => <div key={i} className="h-28 rounded-2xl border border-border bg-card" />)}
      </div>
    </div>
  );
}
