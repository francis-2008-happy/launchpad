"use client";

import { useActionState } from "react";
import { updateApplicantStage, type StageState } from "@/app/employer/jobs/[id]/applicants/actions";
import type { Database } from "@/types/database";

type Stage = Database["public"]["Enums"]["application_stage"];

const stages: Stage[] = ["applied", "reviewing", "interviewing", "offered", "rejected"];
const labels: Record<Stage, string> = {
  applied: "Applied",
  reviewing: "Reviewing",
  interviewing: "Interviewing",
  offered: "Offered",
  rejected: "Rejected",
};

const initialState: StageState = { status: "idle" };

export function StageSelect({ applicationId, stage }: { applicationId: string; stage: Stage }) {
  const [state, formAction, isPending] = useActionState(
    async (_previous: StageState, formData: FormData) => {
      return updateApplicantStage(applicationId, formData.get("stage") as Stage);
    },
    initialState,
  );

  return (
    <form action={formAction} className="flex items-center gap-2">
      <label htmlFor={`stage-${applicationId}`} className="sr-only">Application stage</label>
      <select
        id={`stage-${applicationId}`}
        name="stage"
        defaultValue={stage}
        disabled={isPending}
        onChange={(event) => event.currentTarget.form?.requestSubmit()}
        className="min-h-11 rounded-xl border border-border bg-card px-3 text-sm font-semibold"
        data-testid="stage-select"
      >
        {stages.map((value) => <option key={value} value={value}>{labels[value]}</option>)}
      </select>
      {state.status === "error" && <p role="alert" className="text-xs text-red-700">{state.message}</p>}
    </form>
  );
}
