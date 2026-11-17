// The candidate's featured projects, shown at the top of the skill profile
// (issue #42). Like SkillGroups, it only displays data, so the employer view
// of an applicant can reuse it later.
import { RepoIcon, SparklesIcon } from "@/components/icons";

export type FeaturedProject = {
  id: string;
  name: string;
  url: string;
  primaryLanguage: string | null;
  stars: number;
  description: string;
};

export function FeaturedProjects({ projects }: { projects: FeaturedProject[] }) {
  return (
    <ul className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {projects.map((project) => (
        <li key={project.id} className="flex flex-col rounded-2xl border border-border bg-card p-5">
          <span className="inline-flex items-center gap-1.5 self-start rounded-full bg-highlight-soft px-2.5 py-0.5 text-xs font-semibold">
            <SparklesIcon className="h-3.5 w-3.5 text-highlight" />
            Featured
          </span>
          <a
            href={project.url}
            target="_blank"
            rel="noreferrer"
            className="mt-3 flex items-center gap-2 font-mono text-base font-bold hover:text-primary-text hover:underline"
          >
            <RepoIcon className="h-4 w-4 shrink-0 text-muted" />
            <span className="truncate">{project.name}</span>
          </a>
          <p className="mt-2 flex-1 text-sm text-muted">{project.description}</p>
          <p className="mt-4 text-xs text-muted">
            {[project.primaryLanguage, project.stars > 0 ? `★ ${project.stars.toLocaleString("en-US")}` : null]
              .filter(Boolean)
              .join(" · ") || "Open on GitHub"}
          </p>
        </li>
      ))}
    </ul>
  );
}
