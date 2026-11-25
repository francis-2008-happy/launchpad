// "Analyze my match" panel on the job details page (issue #77).
// A Client Component so it can show "Analyzing..." while the server action runs,
// and the new result afterwards without reloading the page.
//
// It starts with the saved analysis from the database (if any), so returning
// candidates see their last result straight away, without calling the AI.
"use client";

import { useActionState } from "react";
import { analyzeMyMatch, type MatchState } from "@/app/jobs/[id]/match-actions";
import type { MatchAnalysis } from "@/lib/matching/analyze";
import { matchLabel } from "@/lib/matching/label";

// A fixed format and time zone, so the server and browser render the same text.
const dateFormat = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });

export function MatchAnalysisPanel({ jobId, saved }: { jobId: string; saved: MatchAnalysis | null }) {
  const [state, formAction, isPending] = useActionState(
    analyzeMyMatch.bind(null, jobId),
    { status: "idle" } satisfies MatchState,
  );
  // The newest result wins: a fresh analysis, else the saved one.
  const analysis = state.analysis ?? saved;

  return (
    <section aria-labelledby="match-heading" className="rounded-2xl border border-border bg-card p-5 sm:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 id="match-heading" className="text-xl font-bold">
            How well do you match?
          </h2>
          <p className="mt-2 text-sm text-muted">
            We compare the skills this job needs with the skills proven in your GitHub repositories.
          </p>
        </div>

        <form action={formAction} className="shrink-0">
          <button
            type="submit"
            disabled={isPending}
            className={`inline-flex min-h-11 w-full items-center justify-center rounded-xl px-5 text-sm font-semibold transition disabled:cursor-wait disabled:opacity-70 sm:w-auto ${
              analysis
                ? "border border-border bg-card hover:border-primary hover:text-primary-text"
                : "bg-primary text-primary-foreground hover:bg-primary-hover"
            }`}
          >
            {isPending ? "Analyzing..." : analysis ? "Refresh analysis" : "Analyze my match"}
          </button>
        </form>
      </div>

      {isPending && (
        <p role="status" className="mt-4 text-sm text-muted">
          Comparing your skills and writing an explanation. This takes a few seconds.
        </p>
      )}
      {!isPending && state.status === "error" && (
        <p role="alert" className="mt-4 text-sm font-medium text-red-600">
          {state.message}
        </p>
      )}

      {analysis && <MatchResult analysis={analysis} />}

      <p className="mt-6 border-t border-border pt-4 text-xs text-muted">
        AI explains the match to help you understand it. It does not make hiring decisions; the employer does.
      </p>
    </section>
  );
}

function MatchResult({ analysis }: { analysis: MatchAnalysis }) {
  return (
    <div className="mt-6 space-y-6">
      {analysis.isStale && (
        <p className="rounded-xl bg-surface px-4 py-3 text-sm">
          Your skills or this job changed since this analysis. Refresh it to see your current match.
        </p>
      )}

      <div className="flex items-center gap-4">
        <p className="text-4xl font-extrabold tabular-nums text-primary-text">
          {analysis.score}
          <span className="text-lg font-semibold text-muted">/100</span>
        </p>
        <div>
          <p className="font-semibold">{matchLabel(analysis.score)}</p>
          <p className="text-xs text-muted">Analyzed {dateFormat.format(new Date(analysis.updatedAt))}</p>
        </div>
      </div>

      <p className="text-sm leading-7">{analysis.explanation}</p>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <h3 className="text-sm font-bold">Proven skills ({analysis.strengths.length})</h3>
          {analysis.strengths.length > 0 ? (
            <ul className="mt-3 space-y-3">
              {analysis.strengths.map((strength) => (
                <li key={strength.skill} className="text-sm">
                  <span className="font-semibold">{strength.skill}</span>
                  <span className="text-muted"> · proven in </span>
                  {strength.repositories.map((repo, index) => (
                    <span key={repo.url}>
                      {index > 0 && ", "}
                      <a
                        href={repo.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-primary-text hover:underline"
                      >
                        {repo.name}
                      </a>
                    </span>
                  ))}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-muted">None of this job&apos;s skills are proven in your repositories yet.</p>
          )}
        </div>

        <div>
          <h3 className="text-sm font-bold">Missing skills ({analysis.gaps.length})</h3>
          {analysis.gaps.length > 0 ? (
            <ul className="mt-3 flex flex-wrap gap-2">
              {analysis.gaps.map((gap) => (
                <li key={gap.skill} className="rounded-full border border-border px-3 py-1 text-sm">
                  {gap.skill}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-muted">None. You&apos;ve proven every required skill.</p>
          )}
          {analysis.gaps.length > 0 && (
            <p className="mt-3 text-xs text-muted">
              Build a project that uses these, then refresh your profile to prove them.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
