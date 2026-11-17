// src/app/actions/auth.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { GITHUB_TOKEN_COOKIE } from "@/lib/github/api";

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  // Also forget the GitHub token saved at sign in for repository imports (#39).
  (await cookies()).delete(GITHUB_TOKEN_COOKIE);
  
  // Revalidate the layout so the Header updates to show the "Sign In" button
  revalidatePath("/", "layout");
  redirect("/");
}