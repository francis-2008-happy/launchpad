// The candidate's skill profile (issue #41): /candidate/profile
// Shows verified skills grouped by category, each linked to the repositories
// that prove it, with an empty state that leads to the import.
//
// Everything comes from our database (saved by the last import), so the page
// never waits on GitHub. It reads the session, so it sits inside <Suspense>.
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { groupSkills, type EvidenceRow } from "@/lib/skills/profile";
import { ImportReposButton } from "@/components/import-repos-button";
import { SkillGroups } from "@/components/skill-groups";
import { GitHubIcon } from "@/components/icons";

export const metadata: Metadata = {
  title: "Skill profile | LaunchPad",
};

const dateFormat = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" });

export default function SkillProfilePage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <Link href="/candidate/dashboard" className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text hover:underline">
        ← Back to dashboard
      </Link>
      <Suspense fallback={<ProfileSkeleton />}>
        <ProfileContent />
      </Suspense>
    </main>
  );
}

async function ProfileContent() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null; // the proxy already sends signed-out visitors to sign in

  const [{ data: profile }, { data: evidence }, { data: repos }] = await Promise.all([
    supabase.from("profiles").select("full_name, github_username, avatar_url, headline").eq("id", user.id).single(),
    supabase
      .from("candidate_skills")
      .select("source, skill:skills(name, category), repository:repositories(name, url)")
      .eq("profile_id", user.id),
    supabase.from("repositories").select("imported_at").eq("profile_id", user.id),
  ]);

  const groups = groupSkills((evidence ?? []) as EvidenceRow[]);
  const skillCount = groups.reduce((sum, group) => sum + group.skills.length, 0);
  const repoCount = repos?.length ?? 0;
  const lastImported = repos?.map((r) => r.imported_at).sort().at(-1);
  const name = profile?.full_name || profile?.github_username || "Your profile";

  return (
    <>
      {/* Header: who this is, with the numbers that matter */}
      <section className="mt-4 flex flex-col gap-6 rounded-3xl border border-border bg-card p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
        <div className="flex items-center gap-4">
          {profile?.avatar_url ? (
            <span className="relative block h-16 w-16 shrink-0 overflow-hidden rounded-full bg-surface sm:h-20 sm:w-20">
              <Image src={profile.avatar_url} alt="" fill sizes="80px" className="object-cover" />
            </span>
          ) : null}
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-extrabold tracking-tight sm:text-3xl">{name}</h1>
            {profile?.github_username && (
              <a
                href={`https://github.com/${profile.github_username}`}
                target="_blank"
                rel="noreferrer"
                className="mt-1 inline-flex items-center gap-1.5 text-sm text-muted hover:underline"
              >
                <GitHubIcon className="h-4 w-4" />@{profile.github_username}
              </a>
            )}
            <p className="mt-2 text-sm text-muted">
              <span className="font-semibold text-foreground">{skillCount}</span> verified {skillCount === 1 ? "skill" : "skills"} ·{" "}
              <span className="font-semibold text-foreground">{repoCount}</span> {repoCount === 1 ? "repository" : "repositories"}
              {lastImported && <> · Updated {dateFormat.format(new Date(lastImported))}</>}
            </p>
          </div>
        </div>
        {repoCount > 0 && <ImportReposButton hasImported variant="secondary" />}
      </section>

      {skillCount === 0 ? (
        <EmptyState hasRepos={repoCount > 0} />
      ) : (
        <section aria-labelledby="skills-heading" className="mt-10">
          <h2 id="skills-heading" className="text-2xl font-extrabold tracking-tight">
            Verified skills
          </h2>
          <p className="mt-2 text-muted">Every skill links to the repositories that prove it. Employers can open the code.</p>
          <div className="mt-6">
            <SkillGroups groups={groups} />
          </div>
        </section>
      )}
    </>
  );
}

// No skills yet: explain what happens and offer the import.
function EmptyState({ hasRepos }: { hasRepos: boolean }) {
  return (
    <section className="mt-10 rounded-3xl border border-dashed border-border bg-surface px-6 py-14 text-center">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-soft text-primary-text">
        <GitHubIcon className="h-7 w-7" />
      </span>
      <h2 className="mt-5 text-2xl font-extrabold tracking-tight">
        {hasRepos ? "No skills detected yet" : "Your skill profile is empty"}
      </h2>
      <p className="mx-auto mt-3 max-w-lg text-muted">
        {hasRepos
          ? "We couldn't find skills in your imported repositories. Push some code to GitHub, then refresh."
          : "Import your public GitHub repositories. LaunchPad detects your languages, frameworks, and testing practices, and links each skill to the code that proves it."}
      </p>
      <div className="mt-6 flex justify-center">
        <ImportReposButton hasImported={hasRepos} />
      </div>
    </section>
  );
}

function ProfileSkeleton() {
  return (
    <div aria-hidden="true" className="mt-4 animate-pulse space-y-8">
      <div className="h-36 rounded-3xl border border-border bg-card" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="h-64 rounded-2xl border border-border bg-card" />
        <div className="h-64 rounded-2xl border border-border bg-card" />
      </div>
    </div>
  );
}
