// Unit tests for the GitHub username preview helpers (issue #34).
import { isValidGitHubUsername, summarizeRepos, type GitHubRepo } from "@/lib/github/preview";

describe("isValidGitHubUsername", () => {
  it.each(["octocat", "francis-2008-happy", "a", "A1-b2", "x".repeat(39)])("accepts %s", (name) => {
    expect(isValidGitHubUsername(name)).toBe(true);
  });

  it.each([
    ["empty", ""],
    ["too long", "x".repeat(40)],
    ["leading hyphen", "-octocat"],
    ["trailing hyphen", "octocat-"],
    ["double hyphen", "octo--cat"],
    ["a space", "octo cat"],
    ["a path", "../users"],
    ["a query string", "octocat?per_page=1"],
  ])("rejects %s", (_label, name) => {
    expect(isValidGitHubUsername(name)).toBe(false);
  });
});

function repo(overrides: Partial<GitHubRepo>): GitHubRepo {
  return {
    name: "repo",
    html_url: "https://github.com/u/repo",
    description: null,
    language: null,
    stargazers_count: 0,
    fork: false,
    pushed_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("summarizeRepos", () => {
  const repos = [
    repo({ name: "chat-app", language: "TypeScript", stargazers_count: 12 }),
    repo({ name: "budget", language: "TypeScript", stargazers_count: 3 }),
    repo({ name: "api", language: "Python", stargazers_count: 3, pushed_at: "2026-06-01T00:00:00Z" }),
    repo({ name: "notes", language: null }),
    repo({ name: "someone-elses", language: "Go", stargazers_count: 999, fork: true }),
  ];

  it("skips forks", () => {
    const summary = summarizeRepos(repos);
    expect(summary.ownRepoCount).toBe(4);
    expect(summary.languages.map((l) => l.name)).not.toContain("Go");
    expect(summary.topRepos.map((r) => r.name)).not.toContain("someone-elses");
  });

  it("ranks languages by how many repositories use them, with percentages", () => {
    expect(summarizeRepos(repos).languages).toEqual([
      { name: "TypeScript", repos: 2, percent: 67 },
      { name: "Python", repos: 1, percent: 33 },
    ]);
  });

  it("orders top repositories by stars, then by most recent push", () => {
    expect(summarizeRepos(repos).topRepos.map((r) => r.name)).toEqual(["chat-app", "api", "budget", "notes"]);
  });

  it("respects the limits", () => {
    const summary = summarizeRepos(repos, { maxLanguages: 1, maxRepos: 2 });
    expect(summary.languages).toHaveLength(1);
    expect(summary.topRepos).toHaveLength(2);
  });

  it("handles a user with no repositories", () => {
    expect(summarizeRepos([])).toEqual({ ownRepoCount: 0, languages: [], topRepos: [] });
  });
});
