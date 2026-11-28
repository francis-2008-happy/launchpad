"use client";

import { useActionState } from "react";
import { updateApplicantStage, type StageState } from "@/app/employer/jobs/[id]/applicants/actions";
import { STAGES, STAGE_LABELS, type Stage } from "@/lib/applications/stages";

const initialState: StageState = { status: "idle" };

export function StageSelect({ applicationId, stage }: { applicationId: string; stage: Stage }) {
  const [state, formAction, isPending] = useActionState(
    async (_previous: StageState, formData: FormData) => {
      // The server action checks that this is a valid stage.
      return updateApplicantStage(applicationId, formData.get("stage"));
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
        {STAGES.map((value) => <option key={value} value={value}>{STAGE_LABELS[value]}</option>)}
      </select>
      {state.status === "error" && <p role="alert" className="text-xs text-red-700">{state.message}</p>}
    </form>
  );
}
