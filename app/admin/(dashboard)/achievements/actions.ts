"use server"

import { revalidatePath } from "next/cache"
import { createAdminClient } from "@/lib/supabase/admin"
import { requireAdminSession } from "@/lib/auth"
import { uploadAsset, deleteAsset, IMAGE_TYPES } from "@/lib/storage"
import { logActivity } from "@/lib/activity"
import type { Achievement } from "@/shared/database.types"

export interface ActionResult {
  ok: boolean
  error: string | null
}

export async function listAchievements(): Promise<Achievement[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("achievements")
    .select("*")
    .order("sort_order", { ascending: true })
  if (error) {
    console.error("listAchievements", error.message)
    return []
  }
  return data as Achievement[]
}

export async function createAchievement(): Promise<ActionResult> {
  const user = await requireAdminSession()
  const supabase = createAdminClient()
  const { count } = await supabase.from("achievements").select("id", { count: "exact", head: true })
  const { error } = await supabase
    .from("achievements")
    .insert({ title: "New achievement", published: false, sort_order: count ?? 0 })
  if (error) return { ok: false, error: error.message }
  await logActivity({ entityType: "achievement", action: "created", actor: user.email })
  revalidatePath("/admin/achievements")
  return { ok: true, error: null }
}

export async function updateAchievement(id: string, formData: FormData): Promise<ActionResult> {
  await requireAdminSession()
  const supabase = createAdminClient()

  const payload = {
    title: String(formData.get("title") ?? "").trim(),
    value: nullableString(formData.get("value")),
    organization: nullableString(formData.get("organization")),
    category: nullableString(formData.get("category")),
    description: nullableString(formData.get("description")),
    year: numberOrNull(formData.get("year")),
    link: nullableString(formData.get("link")),
    credential_url: nullableString(formData.get("credential_url")),
    certificate_id: nullableString(formData.get("certificate_id")),
    published: formData.get("published") === "on"
  }

  if (!payload.title) return { ok: false, error: "Title is required." }

  const { error } = await supabase.from("achievements").update(payload).eq("id", id)
  if (error) return { ok: false, error: error.message }

  revalidatePath("/admin/achievements")
  return { ok: true, error: null }
}

export async function deleteAchievement(id: string): Promise<ActionResult> {
  const user = await requireAdminSession()
  const supabase = createAdminClient()
  const { error } = await supabase.from("achievements").delete().eq("id", id)
  if (error) return { ok: false, error: error.message }
  await logActivity({ entityType: "achievement", entityId: id, action: "deleted", actor: user.email })
  revalidatePath("/admin/achievements")
  return { ok: true, error: null }
}

export async function reorderAchievements(orderedIds: string[]): Promise<ActionResult> {
  await requireAdminSession()
  const supabase = createAdminClient()
  const results = await Promise.all(
    orderedIds.map((id, index) => supabase.from("achievements").update({ sort_order: index }).eq("id", id))
  )
  const failed = results.find((r) => r.error)
  if (failed?.error) return { ok: false, error: failed.error.message }
  revalidatePath("/admin/achievements")
  return { ok: true, error: null }
}

export async function uploadAchievementImage(
  id: string,
  previousPath: string | null,
  file: File
): Promise<{ path: string | null; error: string | null }> {
  await requireAdminSession()
  const result = await uploadAsset({
    file,
    folder: `ACHIEVEMENTS/${id}`,
    allowedTypes: IMAGE_TYPES,
    filenameOverride: `image.${file.name.split(".").pop()?.toLowerCase() ?? "webp"}`
  })
  if (result.error || !result.path) return { path: null, error: result.error }

  const supabase = createAdminClient()
  const { error } = await supabase.from("achievements").update({ image_path: result.path }).eq("id", id)
  if (error) return { path: null, error: "Saved file but failed to update the record." }

  if (previousPath && previousPath !== result.path) await deleteAsset(previousPath)
  revalidatePath("/admin/achievements")
  return { path: result.path, error: null }
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
