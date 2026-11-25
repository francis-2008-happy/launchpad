// Server actions for the match panel on the job details page.
//   analyzeMyMatch  "Analyze my match" (issue #77)
//   draftMySummary  "Draft a summary" (issue #78)
// Both run only when the candidate clicks a button, never on page load.
// Both are used with .bind(null, jobId), so the job id comes from the server-rendered
// page. The candidate is always the signed-in user, never a value from the form.
"use server";

import { redirect } from "next/navigation";
import { AiUnavailableError } from "@/lib/ai/gemini";
import { MatchError, analyzeMatch, draftResumeSummary, type MatchAnalysis } from "@/lib/matching/analyze";
import { createClient } from "@/lib/supabase/server";

export type MatchState = {
  status: "idle" | "success" | "error";
  analysis?: MatchAnalysis;
  message?: string;
};

export type SummaryState = {
  status: "idle" | "success" | "error";
  summary?: string;
  message?: string;
};

export async function analyzeMyMatch(jobId: string): Promise<MatchState> {
  const userId = await signedInUserId();
  try {
    const analysis = await analyzeMatch(jobId, userId);
    return { status: "success", analysis };
  } catch (error) {
    return { status: "error", message: errorMessage(error) };
  }
}

// "Draft a summary" (issue #78). Also runs only when the candidate clicks.
export async function draftMySummary(jobId: string): Promise<SummaryState> {
  const userId = await signedInUserId();
  try {
    const summary = await draftResumeSummary(jobId, userId);
    return { status: "success", summary };
  } catch (error) {
    return { status: "error", message: errorMessage(error) };
  }
}

async function signedInUserId(): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");
  return user.id;
}

// MatchError and AiUnavailableError carry messages written for users;
// anything else is unexpected, so it is logged and replaced with a general message.
function errorMessage(error: unknown): string {
  if (error instanceof MatchError || error instanceof AiUnavailableError) return error.message;
  console.error("Match action failed:", error);
  return "Something went wrong. Please try again.";
}
