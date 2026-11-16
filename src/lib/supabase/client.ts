// Supabase client for the BROWSER.
// Use this only in Client Components (files that start with "use client"),
// for example a sign in button or a form that updates live.
// For Server Components, route handlers, and server actions, use ./server.ts instead.
import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
