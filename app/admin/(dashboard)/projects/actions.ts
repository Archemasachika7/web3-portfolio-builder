"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createAdminClient } from "@/lib/supabase/admin"
import { uploadAsset, deleteAsset, IMAGE_TYPES, VIDEO_TYPES, PDF_TYPES } from "@/lib/storage"
import { logActivity } from "@/lib/activity"
import { requireAdminSession } from "@/lib/auth"
import type { Project, ProjectMedia, Report, Tag } from "@/shared/database.types"

export interface ActionResult {
  ok: boolean
  error: string | null
}

export interface ProjectListItem extends Project {
  tagCount: number
  reportCount: number
}

export async function listProjects(): Promise<ProjectListItem[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("projects")
    .select("*, project_tags(tag_id), reports(id)")
    .order("sort_order", { ascending: true })
    .order("updated_at", { ascending: false })

  if (error || !data) {
    console.error("listProjects", error?.message)
    return []
  }

  return data.map((p) => ({
    ...(p as unknown as Project),
    tagCount: (p.project_tags as unknown[] | null)?.length ?? 0,
    reportCount: (p.reports as unknown[] | null)?.length ?? 0
  }))
}

export interface ProjectDetail extends Project {
  tags: Tag[]
  media: ProjectMedia[]
  reports: Report[]
}

export async function getProject(id: string): Promise<ProjectDetail | null> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("projects")
    .select("*, project_tags(tags(*)), project_media(*), reports(*)")
    .eq("id", id)
    .maybeSingle()

  if (error || !data) {
    if (error) console.error("getProject", error.message)
    return null
  }

  return {
    ...(data as unknown as Project),
    tags: ((data.project_tags as { tags: Tag }[] | null) ?? []).map((pt) => pt.tags),
    media: ((data.project_media as ProjectMedia[] | null) ?? []).sort(
      (a, b) => a.display_order - b.display_order
    ),
    reports: (data.reports as Report[] | null) ?? []
  }
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
}

export async function createProject(formData: FormData) {
  await requireAdminSession()
  const title = String(formData.get("title") ?? "").trim()
  if (!title) return

  const supabase = createAdminClient()
  const baseSlug = slugify(title) || "untitled"
  let slug = baseSlug
  let attempt = 1
  // Guarantee a unique slug rather than surfacing a constraint error.
  while (true) {
    const { data } = await supabase.from("projects").select("id").eq("slug", slug).maybeSingle()
    if (!data) break
    attempt += 1
    slug = `${baseSlug}-${attempt}`
  }

  const { data: inserted, error } = await supabase
    .from("projects")
    .insert({ title, slug, status: "draft", published: false })
    .select("id")
    .single()

  if (error || !inserted) {
    console.error("createProject", error?.message)
    return
  }

  await logActivity({ entityType: "project", entityId: inserted.id, action: "created" })
  revalidatePath("/admin/projects")
  redirect(`/admin/projects/${inserted.id}`)
}

export async function updateProjectOverview(id: string, formData: FormData): Promise<ActionResult> {
  const user = await requireAdminSession()
  const supabase = createAdminClient()

  const payload = {
    title: String(formData.get("title") ?? "").trim(),
    slug: String(formData.get("slug") ?? "").trim(),
    short_bio: nullableString(formData.get("short_bio")),
    long_description: nullableString(formData.get("long_description")),
    year: numberOrNull(formData.get("year")),
    role: nullableString(formData.get("role")),
    status: String(formData.get("status") ?? "draft"),
    project_url: nullableString(formData.get("project_url")),
    github_url: nullableString(formData.get("github_url")),
    live_url: nullableString(formData.get("live_url")),
    documentation_url: nullableString(formData.get("documentation_url"))
  }

  if (!payload.title || !payload.slug) {
    return { ok: false, error: "Title and slug are required." }
  }

  const { error } = await supabase.from("projects").update(payload).eq("id", id)
  if (error) {
    console.error("updateProjectOverview", error.message)
    return { ok: false, error: "Save failed: " + error.message }
  }

  await logActivity({ entityType: "project", entityId: id, action: "updated", actor: user.email })
  revalidatePath(`/admin/projects/${id}`)
  revalidatePath("/admin/projects")
  return { ok: true, error: null }
}

export async function updateProjectDisplay(id: string, formData: FormData): Promise<ActionResult> {
  const user = await requireAdminSession()
  const supabase = createAdminClient()

  const payload = {
    featured: formData.get("featured") === "on",
    sort_order: numberOrNull(formData.get("sort_order")) ?? 0
  }

  const { error } = await supabase.from("projects").update(payload).eq("id", id)
  if (error) {
    console.error("updateProjectDisplay", error.message)
    return { ok: false, error: error.message }
  }

  await logActivity({ entityType: "project", entityId: id, action: "updated", actor: user.email })
  revalidatePath(`/admin/projects/${id}`)
  revalidatePath("/admin/projects")
  return { ok: true, error: null }
}

export interface PublishCheck {
  canPublish: boolean
  missing: string[]
}

export async function checkPublishRequirements(id: string): Promise<PublishCheck> {
  const project = await getProject(id)
  if (!project) return { canPublish: false, missing: ["Project not found"] }

  const missing: string[] = []
  if (!project.title?.trim()) missing.push("Title")
  if (!project.short_bio?.trim()) missing.push("Short bio")
  if (!project.thumbnail_path) missing.push("Thumbnail")
  if (!project.project_url?.trim()) missing.push("Project URL")
  if (project.tags.length === 0) missing.push("At least one tag")
  if (!project.reports.some((r) => r.published)) missing.push("At least one published report")

  return { canPublish: missing.length === 0, missing }
}

export async function setProjectPublished(id: string, published: boolean): Promise<ActionResult> {
  const user = await requireAdminSession()

  if (published) {
    const check = await checkPublishRequirements(id)
    if (!check.canPublish) {
      return { ok: false, error: `Cannot publish. Missing: ${check.missing.join(", ")}` }
    }
  }

  const supabase = createAdminClient()
  const { error } = await supabase.from("projects").update({ published }).eq("id", id)
  if (error) {
    console.error("setProjectPublished", error.message)
    return { ok: false, error: error.message }
  }

  await logActivity({
    entityType: "project",
    entityId: id,
    action: published ? "published" : "unpublished",
    actor: user.email
  })
  revalidatePath(`/admin/projects/${id}`)
  revalidatePath("/admin/projects")
  return { ok: true, error: null }
}

export async function deleteProject(id: string): Promise<ActionResult> {
  const user = await requireAdminSession()
  const supabase = createAdminClient()

  const project = await getProject(id)
  const { error } = await supabase.from("projects").delete().eq("id", id)
  if (error) {
    console.error("deleteProject", error.message)
    return { ok: false, error: error.message }
  }

  // Best-effort cleanup of the project's own image fields. project_media
  // and reports rows cascade-delete at the DB level; their Storage
  // objects are cleaned up separately since Storage isn't part of the
  // FK graph. Orphans here are visible and removable from Storage Manager.
  if (project?.thumbnail_path) await deleteAsset(project.thumbnail_path)
  if (project?.hero_media_path) await deleteAsset(project.hero_media_path)

  await logActivity({ entityType: "project", entityId: id, action: "deleted", actor: user.email })
  revalidatePath("/admin/projects")
  return { ok: true, error: null }
}

// ---- Tags -------------------------------------------------------------

export async function setProjectTags(id: string, tagIds: string[]): Promise<ActionResult> {
  await requireAdminSession()
  const supabase = createAdminClient()

  const { error: delError } = await supabase.from("project_tags").delete().eq("project_id", id)
  if (delError) return { ok: false, error: delError.message }

  if (tagIds.length > 0) {
    const { error: insError } = await supabase
      .from("project_tags")
      .insert(tagIds.map((tag_id) => ({ project_id: id, tag_id })))
    if (insError) return { ok: false, error: insError.message }
  }

  revalidatePath(`/admin/projects/${id}`)
  return { ok: true, error: null }
}

// ---- Images (thumbnail / hero) ----------------------------------------

export async function uploadProjectImage(
  projectId: string,
  slug: string,
  field: "thumbnail_path" | "hero_media_path",
  previousPath: string | null,
  file: File
): Promise<{ path: string | null; error: string | null }> {
  await requireAdminSession()

  const name = field === "thumbnail_path" ? "thumbnail" : "hero"
  const result = await uploadAsset({
    file,
    folder: `PROJECTS/${slug}`,
    allowedTypes: IMAGE_TYPES,
    filenameOverride: `${name}.${file.name.split(".").pop()?.toLowerCase() ?? "webp"}`
  })

  if (result.error || !result.path) return { path: null, error: result.error }

  const supabase = createAdminClient()
  const { error } = await supabase.from("projects").update({ [field]: result.path }).eq("id", projectId)
  if (error) return { path: null, error: "Saved file but failed to update the project record." }

  if (previousPath && previousPath !== result.path) await deleteAsset(previousPath)

  revalidatePath(`/admin/projects/${projectId}`)
  return { path: result.path, error: null }
}

// ---- Project media ------------------------------------------------------

export async function uploadProjectMedia(
  projectId: string,
  slug: string,
  mediaType: ProjectMedia["media_type"],
  file: File
): Promise<ActionResult> {
  await requireAdminSession()
  const allowed = mediaType === "video" ? VIDEO_TYPES : IMAGE_TYPES

  const result = await uploadAsset({ file, folder: `PROJECTS/${slug}/media`, allowedTypes: allowed })
  if (result.error || !result.path) return { ok: false, error: result.error }

  const supabase = createAdminClient()
  const { count } = await supabase
    .from("project_media")
    .select("id", { count: "exact", head: true })
    .eq("project_id", projectId)

  const { error } = await supabase.from("project_media").insert({
    project_id: projectId,
    media_type: mediaType,
    storage_path: result.path,
    display_order: count ?? 0
  })
  if (error) return { ok: false, error: error.message }

  revalidatePath(`/admin/projects/${projectId}`)
  return { ok: true, error: null }
}

export async function deleteProjectMedia(mediaId: string, projectId: string, storagePath: string): Promise<ActionResult> {
  await requireAdminSession()
  const supabase = createAdminClient()
  const { error } = await supabase.from("project_media").delete().eq("id", mediaId)
  if (error) return { ok: false, error: error.message }
  await deleteAsset(storagePath)
  revalidatePath(`/admin/projects/${projectId}`)
  return { ok: true, error: null }
}

export async function reorderProjectMedia(projectId: string, orderedIds: string[]): Promise<ActionResult> {
  await requireAdminSession()
  const supabase = createAdminClient()
  const updates = orderedIds.map((id, index) =>
    supabase.from("project_media").update({ display_order: index }).eq("id", id)
  )
  const results = await Promise.all(updates)
  const failed = results.find((r) => r.error)
  if (failed?.error) return { ok: false, error: failed.error.message }
  revalidatePath(`/admin/projects/${projectId}`)
  return { ok: true, error: null }
}

// ---- Reports ------------------------------------------------------------

export async function uploadProjectReport(
  projectId: string,
  slug: string,
  title: string,
  file: File
): Promise<ActionResult> {
  await requireAdminSession()
  const result = await uploadAsset({ file, folder: `REPORTS/${slug}`, allowedTypes: PDF_TYPES })
  if (result.error || !result.path) return { ok: false, error: result.error }

  const supabase = createAdminClient()
  const { error } = await supabase.from("reports").insert({
    project_id: projectId,
    title: title || file.name,
    file_path: result.path,
    file_type: "pdf",
    file_size: file.size,
    published: true
  })
  if (error) return { ok: false, error: error.message }

  revalidatePath(`/admin/projects/${projectId}`)
  return { ok: true, error: null }
}

export async function deleteProjectReport(reportId: string, projectId: string, filePath: string): Promise<ActionResult> {
  await requireAdminSession()
  const supabase = createAdminClient()
  const { error } = await supabase.from("reports").delete().eq("id", reportId)
  if (error) return { ok: false, error: error.message }
  await deleteAsset(filePath)
  revalidatePath(`/admin/projects/${projectId}`)
  return { ok: true, error: null }
}

export async function toggleReportPublished(reportId: string, projectId: string, published: boolean): Promise<ActionResult> {
  await requireAdminSession()
  const supabase = createAdminClient()
  const { error } = await supabase.from("reports").update({ published }).eq("id", reportId)
  if (error) return { ok: false, error: error.message }
  revalidatePath(`/admin/projects/${projectId}`)
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
