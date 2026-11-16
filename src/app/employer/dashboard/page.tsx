// Employer dashboard. Job listings and applicants will be added here later
// (#15 manage jobs, Sprint 3 applicants). For now it links to the company
// profile and the "post a job" page.
//
// The company card reads the session cookie to load the employer's company, so
// it sits inside <Suspense> and the rest of the page can still be pre-rendered.
import Link from "next/link";
import { Suspense } from "react";
import { ArrowRightIcon, BriefcaseIcon } from "@/components/icons";
import { CompanyLogo } from "@/components/company-logo";
import { createClient } from "@/lib/supabase/server";

export default function EmployerDashboard() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
      <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Employer dashboard</h1>
      <p className="mt-3 text-lg text-muted">Your job postings and applicant tracking will appear here.</p>

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
    </main>
  );
}

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
