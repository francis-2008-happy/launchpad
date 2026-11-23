// The "getting started" checklist on the candidate dashboard (issue #60).
// A pure function: it takes the candidate's progress and returns the steps,
// which are done, and which one to do next.

export type ChecklistInput = { repoCount: number; skillCount: number; featuredCount: number };

export type ChecklistStepId = "account" | "import" | "review" | "feature" | "jobs";

export type ChecklistStep = {
  id: ChecklistStepId;
  title: string;
  description: string;
  done: boolean;
  optional?: boolean; // we cannot track it, so it is not counted and is never "next"
};

export function buildChecklist({ repoCount, skillCount, featuredCount }: ChecklistInput) {
  const steps: ChecklistStep[] = [
    {
      id: "account",
      title: "Create your account",
      description: "Signed in with GitHub and chose the developer role.",
      done: true,
    },
    {
      id: "import",
      title: "Import your repositories",
      description: "LaunchPad reads your public repositories to find your skills.",
      done: repoCount > 0,
    },
    {
      id: "review",
      title: "Review your skill profile",
      description: "Check the skills we found and the code that proves each one.",
      done: skillCount > 0,
    },
    {
      id: "feature",
      title: "Feature your best projects",
      description: "Pick up to 3 projects and say what you built.",
      done: featuredCount > 0,
    },
    {
      id: "jobs",
      title: "Browse jobs",
      description: "Find jobs that match your verified skills.",
      done: false,
      optional: true, // we do not record whether someone has browsed jobs
    },
  ];

  const available = steps.filter((step) => !step.optional);
  const doneCount = available.filter((step) => step.done).length;
  // The first step that is not done and can be done now.
  const next = available.find((step) => !step.done)?.id ?? null;

  return { steps, doneCount, total: available.length, next };
}

// "Francis Happy" -> "Francis". Falls back to the GitHub username.
export function firstName(fullName: string | null | undefined, username: string | null | undefined): string {
  const first = fullName?.trim().split(/\s+/)[0];
  return first || username || "there";
}
