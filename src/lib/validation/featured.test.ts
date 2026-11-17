// Unit tests for featured project validation (issue #42).
import { FEATURED_DESCRIPTION_MAX, canFeatureAnother, validateFeaturedDescription } from "@/lib/validation/featured";

describe("validateFeaturedDescription", () => {
  it("accepts a short description and trims it", () => {
    expect(validateFeaturedDescription("  A chat app built with Next.js.  ")).toEqual({ ok: true, value: "A chat app built with Next.js." });
  });

  it("requires a description", () => {
    expect(validateFeaturedDescription("   ").ok).toBe(false);
  });

  it("accepts exactly the maximum length", () => {
    expect(validateFeaturedDescription("x".repeat(FEATURED_DESCRIPTION_MAX)).ok).toBe(true);
  });

  it("rejects a description that is too long", () => {
    expect(validateFeaturedDescription("x".repeat(FEATURED_DESCRIPTION_MAX + 1))).toEqual({
      ok: false,
      error: "Keep it to 280 characters or fewer.",
    });
  });
});

describe("canFeatureAnother", () => {
  it("allows up to 3 featured projects", () => {
    expect(canFeatureAnother(0)).toBe(true);
    expect(canFeatureAnother(2)).toBe(true);
    expect(canFeatureAnother(3)).toBe(false);
  });
});
