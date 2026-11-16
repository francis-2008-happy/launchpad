// Employer dashboard. Job listings and applicants will be added here later
// (#15 manage jobs, Sprint 3 applicants). For now it links to the company profile.
import Link from "next/link";
import { ArrowRightIcon, BriefcaseIcon } from "@/components/icons";

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
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary-text">
            <BriefcaseIcon className="h-6 w-6" />
          </span>
          <span>
            <span className="flex items-center gap-1 font-bold">
              Company profile
              <ArrowRightIcon className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </span>
            <span className="mt-1 block text-sm text-muted">Create or edit the company candidates see on your jobs.</span>
          </span>
        </Link>
      </div>
    </main>
  );
}
