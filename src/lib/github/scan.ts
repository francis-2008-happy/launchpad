// Collects what skill detection needs about one repository (issue #40):
// its languages, its file list, and the text of its dependency files.
// Server only (it may use the candidate's GitHub token).
import { getFilePaths, getFileText, getLanguages, type GitHubRepository } from "@/lib/github/api";
import { dependencyFilesToFetch, detectSkills, type DetectedSkill } from "@/lib/github/skill-detection";

export async function scanRepository(repo: GitHubRepository, token: string | null): Promise<DetectedSkill[]> {
  // 2 GitHub API requests: languages and the file list.
  const [languages, paths] = await Promise.all([
    getLanguages(repo.full_name, token),
    getFilePaths(repo.full_name, repo.default_branch, token),
  ]);

  // Dependency files come from raw.githubusercontent.com (no API rate limit).
  const files: Record<string, string> = {};
  await Promise.all(
    dependencyFilesToFetch(paths).map(async (path) => {
      const text = await getFileText(repo.full_name, repo.default_branch, path);
      if (text !== null) files[path] = text;
    }),
  );

  return detectSkills({ languages, paths, files });
}
