// Builds the skill profile from saved skill evidence (issue #41).
// The database has one candidate_skills row per skill per repository; this
// groups those rows into skills (each with the repositories that prove it),
// and the skills into categories. Pure functions, unit tested.

export type SkillCategory = "language" | "framework" | "tool" | "practice";
export type EvidenceSource = "language" | "dependency" | "tests";

// One candidate_skills row, joined with its skill and repository.
export type EvidenceRow = {
  source: EvidenceSource;
  skill: { name: string; category: SkillCategory } | null;
  repository: { name: string; url: string } | null;
};

export type ProfileSkill = {
  name: string;
  repos: { name: string; url: string }[];
  sources: EvidenceSource[]; // how it was detected, for the "found in" note
};

export type SkillGroup = { category: SkillCategory; title: string; skills: ProfileSkill[] };

export const CATEGORY_TITLES: Record<SkillCategory, string> = {
  language: "Languages",
  framework: "Frameworks and libraries",
  tool: "Tools and platforms",
  practice: "Practices",
};

const CATEGORY_ORDER: SkillCategory[] = ["language", "framework", "tool", "practice"];

// Groups evidence rows by category. Inside each category, the skills proven by
// the most repositories come first (ties in alphabetical order). Empty
// categories are left out.
export function groupSkills(rows: EvidenceRow[]): SkillGroup[] {
  const bySkill = new Map<string, ProfileSkill & { category: SkillCategory }>();

  for (const row of rows) {
    if (!row.skill || !row.repository) continue;
    let entry = bySkill.get(row.skill.name);
    if (!entry) {
      entry = { name: row.skill.name, category: row.skill.category, repos: [], sources: [] };
      bySkill.set(row.skill.name, entry);
    }
    if (!entry.repos.some((repo) => repo.url === row.repository!.url)) entry.repos.push(row.repository);
    if (!entry.sources.includes(row.source)) entry.sources.push(row.source);
  }

  return CATEGORY_ORDER.map((category) => ({
    category,
    title: CATEGORY_TITLES[category],
    skills: [...bySkill.values()]
      .filter((skill) => skill.category === category)
      .sort((a, b) => b.repos.length - a.repos.length || a.name.localeCompare(b.name))
      .map(({ name, repos, sources }) => ({
        name,
        repos: [...repos].sort((a, b) => a.name.localeCompare(b.name)),
        sources,
      })),
  })).filter((group) => group.skills.length > 0);
}

// A short note saying where a skill was found, for example "Found in code and tests".
export function describeSources(sources: EvidenceSource[]): string {
  const words: Record<EvidenceSource, string> = { language: "code", dependency: "dependencies", tests: "tests" };
  const list = (["language", "dependency", "tests"] as const).filter((s) => sources.includes(s)).map((s) => words[s]);
  if (list.length === 0) return "";
  const joined = list.length === 1 ? list[0] : `${list.slice(0, -1).join(", ")} and ${list.at(-1)}`;
  return `Found in ${joined}`;
}
