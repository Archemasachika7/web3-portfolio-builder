"use server"

import { revalidatePath } from "next/cache"
import { createAdminClient } from "@/lib/supabase/admin"
import { deleteAsset, PUBLIC_BUCKET } from "@/lib/storage"
import { logActivity } from "@/lib/activity"
import { requireAdminSession } from "@/lib/auth"
import type { Project, ProjectMedia, Report, Tag } from "@/shared/database.types"
import { missingRequirements } from "@/lib/projectReadiness"

export interface ActionResult {
  ok: boolean
  error: string | null
}

export interface ProjectListItem extends Project {
  tagCount: number
  reportCount: number
  publishedReportCount: number
  missing: string[]
}

export async function listProjects(): Promise<ProjectListItem[]> {
  await requireAdminSession()
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("projects")
    .select("*, project_tags(tag_id), reports(id, published)")
    .order("sort_order", { ascending: true })
    .order("updated_at", { ascending: false })

  if (error || !data) {
    console.error("listProjects", error?.message)
    return []
  }

  return data.map((p) => {
    const project = p as unknown as Project
    const tagCount = (p.project_tags as unknown[] | null)?.length ?? 0
    const reports = (p.reports as { published: boolean }[] | null) ?? []
    const publishedReportCount = reports.filter((r) => r.published).length
    return {
      ...project,
      tagCount,
      reportCount: reports.length,
      publishedReportCount,
      missing: missingRequirements({ ...project, tagCount, publishedReportCount })
    }
  })
}

export interface ProjectDetail extends Project {
  tags: Tag[]
  media: ProjectMedia[]
  reports: Report[]
}

export async function getProject(id: string): Promise<ProjectDetail | null> {
  await requireAdminSession()
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

export async function createProject(title = "Untitled Project"): Promise<ActionResult & { id?: string }> {
  const user = await requireAdminSession()
  const clean = title.trim() || "Untitled Project"

  const supabase = createAdminClient()
  const baseSlug = slugify(clean) || "untitled"

  // One query for every slug already taken with this base, instead of
  // probing them one round trip at a time.
  const { data: taken, error: lookupError } = await supabase
    .from("projects")
    .select("slug")
    .like("slug", `${baseSlug}%`)
  if (lookupError) {
    console.error("createProject", lookupError.message)
    return { ok: false, error: "Couldn't create the project: " + lookupError.message }
  }
  const used = new Set((taken ?? []).map((r) => r.slug as string))
  let slug = baseSlug
  for (let n = 2; used.has(slug); n++) slug = `${baseSlug}-${n}`

  const { data: inserted, error } = await supabase
    .from("projects")
    .insert({ title: clean, slug, status: "draft", published: false })
    .select("id")
    .single()

  if (error || !inserted) {
    console.error("createProject", error?.message)
    return { ok: false, error: "Couldn't create the project: " + (error?.message ?? "unknown error") }
  }

  await logActivity({ entityType: "project", entityId: inserted.id, action: "created", actor: user.email })
  revalidatePath("/admin/projects")
  return { ok: true, error: null, id: inserted.id }
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
  await requireAdminSession()
  const project = await getProject(id)
  if (!project) return { canPublish: false, missing: ["Project not found"] }

  const missing = missingRequirements({
    ...project,
    tagCount: project.tags.length,
    publishedReportCount: project.reports.filter((r) => r.published).length
  })

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

  // Collect the project's files first: media and report rows cascade away
  // with the project, and Storage isn't part of that FK graph.
  const [{ data: media }, { data: reports }] = await Promise.all([
    supabase.from("project_media").select("storage_path").eq("project_id", id),
    supabase.from("reports").select("file_path").eq("project_id", id)
  ])

  const { data: deleted, error } = await supabase
    .from("projects")
    .delete()
    .eq("id", id)
    .select("thumbnail_path, hero_media_path")
    .maybeSingle()
  if (error) {
    console.error("deleteProject", error.message)
    return { ok: false, error: error.message }
  }

  const paths = [
    deleted?.thumbnail_path,
    deleted?.hero_media_path,
    ...(media ?? []).map((m) => m.storage_path as string),
    ...(reports ?? []).map((r) => r.file_path as string)
  ].filter((p): p is string => !!p && (p.startsWith("PROJECTS/") || p.startsWith("REPORTS/")))
  if (paths.length) {
    const { error: storageError } = await supabase.storage.from(PUBLIC_BUCKET).remove(paths)
    if (storageError) console.error("deleteProject storage", storageError.message)
  }

  await logActivity({ entityType: "project", entityId: id, action: "deleted", actor: user.email })
  revalidatePath("/admin/projects")
  return { ok: true, error: null }
}

/** Bulk delete for clearing out draft/junk projects from the list in one go. */
export async function deleteProjects(ids: string[]): Promise<ActionResult> {
  await requireAdminSession()
  if (ids.length === 0) return { ok: true, error: null }

  const results = await Promise.all(ids.map((id) => deleteProject(id)))
  const failures = results.filter((r) => !r.ok)
  if (failures.length > 0) {
    return { ok: false, error: `Failed to delete ${failures.length} of ${ids.length}: ${failures[0].error}` }
  }
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

// ---- Project media ------------------------------------------------------

export async function deleteProjectMedia(mediaId: string, projectId: string): Promise<ActionResult> {
  await requireAdminSession()
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("project_media")
    .delete()
    .eq("id", mediaId)
    .select("storage_path")
    .maybeSingle()
  if (error) return { ok: false, error: error.message }
  if (data?.storage_path) await deleteAsset(data.storage_path)
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

export async function deleteProjectReport(reportId: string, projectId: string): Promise<ActionResult> {
  await requireAdminSession()
  const supabase = createAdminClient()
  const { data, error } = await supabase.from("reports").delete().eq("id", reportId).select("file_path").maybeSingle()
  if (error) return { ok: false, error: error.message }
  if (data?.file_path) await deleteAsset(data.file_path)
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
