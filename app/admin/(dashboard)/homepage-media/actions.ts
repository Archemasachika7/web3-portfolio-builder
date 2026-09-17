"use server"

import { revalidatePath } from "next/cache"
import { createAdminClient } from "@/lib/supabase/admin"
import { requireAdminSession } from "@/lib/auth"
import { uploadAsset, deleteAsset, IMAGE_TYPES, VIDEO_TYPES } from "@/lib/storage"
import { logActivity } from "@/lib/activity"
import type { HomepageMedia } from "@/shared/database.types"

export interface ActionResult {
  ok: boolean
  error: string | null
}

export async function listHomepageMedia(): Promise<HomepageMedia[]> {
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
  const { error } = await supabase
    .from("homepage_media")
    .insert({ section_key: sectionKey, media_type: "image", enabled: true, sort_order: count ?? 0 })

  if (error) return { ok: false, error: error.message }
  await logActivity({ entityType: "homepage_media", action: "created", actor: user.email, detail: sectionKey })
  revalidatePath("/admin/homepage-media")
  return { ok: true, error: null }
}

export async function updateHomepageMedia(id: string, formData: FormData): Promise<ActionResult> {
  await requireAdminSession()
  const supabase = createAdminClient()

  const payload = {
    media_type: String(formData.get("media_type") ?? "image"),
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

type MediaField = "storage_path" | "poster_path" | "mobile_storage_path"

export async function uploadHomepageAsset(
  id: string,
  sectionKey: string,
  field: MediaField,
  previousPath: string | null,
  file: File
): Promise<{ path: string | null; error: string | null }> {
  await requireAdminSession()

  const allowed = VIDEO_TYPES.includes(file.type) ? VIDEO_TYPES : IMAGE_TYPES
  const nameByField: Record<MediaField, string> = {
    storage_path: "media",
    poster_path: "poster",
    mobile_storage_path: "mobile"
  }
  const result = await uploadAsset({
    file,
    folder: `HOMEPAGE/${sectionKey}`,
    allowedTypes: allowed,
    filenameOverride: `${nameByField[field]}.${file.name.split(".").pop()?.toLowerCase() ?? "webp"}`
  })
  if (result.error || !result.path) return { path: null, error: result.error }

  const supabase = createAdminClient()
  const updatePayload: Record<string, string> = { [field]: result.path }
  if (field === "storage_path") {
    updatePayload.media_type = VIDEO_TYPES.includes(file.type) ? "video" : "image"
  }

  const { error } = await supabase.from("homepage_media").update(updatePayload).eq("id", id)
  if (error) return { path: null, error: "Saved file but failed to update the record." }

  if (previousPath && previousPath !== result.path) await deleteAsset(previousPath)
  revalidatePath("/admin/homepage-media")
  return { path: result.path, error: null }
}

/**
 * Records a storage_path/mobile_storage_path already uploaded via
 * /api/upload (the XHR-with-progress path large videos use) — this only
 * does the DB write and old-asset cleanup, no upload.
 */
export async function attachHomepageAsset(
  id: string,
  field: "storage_path" | "mobile_storage_path",
  path: string,
  previousPath: string | null,
  isVideo: boolean
): Promise<ActionResult> {
  await requireAdminSession()
  const supabase = createAdminClient()

  const updatePayload: Record<string, string> = { [field]: path }
  if (field === "storage_path") {
    updatePayload.media_type = isVideo ? "video" : "image"
  }

  const { error } = await supabase.from("homepage_media").update(updatePayload).eq("id", id)
  if (error) return { ok: false, error: error.message }

  if (previousPath && previousPath !== path) await deleteAsset(previousPath)
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
