// GitHub username preview on the landing page (issue #34).
// Pure functions that check a username and turn a list of public repositories
// into a short summary: top languages and a few highlight repositories.
// The GitHub API call itself is in src/app/api/github-preview/route.ts.
//
// This is only a quick preview from each repository's main language. The full
// skill profile (#39, #40) also detects frameworks and testing practices.

// The fields we use from GET /users/{username}/repos.
export type GitHubRepo = {
  name: string;
  html_url: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  fork: boolean;
  pushed_at: string | null;
};

export type LanguageShare = { name: string; repos: number; percent: number };

export type RepoHighlight = {
  name: string;
  url: string;
  description: string | null;
  language: string | null;
  stars: number;
};

export type RepoSummary = {
  ownRepoCount: number;
  languages: LanguageShare[];
  topRepos: RepoHighlight[];
};

// What /api/github-preview sends back to the browser.
export type GitHubPreviewResponse =
  | {
      status: "ok";
      profile: { login: string; name: string | null; avatarUrl: string; url: string };
      summary: RepoSummary;
    }
  | { status: "invalid_username" | "not_found" | "rate_limited" | "unavailable" };

// GitHub usernames: 1 to 39 letters, numbers, or single hyphens, and they
// cannot start or end with a hyphen. Checking this first means we never send
// junk (or anything that could change the API URL) to GitHub.
const USERNAME_PATTERN = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i;

export function isValidGitHubUsername(value: string): boolean {
  return USERNAME_PATTERN.test(value);
}

// Summarises a user's public repositories. Forks are skipped because they are
// mostly other people's code.
export function summarizeRepos(repos: GitHubRepo[], { maxLanguages = 5, maxRepos = 4 } = {}): RepoSummary {
  const ownRepos = repos.filter((repo) => !repo.fork);

  // Count how many repositories use each main language.
  const counts = new Map<string, number>();
  for (const repo of ownRepos) {
    if (repo.language) counts.set(repo.language, (counts.get(repo.language) ?? 0) + 1);
  }
  const withLanguage = [...counts.values()].reduce((sum, count) => sum + count, 0);

  const languages = [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, maxLanguages)
    .map(([name, count]) => ({ name, repos: count, percent: Math.round((count / withLanguage) * 100) }));

  // Most starred first; ties go to the most recently updated.
  const topRepos = [...ownRepos]
    .sort(
      (a, b) =>
        b.stargazers_count - a.stargazers_count ||
        Date.parse(b.pushed_at ?? "1970-01-01") - Date.parse(a.pushed_at ?? "1970-01-01"),
    )
    .slice(0, maxRepos)
    .map((repo) => ({
      name: repo.name,
      url: repo.html_url,
      description: repo.description,
      language: repo.language,
      stars: repo.stargazers_count,
    }));

  return { ownRepoCount: ownRepos.length, languages, topRepos };
}
