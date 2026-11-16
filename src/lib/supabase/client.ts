// Supabase client for the BROWSER.
// Use this only in Client Components (files that start with "use client"),
// for example a sign in button or a form that updates live.
// For Server Components, route handlers, and server actions, use ./server.ts instead.
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
