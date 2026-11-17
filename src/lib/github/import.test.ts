// Unit tests for the repository import helpers (issue #39).
import type { GitHubRepository } from "@/lib/github/api";
import { selectReposToImport, toRepositoryRow } from "@/lib/github/import";

function repo(overrides: Partial<GitHubRepository>): GitHubRepository {
  return {
    id: 1,
    name: "repo",
    full_name: "dev/repo",
    html_url: "https://github.com/dev/repo",
    description: null,
    language: null,
    stargazers_count: 0,
    fork: false,
    pushed_at: "2026-01-01T00:00:00Z",
    default_branch: "main",
    ...overrides,
  };
}

describe("selectReposToImport", () => {
  const repos = [
    repo({ id: 1, name: "old", pushed_at: "2024-01-01T00:00:00Z" }),
    repo({ id: 2, name: "newest", pushed_at: "2026-06-01T00:00:00Z" }),
    repo({ id: 3, name: "forked", fork: true, pushed_at: "2026-07-01T00:00:00Z" }),
    repo({ id: 4, name: "never-pushed", pushed_at: null }),
    repo({ id: 5, name: "middle", pushed_at: "2025-03-01T00:00:00Z" }),
  ];

  it("skips forks and puts the most recently pushed first", () => {
    expect(selectReposToImport(repos).map((r) => r.name)).toEqual(["newest", "middle", "old", "never-pushed"]);
  });

  it("imports at most the given number", () => {
    expect(selectReposToImport(repos, 2).map((r) => r.name)).toEqual(["newest", "middle"]);
  });

  it("handles a user with no repositories", () => {
    expect(selectReposToImport([])).toEqual([]);
  });
});

describe("toRepositoryRow", () => {
  it("maps GitHub fields to database columns", () => {
    const row = toRepositoryRow(
      repo({ id: 42, name: "chat-app", html_url: "https://github.com/dev/chat-app", description: "Chat", language: "TypeScript", stargazers_count: 7 }),
      "profile-1",
      "2026-11-17T10:00:00.000Z",
    );
    expect(row).toEqual({
      profile_id: "profile-1",
      github_id: 42,
      name: "chat-app",
      url: "https://github.com/dev/chat-app",
      description: "Chat",
      primary_language: "TypeScript",
      stars: 7,
      pushed_at: "2026-01-01T00:00:00Z",
      imported_at: "2026-11-17T10:00:00.000Z",
    });
  });

  it("never includes the featured fields, so re-importing keeps featured projects", () => {
    const row = toRepositoryRow(repo({}), "p", "now");
    expect(row).not.toHaveProperty("is_featured");
    expect(row).not.toHaveProperty("featured_description");
  });
});
