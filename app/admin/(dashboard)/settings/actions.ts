"use server"

import { revalidatePath } from "next/cache"
import { createAdminClient } from "@/lib/supabase/admin"
import { requireAdminSession } from "@/lib/auth"
import { logActivity } from "@/lib/activity"
import type { SiteSettings } from "@/shared/database.types"

export interface ActionResult {
  ok: boolean
  error: string | null
}

export async function getSiteSettings(): Promise<SiteSettings | null> {
  await requireAdminSession()
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

function nullableString(value: FormDataEntryValue | null): string | null {
  const s = String(value ?? "").trim()
  return s.length ? s : null
}
