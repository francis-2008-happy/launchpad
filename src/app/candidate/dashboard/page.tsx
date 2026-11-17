// Candidate dashboard (issue #60): the first page a developer sees after
// onboarding. It welcomes them, shows a getting-started checklist, and
// summarises their verified skill profile as it fills in:
//   - repositories and the Import / Refresh button (#39)
//   - top verified skills (#40, #41)
//   - featured projects (#42)
//
// Everything is read from our database (saved by the last import), so the page
// loads fast and never waits on GitHub. It reads the session, so the parts that
// load data sit inside <Suspense>.
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { buildChecklist, firstName, type ChecklistStep, type ChecklistStepId } from "@/lib/candidate/checklist";
import { groupSkills, type EvidenceRow } from "@/lib/skills/profile";
import { FEATURED_MAX } from "@/lib/validation/featured";
import { ImportReposButton } from "@/components/import-repos-button";
import { FeaturedProjects } from "@/components/featured-projects";
import { ArrowRightIcon, CheckIcon, RepoIcon } from "@/components/icons";

const dateFormat = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" });

export default function CandidateDashboard() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <Suspense fallback={<DashboardSkeleton />}>
        <Dashboard />
      </Suspense>
    </main>
  );
}

async function Dashboard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null; // the proxy already sends signed-out visitors to sign in

  const [{ data: profile }, { data: repos }, { data: evidence }] = await Promise.all([
    supabase.from("profiles").select("full_name, github_username, avatar_url").eq("id", user.id).single(),
    supabase
      .from("repositories")
      .select("id, name, url, primary_language, stars, is_featured, featured_description, imported_at")
      .eq("profile_id", user.id)
      .order("pushed_at", { ascending: false, nullsFirst: false }),
    supabase
      .from("candidate_skills")
      .select("source, skill:skills(name, category), repository:repositories(name, url)")
      .eq("profile_id", user.id),
  ]);

  const repoList = repos ?? [];
  const groups = groupSkills((evidence ?? []) as EvidenceRow[]);
  // All skills, most proven first, for the "top skills" preview.
  const topSkills = groups
    .flatMap((group) => group.skills)
    .sort((a, b) => b.repos.length - a.repos.length || a.name.localeCompare(b.name));
  const featured = repoList.filter((repo) => repo.is_featured && repo.featured_description);
  const lastImported = repoList.map((r) => r.imported_at).sort().at(-1);

  const checklist = buildChecklist({ repoCount: repoList.length, skillCount: topSkills.length, featuredCount: featured.length });

  return (
    <>
      {/* Welcome */}
      <section className="flex items-center gap-4">
        {profile?.avatar_url && (
          <span className="relative block h-14 w-14 shrink-0 overflow-hidden rounded-full bg-surface sm:h-16 sm:w-16">
            <Image src={profile.avatar_url} alt="" fill sizes="64px" className="object-cover" />
          </span>
        )}
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-extrabold tracking-tight sm:text-3xl">
            Welcome, {firstName(profile?.full_name, profile?.github_username)}
          </h1>
          <p className="mt-1 text-muted">
            {checklist.next === null
              ? "Your verified skill profile is ready for employers."
              : "Let's build your verified skill profile from your GitHub code."}
          </p>
        </div>
      </section>

      {/* Numbers at a glance */}
      <dl className="mt-8 grid grid-cols-3 gap-3 sm:gap-4">
        {[
          { label: "Verified skills", value: topSkills.length },
          { label: "Repositories", value: repoList.length },
          { label: "Featured", value: `${featured.length}/${FEATURED_MAX}` },
        ].map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-border bg-card p-4 sm:p-5">
            <dt className="text-xs font-semibold text-muted sm:text-sm">{stat.label}</dt>
            <dd className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl">{stat.value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[1.5fr_1fr]">
        {/* Left: checklist, top skills, featured projects */}
        <div className="space-y-6">
          <Checklist steps={checklist.steps} next={checklist.next} doneCount={checklist.doneCount} total={checklist.total} hasRepos={repoList.length > 0} />

          {topSkills.length > 0 && (
            <section aria-labelledby="top-skills-heading" className="rounded-2xl border border-border bg-card p-5 sm:p-6">
              <div className="flex items-baseline justify-between gap-3">
                <h2 id="top-skills-heading" className="text-lg font-bold">
                  Your top verified skills
                </h2>
                <Link href="/candidate/profile" className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-primary-text hover:underline">
                  Full profile
                  <ArrowRightIcon className="h-4 w-4" />
                </Link>
              </div>
              <ul className="mt-3 flex flex-wrap gap-2">
                {topSkills.slice(0, 10).map((skill) => (
                  <li
                    key={skill.name}
                    className="inline-flex items-center gap-1.5 rounded-full bg-accent-soft px-3 py-1.5 text-sm font-semibold text-accent-text"
                  >
                    <CheckIcon className="h-3.5 w-3.5" />
                    {skill.name}
                    <span className="font-normal opacity-80">· {skill.repos.length}</span>
                  </li>
                ))}
              </ul>
              {topSkills.length > 10 && (
                <p className="mt-3 text-sm text-muted">and {topSkills.length - 10} more on your profile.</p>
              )}
            </section>
          )}

          {featured.length > 0 && (
            <section aria-labelledby="featured-heading">
              <h2 id="featured-heading" className="text-lg font-bold">
                Featured projects
              </h2>
              <div className="mt-3">
                <FeaturedProjects
                  projects={featured.map((repo) => ({
                    id: repo.id,
                    name: repo.name,
                    url: repo.url,
                    primaryLanguage: repo.primary_language,
                    stars: repo.stars,
                    description: repo.featured_description ?? "",
                  }))}
                />
              </div>
            </section>
          )}
        </div>

        {/* Right: repositories */}
        <section aria-labelledby="repos-heading" className="self-start rounded-2xl border border-border bg-card p-5 sm:p-6">
          <h2 id="repos-heading" className="text-lg font-bold">
            Your repositories
          </h2>
          <p className="mt-1 text-sm text-muted">
            {lastImported
              ? `${repoList.length} imported · Updated ${dateFormat.format(new Date(lastImported))}`
              : "Nothing imported yet. Start with step 2 of Getting started."}
          </p>
          {/* Before the first import, the checklist has the Import button, so only show Refresh here. */}
          {repoList.length > 0 && (
            <div className="mt-4">
              <ImportReposButton hasImported variant="secondary" />
            </div>
          )}
          {repoList.length > 0 && (
            <ul className="mt-5 divide-y divide-border">
              {repoList.slice(0, 8).map((repo) => (
                <li key={repo.id}>
                  <a
                    href={repo.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex min-h-11 items-center justify-between gap-3 py-2 text-sm hover:text-primary-text"
                  >
                    <span className="flex min-w-0 items-center gap-2 font-mono font-semibold">
                      <RepoIcon className="h-4 w-4 shrink-0 text-muted" />
                      <span className="truncate">{repo.name}</span>
                    </span>
                    {repo.primary_language && <span className="shrink-0 text-xs text-muted">{repo.primary_language}</span>}
                  </a>
                </li>
              ))}
            </ul>
          )}
          {repoList.length > 8 && <p className="mt-2 text-sm text-muted">+ {repoList.length - 8} more</p>}
        </section>
      </div>
    </>
  );
}

// Where each checklist step's button goes. The import step uses the import button instead.
const stepLinks: Partial<Record<ChecklistStepId, { href: string; label: string }>> = {
  review: { href: "/candidate/profile", label: "Open your profile" },
  feature: { href: "/candidate/profile#choose-featured-heading", label: "Choose projects" },
};

function Checklist({
  steps,
  next,
  doneCount,
  total,
  hasRepos,
}: {
  steps: ChecklistStep[];
  next: ChecklistStepId | null;
  doneCount: number;
  total: number;
  hasRepos: boolean;
}) {
  return (
    <section aria-labelledby="checklist-heading" className="rounded-2xl border border-border bg-card p-5 sm:p-6">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="checklist-heading" className="text-lg font-bold">
          Getting started
        </h2>
        <span className="text-sm text-muted">
          {doneCount} of {total} done
        </span>
      </div>
      {/* Progress bar. The text above says the same thing for screen readers. */}
      <div aria-hidden="true" className="mt-3 h-2 overflow-hidden rounded-full bg-surface">
        <div className="h-full rounded-full bg-primary transition-[width]" style={{ width: `${(doneCount / total) * 100}%` }} />
      </div>

      <ol className="mt-5 space-y-1">
        {steps.map((step, index) => {
          const isNext = step.id === next;
          const link = stepLinks[step.id];
          return (
            <li
              key={step.id}
              aria-current={isNext ? "step" : undefined}
              className={`flex gap-4 rounded-xl p-3 ${isNext ? "bg-primary-soft" : ""}`}
            >
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                  step.done
                    ? "bg-primary text-primary-foreground"
                    : isNext
                      ? "border-2 border-primary text-primary-text"
                      : "border border-border text-muted"
                }`}
              >
                {step.done ? <CheckIcon className="h-4 w-4" /> : index + 1}
                <span className="sr-only">{step.done ? " (done)" : ""}</span>
              </span>
              <div className="min-w-0 flex-1">
                <p className={`font-semibold ${step.done ? "text-muted line-through decoration-1" : ""}`}>
                  {step.title}
                  {step.comingSoon && (
                    <span className="ml-2 rounded-full bg-surface px-2 py-0.5 align-middle text-xs font-semibold text-muted no-underline">
                      Coming soon
                    </span>
                  )}
                </p>
                <p className="mt-0.5 text-sm text-muted">{step.description}</p>
                {isNext && step.id === "import" && (
                  <div className="mt-3">
                    <ImportReposButton hasImported={hasRepos} />
                  </div>
                )}
                {isNext && link && (
                  <Link
                    href={link.href}
                    className="mt-3 inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary-hover"
                  >
                    {link.label}
                    <ArrowRightIcon className="h-4 w-4" />
                  </Link>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function DashboardSkeleton() {
  return (
    <div aria-hidden="true" className="animate-pulse">
      <div className="flex items-center gap-4">
        <div className="h-16 w-16 rounded-full bg-surface" />
        <div className="h-8 w-56 rounded bg-surface" />
      </div>
      <div className="mt-8 grid grid-cols-3 gap-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-24 rounded-2xl border border-border bg-card" />
        ))}
      </div>
      <div className="mt-8 h-80 rounded-2xl border border-border bg-card" />
    </div>
  );
}
