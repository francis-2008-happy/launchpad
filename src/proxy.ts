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

  return response;
}

export const config = {
  // Run on every route except static files and images.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
