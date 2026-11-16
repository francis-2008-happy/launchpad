// Server actions for the company logo (issue #13).
// The file is checked here on the server, uploaded to the "company-logos"
// Supabase Storage bucket, and its public URL is saved in companies.logo_url.
// Storage policies (see the company_logos_storage migration) make sure an
// employer can only write files inside their own folder.
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { validateLogo } from "@/lib/validation/company";

const BUCKET = "company-logos";

export type LogoFormState = {
  status: "idle" | "success" | "error";
  message?: string;
};

export async function uploadLogo(_previous: LogoFormState, formData: FormData): Promise<LogoFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const file = formData.get("logo");
  if (!(file instanceof File)) {
    return { status: "error", message: "Choose an image to upload." };
  }

  // Read the file's first bytes to check what kind of image it really is.
  const bytes = new Uint8Array(await file.arrayBuffer());
  const result = validateLogo(file.size, bytes.subarray(0, 12));
  if (!result.ok) {
    return { status: "error", message: result.error };
  }

  const { data: company } = await supabase
    .from("companies")
    .select("id, logo_url")
    .eq("owner_id", user.id)
    .order("created_at")
    .limit(1)
    .maybeSingle();
  if (!company) {
    return { status: "error", message: "Save your company profile before adding a logo." };
  }

  // A new file name each time, so browsers never show an old cached logo.
  const path = `${user.id}/logo-${Date.now()}.${result.type.extension}`;
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, bytes, { contentType: result.type.mimeType });
  if (uploadError) {
    console.error("Failed to upload logo:", uploadError);
    return { status: "error", message: "We couldn't upload your logo. Please try again." };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET).getPublicUrl(path);

  const { error: updateError } = await supabase.from("companies").update({ logo_url: publicUrl }).eq("id", company.id);
  if (updateError) {
    console.error("Failed to save logo URL:", updateError);
    await supabase.storage.from(BUCKET).remove([path]); // don't leave an unused file behind
    return { status: "error", message: "We couldn't save your logo. Please try again." };
  }

  await removeStoredFile(company.logo_url);
  revalidateCompanyPages();
  return { status: "success", message: "Logo updated." };
}

export async function removeLogo(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data: company } = await supabase
    .from("companies")
    .select("id, logo_url")
    .eq("owner_id", user.id)
    .order("created_at")
    .limit(1)
    .maybeSingle();
  if (!company?.logo_url) return;

  const { error } = await supabase.from("companies").update({ logo_url: null }).eq("id", company.id);
  if (error) {
    console.error("Failed to remove logo:", error);
    return;
  }
  await removeStoredFile(company.logo_url);
  revalidateCompanyPages();
}

// Deletes a previous logo file from storage, given its public URL.
// Public URLs look like .../storage/v1/object/public/company-logos/<user id>/<file>.
async function removeStoredFile(publicUrl: string | null) {
  const marker = `/${BUCKET}/`;
  const index = publicUrl?.indexOf(marker) ?? -1;
  if (!publicUrl || index === -1) return;

  const supabase = await createClient();
  const { error } = await supabase.storage.from(BUCKET).remove([publicUrl.slice(index + marker.length)]);
  if (error) console.error("Failed to delete old logo file:", error);
}

function revalidateCompanyPages() {
  revalidatePath("/employer/company");
  revalidatePath("/employer/dashboard");
}
