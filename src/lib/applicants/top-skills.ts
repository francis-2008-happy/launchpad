// Each applicant's top verified skills, for the applicant review page (issue #71).
// Pure function: no database code, so it's easy to unit test.

// One candidate_skills row: this candidate proved this skill in this repository.
export type ApplicantEvidenceRow = {
  profile_id: string;
  repository_id: string;
  skill: { name: string } | null;
};

export type TopSkill = { name: string; repoCount: number };

// For each candidate, their skills proven by the most repositories (ties in
// alphabetical order), at most `limit` per candidate.
export function topSkillsByCandidate(rows: ApplicantEvidenceRow[], limit = 5): Map<string, TopSkill[]> {
  // candidate id -> skill name -> repository ids that prove it
  const proof = new Map<string, Map<string, Set<string>>>();
  for (const row of rows) {
    if (!row.skill) continue;
    const skills = proof.get(row.profile_id) ?? new Map<string, Set<string>>();
    const repos = skills.get(row.skill.name) ?? new Set<string>();
    repos.add(row.repository_id);
    skills.set(row.skill.name, repos);
    proof.set(row.profile_id, skills);
  }

  const result = new Map<string, TopSkill[]>();
  for (const [candidateId, skills] of proof) {
    const top = [...skills]
      .map(([name, repos]) => ({ name, repoCount: repos.size }))
      .sort((a, b) => b.repoCount - a.repoCount || a.name.localeCompare(b.name))
      .slice(0, limit);
    result.set(candidateId, top);
  }
  return result;
}
