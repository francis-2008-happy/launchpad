// Server action for analyzing an applicant's match from the applicant review
// page (issue #79). Runs only when the employer clicks Analyze.
// It's used with .bind(null, jobId, candidateId), so both ids come from the
// server-rendered page. analyzeMatch also checks that this candidate applied to
// one of the signed-in employer's jobs before doing anything.
"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { AiUnavailableError } from "@/lib/ai/gemini";
import { isStage } from "@/lib/applications/stages";
import { MatchError, analyzeMatch } from "@/lib/matching/analyze";

export type AnalyzeApplicantState = { status: "idle" | "success" | "error"; message?: string };

export type StageState = { status: "idle" | "success" | "error"; message?: string };

// Changes an application's stage (issue #75). Row Level Security only lets the
// employer who owns the job do this, and only the stage column can change.
export async function updateApplicantStage(applicationId: string, stage: unknown): Promise<StageState> {
  // The stage comes from a form, so check it before it reaches the database.
  if (!isStage(stage)) return { status: "error", message: "Choose a valid stage." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { status: "error", message: "Sign in to update stages." };

  const { data: application } = await supabase
    .from("applications")
    .select("job_id")
    .eq("id", applicationId)
    .maybeSingle();
  if (!application) return { status: "error", message: "Application not found." };

  // .select() returns the rows that changed. If Row Level Security blocks the
  // update (the user doesn't own this job), no error comes back, just no rows.
  const { data: updated, error } = await supabase
    .from("applications")
    .update({ stage })
    .eq("id", applicationId)
    .select("id");
  if (error) {
    console.error("Failed to update application stage:", error);
    return { status: "error", message: "We couldn't update the stage. Please try again." };
  }
  if (!updated || updated.length === 0) {
    return { status: "error", message: "You can only change stages for your own jobs." };
  }

  revalidatePath(`/employer/jobs/${application.job_id}/applicants`);
  revalidatePath("/candidate", "layout");
  revalidatePath("/candidate/applications");
  return { status: "success", message: "Stage updated." };
}

export async function analyzeApplicant(jobId: string, candidateId: string): Promise<AnalyzeApplicantState> {
  try {
    await analyzeMatch(jobId, candidateId);
  } catch (error) {
    if (error instanceof MatchError || error instanceof AiUnavailableError) {
      return { status: "error", message: error.message };
    }
    console.error("Applicant analysis failed:", error);
    return { status: "error", message: "Something went wrong. Please try again." };
  }
  // Reload the page data so the new score shows and the ranking updates.
  revalidatePath(`/employer/jobs/${jobId}/applicants`);
  return { status: "success" };
}
