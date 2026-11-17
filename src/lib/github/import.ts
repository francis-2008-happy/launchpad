// Pure helpers for importing GitHub repositories (issue #39).
// They decide which repositories to import and turn GitHub's data into rows
// for the `repositories` table. No network or database code here, so they are
// easy to unit test.
import type { GitHubRepository } from "@/lib/github/api";

// How many repositories one import covers. Each costs 2 GitHub API requests,
// so this keeps an import well inside GitHub's rate limits.
export const MAX_IMPORTED_REPOS = 30;

// The candidate's own work: forks are skipped (they are mostly someone else's
// code), and the most recently pushed repositories come first.
export function selectReposToImport(repos: GitHubRepository[], max = MAX_IMPORTED_REPOS): GitHubRepository[] {
  return repos
    .filter((repo) => !repo.fork)
    .sort((a, b) => Date.parse(b.pushed_at ?? "1970-01-01") - Date.parse(a.pushed_at ?? "1970-01-01"))
    .slice(0, max);
}

export type RepositoryRow = {
  profile_id: string;
  github_id: number;
  name: string;
  url: string;
  description: string | null;
  primary_language: string | null;
  stars: number;
  pushed_at: string | null;
  imported_at: string;
};

// One row for the `repositories` table. The featured fields are left out on
// purpose, so re-importing never resets a candidate's featured projects (#42).
export function toRepositoryRow(repo: GitHubRepository, profileId: string, importedAt: string): RepositoryRow {
  return {
    profile_id: profileId,
    github_id: repo.id,
    name: repo.name,
    url: repo.html_url,
    description: repo.description,
    primary_language: repo.language,
    stars: repo.stargazers_count,
    pushed_at: repo.pushed_at,
    imported_at: importedAt,
  };
}
