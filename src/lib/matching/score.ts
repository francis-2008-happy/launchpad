// Match scoring (issue #76).
// Compares a job's required skills with the skills a candidate has proven in
// their GitHub repositories, and turns that into a score from 0 to 100.
//
// The score always comes from this code, never from the AI. That keeps scores
// consistent (the same input always gives the same score) and easy to test.
// The AI only explains the result (see src/lib/ai/prompts.ts).
//
// Pure functions: no database or network code here.
import { createHash } from "node:crypto";

export type RequiredSkill = { id: string; name: string };

// One piece of evidence: a repository that proves a skill.
export type Evidence = {
  skillId: string;
  repository: { id: string; name: string; url: string };
};

export type Strength = { skill: string; repositories: { name: string; url: string }[] };
export type Gap = { skill: string };

export type MatchResult = {
  score: number; // 0 to 100
  strengths: Strength[]; // required skills the candidate has proven
  gaps: Gap[]; // required skills the candidate has not proven yet
};

// How much one required skill counts, by how many repositories prove it.
// One repository is real evidence but could be a one-off, so it earns most of
// the credit; three or more repositories earn full credit.
export function skillCredit(repositoryCount: number): number {
  if (repositoryCount <= 0) return 0;
  if (repositoryCount === 1) return 0.6;
  if (repositoryCount === 2) return 0.85;
  return 1;
}

// Score = the average credit across all required skills, as a whole number from 0 to 100.
// Example: a job needs React and Docker. React is proven by 3 repositories (credit 1)
// and Docker by none (credit 0), so the score is (1 + 0) / 2 = 50.
export function computeMatch(required: RequiredSkill[], evidence: Evidence[]): MatchResult {
  if (required.length === 0) return { score: 0, strengths: [], gaps: [] };

  const strengths: Strength[] = [];
  const gaps: Gap[] = [];
  let totalCredit = 0;

  for (const skill of required) {
    // Each repository counts once per skill, even if it appears twice in the evidence.
    const repositories = new Map<string, { name: string; url: string }>();
    for (const item of evidence) {
      if (item.skillId === skill.id) {
        repositories.set(item.repository.id, { name: item.repository.name, url: item.repository.url });
      }
    }

    totalCredit += skillCredit(repositories.size);
    if (repositories.size > 0) {
      strengths.push({
        skill: skill.name,
        repositories: [...repositories.values()].sort((a, b) => a.name.localeCompare(b.name)),
      });
    } else {
      gaps.push({ skill: skill.name });
    }
  }

  // The best-proven strengths first, then alphabetical, so the list is stable.
  strengths.sort((a, b) => b.repositories.length - a.repositories.length || a.skill.localeCompare(b.skill));
  gaps.sort((a, b) => a.skill.localeCompare(b.skill));

  return { score: Math.round((totalCredit / required.length) * 100), strengths, gaps };
}

// A short hash of everything the score depends on: the job's required skills and
// the candidate's evidence. A cached analysis is still valid only while this hash
// is the same. Order does not matter, so the same data always gives the same hash.
export function skillsFingerprint(required: RequiredSkill[], evidence: Evidence[]): string {
  const requiredPart = required.map((skill) => skill.id).sort().join(",");
  const evidencePart = evidence
    .map((item) => `${item.skillId}:${item.repository.id}`)
    .sort()
    .join(",");
  return createHash("sha256").update(`${requiredPart}|${evidencePart}`).digest("hex").slice(0, 32);
}
