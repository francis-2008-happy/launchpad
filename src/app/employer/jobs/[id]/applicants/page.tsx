// Applicant review page (issue #71): everyone who applied to one of the
// employer's jobs, with their top verified skills.
//
// Access: proxy.ts keeps non-employers out of /employer, the ownership check
// below shows "not found" for other companies' jobs, and Row Level Security
// only returns applications (and applicants' skills) for the employer's own jobs.
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { topSkillsByCandidate } from "@/lib/applicants/top-skills";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export const metadata: Metadata = {
  title: "Applicants | LaunchPad",
};

type Stage = Database["public"]["Enums"]["application_stage"];

const STAGE_LABELS: Record<Stage, string> = {
  applied: "Applied",
  reviewing: "Reviewing",
  interviewing: "Interviewing",
  offered: "Offered",
  rejected: "Rejected",
};

const dateFormat = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });

type PageProps = { params: Promise<{ id: string }> };

export default function ApplicantsPage({ params }: PageProps) {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
      <Link
        href="/employer/dashboard"
        className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text hover:underline"
      >
        ← Back to dashboard
      </Link>
      <Suspense fallback={<ApplicantsSkeleton />}>
        <Applicants params={params} />
      </Suspense>
    </main>
  );
}

async function Applicants({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) notFound();

  // Employers can also see other companies' open jobs, so check ownership here.
  const { data: job } = await supabase
    .from("jobs")
    .select("id, title, status, company:companies(owner_id)")
    .eq("id", id)
    .maybeSingle();
  if (!job || job.company?.owner_id !== user.id) notFound();

  const { data: applications } = await supabase
    .from("applications")
    .select("id, stage, created_at, candidate:profiles(id, full_name, github_username, avatar_url)")
    .eq("job_id", job.id)
    .order("created_at", { ascending: false });

  const applicants = (applications ?? []).flatMap((application) =>
    application.candidate ? [{ ...application, candidate: application.candidate }] : [],
  );

  // Every applicant's skill evidence in one query, then the top 5 for each.
  const candidateIds = applicants.map((a) => a.candidate.id);
  const { data: evidence } = candidateIds.length
    ? await supabase
        .from("candidate_skills")
        .select("profile_id, repository_id, skill:skills(name)")
        .in("profile_id", candidateIds)
    : { data: [] };
  const topSkills = topSkillsByCandidate(evidence ?? []);

  return (
    <div className="mt-6">
      <p className="text-sm font-semibold text-primary-text">{job.status === "open" ? "Open job" : "Closed job"}</p>
      <h1 className="mt-1 text-3xl font-extrabold tracking-tight sm:text-4xl">{job.title}</h1>
      <p className="mt-3 text-lg text-muted">
        {applicants.length} {applicants.length === 1 ? "applicant" : "applicants"}
      </p>

      {applicants.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-border bg-surface px-6 py-12 text-center">
          <p className="font-semibold">No one has applied yet</p>
          <p className="mt-2 text-sm text-muted">
            When candidates apply, they show up here with the skills proven in their code.
          </p>
        </div>
      ) : (
        <ul className="mt-8 grid grid-cols-1 gap-4">
          {applicants.map(({ id: applicationId, stage, created_at, candidate }) => {
            const name = candidate.full_name || candidate.github_username || "Unnamed candidate";
            const skills = topSkills.get(candidate.id) ?? [];
            return (
              <li key={applicationId} className="rounded-2xl border border-border bg-card p-5 sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex min-w-0 items-center gap-4">
                    <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-surface">
                      {candidate.avatar_url && (
                        <Image src={candidate.avatar_url} alt="" fill sizes="48px" className="object-cover" />
                      )}
                    </span>
                    <div className="min-w-0">
                      <h2 className="truncate text-lg font-bold">{name}</h2>
                      <p className="text-sm text-muted">
                        {candidate.github_username && (
                          <>
                            <a
                              href={`https://github.com/${candidate.github_username}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-medium hover:text-primary-text hover:underline"
                            >
                              @{candidate.github_username}
                            </a>
                            {" · "}
                          </>
                        )}
                        Applied {dateFormat.format(new Date(created_at))}
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    <span className="rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary-text">
                      {STAGE_LABELS[stage]}
                    </span>
                    {/* Read-only skill profile from #74. */}
                    <Link
                      href={`/candidates/${candidate.id}`}
                      className="inline-flex min-h-11 items-center justify-center rounded-xl border border-border px-4 text-sm font-semibold transition hover:border-primary hover:text-primary-text"
                    >
                      View profile
                    </Link>
                  </div>
                </div>

                {skills.length > 0 ? (
                  <ul aria-label={`${name}'s top verified skills`} className="mt-4 flex flex-wrap gap-1.5">
                    {skills.map((skill) => (
                      <li key={skill.name} className="rounded-full bg-surface px-2.5 py-1 text-xs font-medium">
                        {skill.name}
                        <span className="text-muted">
                          {" "}
                          · {skill.repoCount} {skill.repoCount === 1 ? "repo" : "repos"}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-4 text-sm text-muted">No verified skills yet.</p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function ApplicantsSkeleton() {
  return (
    <div aria-hidden="true" className="mt-6 animate-pulse">
      <div className="h-10 w-2/3 rounded bg-surface" />
      <div className="mt-8 grid grid-cols-1 gap-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-32 rounded-2xl border border-border bg-card" />
        ))}
      </div>
    </div>
  );
}
