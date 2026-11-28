"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type ApplyState = { status: "idle" | "success" | "error"; message?: string };

export async function applyToJob(jobId: string): Promise<ApplyState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "candidate") {
    return { status: "error", message: "Only candidates can apply to jobs." };
  }

  const { data: job } = await supabase
    .from("jobs")
    .select("id")
    .eq("id", jobId)
    .eq("status", "open")
    .maybeSingle();
  if (!job) return { status: "error", message: "This job is not open for applications." };

  const { error } = await supabase
    .from("applications")
    .insert({ candidate_id: user.id, job_id: jobId, stage: "applied" });
  if (error) {
    if (error.code === "23505") return { status: "success", message: "You have already applied to this job." };
    console.error("Failed to apply:", error);
    return { status: "error", message: "We couldn't submit your application. Please try again." };
  }

  revalidatePath("/candidate", "layout");
  revalidatePath(`/jobs/${jobId}`);
  return { status: "success", message: "Application submitted." };
}
