// Runs before every page request (Next.js 16 calls this "proxy"; it used to be "middleware").
// Its only job right now: keep the Supabase login session fresh. Supabase sessions expire,
// and Server Components cannot save cookies, so the refreshed session is saved here.
// Issue #9 (protected pages) can add role-based redirects to this file.
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

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
  await supabase.auth.getClaims();

  // Helper to redirect while preserving the refreshed session cookies and headers
  const redirectWithCookies = (url: URL) => {
    const r = NextResponse.redirect(url);
    
    // Copy cookies (name and value only, as getAll() doesn't return options)
    response.cookies.getAll().forEach((c) => {
      r.cookies.set(c.name, c.value);
    });
    
    // Copy any headers that were set during the session refresh
    response.headers.forEach((value, key) => {
      r.headers.set(key, value);
    });
    
    return r;
  };

  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub ?? null;

  const pathname = request.nextUrl.pathname;
  const isProtected = pathname.startsWith("/candidate") || pathname.startsWith("/employer");
  const isOnboarding = pathname.startsWith("/onboarding");

  // Signed-out users cannot open dashboards.
  if (!userId && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = "/sign-in";
    url.searchParams.set("next", pathname);
    return redirectWithCookies(url);
  }

  if (userId) {
    let role: string | null = null;
    if (!isOnboarding) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .single();
      role = profile?.role ?? null;
    }

    // New users (no role yet) go to onboarding.
    if (!isOnboarding && !role) {
      const url = request.nextUrl.clone();
      url.pathname = "/onboarding";
      return redirectWithCookies(url);
    }

    // Each role stays out of the other's pages.
    if (role === "candidate" && pathname.startsWith("/employer")) {
      const url = request.nextUrl.clone();
      url.pathname = "/candidate/dashboard";
      return redirectWithCookies(url);
    }
    if (role === "employer" && pathname.startsWith("/candidate")) {
      const url = request.nextUrl.clone();
      url.pathname = "/employer/dashboard";
      return redirectWithCookies(url);
    }
  }

  return response;
}

export const config = {
  // Run on every route except static files and images.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
