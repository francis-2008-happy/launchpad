import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { groupSkills, type EvidenceRow } from "@/lib/skills/profile";
import { SkillGroups } from "@/components/skill-groups";
import { FeaturedProjects } from "@/components/featured-projects";
import { GitHubIcon } from "@/components/icons";

export const metadata: Metadata = { title: "Candidate profile | LaunchPad" };

type PageProps = { params: Promise<{ id: string }> };

export default function CandidateProfilePage({ params }: PageProps) {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <Suspense fallback={<ProfileSkeleton />}>
        <CandidateProfile params={params} />
      </Suspense>
    </main>
  );
}

async function CandidateProfile({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) notFound();

  const { data: viewer } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (viewer?.role === "candidate" && user.id !== id) notFound();

  if (viewer?.role === "employer") {
    const { data: application } = await supabase
      .from("applications")
      .select("id")
      .eq("candidate_id", id)
      .limit(1)
      .maybeSingle();
    if (!application) notFound();
  } else if (viewer?.role !== "candidate" && viewer?.role !== "admin") {
    notFound();
  }

  const [{ data: profile }, { data: evidence }, { data: repos }] = await Promise.all([
    supabase.from("profiles").select("full_name, github_username, avatar_url, headline").eq("id", id).maybeSingle(),
    supabase
      .from("candidate_skills")
      .select("source, skill:skills(name, category), repository:repositories(name, url)")
      .eq("profile_id", id),
    supabase
      .from("repositories")
      .select("id, name, url, primary_language, stars, is_featured, featured_description")
      .eq("profile_id", id)
      .order("pushed_at", { ascending: false, nullsFirst: false }),
  ]);
  if (!profile) notFound();

  const groups = groupSkills((evidence ?? []) as EvidenceRow[]);
  const skillCount = groups.reduce((sum, group) => sum + group.skills.length, 0);
  const featured = (repos ?? []).filter((repo) => repo.is_featured && repo.featured_description);
  const name = profile.full_name || profile.github_username || "Candidate";

  return (
    <>
      <Link href={viewer?.role === "employer" ? "/employer/dashboard" : "/candidate/dashboard"} className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text hover:underline">
        ← Back
      </Link>
      <section className="mt-4 flex items-center gap-4 rounded-3xl border border-border bg-card p-6 sm:p-8">
        {profile.avatar_url && (
          <span className="relative block h-16 w-16 shrink-0 overflow-hidden rounded-full bg-surface sm:h-20 sm:w-20">
            <Image src={profile.avatar_url} alt="" fill sizes="80px" className="object-cover" />
          </span>
        )}
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-extrabold tracking-tight sm:text-3xl">{name}</h1>
          {profile.headline && <p className="mt-1 text-muted">{profile.headline}</p>}
          {profile.github_username && (
            <a href={`https://github.com/${profile.github_username}`} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1.5 text-sm text-muted hover:underline">
              <GitHubIcon className="h-4 w-4" />@{profile.github_username}
            </a>
          )}
        </div>
      </section>

      {featured.length > 0 && (
        <section className="mt-10" aria-labelledby="featured-heading">
          <h2 id="featured-heading" className="text-2xl font-extrabold tracking-tight">Featured projects</h2>
          <div className="mt-6">
            <FeaturedProjects projects={featured.map((repo) => ({
              id: repo.id,
              name: repo.name,
              url: repo.url,
              primaryLanguage: repo.primary_language,
              stars: repo.stars,
              description: repo.featured_description ?? "",
            }))} />
          </div>
        </section>
      )}

      {skillCount > 0 ? (
        <section className="mt-10" aria-labelledby="skills-heading">
          <h2 id="skills-heading" className="text-2xl font-extrabold tracking-tight">Verified skills</h2>
          <p className="mt-2 text-muted">Every skill links to repositories that provide evidence.</p>
          <div className="mt-6"><SkillGroups groups={groups} /></div>
        </section>
      ) : (
        <div className="mt-10 rounded-3xl border border-dashed border-border bg-surface px-6 py-12 text-center">
          <p className="font-semibold">No verified skills yet</p>
          <p className="mt-2 text-sm text-muted">This candidate has not imported repositories or detected skills.</p>
        </div>
      )}
    </>
  );
}

function ProfileSkeleton() {
  return <div aria-hidden="true" className="h-96 animate-pulse rounded-3xl border border-border bg-card" />;
}
