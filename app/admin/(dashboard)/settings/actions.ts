"use server"

import { revalidatePath } from "next/cache"
import { createAdminClient } from "@/lib/supabase/admin"
import { requireAdminSession } from "@/lib/auth"
import { uploadAsset, deleteAsset, IMAGE_TYPES } from "@/lib/storage"
import { logActivity } from "@/lib/activity"
import type { SiteSettings } from "@/shared/database.types"

export interface ActionResult {
  ok: boolean
  error: string | null
}

export async function getSiteSettings(): Promise<SiteSettings | null> {
  const supabase = createAdminClient()
  const { data, error } = await supabase.from("site_settings").select("*").limit(1).maybeSingle()
  if (error) {
    console.error("getSiteSettings", error.message)
    return null
  }
  return data as SiteSettings | null
}

export async function saveSiteSettings(formData: FormData): Promise<ActionResult> {
  const user = await requireAdminSession()
  const supabase = createAdminClient()

  const id = String(formData.get("id") ?? "")
  const payload = {
    site_title: nullableString(formData.get("site_title")),
    site_description: nullableString(formData.get("site_description")),
    contact_email: nullableString(formData.get("contact_email")),
    footer_text: nullableString(formData.get("footer_text")),
    copyright_text: nullableString(formData.get("copyright_text")),
    availability_text: nullableString(formData.get("availability_text")),
    primary_location: nullableString(formData.get("primary_location")),
    maintenance_mode: formData.get("maintenance_mode") === "on"
  }

  const { error } = id
    ? await supabase.from("site_settings").update(payload).eq("id", id)
    : await supabase.from("site_settings").insert(payload)

  if (error) return { ok: false, error: error.message }

  await logActivity({ entityType: "site_settings", action: id ? "updated" : "created", actor: user.email })
  revalidatePath("/admin/settings")
  return { ok: true, error: null }
}

export async function uploadSiteImage(
  settingsId: string,
  field: "favicon_path" | "default_og_image_path",
  previousPath: string | null,
  file: File
): Promise<{ path: string | null; error: string | null }> {
  await requireAdminSession()
  const name = field === "favicon_path" ? "favicon" : "og-image"
  const result = await uploadAsset({
    file,
    folder: "SITE",
    allowedTypes: IMAGE_TYPES,
    filenameOverride: `${name}.${file.name.split(".").pop()?.toLowerCase() ?? "webp"}`
  })
  if (result.error || !result.path) return { path: null, error: result.error }

  const supabase = createAdminClient()
  const { error } = await supabase.from("site_settings").update({ [field]: result.path }).eq("id", settingsId)
  if (error) return { path: null, error: "Saved file but failed to update the record." }

  if (previousPath && previousPath !== result.path) await deleteAsset(previousPath)
  revalidatePath("/admin/settings")
  return { path: result.path, error: null }
}

function nullableString(value: FormDataEntryValue | null): string | null {
  const s = String(value ?? "").trim()
  return s.length ? s : null
}
