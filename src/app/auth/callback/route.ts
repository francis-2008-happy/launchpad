// GitHub sends the user back here after they approve sign in.
// The URL contains a one-time "code" that we exchange for a Supabase session (login cookies).
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  // Where to go after signing in. Only allow paths on our own site (starting with a
  // single "/"), so nobody can craft a link that redirects users to another website.
  const next = searchParams.get("next") ?? "/";
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${safeNext}`);
    }
  }

  // No code, or the exchange failed: back to sign in with an error message.
  return NextResponse.redirect(`${origin}/sign-in?error=auth`);
}
