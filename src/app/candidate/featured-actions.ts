// Server actions for featured projects (issue #42).
//   saveFeaturedProject    feature a repository, or edit its description
//   removeFeaturedProject  stop featuring a repository
//
// Both are used with .bind(null, repositoryId), so the repository id comes from
// the server-rendered page, not from the form. Row Level Security also makes
// sure candidates can only change their own repositories.
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { FEATURED_MAX, canFeatureAnother, validateFeaturedDescription } from "@/lib/validation/featured";

export type FeaturedFormState = {
  status: "idle" | "success" | "error";
  message?: string;
  description?: string; // sends back what was typed, because React clears the form
  savedAt?: number;
};

async function signedInUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");
  return { supabase, user };
}

export async function saveFeaturedProject(
  repositoryId: string,
  _previous: FeaturedFormState,
  formData: FormData,
): Promise<FeaturedFormState> {
  const { supabase, user } = await signedInUser();
  const description = String(formData.get("description") ?? "");

  const result = validateFeaturedDescription(description);
  if (!result.ok) return { status: "error", message: result.error, description };

  // At most 3 featured projects. Count the others (not this one), so editing
  // the description of an already featured project is always allowed.
  const { count, error: countError } = await supabase
    .from("repositories")
    .select("id", { count: "exact", head: true })
    .eq("profile_id", user.id)
    .eq("is_featured", true)
    .neq("id", repositoryId);
  if (countError) {
    console.error("Failed to count featured projects:", countError);
    return { status: "error", message: "We couldn't save this. Please try again.", description };
  }
  if (!canFeatureAnother(count ?? 0)) {
    return {
      status: "error",
      message: `You can feature up to ${FEATURED_MAX} projects. Remove one first.`,
      description,
    };
  }

  const { data, error } = await supabase
    .from("repositories")
    .update({ is_featured: true, featured_description: result.value })
    .eq("id", repositoryId)
    .eq("profile_id", user.id)
    .select("id");
  if (error || data.length === 0) {
    if (error) console.error("Failed to feature project:", error);
    return { status: "error", message: "We couldn't save this. Please try again.", description };
  }

  revalidatePath("/candidate", "layout");
  return { status: "success", message: "Saved.", description: result.value, savedAt: Date.now() };
}

export async function removeFeaturedProject(repositoryId: string): Promise<void> {
  const { supabase, user } = await signedInUser();
  const { error } = await supabase
    .from("repositories")
    .update({ is_featured: false, featured_description: null })
    .eq("id", repositoryId)
    .eq("profile_id", user.id);
  if (error) console.error("Failed to remove featured project:", error);
  revalidatePath("/candidate", "layout");
}
