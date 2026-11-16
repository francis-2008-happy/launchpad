// src/app/actions/onboarding.ts
"use server";

import { createClient } from "@/lib/supabase/server"; // Adjust path if your client export is named differently
import { redirect } from "next/navigation";

export async function completeOnboarding(formData: FormData): Promise<void> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  
  if (!user) {
    redirect("/sign-in");
  }

  const role = formData.get("role") as "candidate" | "employer";
  if (!role || !["candidate", "employer"].includes(role)) {
    throw new Error("Please select a valid role.");
  }

  const { error } = await supabase
    .from("profiles")
    .update({ role })
    .eq("id", user.id);

  if (error) {
    console.error("Failed to save role:", error);
    throw new Error("Could not save your role. Please try again.");
  }

  redirect(role === "candidate" ? "/candidate/dashboard" : "/employer/dashboard");
}