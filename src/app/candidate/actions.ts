// Server actions for the candidate's GitHub skill profile.
//   importRepositories  import or refresh the candidate's public repositories (issue #39)
//                       and detect the skills each one proves (issue #40)
//
// GitHub is only called here, when the candidate clicks Import or Refresh. Pages
// read the saved rows from the database, so they never wait on GitHub.
"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { GITHUB_TOKEN_COOKIE, GitHubRateLimitError, listRepositories, mapWithLimit } from "@/lib/github/api";
import { selectReposToImport, toRepositoryRow } from "@/lib/github/import";
import { scanRepository } from "@/lib/github/scan";

export type ImportState = {
  status: "idle" | "success" | "error";
  message?: string;
};

export async function importRepositories(): Promise<ImportState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data: profile } = await supabase.from("profiles").select("role, github_username").eq("id", user.id).single();
  if (profile?.role !== "candidate") {
    return { status: "error", message: "Only candidates can import repositories." };
  }
  if (!profile.github_username) {
    return { status: "error", message: "We couldn't find your GitHub username. Please sign out and sign in again." };
  }

  // The candidate's own GitHub token (saved at sign in), else the optional
  // server token, else no token (GitHub then allows only 60 requests an hour).
  const token = (await cookies()).get(GITHUB_TOKEN_COOKIE)?.value ?? process.env.GITHUB_TOKEN ?? null;

  let repos;
  try {
    repos = await listRepositories(profile.github_username, token);
  } catch (error) {
    return gitHubErrorState(error, Boolean(token));
  }
  if (!repos) {
    return { status: "error", message: `GitHub has no user called "${profile.github_username}".` };
  }

  const selected = selectReposToImport(repos);
  const importedAt = new Date().toISOString();

  // Detect skills in every repository (#40), 6 repositories at a time.
  // This happens before anything is saved, so if GitHub stops us half way
  // (rate limit), the candidate's previous profile stays as it was.
  let detected;
  try {
    detected = await mapWithLimit(selected, 6, (repo) => scanRepository(repo, token));
  } catch (error) {
    return gitHubErrorState(error, Boolean(token));
  }

  let saved: { id: string; github_id: number }[] = [];
  if (selected.length > 0) {
    // Insert new repositories and update existing ones. onConflict uses the
    // unique (profile_id, github_id) pair, so re-importing never adds duplicates.
    const { data, error } = await supabase
      .from("repositories")
      .upsert(
        selected.map((repo) => toRepositoryRow(repo, user.id, importedAt)),
        { onConflict: "profile_id,github_id" },
      )
      .select("id, github_id");
    if (error) {
      console.error("Failed to save repositories:", error);
      return { status: "error", message: "We couldn't save your repositories. Please try again." };
    }
    saved = data;
  }

  // Remove repositories that were deleted on GitHub (or are no longer among the most recent).
  const keep = selected.map((repo) => repo.id);
  const remove = supabase.from("repositories").delete().eq("profile_id", user.id);
  const { error: removeError } = keep.length > 0 ? await remove.not("github_id", "in", `(${keep.join(",")})`) : await remove;
  if (removeError) console.error("Failed to remove old repositories:", removeError);

  const skillCount = await saveDetectedSkills(user.id, selected, detected, saved);
  if (skillCount === null) {
    return { status: "error", message: "We saved your repositories but couldn't save your skills. Please try again." };
  }

  revalidatePath("/candidate", "layout");
  return {
    status: "success",
    message:
      selected.length === 0
        ? "You don't have any public repositories of your own yet. Push a project to GitHub, then refresh."
        : `Imported ${selected.length} ${selected.length === 1 ? "repository" : "repositories"} and found ${skillCount} verified ${skillCount === 1 ? "skill" : "skills"}.`,
  };
}

// Replaces the candidate's skill evidence with what this import found (#40):
// one candidate_skills row for each skill in each repository that proves it.
// Returns how many different skills were found, or null if saving failed.
async function saveDetectedSkills(
  profileId: string,
  repos: { id: number }[],
  detected: { skill: string; source: "language" | "dependency" | "tests" }[][],
  saved: { id: string; github_id: number }[],
): Promise<number | null> {
  const supabase = await createClient();

  // Skill names -> ids from the skills list.
  const names = [...new Set(detected.flat().map((d) => d.skill))];
  const { data: skills, error: skillsError } = names.length
    ? await supabase.from("skills").select("id, name").in("name", names)
    : { data: [], error: null };
  if (skillsError) {
    console.error("Failed to load skills:", skillsError);
    return null;
  }
  const skillIds = new Map(skills.map((skill) => [skill.name, skill.id]));
  const repositoryIds = new Map(saved.map((row) => [row.github_id, row.id]));

  const rows = repos.flatMap((repo, index) => {
    const repositoryId = repositoryIds.get(repo.id);
    if (!repositoryId) return [];
    return detected[index].flatMap(({ skill, source }) => {
      const skillId = skillIds.get(skill);
      return skillId ? [{ profile_id: profileId, skill_id: skillId, repository_id: repositoryId, source }] : [];
    });
  });

  // Start fresh, so skills removed from a repository disappear on refresh.
  const { error: clearError } = await supabase.from("candidate_skills").delete().eq("profile_id", profileId);
  if (clearError) {
    console.error("Failed to clear old skills:", clearError);
    return null;
  }
  if (rows.length > 0) {
    const { error: insertError } = await supabase.from("candidate_skills").insert(rows);
    if (insertError) {
      console.error("Failed to save skills:", insertError);
      return null;
    }
  }
  return new Set(rows.map((row) => row.skill_id)).size;
}

// A clear message for each way GitHub can fail.
function gitHubErrorState(error: unknown, hadToken: boolean): ImportState {
  if (error instanceof GitHubRateLimitError) {
    return {
      status: "error",
      message: hadToken
        ? "GitHub's rate limit has been reached. Please try again in about an hour."
        : "GitHub's rate limit has been reached. Sign out and sign in again so LaunchPad can use your own GitHub quota, then try again.",
    };
  }
  console.error("GitHub import failed:", error);
  return { status: "error", message: "We couldn't reach GitHub just now. Please try again in a moment." };
}
