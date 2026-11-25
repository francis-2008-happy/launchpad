// Server action for "Analyze my match" on the job details page (issue #77).
// Runs only when the candidate clicks the button, never on page load.
// It's used with .bind(null, jobId), so the job id comes from the server-rendered
// page. The candidate is always the signed-in user, never a value from the form.
"use server";

import { redirect } from "next/navigation";
import { AiUnavailableError } from "@/lib/ai/gemini";
import { MatchError, analyzeMatch, type MatchAnalysis } from "@/lib/matching/analyze";
import { createClient } from "@/lib/supabase/server";

export type MatchState = {
  status: "idle" | "success" | "error";
  analysis?: MatchAnalysis;
  message?: string;
};

export async function analyzeMyMatch(jobId: string): Promise<MatchState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  try {
    const analysis = await analyzeMatch(jobId, user.id);
    return { status: "success", analysis };
  } catch (error) {
    // These two errors carry messages written for users; anything else is unexpected.
    if (error instanceof MatchError || error instanceof AiUnavailableError) {
      return { status: "error", message: error.message };
    }
    console.error("Match analysis failed:", error);
    return { status: "error", message: "Something went wrong. Please try again." };
  }
}
