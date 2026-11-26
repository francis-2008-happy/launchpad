// "Analyze" / "Refresh" button for one applicant on the applicant review page (issue #79).
// A Client Component so it can show "Analyzing..." and any error message.
"use client";

import { useActionState } from "react";
import { analyzeApplicant, type AnalyzeApplicantState } from "@/app/employer/jobs/[id]/applicants/actions";

export function AnalyzeApplicantButton({
  jobId,
  candidateId,
  analyzed,
}: {
  jobId: string;
  candidateId: string;
  analyzed: boolean;
}) {
  const [state, formAction, isPending] = useActionState(
    analyzeApplicant.bind(null, jobId, candidateId),
    { status: "idle" } satisfies AnalyzeApplicantState,
  );

  return (
    <form action={formAction}>
      <button
        type="submit"
        disabled={isPending}
        className={
          analyzed
            ? "inline-flex min-h-11 items-center text-sm font-semibold text-primary-text hover:underline disabled:cursor-wait disabled:opacity-70"
            : "inline-flex min-h-11 items-center justify-center rounded-xl border border-border px-4 text-sm font-semibold transition hover:border-primary hover:text-primary-text disabled:cursor-wait disabled:opacity-70"
        }
      >
        {isPending ? "Analyzing..." : analyzed ? "Refresh" : "Analyze match"}
      </button>
      {!isPending && state.status === "error" && (
        <p role="alert" className="mt-1 text-sm font-medium text-red-600">
          {state.message}
        </p>
      )}
    </form>
  );
}
