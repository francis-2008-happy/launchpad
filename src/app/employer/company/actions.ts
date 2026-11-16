// Server action for the company profile form (issue #12).
// It runs on the server when the form is submitted: it checks who is signed in,
// validates the input, then creates or updates the employer's company.
// Row Level Security in the database also enforces that only employers can
// create a company and only the owner can edit it.
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { validateCompany, type CompanyErrors, type CompanyInput } from "@/lib/validation/company";

// What the form shows after a submit: field errors, a general error, or success.
// `values` sends back what was submitted. React clears a form after its action
// runs, so the form uses these as its default values to keep what the user typed.
export type CompanyFormState = {
  status: "idle" | "success" | "error";
  message?: string;
  errors?: CompanyErrors;
  values?: CompanyInput;
};

export async function saveCompany(_previous: CompanyFormState, formData: FormData): Promise<CompanyFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const values: CompanyInput = {
    name: String(formData.get("name") ?? ""),
    website: String(formData.get("website") ?? ""),
    description: String(formData.get("description") ?? ""),
  };
  const result = validateCompany(values);
  if (!result.ok) {
    return { status: "error", message: "Please fix the highlighted fields.", errors: result.errors, values };
  }

  // Each employer has one company profile: update it if it exists, otherwise create it.
  const { data: existing } = await supabase
    .from("companies")
    .select("id")
    .eq("owner_id", user.id)
    .order("created_at")
    .limit(1)
    .maybeSingle();

  const { error } = existing
    ? await supabase.from("companies").update(result.data).eq("id", existing.id)
    : await supabase.from("companies").insert({ ...result.data, owner_id: user.id });

  if (error) {
    console.error("Failed to save company:", error);
    return { status: "error", message: "We couldn't save your company. Please try again.", values };
  }

  revalidatePath("/employer/company");
  revalidatePath("/employer/dashboard");
  return {
    status: "success",
    message: existing ? "Company profile updated." : "Company profile created.",
    values: {
      name: result.data.name,
      website: result.data.website ?? "",
      description: result.data.description ?? "",
    },
  };
}
