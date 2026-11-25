import { topSkillsByCandidate, type ApplicantEvidenceRow } from "./top-skills";

function row(profile: string, skill: string, repo: string): ApplicantEvidenceRow {
  return { profile_id: profile, repository_id: repo, skill: { name: skill } };
}

describe("topSkillsByCandidate", () => {
  it("ranks each candidate's skills by how many repositories prove them", () => {
    const result = topSkillsByCandidate([
      row("ana", "React", "r1"),
      row("ana", "React", "r2"),
      row("ana", "Docker", "r1"),
      row("ana", "TypeScript", "r1"),
      row("ana", "TypeScript", "r2"),
      row("ana", "TypeScript", "r3"),
    ]);
    expect(result.get("ana")).toEqual([
      { name: "TypeScript", repoCount: 3 },
      { name: "React", repoCount: 2 },
      { name: "Docker", repoCount: 1 },
    ]);
  });

  it("keeps candidates apart", () => {
    const result = topSkillsByCandidate([row("ana", "React", "r1"), row("ben", "Go", "r9")]);
    expect(result.get("ana")).toEqual([{ name: "React", repoCount: 1 }]);
    expect(result.get("ben")).toEqual([{ name: "Go", repoCount: 1 }]);
  });

  it("limits the list and breaks ties alphabetically", () => {
    const rows = ["Go", "C", "Ruby", "A", "B", "Java"].map((skill) => row("ana", skill, "r1"));
    expect(topSkillsByCandidate(rows, 3).get("ana")?.map((s) => s.name)).toEqual(["A", "B", "C"]);
  });

  it("counts the same repository once and skips rows without a skill", () => {
    const result = topSkillsByCandidate([
      row("ana", "React", "r1"),
      row("ana", "React", "r1"),
      { profile_id: "ana", repository_id: "r2", skill: null },
    ]);
    expect(result.get("ana")).toEqual([{ name: "React", repoCount: 1 }]);
  });

  it("has no entry for candidates without skills", () => {
    expect(topSkillsByCandidate([]).has("ana")).toBe(false);
  });
});
