export const instant = false;

import Link from "next/link";
import { JobSearchForm } from "@/components/job-search-form";
import { createClient } from "@/lib/supabase/server";

type JobsPageProps = {
  searchParams: Promise<{
    q?: string;
    skill?: string;
    location?: string;
    remote?: string;
  }>;
};

export default async function JobsPage({ searchParams }: JobsPageProps) {
  const params = await searchParams;

  const keyword = params.q?.trim() ?? "";
  const skillId = params.skill?.trim() ?? "";
  const location = params.location?.trim() ?? "";
  const remote = params.remote ?? "";

  const supabase = await createClient();

  // Load skills for the filter dropdown.
  const { data: skills } = await supabase
    .from("skills")
    .select("id, name")
    .order("name");

  // Start with open jobs only.
  let jobsQuery = supabase
    .from("jobs")
    .select(
      `
        id,
        title,
        description,
        location,
        is_remote,
        created_at,
        companies (
          name
        ),
        job_skills (
          skills (
            id,
            name
          )
        )
      `,
    )
    .eq("status", "open")
    .order("created_at", { ascending: false });

  // Keyword searches both the job title and description.
  if (keyword) {
    const safeKeyword = keyword
      .replace(/\\/g, "\\\\")
      .replace(/%/g, "\\%")
      .replace(/_/g, "\\_")
      .replace(/,/g, "\\,");

    jobsQuery = jobsQuery.or(
      `title.ilike.%${safeKeyword}%,description.ilike.%${safeKeyword}%`,
    );
  }

  // Filter by location.
  if (location) {
    const safeLocation = location
      .replace(/\\/g, "\\\\")
      .replace(/%/g, "\\%")
      .replace(/_/g, "\\_");

    jobsQuery = jobsQuery.ilike("location", `%${safeLocation}%`);
  }

  // Filter by remote/on-site.
  if (remote === "true") {
    jobsQuery = jobsQuery.eq("is_remote", true);
  } else if (remote === "false") {
    jobsQuery = jobsQuery.eq("is_remote", false);
  }

  // Filter by required skill.
  if (skillId) {
    jobsQuery = jobsQuery.eq("job_skills.skill_id", skillId);
  }

  const { data: jobs, error } = await jobsQuery;

  if (error) {
    console.error("Failed to load jobs:", error);
  }

  const results = jobs ?? [];

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      {/* Page heading */}
      <div className="max-w-3xl">
        <p className="text-sm font-semibold text-primary-text">
          Find your next opportunity
        </p>

        <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
          Open jobs
        </h1>

        <p className="mt-3 text-lg text-muted">
          Search open positions and find opportunities that match your skills.
        </p>
      </div>

      {/* Search and filters */}
      <div className="mt-8">
        <JobSearchForm skills={skills ?? []} />
      </div>

      {/* Results count */}
      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold">
          {results.length} {results.length === 1 ? "job" : "jobs"} found
        </h2>

        {(keyword || skillId || location || remote) && (
          <p className="text-sm text-muted">
            Showing results for your current filters
          </p>
        )}
      </div>

      {/* Empty state */}
      {results.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-dashed border-border bg-surface px-6 py-14 text-center">
          <h2 className="text-lg font-bold">No jobs found</h2>

          <p className="mx-auto mt-2 max-w-md text-sm text-muted">
            We couldn&apos;t find any open jobs matching your search. Try
            changing your keyword or filters.
          </p>

          <Link
            href="/jobs"
            className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover"
          >
            Clear filters
          </Link>
        </div>
      ) : (
        <ul className="mt-5 grid grid-cols-1 gap-4">
          {results.map((job) => {
            const company = Array.isArray(job.companies)
              ? job.companies[0]
              : job.companies;

            const skillNames = job.job_skills.flatMap((jobSkill) =>
              jobSkill.skills
                ? Array.isArray(jobSkill.skills)
                  ? jobSkill.skills.map((skill) => skill.name)
                  : [jobSkill.skills.name]
                : [],
            );

            return (
              <li key={job.id}>
                <Link
                  href={`/jobs/${job.id}`}
                  className="block rounded-2xl border border-border bg-card p-5 transition hover:border-primary hover:shadow-sm sm:p-6"
                >
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                    {/* Job information */}
                    <div className="min-w-0">
                      <h3 className="text-xl font-bold tracking-tight">
                        {job.title}
                      </h3>

                      <p className="mt-1 text-sm font-semibold text-primary-text">
                        {company?.name ?? "Company"}
                      </p>

                      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted">
                        {job.location && <span>{job.location}</span>}

                        <span>
                          {job.is_remote ? "Remote" : "On-site"}
                        </span>
                      </div>
                    </div>

                    {/* View job */}
                    <span className="shrink-0 text-sm font-semibold text-primary-text">
                      View job →
                    </span>
                  </div>

                  {/* Required skills */}
                  {skillNames.length > 0 && (
                    <div className="mt-5 flex flex-wrap gap-2">
                      {skillNames.map((skillName) => (
                        <span
                          key={skillName}
                          className="rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary-text"
                        >
                          {skillName}
                        </span>
                      ))}
                    </div>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}