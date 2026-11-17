// Candidate dashboard. For now it shows the candidate's imported GitHub
// repositories with an Import / Refresh button (issue #39). The full dashboard
// design comes in issue #60.
//
// The repositories are read from our database (saved by the last import), not
// from GitHub, so this page loads fast and does not use GitHub's rate limit.
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { ImportReposButton } from "@/components/import-repos-button";
import { RepoIcon } from "@/components/icons";

const dateFormat = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });

export default function CandidateDashboard() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
      <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Candidate dashboard</h1>
      <p className="mt-3 text-lg text-muted">Your skill profile is built from your public GitHub repositories.</p>

      <Suspense fallback={<div className="mt-10 h-48 animate-pulse rounded-2xl border border-border bg-card" />}>
        <RepositoriesCard />
      </Suspense>
    </main>
  );
}

async function RepositoriesCard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: repos } = user
    ? await supabase
        .from("repositories")
        .select("id, name, url, primary_language, imported_at")
        .eq("profile_id", user.id)
        .order("pushed_at", { ascending: false, nullsFirst: false })
    : { data: null };

  const list = repos ?? [];
  const lastImported = list.length > 0 ? list.map((r) => r.imported_at).sort().at(-1) : null;

  return (
    <section aria-labelledby="repos-heading" className="mt-10 rounded-2xl border border-border bg-card p-5 sm:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 id="repos-heading" className="text-xl font-bold">
            Your repositories
          </h2>
          <p className="mt-1 text-sm text-muted">
            {lastImported
              ? `${list.length} imported · Last imported ${dateFormat.format(new Date(lastImported))}`
              : "Import your public repositories to start your verified skill profile."}
          </p>
        </div>
        <ImportReposButton hasImported={list.length > 0} />
      </div>

      {list.length > 0 && (
        <ul className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {list.map((repo) => (
            <li key={repo.id}>
              <a
                href={repo.url}
                target="_blank"
                rel="noreferrer"
                className="flex min-h-11 items-center justify-between gap-3 rounded-lg border border-border px-3 py-2 transition hover:border-primary"
              >
                <span className="flex min-w-0 items-center gap-2 font-mono text-sm font-semibold">
                  <RepoIcon className="h-4 w-4 shrink-0 text-muted" />
                  <span className="truncate">{repo.name}</span>
                </span>
                {repo.primary_language && <span className="shrink-0 text-xs text-muted">{repo.primary_language}</span>}
              </a>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
