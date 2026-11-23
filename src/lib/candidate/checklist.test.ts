// Unit tests for the candidate dashboard checklist (issue #60).
import { buildChecklist, firstName } from "@/lib/candidate/checklist";

describe("buildChecklist", () => {
  it("starts with only the account step done and import next", () => {
    const result = buildChecklist({ repoCount: 0, skillCount: 0, featuredCount: 0 });
    expect(result.doneCount).toBe(1);
    expect(result.total).toBe(4); // "Browse jobs" is optional, so it is not counted
    expect(result.next).toBe("import");
  });

  it("moves on as the candidate makes progress", () => {
    expect(buildChecklist({ repoCount: 12, skillCount: 0, featuredCount: 0 }).next).toBe("review");
    expect(buildChecklist({ repoCount: 12, skillCount: 9, featuredCount: 0 }).next).toBe("feature");
  });

  it("is complete when every available step is done", () => {
    const result = buildChecklist({ repoCount: 12, skillCount: 9, featuredCount: 2 });
    expect(result.doneCount).toBe(4);
    expect(result.next).toBeNull();
  });

  it("keeps browsing jobs optional: never counted and never the next step", () => {
    const result = buildChecklist({ repoCount: 1, skillCount: 1, featuredCount: 1 });
    const jobs = result.steps.find((s) => s.id === "jobs")!;
    expect(jobs.optional).toBe(true);
    expect(jobs.done).toBe(false);
    expect(result.next).toBeNull();
  });
});

describe("firstName", () => {
  it("uses the first word of the full name", () => {
    expect(firstName("Francis Happy", "francis-2008-happy")).toBe("Francis");
  });

  it("falls back to the GitHub username, then a friendly word", () => {
    expect(firstName("  ", "octocat")).toBe("octocat");
    expect(firstName(null, null)).toBe("there");
  });
});
