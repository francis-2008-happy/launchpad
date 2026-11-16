// Where each role's home page is. Used by proxy.ts (redirects) and the landing
// page ("Go to your dashboard"), so the paths are defined in one place.
// Admins have no dashboard yet, so they go to the home page.
export function dashboardPathFor(role: string | null | undefined): string {
  if (role === "candidate") return "/candidate/dashboard";
  if (role === "employer") return "/employer/dashboard";
  return "/";
}
