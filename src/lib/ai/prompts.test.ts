import { MAX_DESCRIPTION_CHARS, matchExplanationPrompt, resumeSummaryPrompt } from "./prompts";

const base = {
  jobTitle: "Frontend Developer",
  jobDescription: "Build our React app.",
  score: 50,
  strengths: [{ skill: "React", repositories: [{ name: "a", url: "u1" }, { name: "b", url: "u2" }] }],
  gaps: [{ skill: "Docker" }],
};

describe("matchExplanationPrompt", () => {
  it("includes the score, proven skills with repository counts, and missing skills", () => {
    const prompt = matchExplanationPrompt(base);
    expect(prompt).toContain("Match score: 50 out of 100");
    expect(prompt).toContain("- React (proven in 2 repositories)");
    expect(prompt).toContain("- Docker");
  });

  it("says when nothing is proven or nothing is missing", () => {
    const prompt = matchExplanationPrompt({ ...base, strengths: [], gaps: [] });
    expect(prompt).toContain("- None yet");
    expect(prompt).toContain("- None");
  });

  it("cuts very long job descriptions", () => {
    const prompt = matchExplanationPrompt({ ...base, jobDescription: "x".repeat(MAX_DESCRIPTION_CHARS + 500) });
    expect(prompt).toContain(`${"x".repeat(MAX_DESCRIPTION_CHARS)}…`);
    expect(prompt).not.toContain("x".repeat(MAX_DESCRIPTION_CHARS + 1));
  });
});

describe("resumeSummaryPrompt", () => {
  it("lists only the proven skills with the repositories that prove them", () => {
    const prompt = resumeSummaryPrompt(base);
    expect(prompt).toContain("- React (repositories: a, b)");
    expect(prompt).not.toContain("Docker");
  });
});
