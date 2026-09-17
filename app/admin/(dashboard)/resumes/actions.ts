"use server"

import { revalidatePath } from "next/cache"
import { createAdminClient } from "@/lib/supabase/admin"
import { requireAdminSession } from "@/lib/auth"
import { uploadAsset, deleteAsset, RESUME_TYPES } from "@/lib/storage"
import { logActivity } from "@/lib/activity"
import type { Resume, Tag } from "@/shared/database.types"

export interface ActionResult {
  ok: boolean
  error: string | null
}

export interface ResumeWithTags extends Resume {
  tags: Tag[]
}

export async function listResumes(): Promise<ResumeWithTags[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("resumes")
    .select("*, resume_tags(tags(*))")
    .order("priority", { ascending: false })
  if (error) {
    console.error("listResumes", error.message)
    return []
  }
  return data.map((r) => ({
    ...(r as unknown as Resume),
    tags: ((r.resume_tags as { tags: Tag }[] | null) ?? []).map((rt) => rt.tags)
  }))
}

export async function createResume(): Promise<ActionResult> {
  const user = await requireAdminSession()
  const supabase = createAdminClient()

  const baseSlug = "resume"
  let slug = baseSlug
  let attempt = 1
  while (true) {
    const { data } = await supabase.from("resumes").select("id").eq("slug", slug).maybeSingle()
    if (!data) break
    attempt += 1
    slug = `${baseSlug}-${attempt}`
  }

  const { error } = await supabase
    .from("resumes")
    .insert({ title: "New resume", slug, file_path: "", published: false })
  if (error) return { ok: false, error: error.message }
  await logActivity({ entityType: "resume", action: "created", actor: user.email })
  revalidatePath("/admin/resumes")
  return { ok: true, error: null }
}

export async function updateResume(id: string, formData: FormData): Promise<ActionResult> {
  await requireAdminSession()
  const supabase = createAdminClient()

  const payload = {
    title: String(formData.get("title") ?? "").trim(),
    slug: String(formData.get("slug") ?? "").trim(),
    description: nullableString(formData.get("description")),
    version: numberOrNull(formData.get("version")) ?? 1,
    priority: numberOrNull(formData.get("priority")) ?? 0,
    published: formData.get("published") === "on"
  }

  if (!payload.title || !payload.slug) return { ok: false, error: "Title and slug are required." }

  const { error } = await supabase.from("resumes").update(payload).eq("id", id)
  if (error) return { ok: false, error: error.message }

  const tagIds = formData.getAll("tag_ids").map(String)
  await supabase.from("resume_tags").delete().eq("resume_id", id)
  if (tagIds.length > 0) {
    await supabase.from("resume_tags").insert(tagIds.map((tag_id) => ({ resume_id: id, tag_id })))
  }

  revalidatePath("/admin/resumes")
  return { ok: true, error: null }
}

export async function setCurrentResume(id: string): Promise<ActionResult> {
  const user = await requireAdminSession()
  const supabase = createAdminClient()

  // Only one resume should normally be current — unset the rest first.
  const { error: clearError } = await supabase.from("resumes").update({ is_current: false }).neq("id", id)
  if (clearError) return { ok: false, error: clearError.message }

  const { error } = await supabase.from("resumes").update({ is_current: true }).eq("id", id)
  if (error) return { ok: false, error: error.message }

  await logActivity({ entityType: "resume", entityId: id, action: "updated", actor: user.email, detail: "set current" })
  revalidatePath("/admin/resumes")
  return { ok: true, error: null }
}

export async function deleteResume(id: string, filePath: string): Promise<ActionResult> {
  const user = await requireAdminSession()
  const supabase = createAdminClient()
  const { error } = await supabase.from("resumes").delete().eq("id", id)
  if (error) return { ok: false, error: error.message }
  if (filePath) await deleteAsset(filePath)
  await logActivity({ entityType: "resume", entityId: id, action: "deleted", actor: user.email })
  revalidatePath("/admin/resumes")
  return { ok: true, error: null }
}

export async function uploadResumeFile(
  id: string,
  slug: string,
  previousPath: string | null,
  file: File
): Promise<{ path: string | null; error: string | null }> {
  await requireAdminSession()
  const result = await uploadAsset({ file, folder: `RESUMES/${slug}`, allowedTypes: RESUME_TYPES })
  if (result.error || !result.path) return { path: null, error: result.error }

  const supabase = createAdminClient()
  const { error } = await supabase.from("resumes").update({ file_path: result.path }).eq("id", id)
  if (error) return { path: null, error: "Saved file but failed to update the record." }

  if (previousPath && previousPath !== result.path) await deleteAsset(previousPath)
  revalidatePath("/admin/resumes")
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
