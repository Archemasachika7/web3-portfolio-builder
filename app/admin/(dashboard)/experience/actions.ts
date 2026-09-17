"use server"

import { revalidatePath } from "next/cache"
import { createAdminClient } from "@/lib/supabase/admin"
import { requireAdminSession } from "@/lib/auth"
import { uploadAsset, deleteAsset, IMAGE_TYPES } from "@/lib/storage"
import { logActivity } from "@/lib/activity"
import type { Experience, Tag } from "@/shared/database.types"

export interface ActionResult {
  ok: boolean
  error: string | null
}

export interface ExperienceWithTags extends Experience {
  tags: Tag[]
}

export async function listExperience(): Promise<ExperienceWithTags[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("experience")
    .select("*, experience_tags(tags(*))")
    .order("sort_order", { ascending: true })
  if (error) {
    console.error("listExperience", error.message)
    return []
  }
  return data.map((e) => ({
    ...(e as unknown as Experience),
    tags: ((e.experience_tags as { tags: Tag }[] | null) ?? []).map((et) => et.tags)
  }))
}

export async function createExperience(): Promise<ActionResult> {
  const user = await requireAdminSession()
  const supabase = createAdminClient()
  const { count } = await supabase.from("experience").select("id", { count: "exact", head: true })
  const { error } = await supabase
    .from("experience")
    .insert({ organization: "New organization", role: "Role", published: false, sort_order: count ?? 0 })
  if (error) return { ok: false, error: error.message }
  await logActivity({ entityType: "experience", action: "created", actor: user.email })
  revalidatePath("/admin/experience")
  return { ok: true, error: null }
}

export async function updateExperience(id: string, formData: FormData): Promise<ActionResult> {
  await requireAdminSession()
  const supabase = createAdminClient()

  const payload = {
    organization: String(formData.get("organization") ?? "").trim(),
    role: String(formData.get("role") ?? "").trim(),
    employment_type: nullableString(formData.get("employment_type")),
    location: nullableString(formData.get("location")),
    start_date: nullableString(formData.get("start_date")),
    end_date: nullableString(formData.get("end_date")),
    current: formData.get("current") === "on",
    short_description: nullableString(formData.get("short_description")),
    long_description: nullableString(formData.get("long_description")),
    website_url: nullableString(formData.get("website_url")),
    published: formData.get("published") === "on"
  }

  if (!payload.organization || !payload.role) {
    return { ok: false, error: "Organization and role are required." }
  }

  const { error } = await supabase.from("experience").update(payload).eq("id", id)
  if (error) return { ok: false, error: error.message }

  const tagIds = formData.getAll("tag_ids").map(String)
  await supabase.from("experience_tags").delete().eq("experience_id", id)
  if (tagIds.length > 0) {
    await supabase.from("experience_tags").insert(tagIds.map((tag_id) => ({ experience_id: id, tag_id })))
  }

  revalidatePath("/admin/experience")
  return { ok: true, error: null }
}

export async function deleteExperience(id: string): Promise<ActionResult> {
  const user = await requireAdminSession()
  const supabase = createAdminClient()
  const { error } = await supabase.from("experience").delete().eq("id", id)
  if (error) return { ok: false, error: error.message }
  await logActivity({ entityType: "experience", entityId: id, action: "deleted", actor: user.email })
  revalidatePath("/admin/experience")
  return { ok: true, error: null }
}

export async function reorderExperience(orderedIds: string[]): Promise<ActionResult> {
  await requireAdminSession()
  const supabase = createAdminClient()
  const results = await Promise.all(
    orderedIds.map((id, index) => supabase.from("experience").update({ sort_order: index }).eq("id", id))
  )
  const failed = results.find((r) => r.error)
  if (failed?.error) return { ok: false, error: failed.error.message }
  revalidatePath("/admin/experience")
  return { ok: true, error: null }
}

export async function uploadExperienceLogo(
  id: string,
  previousPath: string | null,
  file: File
): Promise<{ path: string | null; error: string | null }> {
  await requireAdminSession()
  const result = await uploadAsset({
    file,
    folder: `EXPERIENCE/${id}`,
    allowedTypes: IMAGE_TYPES,
    filenameOverride: `logo.${file.name.split(".").pop()?.toLowerCase() ?? "webp"}`
  })
  if (result.error || !result.path) return { path: null, error: result.error }

  const supabase = createAdminClient()
  const { error } = await supabase.from("experience").update({ logo_path: result.path }).eq("id", id)
  if (error) return { path: null, error: "Saved file but failed to update the record." }

  if (previousPath && previousPath !== result.path) await deleteAsset(previousPath)
  revalidatePath("/admin/experience")
  return { path: result.path, error: null }
}

function nullableString(value: FormDataEntryValue | null): string | null {
  const s = String(value ?? "").trim()
  return s.length ? s : null
}
