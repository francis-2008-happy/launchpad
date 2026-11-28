// Applicant review page (issue #71): everyone who applied to one of the
// employer's jobs, with their top verified skills.
//
// Access: proxy.ts keeps non-employers out of /employer, the ownership check
// below shows "not found" for other companies' jobs, and Row Level Security
// only returns applications (and applicants' skills) for the employer's own jobs.
//
// Ranking (issue #79): ?sort=match orders applicants by their cached match score.
// The score explains how well proven skills fit the job; the employer decides.
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AnalyzeApplicantButton } from "@/components/analyze-applicant-button";
import { StageSelect } from "@/components/stage-select";
import { oneLine, parseSortOrder, sortApplicants, type SortOrder } from "@/lib/applicants/ranking";
import { topSkillsByCandidate } from "@/lib/applicants/top-skills";
import { matchLabel } from "@/lib/matching/label";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Applicants | LaunchPad",
};

const dateFormat = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default function ApplicantsPage({ params, searchParams }: PageProps) {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
      <Link
        href="/employer/dashboard"
        className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text hover:underline"
      >
        ← Back to dashboard
      </Link>
      <Suspense fallback={<ApplicantsSkeleton />}>
        <Applicants params={params} searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function Applicants({ params, searchParams }: PageProps) {
  const { id } = await params;
  const sort = parseSortOrder((await searchParams).sort);
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

  // Every applicant's skill evidence and cached match analysis, one query each.
  const candidateIds = (applications ?? []).flatMap((a) => (a.candidate ? [a.candidate.id] : []));
  const [{ data: evidence }, { data: analyses }] = candidateIds.length
    ? await Promise.all([
        supabase.from("candidate_skills").select("profile_id, repository_id, skill:skills(name)").in("profile_id", candidateIds),
        supabase.from("match_analyses").select("candidate_id, score, explanation").eq("job_id", job.id),
      ])
    : [{ data: [] }, { data: [] }];
  const topSkills = topSkillsByCandidate(evidence ?? []);
  const analysisFor = new Map((analyses ?? []).map((a) => [a.candidate_id, a]));

  const applicants = sortApplicants(
    (applications ?? []).flatMap((application) => {
      if (!application.candidate) return [];
      const analysis = analysisFor.get(application.candidate.id);
      return [
        {
          ...application,
          candidate: application.candidate,
          appliedAt: application.created_at,
          score: analysis?.score ?? null,
          explanation: analysis?.explanation ?? null,
        },
      ];
    }),
    sort,
  );

  return (
    <div className="mt-6">
      <p className="text-sm font-semibold text-primary-text">{job.status === "open" ? "Open job" : "Closed job"}</p>
      <h1 className="mt-1 text-3xl font-extrabold tracking-tight sm:text-4xl">{job.title}</h1>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <p className="text-lg text-muted">
          {applicants.length} {applicants.length === 1 ? "applicant" : "applicants"}
        </p>
        {applicants.length > 1 && <SortLinks jobId={job.id} current={sort} />}
      </div>

      {applicants.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-border bg-surface px-6 py-12 text-center">
          <p className="font-semibold">No one has applied yet</p>
          <p className="mt-2 text-sm text-muted">
            When candidates apply, they show up here with the skills proven in their code.
          </p>
        </div>
      ) : (
        <ul className="mt-8 grid grid-cols-1 gap-4">
          {applicants.map(({ id: applicationId, stage, created_at, candidate, score, explanation }) => {
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
                    <StageSelect applicationId={applicationId} stage={stage} />
                    {/* Read-only skill profile from #74. */}
                    <Link
                      href={`/candidates/${candidate.id}`}
                      className="inline-flex min-h-11 items-center justify-center rounded-xl border border-border px-4 text-sm font-semibold transition hover:border-primary hover:text-primary-text"
                    >
                      View profile
                    </Link>
                  </div>
                </div>

                {/* Match score (#79): cached analysis, or a button to run one. */}
                <div className="mt-4 flex flex-col gap-2 rounded-xl bg-surface p-4 sm:flex-row sm:items-center sm:justify-between">
                  {score !== null ? (
                    <p className="min-w-0 text-sm">
                      <span className="font-bold tabular-nums text-primary-text">{score}/100</span>
                      <span className="font-semibold"> · {matchLabel(score)}</span>
                      {explanation && <span className="block text-muted sm:inline"> {oneLine(explanation)}</span>}
                    </p>
                  ) : (
                    <p className="text-sm text-muted">Not analyzed yet</p>
                  )}
                  <div className="shrink-0">
                    <AnalyzeApplicantButton jobId={job.id} candidateId={candidate.id} analyzed={score !== null} />
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

      {applicants.length > 0 && (
        <p className="mt-6 text-xs text-muted">
          Match scores compare each applicant&apos;s proven skills with this job&apos;s required skills, and AI explains
          them. The score helps you decide who to review first; you make the hiring decision.
        </p>
      )}
    </div>
  );
}

// "Newest" / "Best match" toggle. Plain links, so the sort order is in the URL.
function SortLinks({ jobId, current }: { jobId: string; current: SortOrder }) {
  const options: { value: SortOrder; label: string }[] = [
    { value: "newest", label: "Newest" },
    { value: "match", label: "Best match" },
  ];
  return (
    <nav aria-label="Sort applicants" className="flex rounded-xl border border-border bg-card p-1">
      {options.map((option) => (
        <Link
          key={option.value}
          href={`/employer/jobs/${jobId}/applicants${option.value === "match" ? "?sort=match" : ""}`}
          aria-current={current === option.value ? "page" : undefined}
          className={`inline-flex min-h-10 items-center rounded-lg px-4 text-sm font-semibold transition ${
            current === option.value ? "bg-primary text-primary-foreground" : "text-muted hover:text-primary-text"
          }`}
        >
          {option.label}
        </Link>
      ))}
    </nav>
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
