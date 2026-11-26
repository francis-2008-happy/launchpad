// Server action for analyzing an applicant's match from the applicant review
// page (issue #79). Runs only when the employer clicks Analyze.
// It's used with .bind(null, jobId, candidateId), so both ids come from the
// server-rendered page. analyzeMatch also checks that this candidate applied to
// one of the signed-in employer's jobs before doing anything.
"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";
import { AiUnavailableError } from "@/lib/ai/gemini";
import { MatchError, analyzeMatch } from "@/lib/matching/analyze";

export type AnalyzeApplicantState = { status: "idle" | "success" | "error"; message?: string };

export type StageState = { status: "idle" | "success" | "error"; message?: string };

export async function updateApplicantStage(
  applicationId: string,
  stage: Database["public"]["Enums"]["application_stage"],
): Promise<StageState> {
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

  const { error } = await supabase
    .from("applications")
    .update({ stage })
    .eq("id", applicationId);
  if (error) {
    console.error("Failed to update application stage:", error);
    return { status: "error", message: "We couldn't update the stage. Please try again." };
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
