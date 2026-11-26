import { computeMatch, skillCredit, skillsFingerprint, type Evidence, type RequiredSkill } from "./score";

const react: RequiredSkill = { id: "s-react", name: "React" };
const docker: RequiredSkill = { id: "s-docker", name: "Docker" };
const ts: RequiredSkill = { id: "s-ts", name: "TypeScript" };

function repo(id: string) {
  return { id, name: `repo-${id}`, url: `https://github.com/me/repo-${id}` };
}

function proof(skill: RequiredSkill, ...repoIds: string[]): Evidence[] {
  return repoIds.map((id) => ({ skillId: skill.id, repository: repo(id) }));
}

describe("skillCredit", () => {
  it("gives more credit for more repositories, up to full credit at three", () => {
    expect(skillCredit(0)).toBe(0);
    expect(skillCredit(1)).toBe(0.6);
    expect(skillCredit(2)).toBe(0.85);
    expect(skillCredit(3)).toBe(1);
    expect(skillCredit(10)).toBe(1);
  });
});

describe("computeMatch", () => {
  it("scores 100 when every required skill is proven by three or more repositories", () => {
    const result = computeMatch([react, ts], [...proof(react, "1", "2", "3"), ...proof(ts, "1", "2", "3")]);
    expect(result.score).toBe(100);
    expect(result.gaps).toEqual([]);
  });

  it("scores 0 when no required skill is proven", () => {
    const result = computeMatch([react, docker], []);
    expect(result.score).toBe(0);
    expect(result.strengths).toEqual([]);
    expect(result.gaps).toEqual([{ skill: "Docker" }, { skill: "React" }]);
  });

  it("averages the credit across required skills", () => {
    // React: 3 repos (1.0), Docker: none (0) -> 50
    expect(computeMatch([react, docker], proof(react, "1", "2", "3")).score).toBe(50);
    // React: 1 repo (0.6), TypeScript: 2 repos (0.85), Docker: none -> 1.45 / 3 = 48.33 -> 48
    expect(computeMatch([react, ts, docker], [...proof(react, "1"), ...proof(ts, "1", "2")]).score).toBe(48);
  });

  it("links each strength to the repositories that prove it, best proven first", () => {
    const result = computeMatch([react, ts], [...proof(react, "2", "1"), ...proof(ts, "1", "2", "3")]);
    expect(result.strengths.map((s) => s.skill)).toEqual(["TypeScript", "React"]);
    expect(result.strengths[1].repositories).toEqual([
      { name: "repo-1", url: "https://github.com/me/repo-1" },
      { name: "repo-2", url: "https://github.com/me/repo-2" },
    ]);
  });

  it("counts a repository only once per skill", () => {
    const result = computeMatch([react], [...proof(react, "1"), ...proof(react, "1")]);
    expect(result.strengths[0].repositories).toHaveLength(1);
    expect(result.score).toBe(60);
  });

  it("ignores evidence for skills the job does not require", () => {
    const result = computeMatch([react], [...proof(react, "1", "2", "3"), ...proof(docker, "4")]);
    expect(result.score).toBe(100);
    expect(result.strengths.map((s) => s.skill)).toEqual(["React"]);
  });

  it("returns a score of 0 and no lists when the job requires no skills", () => {
    expect(computeMatch([], proof(react, "1"))).toEqual({ score: 0, strengths: [], gaps: [] });
  });
});

describe("skillsFingerprint", () => {
  it("is the same no matter the order of the data", () => {
    const a = skillsFingerprint([react, ts], [...proof(react, "1"), ...proof(ts, "2")]);
    const b = skillsFingerprint([ts, react], [...proof(ts, "2"), ...proof(react, "1")]);
    expect(a).toBe(b);
  });

  it("changes when the candidate gains evidence", () => {
    const before = skillsFingerprint([react], proof(react, "1"));
    const after = skillsFingerprint([react], proof(react, "1", "2"));
    expect(after).not.toBe(before);
  });

  it("changes when the job's required skills change", () => {
    const before = skillsFingerprint([react], proof(react, "1"));
    const after = skillsFingerprint([react, docker], proof(react, "1"));
    expect(after).not.toBe(before);
  });
});
