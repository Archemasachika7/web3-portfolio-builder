"use server"

/**
 * Uploads go straight from the browser to Supabase Storage. These two
 * actions are the only server steps, and neither carries file bytes:
 *
 *   prepareUpload  checks the session and the file, picks the object path,
 *                  and returns a one-time signed upload URL.
 *   finishUpload   records the uploaded path on the right row (or inserts
 *                  a gallery item / report) and removes the file it replaced.
 *
 * Keeping files off the Next.js server avoids its request-size limits
 * (1 MB for Server Actions, 4.5 MB on Vercel), which is what made uploads
 * hang before.
 */

import { revalidatePath } from "@/lib/revalidate"
import { createAdminClient } from "./supabase/admin"
import { requireAdminSession } from "./auth"
import { logActivity } from "./activity"
import { PUBLIC_BUCKET, deleteAsset, getPublicAssetUrl } from "./storage"
import { extensionOf } from "./storageConstants"
import { checkFile, classifyFile, isUploadKind, isVideoPath, type UploadKind } from "./uploadKinds"
import type { ProjectMedia, Report } from "@/shared/database.types"

interface FileInfo {
  name: string
  type: string
  size: number
}

export type PrepareResult =
  | { ok: true; error: null; path: string; uploadUrl: string }
  | { ok: false; error: string }

export type FinishResult =
  | {
      ok: true
      error: null
      path: string
      url: string | null
      media?: ProjectMedia
      report?: Report
    }
  | { ok: false; error: string }

type Supabase = ReturnType<typeof createAdminClient>

/** Where each single-slot kind is recorded. */
const SLOTS: Partial<Record<UploadKind, { table: string; column: string }>> = {
  "profile-picture": { table: "profiles", column: "profile_image_path" },
  "education-logo": { table: "education", column: "logo_path" },
  "experience-logo": { table: "experience", column: "logo_path" },
  "achievement-image": { table: "achievements", column: "image_path" },
  "certificate-thumbnail": { table: "certificates", column: "thumbnail_path" },
  "certificate-file": { table: "certificates", column: "certificate_file_path" },
  "resume-file": { table: "resumes", column: "file_path" },
  "project-thumbnail": { table: "projects", column: "thumbnail_path" },
  "project-hero": { table: "projects", column: "hero_media_path" },
  "homepage-media": { table: "homepage_media", column: "storage_path" },
  "homepage-poster": { table: "homepage_media", column: "poster_path" },
  "homepage-mobile": { table: "homepage_media", column: "mobile_storage_path" },
  "site-favicon": { table: "site_settings", column: "favicon_path" },
  "site-og": { table: "site_settings", column: "default_og_image_path" }
}

/** Admin pages to refresh after an upload of each kind. */
function pagesFor(kind: UploadKind, recordId: string): string[] {
  if (kind.startsWith("project-")) return [`/admin/projects/${recordId}`, "/admin/projects", "/admin/reports"]
  if (kind.startsWith("homepage-")) return ["/admin/homepage-media"]
  if (kind.startsWith("certificate-")) return ["/admin/certificates"]
  if (kind.startsWith("site-")) return ["/admin/settings"]
  return [
    {
      "profile-picture": "/admin/profile",
      "education-logo": "/admin/education",
      "experience-logo": "/admin/experience",
      "achievement-image": "/admin/achievements",
      "resume-file": "/admin/resumes"
    }[kind as string] ?? "/admin"
  ]
}

/** A safe single path segment: lowercase, hyphenated, no dots or slashes. */
function segment(input: string, fallback: string): string {
  const clean = input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60)
  return clean || fallback
}

/**
 * The folder a kind writes into for one record, plus the base filename.
 * Also proves the record exists, so a stale page can't create orphans.
 */
async function resolveTarget(
  supabase: Supabase,
  kind: UploadKind,
  recordId: string,
  fileName: string
): Promise<{ folder: string; base: string } | { error: string }> {
  const fromName = segment(fileName.replace(/\.[^.]+$/, ""), "file")

  async function row<T>(table: string, columns: string): Promise<T | null> {
    const { data } = await supabase.from(table).select(columns).eq("id", recordId).maybeSingle()
    return (data as T | null) ?? null
  }

  switch (kind) {
    case "profile-picture":
      return (await row("profiles", "id")) ? { folder: "PROFILE", base: "profile-picture" } : { error: "Save the profile once before adding a picture." }
    case "education-logo":
      return (await row("education", "id")) ? { folder: `EDUCATION/${recordId}`, base: "logo" } : { error: "This education entry no longer exists." }
    case "experience-logo":
      return (await row("experience", "id")) ? { folder: `EXPERIENCE/${recordId}`, base: "logo" } : { error: "This experience entry no longer exists." }
    case "achievement-image":
      return (await row("achievements", "id")) ? { folder: `ACHIEVEMENTS/${recordId}`, base: "image" } : { error: "This achievement no longer exists." }
    case "certificate-thumbnail":
    case "certificate-file":
      return (await row("certificates", "id"))
        ? { folder: `CERTIFICATES/${recordId}`, base: kind === "certificate-thumbnail" ? "thumbnail" : fromName }
        : { error: "This certificate no longer exists." }
    case "resume-file": {
      const r = await row<{ slug: string }>("resumes", "slug")
      return r ? { folder: `RESUMES/${segment(r.slug, recordId)}`, base: fromName } : { error: "This resume no longer exists." }
    }
    case "project-thumbnail":
    case "project-hero":
    case "project-media":
    case "project-report": {
      const p = await row<{ slug: string }>("projects", "slug")
      if (!p) return { error: "This project no longer exists." }
      const slug = segment(p.slug, recordId)
      if (kind === "project-thumbnail") return { folder: `PROJECTS/${slug}`, base: "thumbnail" }
      if (kind === "project-hero") return { folder: `PROJECTS/${slug}`, base: "hero" }
      if (kind === "project-media") return { folder: `PROJECTS/${slug}/media`, base: fromName }
      return { folder: `REPORTS/${slug}`, base: fromName }
    }
    case "homepage-media":
    case "homepage-poster":
    case "homepage-mobile": {
      const s = await row<{ section_key: string }>("homepage_media", "section_key")
      if (!s) return { error: "This homepage section no longer exists." }
      const base = { "homepage-media": "media", "homepage-poster": "poster", "homepage-mobile": "mobile" }[kind]
      return { folder: `HOMEPAGE/${segment(s.section_key, recordId)}`, base }
    }
    case "site-favicon":
    case "site-og":
      return (await row("site_settings", "id"))
        ? { folder: "SITE", base: kind === "site-favicon" ? "favicon" : "og-image" }
        : { error: "Save the settings once before adding images." }
  }
}

/** The bucket's own size limit, if one is set. Fetched alongside the record lookup, so it adds no wait. */
async function getBucketLimit(supabase: Supabase): Promise<number | null> {
  const { data } = await supabase.storage.getBucket(PUBLIC_BUCKET)
  const raw = data?.file_size_limit
  return typeof raw === "number" && raw > 0 ? raw : null
}

function validInput(kind: string, recordId: string, file: FileInfo): string | null {
  if (!isUploadKind(kind)) return "Unknown upload slot."
  if (!/^[0-9a-f-]{36}$/i.test(recordId)) return "Missing record — reload the page and try again."
  if (typeof file?.name !== "string" || typeof file.size !== "number" || typeof file.type !== "string") {
    return "Malformed upload request."
  }
  return checkFile(kind, file)
}

export async function prepareUpload(input: { kind: UploadKind; recordId: string; file: FileInfo }): Promise<PrepareResult> {
  await requireAdminSession()
  const { kind, recordId, file } = input
  const invalid = validInput(kind, recordId, file)
  if (invalid) return { ok: false, error: invalid }

  const supabase = createAdminClient()
  const [target, bucketLimit] = await Promise.all([
    resolveTarget(supabase, kind, recordId, file.name),
    getBucketLimit(supabase)
  ])
  if ("error" in target) return { ok: false, error: target.error }
  if (bucketLimit && file.size > bucketLimit) {
    return {
      ok: false,
      error: `"${file.name}" is ${(file.size / 1024 / 1024).toFixed(1)} MB, over the ${Math.round(bucketLimit / 1024 / 1024)} MB limit set on the Storage bucket. Raise it in Supabase → Storage, or upload a smaller file.`
    }
  }

  // A fresh name per upload: nothing is overwritten in place, so browsers
  // and the CDN never serve a stale copy of a replaced file.
  const ext = extensionOf(file.name) || "bin"
  const path = `${target.folder}/${target.base}-${crypto.randomUUID().slice(0, 8)}.${ext}`

  const { data, error } = await supabase.storage.from(PUBLIC_BUCKET).createSignedUploadUrl(path)
  if (error || !data) {
    console.error("prepareUpload", error?.message)
    const reason = error?.message?.toLowerCase().includes("bucket")
      ? `Storage bucket "${PUBLIC_BUCKET}" is missing — run supabase/reset_and_setup.sql.`
      : "Couldn't start the upload. Check that Supabase is reachable and try again."
    return { ok: false, error: reason }
  }

  return { ok: true, error: null, path, uploadUrl: data.signedUrl }
}

export async function finishUpload(input: {
  kind: UploadKind
  recordId: string
  path: string
  file: FileInfo
  title?: string
}): Promise<FinishResult> {
  const user = await requireAdminSession()
  const { kind, recordId, path, file } = input
  const invalid = validInput(kind, recordId, file)
  if (invalid) return { ok: false, error: invalid }

  const supabase = createAdminClient()
  const target = await resolveTarget(supabase, kind, recordId, file.name)
  if ("error" in target) return { ok: false, error: target.error }
  // Only ever record a path this slot could have produced.
  if (!path.startsWith(`${target.folder}/`) || path.includes("..")) {
    return { ok: false, error: "Upload path doesn't match this item — reload the page and try again." }
  }

  const result = await record(supabase, kind, recordId, path, file, input.title, target.folder)
  if (!result.ok) {
    await deleteAsset(path)
    return result
  }

  await logActivity({ entityType: kind, entityId: recordId, action: "uploaded", actor: user.email, detail: path })
  for (const page of pagesFor(kind, recordId)) revalidatePath(page)
  return { ...result, url: getPublicAssetUrl(path) }
}

async function record(
  supabase: Supabase,
  kind: UploadKind,
  recordId: string,
  path: string,
  file: FileInfo,
  title: string | undefined,
  folder: string
): Promise<FinishResult> {
  if (kind === "project-media") {
    const cls = classifyFile(kind, file)
    const mediaType: ProjectMedia["media_type"] = cls === "model" ? "model" : cls === "video" ? "video" : "screenshot"
    const { count } = await supabase
      .from("project_media")
      .select("id", { count: "exact", head: true })
      .eq("project_id", recordId)
    const { data, error } = await supabase
      .from("project_media")
      .insert({ project_id: recordId, media_type: mediaType, storage_path: path, display_order: count ?? 0 })
      .select("*")
      .single()
    if (error || !data) return { ok: false, error: `Uploaded, but couldn't add it to the gallery: ${error?.message}` }
    return { ok: true, error: null, path, url: null, media: data as ProjectMedia }
  }

  if (kind === "project-report") {
    const { data, error } = await supabase
      .from("reports")
      .insert({
        project_id: recordId,
        title: title?.trim() || file.name.replace(/\.[^.]+$/, ""),
        file_path: path,
        file_type: "pdf",
        file_size: file.size,
        published: true
      })
      .select("*")
      .single()
    if (error || !data) return { ok: false, error: `Uploaded, but couldn't save the report: ${error?.message}` }
    return { ok: true, error: null, path, url: null, report: data as Report }
  }

  const slot = SLOTS[kind]
  if (!slot) return { ok: false, error: "Unknown upload slot." }

  const { data: before } = await supabase.from(slot.table).select(slot.column).eq("id", recordId).maybeSingle()
  const previous = (before as Record<string, string | null> | null)?.[slot.column] ?? null

  const update: Record<string, unknown> = { [slot.column]: path }
  // The homepage main slot also says whether the section plays a video.
  if (kind === "homepage-media") update.media_type = isVideoPath(path) ? "video" : "image"

  const { error } = await supabase.from(slot.table).update(update).eq("id", recordId)
  if (error) return { ok: false, error: `Uploaded, but couldn't save it: ${error.message}` }

  // Remove the file this one replaced — but only if this slot created it.
  // Files placed by hand elsewhere (e.g. VIDEOS/) are left for the Storage page.
  if (previous && previous !== path && previous.startsWith(`${folder}/`)) await deleteAsset(previous)

  return { ok: true, error: null, path, url: null }
}

/** Clear a single-slot file (e.g. remove a logo) and delete it from Storage. */
export async function clearUpload(input: { kind: UploadKind; recordId: string }): Promise<{ ok: boolean; error: string | null }> {
  const user = await requireAdminSession()
  const { kind, recordId } = input
  const slot = isUploadKind(kind) ? SLOTS[kind] : undefined
  if (!slot || !/^[0-9a-f-]{36}$/i.test(recordId)) return { ok: false, error: "Unknown upload slot." }

  const supabase = createAdminClient()
  const { data: before } = await supabase.from(slot.table).select(slot.column).eq("id", recordId).maybeSingle()
  const previous = (before as Record<string, string | null> | null)?.[slot.column] ?? null

  // resumes.file_path is NOT NULL; an empty string means "no file yet" there.
  const empty = slot.table === "resumes" ? "" : null
  const { error } = await supabase.from(slot.table).update({ [slot.column]: empty }).eq("id", recordId)
  if (error) return { ok: false, error: error.message }

  const target = await resolveTarget(supabase, kind, recordId, "file")
  if (previous && !("error" in target) && previous.startsWith(`${target.folder}/`)) await deleteAsset(previous)

  await logActivity({ entityType: kind, entityId: recordId, action: "deleted", actor: user.email, detail: previous })
  for (const page of pagesFor(kind, recordId)) revalidatePath(page)
  return { ok: true, error: null }
}
