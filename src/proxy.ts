// Runs before every page request (Next.js 16 calls this "proxy"; it used to be "middleware").
// It does two jobs:
// 1. Keeps the Supabase login session fresh. Sessions expire, and Server Components
//    cannot save cookies, so the refreshed session is saved here.
// 2. Protects pages by role (#9): signed-out users cannot open dashboards, new users
//    pick a role at /onboarding first, and each role stays out of the other's pages.
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { dashboardPathFor } from "@/lib/roles";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          // Pass the refreshed cookies both to the page being rendered and to the browser.
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
          Object.entries(headers ?? {}).forEach(([key, value]) =>
            response.headers.set(key, value),
          );
        },
      },
    },
  );

  // Checks the session and refreshes it if it has expired.
  // Do not put code between createServerClient and this call.
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub ?? null;

  // Redirect to another page, keeping any refreshed session cookies.
  const redirectWithCookies = (pathname: string, search = "") => {
    const url = request.nextUrl.clone();
    url.pathname = pathname;
    url.search = search;
    const redirect = NextResponse.redirect(url);

    // Copy each cookie with its options (expiry, httpOnly, secure, ...).
    response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));

    // Copy only the no-cache headers Supabase sets on a refresh, so a response
    // with a session cookie is never cached. Other headers are internal to Next.js.
    ["cache-control", "expires", "pragma"].forEach((name) => {
      const value = response.headers.get(name);
      if (value) redirect.headers.set(name, value);
    });

    return redirect;
  };

  const pathname = request.nextUrl.pathname;
  const isProtected = pathname.startsWith("/candidate") || pathname.startsWith("/employer");
  const isOnboarding = pathname.startsWith("/onboarding");

  // Signed-out users cannot open dashboards.
  if (!userId && isProtected) {
    return redirectWithCookies("/sign-in", `?next=${encodeURIComponent(pathname)}`);
  }

  if (userId) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();
    const role = profile?.role ?? null;

    // New users (no role yet) go to onboarding.
    if (!role && !isOnboarding) {
      return redirectWithCookies("/onboarding");
    }

    // A role can only be picked once, so users who have one skip onboarding.
    if (role && isOnboarding) {
      return redirectWithCookies(dashboardPathFor(role));
    }

    // Each role stays out of the other's pages.
    if (role === "candidate" && pathname.startsWith("/employer")) {
      return redirectWithCookies("/candidate/dashboard");
    }
    if (role === "employer" && pathname.startsWith("/candidate")) {
      return redirectWithCookies("/employer/dashboard");
    }
  }

  return response;
}

export const config = {
  // Run on every route except static files and images.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
