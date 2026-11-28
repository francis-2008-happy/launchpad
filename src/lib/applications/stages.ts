// Application stages (issue #75), shared by the candidate and employer pages.
// The order here is the order employers see in the stage dropdown.
import type { Database } from "@/types/database";

export type Stage = Database["public"]["Enums"]["application_stage"];

export const STAGES: readonly Stage[] = ["applied", "reviewing", "interviewing", "offered", "rejected"];

export const STAGE_LABELS: Record<Stage, string> = {
  applied: "Applied",
  reviewing: "Reviewing",
  interviewing: "Interviewing",
  offered: "Offered",
  rejected: "Rejected",
};

// True when a value from a form is one of the allowed stages.
// Used to validate input on the server before it reaches the database.
export function isStage(value: unknown): value is Stage {
  return typeof value === "string" && (STAGES as readonly string[]).includes(value);
}
