// Supabase client for the SERVER.
// Use this in Server Components, route handlers, and server actions.
// It reads the signed-in user's session from the request cookies, so Row Level
// Security in the database knows who is making each request.
// Create a new client for every request: `const supabase = await createClient()`.
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database";
import { connection } from "next/server";

export async function createClient() {
  await connection();
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        // Give Supabase all cookies from the incoming request.
        getAll() {
          return cookieStore.getAll();
        },
        // Save refreshed session cookies.
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Server Components are not allowed to set cookies, so this fails there.
            // That is fine: the session is refreshed in proxy.ts (added with sign in, #6).
          }
        },
      },
    },
  );
}
