// Validation for featured projects (issue #42). Pure functions, used by the
// server action so the rules cannot be skipped from the browser.

export const FEATURED_MAX = 3;
export const FEATURED_DESCRIPTION_MAX = 280; // the database allows 500; we keep it short and readable

export type FeaturedDescriptionResult = { ok: true; value: string } | { ok: false; error: string };

// The candidate's own words about the project: required, trimmed, and short.
export function validateFeaturedDescription(input: string): FeaturedDescriptionResult {
  const value = input.trim().replace(/\s+\n/g, "\n");
  if (value.length === 0) {
    return { ok: false, error: "Add a sentence or two about what you built and what you learned." };
  }
  if (value.length > FEATURED_DESCRIPTION_MAX) {
    return { ok: false, error: `Keep it to ${FEATURED_DESCRIPTION_MAX} characters or fewer.` };
  }
  return { ok: true, value };
}

// True when one more project can be featured. `alreadyFeatured` should not
// count the project being saved, so editing a featured project's description
// is always allowed.
export function canFeatureAnother(alreadyFeatured: number): boolean {
  return alreadyFeatured < FEATURED_MAX;
}
