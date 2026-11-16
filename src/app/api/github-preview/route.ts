// GET /api/github-preview?username=octocat (issue #34)
// Lets visitors try LaunchPad before signing in: returns a quick summary of a
// GitHub user's public repositories (top languages and a few repositories).
//
// - The username is validated here on the server before anything is sent to GitHub.
// - GitHub is called from the server, never from the browser.
// - Results are cached for an hour, so looking up the same user again does not
//   use any of GitHub's rate limit (60 requests an hour without a token).
//   Errors are not cached, so a rate limit problem clears as soon as GitHub allows.
import { NextResponse, type NextRequest } from "next/server";
import { cacheLife } from "next/cache";
import {
  isValidGitHubUsername,
  summarizeRepos,
  type GitHubPreviewResponse,
  type GitHubRepo,
} from "@/lib/github/preview";

export async function GET(request: NextRequest) {
  const username = (request.nextUrl.searchParams.get("username") ?? "").trim();
  if (!isValidGitHubUsername(username)) {
    return json({ status: "invalid_username" }, 400);
  }

  try {
    // Lowercase so "OctoCat" and "octocat" share one cache entry.
    const preview = await getGitHubPreview(username.toLowerCase());
    return json(preview, preview.status === "ok" ? 200 : 404);
  } catch (error) {
    if (error instanceof Error && error.message === RATE_LIMITED) {
      return json({ status: "rate_limited" }, 429);
    }
    console.error("GitHub preview failed:", error);
    return json({ status: "unavailable" }, 502);
  }
}

function json(body: GitHubPreviewResponse, status: number) {
  return NextResponse.json(body, { status });
}

const RATE_LIMITED = "GITHUB_RATE_LIMITED";

// Fetches and summarises one user. "use cache" keeps the result for about an
// hour per username. Throwing (rate limit, GitHub down) skips the cache.
async function getGitHubPreview(username: string): Promise<GitHubPreviewResponse> {
  "use cache";
  cacheLife("hours");

  const userResponse = await gitHub(`/users/${username}`);
  if (userResponse.status === 404) return { status: "not_found" };
  checkResponse(userResponse);
  const user = (await userResponse.json()) as { login: string; name: string | null; avatar_url: string; html_url: string };

  // The settings recommended in the GitHub API research (#11): the user's own
  // repositories, most recently updated first, 100 per page. One page is plenty for a preview.
  const reposResponse = await gitHub(`/users/${username}/repos?type=owner&sort=updated&per_page=100`);
  checkResponse(reposResponse);
  const repos = (await reposResponse.json()) as GitHubRepo[];

  return {
    status: "ok",
    profile: { login: user.login, name: user.name, avatarUrl: user.avatar_url, url: user.html_url },
    summary: summarizeRepos(repos),
  };
}

function gitHub(path: string) {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "LaunchPad",
  };
  // Optional server-only token for a higher rate limit (see .env.example).
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  return fetch(`https://api.github.com${path}`, { headers });
}

// GitHub answers 403 or 429 when the rate limit is used up.
function checkResponse(response: Response) {
  if (response.status === 429 || (response.status === 403 && response.headers.get("x-ratelimit-remaining") === "0")) {
    throw new Error(RATE_LIMITED);
  }
  if (!response.ok) throw new Error(`GitHub responded with ${response.status}`);
}
