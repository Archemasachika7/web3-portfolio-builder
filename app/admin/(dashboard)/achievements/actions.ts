"use server"

import { revalidatePath } from "@/lib/revalidate"
import { createAdminClient } from "@/lib/supabase/admin"
import { requireAdminSession } from "@/lib/auth"
import { logActivity } from "@/lib/activity"
import type { Achievement, Tag } from "@/shared/database.types"

export interface ActionResult {
  ok: boolean
  error: string | null
  id?: string
}

export interface AchievementWithTags extends Achievement {
  tags: Tag[]
}

export async function listAchievements(): Promise<AchievementWithTags[]> {
  await requireAdminSession()
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("achievements")
    .select("*, achievement_tags(tags(*))")
    .order("sort_order", { ascending: true })
  if (error) {
    console.error("listAchievements", error.message)
    return []
  }
  return data.map((a) => ({
    ...(a as unknown as Achievement),
    tags: ((a.achievement_tags as { tags: Tag }[] | null) ?? []).map((at) => at.tags)
  }))
}

export async function createAchievement(): Promise<ActionResult> {
  const user = await requireAdminSession()
  const supabase = createAdminClient()
  const { count } = await supabase.from("achievements").select("id", { count: "exact", head: true })
  const { data: created, error } = await supabase
    .from("achievements")
    .insert({ title: "New achievement", published: false, sort_order: count ?? 0 })
    .select("id")
    .single()
  if (error) return { ok: false, error: error.message }
  await logActivity({ entityType: "achievement", action: "created", actor: user.email })
  revalidatePath("/admin/achievements")
  return { ok: true, error: null, id: created?.id as string | undefined }
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

  const tagIds = formData.getAll("tag_ids").map(String)
  await supabase.from("achievement_tags").delete().eq("achievement_id", id)
  if (tagIds.length > 0) {
    await supabase.from("achievement_tags").insert(tagIds.map((tag_id) => ({ achievement_id: id, tag_id })))
  }

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
