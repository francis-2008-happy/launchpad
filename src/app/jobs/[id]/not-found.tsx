
import Link from "next/link";

export default function JobNotFound() {
  return (
    <main className="flex min-h-[60vh] items-center justify-center px-4 py-16">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-8 text-center sm:p-12">
        <p className="text-sm font-semibold text-primary-text">
          Job unavailable
        </p>

        <h1 className="mt-4 text-3xl font-extrabold tracking-tight">
          Job not found
        </h1>

        <p className="mt-4 text-sm leading-7 text-muted">
          Sorry, this job may have been closed, removed, or may no longer
          be available. You can return to the jobs page to explore other
          opportunities.
        </p>

        <Link
          href="/jobs"
          className="mt-7 inline-flex min-h-12 items-center justify-center rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover"
        >
          Browse open jobs
        </Link>
      </div>
    </main>
  );
}
