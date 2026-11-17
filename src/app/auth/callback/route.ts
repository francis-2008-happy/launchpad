// GitHub sends the user back here after they approve sign in.
// The URL contains a one-time "code" that we exchange for a Supabase session (login cookies).
import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { GITHUB_TOKEN_COOKIE } from "@/lib/github/api";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  // Where to go after signing in. Only allow paths on our own site (starting with a
  // single "/"), so nobody can craft a link that redirects users to another website.
  const next = searchParams.get("next") ?? "/";
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Keep the user's GitHub access token for importing their repositories (#39).
      // GitHub gives each user 5,000 API requests an hour with their own token,
      // instead of 60 without one. Supabase only hands us this token right now,
      // at sign in, so it is stored in a cookie that:
      //   - httpOnly: page JavaScript cannot read it, only our server can
      //   - secure:   only sent over HTTPS (except on localhost)
      //   - sameSite: not sent with requests from other websites
      // The token only reads public GitHub data (no extra scopes are requested).
      const token = data.session?.provider_token;
      if (token) {
        (await cookies()).set(GITHUB_TOKEN_COOKIE, token, {
          httpOnly: true,
          secure: origin.startsWith("https://"),
          sameSite: "lax",
          path: "/",
          maxAge: 60 * 60 * 24 * 7, // a week; signing in again refreshes it
        });
      }
      return NextResponse.redirect(`${origin}${safeNext}`);
    }
  }

  // No code, or the exchange failed: back to sign in with an error message.
  return NextResponse.redirect(`${origin}/sign-in?error=auth`);
}
