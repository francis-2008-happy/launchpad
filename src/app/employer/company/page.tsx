// Company profile page (issue #12): /employer/company
// Employers create or edit their company here. The proxy already keeps
// signed-out users and candidates out of /employer pages.
//
// Loading the company reads the session cookie, which is only known when a
// request comes in, so that part is wrapped in <Suspense> and the page heading
// can still be pre-rendered.
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { CompanyForm } from "@/components/company-form";

export const metadata: Metadata = {
  title: "Company profile | LaunchPad",
};

export default function CompanyPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <Link href="/employer/dashboard" className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text hover:underline">
        ← Back to dashboard
      </Link>
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">Company profile</h1>
      <p className="mt-3 text-lg text-muted">
        Candidates see this on every job you post, so tell them who you are and what you build.
      </p>

      <Suspense fallback={<FormSkeleton />}>
        <CompanyEditor />
      </Suspense>
    </main>
  );
}

// Loads the signed-in employer's company and shows the form filled in.
async function CompanyEditor() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: company } = user
    ? await supabase
        .from("companies")
        .select("name, website, description")
        .eq("owner_id", user.id)
        .order("created_at")
        .limit(1)
        .maybeSingle()
    : { data: null };

  return (
    <div className="mt-10 grid grid-cols-1 gap-10">
      {!company && (
        <p className="rounded-xl bg-highlight-soft px-4 py-3 text-sm font-medium">
          You haven&apos;t created a company profile yet. Add one before posting your first job.
        </p>
      )}

      <section aria-label="Edit company profile" className="rounded-2xl border border-border bg-card p-5 sm:p-8">
        <CompanyForm company={company} />
      </section>

    </div>
  );
}

// Grey placeholder boxes with the same shape as the form, shown while loading.
function FormSkeleton() {
  return (
    <div aria-hidden="true" className="mt-10 animate-pulse space-y-6 rounded-2xl border border-border bg-card p-5 sm:p-8">
      {[0, 1].map((i) => (
        <div key={i} className="space-y-2">
          <div className="h-4 w-32 rounded bg-surface" />
          <div className="h-12 rounded-xl bg-surface" />
        </div>
      ))}
      <div className="h-36 rounded-xl bg-surface" />
      <div className="h-12 w-48 rounded-xl bg-surface" />
    </div>
  );
}
