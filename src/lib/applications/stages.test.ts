import { STAGES, STAGE_LABELS, isStage } from "./stages";

describe("isStage", () => {
  it("accepts every allowed stage", () => {
    for (const stage of STAGES) expect(isStage(stage)).toBe(true);
  });

  it("rejects anything else", () => {
    expect(isStage("hired")).toBe(false);
    expect(isStage("Applied")).toBe(false); // labels are not values
    expect(isStage("")).toBe(false);
    expect(isStage(null)).toBe(false);
    expect(isStage(3)).toBe(false);
  });
});

describe("STAGE_LABELS", () => {
  it("has a label for every stage", () => {
    for (const stage of STAGES) expect(STAGE_LABELS[stage]).toBeTruthy();
  });
});
