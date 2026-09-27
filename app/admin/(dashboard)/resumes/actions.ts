"use server"

import { revalidatePath } from "@/lib/revalidate"
import { createAdminClient } from "@/lib/supabase/admin"
import { requireAdminSession } from "@/lib/auth"
import { deleteAsset } from "@/lib/storage"
import { logActivity } from "@/lib/activity"
import type { Resume, Tag } from "@/shared/database.types"
import { slugify, titleFromFileName } from "@/lib/names"

export interface ActionResult {
  ok: boolean
  error: string | null
  id?: string
}

export interface ResumeWithTags extends Resume {
  tags: Tag[]
}

export async function listResumes(): Promise<ResumeWithTags[]> {
  await requireAdminSession()
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

  const { data: created, error } = await supabase
    .from("resumes")
    .insert({ title: "New resume", slug, file_path: "", published: false })
    .select("id")
    .single()
  if (error) return { ok: false, error: error.message }
  await logActivity({ entityType: "resume", action: "created", actor: user.email })
  revalidatePath("/admin/resumes")
  return { ok: true, error: null, id: created?.id as string | undefined }
}

/**
 * First step of "drop a PDF to post it": a draft named after the file.
 * The upload fills in file_path; publishUploadedResume then puts it live.
 */
export async function createResumeFromFile(fileName: string): Promise<ActionResult> {
  const user = await requireAdminSession()
  const supabase = createAdminClient()
  const title = titleFromFileName(String(fileName ?? ""))
  const baseSlug = slugify(title)

  const { data: taken } = await supabase.from("resumes").select("slug").like("slug", `${baseSlug}%`)
  const used = new Set((taken ?? []).map((r) => r.slug as string))
  let slug = baseSlug
  for (let n = 2; used.has(slug); n++) slug = `${baseSlug}-${n}`

  const { data: created, error } = await supabase
    .from("resumes")
    .insert({ title, slug, file_path: "", published: false })
    .select("id")
    .single()
  if (error) return { ok: false, error: error.message }
  await logActivity({ entityType: "resume", entityId: created?.id, action: "created", actor: user.email })
  return { ok: true, error: null, id: created?.id as string | undefined }
}

/** Publishes an uploaded resume; it becomes the current one if none is. */
export async function publishUploadedResume(id: string): Promise<ActionResult> {
  const user = await requireAdminSession()
  const supabase = createAdminClient()
  const { data: current } = await supabase.from("resumes").select("id").eq("is_current", true).neq("id", id).limit(1)
  const makeCurrent = !current || current.length === 0
  const { error } = await supabase
    .from("resumes")
    .update({ published: true, ...(makeCurrent ? { is_current: true } : {}) })
    .eq("id", id)
    .neq("file_path", "")
  if (error) return { ok: false, error: error.message }
  await logActivity({ entityType: "resume", entityId: id, action: "published", actor: user.email })
  revalidatePath("/admin/resumes")
  return { ok: true, error: null, id }
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

export async function deleteResume(id: string): Promise<ActionResult> {
  const user = await requireAdminSession()
  const supabase = createAdminClient()
  const { data, error } = await supabase.from("resumes").delete().eq("id", id).select("file_path").maybeSingle()
  if (error) return { ok: false, error: error.message }
  if (data?.file_path) await deleteAsset(data.file_path)
  await logActivity({ entityType: "resume", entityId: id, action: "deleted", actor: user.email })
  revalidatePath("/admin/resumes")
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
