import "server-only"
import { createAdminClient } from "./supabase/admin"
import { IMAGE_TYPES, VIDEO_TYPES } from "./storageConstants"

export const PUBLIC_BUCKET = "portfolio-public"
export const PRIVATE_BUCKET = "portfolio-private"

export { IMAGE_TYPES, VIDEO_TYPES, PDF_TYPES, RESUME_TYPES } from "./storageConstants"

const MAX_IMAGE_BYTES = 8 * 1024 * 1024 // 8MB
const MAX_VIDEO_BYTES = 200 * 1024 * 1024 // 200MB
const MAX_DOC_BYTES = 25 * 1024 * 1024 // 25MB

export function maxBytesFor(mimeType: string): number {
  if (VIDEO_TYPES.includes(mimeType)) return MAX_VIDEO_BYTES
  if (IMAGE_TYPES.includes(mimeType)) return MAX_IMAGE_BYTES
  return MAX_DOC_BYTES
}

/**
 * Normalizes a filename to a safe, permanent object-key segment:
 * lowercase, spaces/unsafe chars -> hyphens, no repeated hyphens, and
 * the original extension preserved. Never use an uploader's original
 * filename as-is for a permanent Storage path (spec #16).
 */
export function normalizeFilename(originalName: string): string {
  const lastDot = originalName.lastIndexOf(".")
  const ext = lastDot >= 0 ? originalName.slice(lastDot + 1).toLowerCase() : ""
  const base = (lastDot >= 0 ? originalName.slice(0, lastDot) : originalName)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")

  const safeBase = base || "file"
  return ext ? `${safeBase}.${ext}` : safeBase
}

/** Joins a folder + normalized filename into a clean object key. */
export function normalizeStoragePath(folder: string, originalName: string): string {
  const cleanFolder = folder.replace(/^\/+|\/+$/g, "")
  return `${cleanFolder}/${normalizeFilename(originalName)}`
}

/**
 * Prefixes a normalized filename with a short random id. Required for
 * any folder that can hold more than one file at a time (project
 * gallery media, reports): without this, two uploads that happen to
 * share a source filename (e.g. two different "photo.jpg" screenshots)
 * would silently overwrite each other's Storage object, since uploadAsset
 * always uses upsert:true. Single-slot uploads (a profile picture, a
 * project's one thumbnail, a homepage section's one video) don't need
 * this — they use a fixed filenameOverride instead, precisely because
 * upsert-in-place is the desired "replace" behavior there.
 */
export function uniqueFilename(originalName: string): string {
  const normalized = normalizeFilename(originalName)
  const id = crypto.randomUUID().slice(0, 8)
  return `${id}-${normalized}`
}

export function getPublicAssetUrl(path: string | null | undefined): string | null {
  if (!path) return null
  const supabase = createAdminClient()
  const { data } = supabase.storage.from(PUBLIC_BUCKET).getPublicUrl(path)
  return data?.publicUrl ?? null
}

export async function getSignedAssetUrl(
  path: string,
  expiresInSeconds = 3600
): Promise<string | null> {
  const supabase = createAdminClient()
  const { data, error } = await supabase.storage
    .from(PRIVATE_BUCKET)
    .createSignedUrl(path, expiresInSeconds)
  if (error) {
    console.error("getSignedAssetUrl", error.message)
    return null
  }
  return data?.signedUrl ?? null
}

export interface UploadAssetParams {
  file: File
  folder: string
  allowedTypes: string[]
  bucket?: string
  /** Use a fixed filename (e.g. "profile-picture.webp") instead of the upload's original name — for slots that always hold exactly one current file. */
  filenameOverride?: string
}

export interface UploadAssetResult {
  path: string | null
  error: string | null
}

/**
 * The one place a file actually reaches Supabase Storage from. Every
 * upload flow in the admin (profile picture, project media, reports,
 * resumes, certificates, homepage media) calls this rather than talking
 * to the Storage client directly, so validation and normalization can't
 * drift between forms.
 */
export async function uploadAsset({
  file,
  folder,
  allowedTypes,
  bucket = PUBLIC_BUCKET,
  filenameOverride
}: UploadAssetParams): Promise<UploadAssetResult> {
  if (!allowedTypes.includes(file.type)) {
    return {
      path: null,
      error: `Unsupported file type "${file.type || "unknown"}". Allowed: ${allowedTypes.join(", ")}.`
    }
  }

  const limit = maxBytesFor(file.type)
  if (file.size > limit) {
    return {
      path: null,
      error: `File is ${(file.size / 1024 / 1024).toFixed(1)}MB, which exceeds the ${(limit / 1024 / 1024).toFixed(0)}MB limit for this type.`
    }
  }

  const path = filenameOverride
    ? normalizeStoragePath(folder, filenameOverride)
    : normalizeStoragePath(folder, file.name)

  const supabase = createAdminClient()
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    upsert: true,
    contentType: file.type
  })

  if (error) {
    console.error("uploadAsset", error.message)
    return { path: null, error: "Storage upload failed. Check the network and try again." }
  }

  return { path, error: null }
}

export async function deleteAsset(
  path: string,
  bucket: string = PUBLIC_BUCKET
): Promise<{ error: string | null }> {
  const supabase = createAdminClient()
  const { error } = await supabase.storage.from(bucket).remove([path])
  if (error) {
    console.error("deleteAsset", error.message)
    return { error: "Storage delete failed." }
  }
  return { error: null }
}
