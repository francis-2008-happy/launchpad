"use client";

import { useActionState } from "react";
import { applyToJob, type ApplyState } from "@/app/candidate/apply-actions";

const initialState: ApplyState = { status: "idle" };

export function ApplyButton({ jobId, alreadyApplied }: { jobId: string; alreadyApplied: boolean }) {
  const [state, formAction, isPending] = useActionState(applyToJob.bind(null, jobId), initialState);
  const applied = alreadyApplied || state.status === "success";

  return (
    <form action={formAction}>
      <button
        type="submit"
        disabled={applied || isPending}
        className="min-h-12 w-full rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover disabled:cursor-default disabled:opacity-70 sm:w-auto"
        data-testid="apply-button"
      >
        {isPending ? "Applying..." : applied ? "Applied" : "Apply"}
      </button>
      {state.status === "success" && <p className="mt-2 text-sm font-medium text-accent-text" role="status">{state.message}</p>}
      {state.status === "error" && <p className="mt-2 text-sm font-medium text-red-700" role="alert">{state.message}</p>}
    </form>
  );
}
