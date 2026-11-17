// Unit tests for building the skill profile (issue #41).
import { describeSources, groupSkills, type EvidenceRow } from "@/lib/skills/profile";

const chat = { name: "chat-app", url: "https://github.com/dev/chat-app" };
const budget = { name: "budget", url: "https://github.com/dev/budget" };
const api = { name: "api", url: "https://github.com/dev/api" };

const rows: EvidenceRow[] = [
  { source: "language", skill: { name: "TypeScript", category: "language" }, repository: chat },
  { source: "language", skill: { name: "TypeScript", category: "language" }, repository: budget },
  { source: "language", skill: { name: "Python", category: "language" }, repository: api },
  { source: "dependency", skill: { name: "React", category: "framework" }, repository: chat },
  { source: "tests", skill: { name: "Unit testing", category: "practice" }, repository: chat },
  { source: "dependency", skill: { name: "Unit testing", category: "practice" }, repository: api },
];

describe("groupSkills", () => {
  it("groups skills by category in a fixed order and leaves out empty ones", () => {
    expect(groupSkills(rows).map((g) => g.title)).toEqual(["Languages", "Frameworks and libraries", "Practices"]);
  });

  it("lists the repositories behind each skill, alphabetically", () => {
    const typescript = groupSkills(rows)[0].skills[0];
    expect(typescript).toEqual({ name: "TypeScript", repos: [budget, chat], sources: ["language"] });
  });

  it("puts skills proven by more repositories first", () => {
    expect(groupSkills(rows)[0].skills.map((s) => s.name)).toEqual(["TypeScript", "Python"]);
  });

  it("collects every way a skill was found", () => {
    const practices = groupSkills(rows).find((g) => g.category === "practice")!;
    expect(practices.skills[0].sources).toEqual(["tests", "dependency"]);
  });

  it("counts a repository once even if it appears twice", () => {
    const duplicate = [...rows, rows[0]];
    expect(groupSkills(duplicate)[0].skills[0].repos).toHaveLength(2);
  });

  it("skips rows whose skill or repository is missing", () => {
    expect(groupSkills([{ source: "language", skill: null, repository: chat }])).toEqual([]);
  });

  it("returns nothing when there is no evidence yet", () => {
    expect(groupSkills([])).toEqual([]);
  });
});

describe("describeSources", () => {
  it("writes a short, readable note", () => {
    expect(describeSources(["language"])).toBe("Found in code");
    expect(describeSources(["tests", "dependency"])).toBe("Found in dependencies and tests");
    expect(describeSources(["tests", "language", "dependency"])).toBe("Found in code, dependencies and tests");
    expect(describeSources([])).toBe("");
  });
});
