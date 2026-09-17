"use server"

import { revalidatePath } from "next/cache"
import { createAdminClient } from "@/lib/supabase/admin"
import { requireAdminSession } from "@/lib/auth"
import { logActivity } from "@/lib/activity"
import type { SocialLink } from "@/shared/database.types"

export interface ActionResult {
  ok: boolean
  error: string | null
}

export async function listSocialLinks(): Promise<SocialLink[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("social_links")
    .select("*")
    .order("sort_order", { ascending: true })
  if (error) {
    console.error("listSocialLinks", error.message)
    return []
  }
  return data as SocialLink[]
}

export async function createSocialLink(formData: FormData): Promise<ActionResult> {
  const user = await requireAdminSession()
  const platform = String(formData.get("platform") ?? "").trim()
  const label = String(formData.get("label") ?? "").trim()
  const url = String(formData.get("url") ?? "").trim()
  if (!platform || !label || !url) return { ok: false, error: "Platform, label and URL are required." }

  const supabase = createAdminClient()
  const { count } = await supabase.from("social_links").select("id", { count: "exact", head: true })
  const { error } = await supabase
    .from("social_links")
    .insert({ platform, label, url, sort_order: count ?? 0 })

  if (error) return { ok: false, error: error.message }
  await logActivity({ entityType: "social_link", action: "created", actor: user.email, detail: label })
  revalidatePath("/admin/social-links")
  return { ok: true, error: null }
}

export async function updateSocialLink(id: string, formData: FormData): Promise<ActionResult> {
  await requireAdminSession()
  const supabase = createAdminClient()

  const payload = {
    platform: String(formData.get("platform") ?? "").trim(),
    label: String(formData.get("label") ?? "").trim(),
    url: String(formData.get("url") ?? "").trim(),
    icon_key: nullableString(formData.get("icon_key")),
    enabled: formData.get("enabled") === "on"
  }

  if (!payload.platform || !payload.label || !payload.url) {
    return { ok: false, error: "Platform, label and URL are required." }
  }

  const { error } = await supabase.from("social_links").update(payload).eq("id", id)
  if (error) return { ok: false, error: error.message }

  revalidatePath("/admin/social-links")
  return { ok: true, error: null }
}

export async function deleteSocialLink(id: string): Promise<ActionResult> {
  const user = await requireAdminSession()
  const supabase = createAdminClient()
  const { error } = await supabase.from("social_links").delete().eq("id", id)
  if (error) return { ok: false, error: error.message }
  await logActivity({ entityType: "social_link", entityId: id, action: "deleted", actor: user.email })
  revalidatePath("/admin/social-links")
  return { ok: true, error: null }
}

export async function reorderSocialLinks(orderedIds: string[]): Promise<ActionResult> {
  await requireAdminSession()
  const supabase = createAdminClient()
  const results = await Promise.all(
    orderedIds.map((id, index) => supabase.from("social_links").update({ sort_order: index }).eq("id", id))
  )
  const failed = results.find((r) => r.error)
  if (failed?.error) return { ok: false, error: failed.error.message }
  revalidatePath("/admin/social-links")
  return { ok: true, error: null }
}

function nullableString(value: FormDataEntryValue | null): string | null {
  const s = String(value ?? "").trim()
  return s.length ? s : null
}
