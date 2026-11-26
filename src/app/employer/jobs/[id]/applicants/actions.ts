// Server action for analyzing an applicant's match from the applicant review
// page (issue #79). Runs only when the employer clicks Analyze.
// It's used with .bind(null, jobId, candidateId), so both ids come from the
// server-rendered page. analyzeMatch also checks that this candidate applied to
// one of the signed-in employer's jobs before doing anything.
"use server";

import { revalidatePath } from "next/cache";
import { AiUnavailableError } from "@/lib/ai/gemini";
import { MatchError, analyzeMatch } from "@/lib/matching/analyze";

export type AnalyzeApplicantState = { status: "idle" | "success" | "error"; message?: string };

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
