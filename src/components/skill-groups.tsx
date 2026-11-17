// Verified skills grouped by category, each linked to the repositories that
// prove it (issue #41). A Server Component with no data loading of its own, so
// it can be reused anywhere a profile is shown (for example, employers viewing
// an applicant in Sprint 3).
import { CheckIcon, RepoIcon } from "@/components/icons";
import { describeSources, type SkillGroup } from "@/lib/skills/profile";

// How many repository links to show per skill before "+ N more".
const MAX_REPO_LINKS = 6;

export function SkillGroups({ groups }: { groups: SkillGroup[] }) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {groups.map((group) => (
        <section
          key={group.category}
          aria-labelledby={`group-${group.category}`}
          className="rounded-2xl border border-border bg-card p-5 sm:p-6"
        >
          <div className="flex items-baseline justify-between gap-3">
            <h3 id={`group-${group.category}`} className="text-lg font-bold">
              {group.title}
            </h3>
            <span className="text-sm text-muted">{group.skills.length}</span>
          </div>

          <ul className="mt-4 divide-y divide-border">
            {group.skills.map((skill) => {
              const extra = skill.repos.length - MAX_REPO_LINKS;
              return (
                <li key={skill.name} className="py-4 first:pt-0 last:pb-0">
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-2 font-semibold">
                      <CheckIcon className="h-4 w-4 shrink-0 text-accent-text" />
                      {skill.name}
                    </span>
                    <span className="shrink-0 rounded-full bg-accent-soft px-2.5 py-0.5 text-xs font-semibold text-accent-text">
                      {skill.repos.length} {skill.repos.length === 1 ? "repo" : "repos"}
                    </span>
                  </div>

                  {/* The evidence: links to the repositories on GitHub. */}
                  <ul aria-label={`Repositories that prove ${skill.name}`} className="mt-2 flex flex-wrap gap-1.5">
                    {skill.repos.slice(0, MAX_REPO_LINKS).map((repo) => (
                      <li key={repo.url}>
                        <a
                          href={repo.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex min-h-8 items-center gap-1 rounded-md bg-surface px-2 py-1 font-mono text-xs text-muted transition hover:bg-primary-soft hover:text-primary-text"
                        >
                          <RepoIcon className="h-3.5 w-3.5" />
                          {repo.name}
                        </a>
                      </li>
                    ))}
                    {extra > 0 && <li className="self-center px-1 text-xs text-muted">+ {extra} more</li>}
                  </ul>
                  <p className="mt-1.5 text-xs text-muted">{describeSources(skill.sources)}</p>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
