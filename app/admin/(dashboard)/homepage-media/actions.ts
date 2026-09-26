"use server"

import { revalidatePath } from "@/lib/revalidate"
import { createAdminClient } from "@/lib/supabase/admin"
import { requireAdminSession } from "@/lib/auth"
import { logActivity } from "@/lib/activity"
import type { HomepageMedia } from "@/shared/database.types"

export interface ActionResult {
  ok: boolean
  error: string | null
  id?: string
}

export async function listHomepageMedia(): Promise<HomepageMedia[]> {
  await requireAdminSession()
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("homepage_media")
    .select("*")
    .order("sort_order", { ascending: true })
  if (error) {
    console.error("listHomepageMedia", error.message)
    return []
  }
  return data as HomepageMedia[]
}

export async function createHomepageSection(formData: FormData): Promise<ActionResult> {
  const user = await requireAdminSession()
  const sectionKey = String(formData.get("section_key") ?? "").trim()
  if (!sectionKey) return { ok: false, error: "Section key is required." }

  const supabase = createAdminClient()
  const { count } = await supabase.from("homepage_media").select("id", { count: "exact", head: true })
  const { data: created, error } = await supabase
    .from("homepage_media")
    .insert({ section_key: sectionKey, media_type: "image", enabled: true, sort_order: count ?? 0 })
    .select("id")
    .single()

  if (error) return { ok: false, error: error.message }
  await logActivity({ entityType: "homepage_media", action: "created", actor: user.email, detail: sectionKey })
  revalidatePath("/admin/homepage-media")
  return { ok: true, error: null, id: created?.id as string | undefined }
}

export async function updateHomepageMedia(id: string, formData: FormData): Promise<ActionResult> {
  await requireAdminSession()
  const supabase = createAdminClient()

  const payload = {
    alt_text: nullableString(formData.get("alt_text")),
    motion_type: nullableString(formData.get("motion_type")),
    enabled: formData.get("enabled") === "on",
    sort_order: numberOrNull(formData.get("sort_order")) ?? 0
  }

  const { error } = await supabase.from("homepage_media").update(payload).eq("id", id)
  if (error) return { ok: false, error: error.message }

  revalidatePath("/admin/homepage-media")
  return { ok: true, error: null }
}

export async function deleteHomepageSection(id: string): Promise<ActionResult> {
  const user = await requireAdminSession()
  const supabase = createAdminClient()
  const { error } = await supabase.from("homepage_media").delete().eq("id", id)
  if (error) return { ok: false, error: error.message }
  await logActivity({ entityType: "homepage_media", entityId: id, action: "deleted", actor: user.email })
  revalidatePath("/admin/homepage-media")
  return { ok: true, error: null }
}


function nullableString(value: FormDataEntryValue | null): string | null {
  const s = String(value ?? "").trim()
  return s.length ? s : null
}

function numberOrNull(value: FormDataEntryValue | null): number | null {
  const s = String(value ?? "").trim()
  if (!s) return null
  const n = Number(s)
  return Number.isFinite(n) ? n : null
}
