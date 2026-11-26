// Match analysis service (issue #76). SERVER ONLY.
// Puts the pieces together:
//   1. Load the job's required skills and the candidate's skill evidence.
//   2. Compute the score in code (score.ts).
//   3. Ask the AI to explain it (prompts.ts + gemini.ts).
//   4. Save the result in match_analyses, so we reuse it until the skills change.
//
// Reads use the signed-in user's client, so Row Level Security decides what they
// can see. Only the final save uses the admin client (see src/lib/supabase/admin.ts).
import type { SupabaseClient } from "@supabase/supabase-js";
import { generateText } from "@/lib/ai/gemini";
import { MATCH_EXPLANATION_SYSTEM, RESUME_SUMMARY_SYSTEM, matchExplanationPrompt, resumeSummaryPrompt } from "@/lib/ai/prompts";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";
import { computeMatch, skillsFingerprint, type Evidence, type Gap, type RequiredSkill, type Strength } from "./score";

// An error with a message that is safe to show to the user.
export class MatchError extends Error {}

export type MatchAnalysis = {
  score: number;
  strengths: Strength[];
  gaps: Gap[];
  explanation: string;
  summary: string | null;
  updatedAt: string;
  // True when the job's skills or the candidate's evidence changed since this analysis.
  isStale: boolean;
};

// Asking again within this time returns the saved analysis instead of calling the AI,
// so repeated clicks don't use up the free AI quota.
const REFRESH_COOLDOWN_MS = 60_000;

type Supabase = SupabaseClient<Database>;
type AnalysisRow = Database["public"]["Tables"]["match_analyses"]["Row"];

// The saved analysis, if there is one, without calling the AI. Returns null when
// nothing is saved yet or the user is not allowed to see it.
export async function getMatchAnalysis(jobId: string, candidateId: string): Promise<MatchAnalysis | null> {
  const supabase = await createClient();
  const row = await loadSavedAnalysis(supabase, jobId, candidateId);
  if (!row) return null;
  const inputs = await loadInputs(supabase, jobId, candidateId);
  const fingerprint = inputs ? skillsFingerprint(inputs.required, inputs.evidence) : null;
  return toAnalysis(row, row.skills_fingerprint !== fingerprint);
}

// Runs (or re-runs) the analysis. Only called when a user clicks a button.
// Allowed for the candidate themselves, or an employer the candidate applied to.
export async function analyzeMatch(jobId: string, candidateId: string): Promise<MatchAnalysis> {
  const supabase = await createClient();
  await checkAccess(supabase, jobId, candidateId);

  const inputs = await loadInputs(supabase, jobId, candidateId);
  if (!inputs) throw new MatchError("This job isn't available.");
  if (inputs.required.length === 0) {
    throw new MatchError("This job doesn't list any required skills yet, so there is nothing to match.");
  }

  const fingerprint = skillsFingerprint(inputs.required, inputs.evidence);
  const saved = await loadSavedAnalysis(supabase, jobId, candidateId);
  if (saved && saved.skills_fingerprint === fingerprint && Date.now() - Date.parse(saved.updated_at) < REFRESH_COOLDOWN_MS) {
    return toAnalysis(saved, false);
  }

  const match = computeMatch(inputs.required, inputs.evidence);
  const explanation = await generateText({
    system: MATCH_EXPLANATION_SYSTEM,
    prompt: matchExplanationPrompt({ jobTitle: inputs.jobTitle, jobDescription: inputs.jobDescription, ...match }),
  });

  const { data, error } = await createAdminClient()
    .from("match_analyses")
    .upsert(
      {
        job_id: jobId,
        candidate_id: candidateId,
        score: match.score,
        strengths: match.strengths,
        gaps: match.gaps,
        explanation,
        // A new analysis means any old resume summary (#78) may be out of date.
        summary: null,
        skills_fingerprint: fingerprint,
      },
      { onConflict: "job_id,candidate_id" },
    )
    .select()
    .single();
  if (error || !data) {
    console.error("Failed to save match analysis:", error);
    throw new MatchError("We couldn't save the analysis. Please try again.");
  }
  return toAnalysis(data, false);
}

// Drafts a resume summary for this job from the saved analysis (issue #78).
// Only the candidate can do this, and only from an up-to-date analysis, so the
// summary is based on the skills they have proven right now. The prompt lets the
// AI mention only those proven skills.
export async function draftResumeSummary(jobId: string, candidateId: string): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.id !== candidateId) throw new MatchError("Only the candidate can draft their own summary.");

  const [saved, inputs] = await Promise.all([
    loadSavedAnalysis(supabase, jobId, candidateId),
    loadInputs(supabase, jobId, candidateId),
  ]);
  if (!saved || !inputs) throw new MatchError("Analyze your match first.");
  if (saved.skills_fingerprint !== skillsFingerprint(inputs.required, inputs.evidence)) {
    throw new MatchError("Your skills or this job changed. Refresh your analysis first.");
  }
  const strengths = saved.strengths as Strength[];
  if (strengths.length === 0) {
    throw new MatchError("Prove at least one of this job's skills in your repositories first.");
  }

  const summary = await generateText({
    system: RESUME_SUMMARY_SYSTEM,
    prompt: resumeSummaryPrompt({ jobTitle: inputs.jobTitle, jobDescription: inputs.jobDescription, strengths }),
  });

  // Cached with the analysis, so it shows again next time without calling the AI.
  const { error } = await createAdminClient()
    .from("match_analyses")
    .update({ summary })
    .eq("id", saved.id);
  if (error) {
    console.error("Failed to save resume summary:", error);
    throw new MatchError("We couldn't save the summary. Please try again.");
  }
  return summary;
}

// The signed-in user must be the candidate, or own the job the candidate applied to.
async function checkAccess(supabase: Supabase, jobId: string, candidateId: string): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new MatchError("Please sign in first.");

  // A candidate analyzing their own match.
  if (user.id === candidateId) {
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    if (profile?.role === "candidate") return;
  }

  // Otherwise: an employer who owns this job, reviewing someone who applied to it.
  const [{ data: job }, { data: application }] = await Promise.all([
    supabase.from("jobs").select("company:companies(owner_id)").eq("id", jobId).maybeSingle(),
    supabase.from("applications").select("id").eq("job_id", jobId).eq("candidate_id", candidateId).maybeSingle(),
  ]);
  if (job?.company?.owner_id !== user.id || !application) {
    throw new MatchError("You can only analyze candidates who applied to your jobs.");
  }
}

type Inputs = { jobTitle: string; jobDescription: string; required: RequiredSkill[]; evidence: Evidence[] };

// The job's required skills and the candidate's evidence. Null if the job isn't visible.
async function loadInputs(supabase: Supabase, jobId: string, candidateId: string): Promise<Inputs | null> {
  const [{ data: job }, { data: evidenceRows }] = await Promise.all([
    supabase.from("jobs").select("title, description, job_skills(skill:skills(id, name))").eq("id", jobId).maybeSingle(),
    supabase
      .from("candidate_skills")
      .select("skill_id, repository:repositories(id, name, url)")
      .eq("profile_id", candidateId),
  ]);
  if (!job) return null;

  const required = job.job_skills.flatMap((row) => (row.skill ? [row.skill] : []));
  const evidence = (evidenceRows ?? []).flatMap((row) =>
    row.repository ? [{ skillId: row.skill_id, repository: row.repository }] : [],
  );
  return { jobTitle: job.title, jobDescription: job.description, required, evidence };
}

async function loadSavedAnalysis(supabase: Supabase, jobId: string, candidateId: string): Promise<AnalysisRow | null> {
  const { data } = await supabase
    .from("match_analyses")
    .select("*")
    .eq("job_id", jobId)
    .eq("candidate_id", candidateId)
    .maybeSingle();
  return data;
}

function toAnalysis(row: AnalysisRow, isStale: boolean): MatchAnalysis {
  return {
    score: row.score,
    strengths: row.strengths as Strength[],
    gaps: row.gaps as Gap[],
    explanation: row.explanation,
    summary: row.summary,
    updatedAt: row.updated_at,
    isStale,
  };
}
