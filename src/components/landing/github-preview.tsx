// "Try it with your GitHub username" on the landing page (issue #34).
// Visitors type any GitHub username and see a quick preview of their top
// languages and repositories, then a link to sign in for the full profile.
// The data comes from our own /api/github-preview route, which calls GitHub on
// the server and caches the result.
"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ArrowRightIcon, GitHubIcon, RepoIcon } from "@/components/icons";
import { isValidGitHubUsername, type GitHubPreviewResponse } from "@/lib/github/preview";

type State =
  | { phase: "idle" }
  | { phase: "loading" }
  | { phase: "done"; username: string; result: GitHubPreviewResponse };

// A clear message for every way a lookup can fail.
function errorMessage(username: string, result: GitHubPreviewResponse): string | null {
  switch (result.status) {
    case "invalid_username":
      return "That doesn't look like a GitHub username. Use letters, numbers, and single hyphens.";
    case "not_found":
      return `We couldn't find a GitHub user called "${username}". Check the spelling and try again.`;
    case "rate_limited":
      return "GitHub is limiting how often we can ask right now. Please try again in a few minutes.";
    case "unavailable":
      return "We couldn't reach GitHub just now. Please try again in a moment.";
    default:
      return null;
  }
}

export function GitHubPreview() {
  const [state, setState] = useState<State>({ phase: "idle" });
  const [inputError, setInputError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const username = String(new FormData(event.currentTarget).get("username") ?? "").trim().replace(/^@/, "");

    // A quick check here for an instant message; the server checks again.
    if (!isValidGitHubUsername(username)) {
      setInputError("Enter a GitHub username, for example octocat.");
      return;
    }
    setInputError(null);
    setState({ phase: "loading" });

    try {
      const response = await fetch(`/api/github-preview?username=${encodeURIComponent(username)}`);
      const result = (await response.json()) as GitHubPreviewResponse;
      setState({ phase: "done", username, result });
    } catch {
      setState({ phase: "done", username, result: { status: "unavailable" } });
    }
  }

  const result = state.phase === "done" ? state.result : null;
  const message = state.phase === "done" ? errorMessage(state.username, state.result) : null;

  return (
    <div>
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3 sm:flex-row">
        <label htmlFor="github-username" className="sr-only">
          GitHub username
        </label>
        <div className="relative flex-1">
          <GitHubIcon className="pointer-events-none absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-muted" />
          <input
            id="github-username"
            name="username"
            type="text"
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            maxLength={40}
            placeholder="GitHub username, for example octocat"
            aria-invalid={Boolean(inputError)}
            aria-describedby={inputError ? "github-username-error" : undefined}
            className={`block min-h-12 w-full rounded-xl border bg-card py-3 pr-4 pl-12 text-base outline-none transition placeholder:text-muted/70 focus:border-primary focus:ring-2 focus:ring-primary/20 ${
              inputError ? "border-red-500" : "border-border"
            }`}
          />
        </div>
        <button
          type="submit"
          disabled={state.phase === "loading"}
          className="inline-flex min-h-12 items-center justify-center rounded-xl bg-primary px-6 font-semibold text-primary-foreground transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
        >
          {state.phase === "loading" ? "Looking..." : "Preview"}
        </button>
      </form>
      {inputError && (
        <p id="github-username-error" className="mt-2 text-sm text-red-600">
          {inputError}
        </p>
      )}

      {/* Results and errors are announced to screen reader users as they appear. */}
      <div aria-live="polite" className="mt-6">
        {state.phase === "loading" && <PreviewSkeleton />}
        {message && (
          <p role="alert" className="rounded-xl bg-highlight-soft px-4 py-3 text-sm font-medium">
            {message}
          </p>
        )}
        {result?.status === "ok" && <PreviewCard result={result} />}
      </div>
    </div>
  );
}

function PreviewCard({ result }: { result: Extract<GitHubPreviewResponse, { status: "ok" }> }) {
  const { profile, summary } = result;
  const displayName = profile.name || profile.login;

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-[0_12px_32px_-12px_rgba(15,31,26,0.18)] sm:p-6">
      <div className="flex items-center gap-3">
        <span className="relative block h-12 w-12 shrink-0 overflow-hidden rounded-full bg-surface">
          <Image src={profile.avatarUrl} alt="" fill sizes="48px" className="object-cover" />
        </span>
        <div className="min-w-0">
          <p className="truncate font-bold">{displayName}</p>
          <a href={profile.url} target="_blank" rel="noreferrer" className="text-sm text-muted hover:underline">
            @{profile.login} · {summary.ownRepoCount} public {summary.ownRepoCount === 1 ? "repository" : "repositories"}
          </a>
        </div>
      </div>

      {summary.ownRepoCount === 0 ? (
        <p className="mt-5 text-muted">
          {displayName} has no public repositories of their own yet. Push a project to GitHub and LaunchPad can start
          building a verified profile from it.
        </p>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-8 md:grid-cols-2">
          <div>
            <h3 className="text-sm font-bold">Top languages</h3>
            {summary.languages.length === 0 ? (
              <p className="mt-2 text-sm text-muted">No languages detected yet.</p>
            ) : (
              <ul className="mt-3 space-y-3">
                {summary.languages.map((language) => (
                  <li key={language.name}>
                    <div className="flex justify-between gap-2 text-sm">
                      <span className="font-semibold">{language.name}</span>
                      <span className="text-muted">
                        {language.repos} {language.repos === 1 ? "repo" : "repos"}
                      </span>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${language.percent}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <h3 className="text-sm font-bold">Highlight repositories</h3>
            <ul className="mt-3 space-y-2">
              {summary.topRepos.map((repo) => (
                <li key={repo.url}>
                  <a
                    href={repo.url}
                    target="_blank"
                    rel="noreferrer"
                    className="block rounded-lg border border-border px-3 py-2 transition hover:border-primary"
                  >
                    <span className="flex items-center gap-1.5 font-mono text-sm font-semibold">
                      <RepoIcon className="h-4 w-4 shrink-0 text-muted" />
                      <span className="truncate">{repo.name}</span>
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-muted">
                      {[repo.language, repo.stars > 0 ? `★ ${repo.stars.toLocaleString("en-US")}` : null, repo.description].filter(Boolean).join(" · ") ||
                        "No description"}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div className="mt-6 flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted">
          This is a quick look at main languages. Your full profile also detects frameworks and testing, with proof.
        </p>
        <Link
          href="/sign-in"
          className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover"
        >
          Get the full profile
          <ArrowRightIcon className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

function PreviewSkeleton() {
  return (
    <div aria-hidden="true" className="animate-pulse rounded-2xl border border-border bg-card p-6">
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-full bg-surface" />
        <div className="h-4 w-40 rounded bg-surface" />
      </div>
      <div className="mt-6 h-24 rounded-xl bg-surface" />
    </div>
  );
}
