// Ranking applicants by match score (issue #79). Pure functions, unit tested.
// The score helps employers decide who to review first. It does not decide for them.

export type SortOrder = "newest" | "match";

type Rankable = { appliedAt: string; score: number | null }; // null = not analyzed yet

// Reads the ?sort= value from the URL. Anything unexpected falls back to newest.
export function parseSortOrder(value: string | string[] | undefined): SortOrder {
  return value === "match" ? "match" : "newest";
}

// "newest": most recent application first.
// "match": highest score first, then not-analyzed applicants last; ties by newest.
// Returns a new array and leaves the input unchanged.
export function sortApplicants<T extends Rankable>(applicants: T[], order: SortOrder): T[] {
  const newestFirst = (a: T, b: T) => Date.parse(b.appliedAt) - Date.parse(a.appliedAt);
  if (order === "newest") return [...applicants].sort(newestFirst);

  return [...applicants].sort((a, b) => {
    if (a.score === null && b.score === null) return newestFirst(a, b);
    if (a.score === null) return 1;
    if (b.score === null) return -1;
    return b.score - a.score || newestFirst(a, b);
  });
}

// The first sentence of an AI explanation, for the one-line summary on each applicant.
// Long first sentences are cut at a word boundary.
export function oneLine(text: string, max = 160): string {
  const trimmed = text.trim();
  const end = trimmed.search(/[.!?](\s|$)/);
  const sentence = end === -1 ? trimmed : trimmed.slice(0, end + 1);
  if (sentence.length <= max) return sentence;
  const cut = sentence.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > 0 ? cut.slice(0, lastSpace) : cut).replace(/[,;:]$/, "")}…`;
}
