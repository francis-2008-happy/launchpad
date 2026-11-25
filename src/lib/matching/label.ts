// A short word for a match score, shown next to the number (#77).
// Kept apart from score.ts because it is also used in the browser, and score.ts
// uses Node's crypto module, which browsers don't have.
export function matchLabel(score: number): "Strong match" | "Good match" | "Partial match" | "Early match" {
  if (score >= 80) return "Strong match";
  if (score >= 60) return "Good match";
  if (score >= 35) return "Partial match";
  return "Early match";
}
