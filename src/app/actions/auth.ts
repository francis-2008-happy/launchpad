// src/app/actions/auth.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  
  // Revalidate the layout so the Header updates to show the "Sign In" button
  revalidatePath("/", "layout");
  redirect("/");
}