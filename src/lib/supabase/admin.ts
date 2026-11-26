// Supabase ADMIN client: SERVER ONLY.
// It uses the secret key, which skips Row Level Security, so it can do anything.
//
// We use it in exactly one place: saving match analyses (src/lib/matching/analyze.ts).
// That table has no insert or update policies on purpose, so the browser can never
// write a score; only our server code, after computing the score itself, can.
// Do not use this client for anything RLS can express.
//
// Never import this file from a Client Component ("use client").
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export function createAdminClient() {
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  if (!secretKey) throw new Error("SUPABASE_SECRET_KEY is not set. Add it to .env.local (see .env.example).");

  return createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, secretKey, {
    // No user session: this client acts as the server itself.
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
