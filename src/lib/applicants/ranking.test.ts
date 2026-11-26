import { oneLine, parseSortOrder, sortApplicants } from "./ranking";

const ana = { name: "ana", appliedAt: "2026-11-20T10:00:00Z", score: 70 };
const ben = { name: "ben", appliedAt: "2026-11-22T10:00:00Z", score: 90 };
const cy = { name: "cy", appliedAt: "2026-11-24T10:00:00Z", score: null };
const dee = { name: "dee", appliedAt: "2026-11-21T10:00:00Z", score: 70 };
const eve = { name: "eve", appliedAt: "2026-11-19T10:00:00Z", score: null };

const names = (list: { name: string }[]) => list.map((a) => a.name);

describe("parseSortOrder", () => {
  it("accepts match and falls back to newest", () => {
    expect(parseSortOrder("match")).toBe("match");
    expect(parseSortOrder("newest")).toBe("newest");
    expect(parseSortOrder(undefined)).toBe("newest");
    expect(parseSortOrder("score; drop table")).toBe("newest");
    expect(parseSortOrder(["match", "newest"])).toBe("newest");
  });
});

describe("sortApplicants", () => {
  it("sorts by newest application", () => {
    expect(names(sortApplicants([ana, ben, cy, dee, eve], "newest"))).toEqual(["cy", "ben", "dee", "ana", "eve"]);
  });

  it("sorts by highest score, ties by newest, not analyzed last", () => {
    expect(names(sortApplicants([ana, ben, cy, dee, eve], "match"))).toEqual(["ben", "dee", "ana", "cy", "eve"]);
  });

  it("does not change the original list", () => {
    const list = [ana, ben];
    sortApplicants(list, "match");
    expect(names(list)).toEqual(["ana", "ben"]);
  });
});

describe("oneLine", () => {
  it("keeps only the first sentence", () => {
    expect(oneLine("Strong React skills. Docker is missing.")).toBe("Strong React skills.");
  });

  it("keeps text with no sentence ending", () => {
    expect(oneLine("  Strong React skills  ")).toBe("Strong React skills");
  });

  it("does not split on dots inside words like Node.js", () => {
    expect(oneLine("Proven in Node.js projects. More text.")).toBe("Proven in Node.js projects.");
  });

  it("cuts a long first sentence at a word boundary", () => {
    expect(oneLine("one two three four five six", 14)).toBe("one two three…");
  });
});
