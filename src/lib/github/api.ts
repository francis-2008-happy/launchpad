// Server-side GitHub REST API helpers for importing a candidate's repositories
// (issues #39 and #40). Only call these from server code: they may use a
// GitHub access token, which must never reach the browser.
//
// Request budget: listing repositories is 1 request per 100 repos, and each
// imported repository costs 2 more (its languages and its file list).
// Dependency files are read from raw.githubusercontent.com, which does not
// count against the API rate limit.

const API = "https://api.github.com";
const RAW = "https://raw.githubusercontent.com";

// The name of the httpOnly cookie that holds the candidate's GitHub token
// (set in /auth/callback after sign in, removed on sign out).
export const GITHUB_TOKEN_COOKIE = "lp_github_token";

// The fields we use from GET /users/{username}/repos.
export type GitHubRepository = {
  id: number;
  name: string;
  full_name: string; // "owner/name"
  html_url: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  fork: boolean;
  pushed_at: string | null;
  default_branch: string;
};

// Thrown when GitHub says we have used up the rate limit.
export class GitHubRateLimitError extends Error {
  constructor() {
    super("GitHub rate limit reached");
    this.name = "GitHubRateLimitError";
  }
}

function headers(token: string | null): Record<string, string> {
  const result: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "LaunchPad",
  };
  if (token) result.Authorization = `Bearer ${token}`;
  return result;
}

async function gitHubJson<T>(path: string, token: string | null): Promise<T | null> {
  const response = await fetch(`${API}${path}`, { headers: headers(token), cache: "no-store" });
  if (response.status === 429 || (response.status === 403 && response.headers.get("x-ratelimit-remaining") === "0")) {
    throw new GitHubRateLimitError();
  }
  // 404: not found. 409: an empty repository with no commits yet.
  if (response.status === 404 || response.status === 409) return null;
  if (!response.ok) throw new Error(`GitHub responded with ${response.status} for ${path}`);
  return (await response.json()) as T;
}

// The user's own public repositories, most recently pushed first (up to 100,
// which is plenty: we only import the most recent ones).
export async function listRepositories(username: string, token: string | null): Promise<GitHubRepository[] | null> {
  return gitHubJson<GitHubRepository[]>(
    `/users/${encodeURIComponent(username)}/repos?type=owner&sort=pushed&per_page=100`,
    token,
  );
}

// Bytes of code per language, for example { "TypeScript": 52000, "CSS": 3100 }.
export async function getLanguages(fullName: string, token: string | null): Promise<Record<string, number>> {
  return (await gitHubJson<Record<string, number>>(`/repos/${fullName}/languages`, token)) ?? {};
}

// Every file path in the repository's default branch, for example "src/app.test.ts".
export async function getFilePaths(fullName: string, branch: string, token: string | null): Promise<string[]> {
  const tree = await gitHubJson<{ tree: { path: string; type: string }[] }>(
    `/repos/${fullName}/git/trees/${encodeURIComponent(branch)}?recursive=1`,
    token,
  );
  return tree?.tree.filter((item) => item.type === "blob").map((item) => item.path) ?? [];
}

// The text of one file, or null if it cannot be read. Files over 200 KB are skipped.
export async function getFileText(fullName: string, branch: string, path: string): Promise<string | null> {
  try {
    const response = await fetch(`${RAW}/${fullName}/${encodeURIComponent(branch)}/${path}`, { cache: "no-store" });
    if (!response.ok) return null;
    const text = await response.text();
    return text.length > 200_000 ? null : text;
  } catch {
    return null;
  }
}

// Runs `task` for every item, at most `limit` at a time, so we do not fire
// dozens of requests at GitHub at once. Results keep the order of `items`.
export async function mapWithLimit<T, R>(items: T[], limit: number, task: (item: T) => Promise<R>): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const index = next++;
      results[index] = await task(items[index]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}
