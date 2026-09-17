"use server"

import { revalidatePath } from "next/cache"
import { createAdminClient } from "@/lib/supabase/admin"
import { requireAdminSession } from "@/lib/auth"
import { deleteAsset, PUBLIC_BUCKET } from "@/lib/storage"
import { logActivity } from "@/lib/activity"

export interface ActionResult {
  ok: boolean
  error: string | null
}

export interface StorageObjectInfo {
  path: string
  name: string
  folder: string
  size: number | null
  updatedAt: string | null
  contentType: string | null
}

const TOP_LEVEL_FOLDERS = [
  "PROFILE",
  "PROJECTS",
  "REPORTS",
  "RESUMES",
  "CERTIFICATES",
  "HOMEPAGE",
  "SITE",
  "EDUCATION",
  "EXPERIENCE",
  "ACHIEVEMENTS",
  "VIDEOS"
]

/** Recursively lists everything under a prefix — Supabase Storage's list() only returns one level at a time. */
async function listRecursive(
  supabase: ReturnType<typeof createAdminClient>,
  prefix: string
): Promise<StorageObjectInfo[]> {
  const { data, error } = await supabase.storage.from(PUBLIC_BUCKET).list(prefix, { limit: 1000 })
  if (error || !data) return []

  const results: StorageObjectInfo[] = []
  for (const entry of data) {
    const fullPath = prefix ? `${prefix}/${entry.name}` : entry.name
    const isFolder = entry.id === null // Supabase convention: "folders" are synthetic entries with null id
    if (isFolder) {
      const nested = await listRecursive(supabase, fullPath)
      results.push(...nested)
    } else {
      results.push({
        path: fullPath,
        name: entry.name,
        folder: prefix.split("/")[0] || "Other",
        size: entry.metadata?.size ?? null,
        updatedAt: entry.updated_at ?? null,
        contentType: entry.metadata?.mimetype ?? null
      })
    }
  }
  return results
}

export async function listStorageObjects(): Promise<StorageObjectInfo[]> {
  const supabase = createAdminClient()
  const perFolder = await Promise.all(TOP_LEVEL_FOLDERS.map((folder) => listRecursive(supabase, folder)))
  return perFolder.flat()
}

export interface UsageEntry {
  label: string
}

/** Cross-references every storage_path-like column across every table so Storage Manager can warn before deleting a file still in use. */
export async function buildUsageIndex(): Promise<Map<string, UsageEntry[]>> {
  const supabase = createAdminClient()
  const index = new Map<string, UsageEntry[]>()

  function add(path: string | null | undefined, label: string) {
    if (!path) return
    const existing = index.get(path) ?? []
    existing.push({ label })
    index.set(path, existing)
  }

  const [
    profiles,
    education,
    achievements,
    experience,
    projects,
    projectMedia,
    reports,
    resumes,
    certificates,
    homepageMedia,
    siteSettings
  ] = await Promise.all([
    supabase.from("profiles").select("name, profile_image_path"),
    supabase.from("education").select("institution, logo_path"),
    supabase.from("achievements").select("title, image_path"),
    supabase.from("experience").select("organization, role, logo_path"),
    supabase.from("projects").select("title, thumbnail_path, hero_media_path"),
    supabase.from("project_media").select("id, project_id, storage_path, poster_path"),
    supabase.from("reports").select("title, file_path"),
    supabase.from("resumes").select("title, file_path"),
    supabase.from("certificates").select("title, certificate_file_path, thumbnail_path"),
    supabase.from("homepage_media").select("section_key, storage_path, poster_path, mobile_storage_path"),
    supabase.from("site_settings").select("favicon_path, default_og_image_path")
  ])

  profiles.data?.forEach((p) => add(p.profile_image_path, `Profile: ${p.name}`))
  education.data?.forEach((e) => add(e.logo_path, `Education: ${e.institution}`))
  achievements.data?.forEach((a) => add(a.image_path, `Achievement: ${a.title}`))
  experience.data?.forEach((e) => add(e.logo_path, `Experience: ${e.role} at ${e.organization}`))
  projects.data?.forEach((p) => {
    add(p.thumbnail_path, `Project thumbnail: ${p.title}`)
    add(p.hero_media_path, `Project hero: ${p.title}`)
  })
  projectMedia.data?.forEach((m) => {
    add(m.storage_path, `Project media (${m.project_id})`)
    add(m.poster_path, `Project media poster (${m.project_id})`)
  })
  reports.data?.forEach((r) => add(r.file_path, `Report: ${r.title}`))
  resumes.data?.forEach((r) => add(r.file_path, `Resume: ${r.title}`))
  certificates.data?.forEach((c) => {
    add(c.certificate_file_path, `Certificate: ${c.title}`)
    add(c.thumbnail_path, `Certificate thumbnail: ${c.title}`)
  })
  homepageMedia.data?.forEach((h) => {
    add(h.storage_path, `Homepage media: ${h.section_key}`)
    add(h.poster_path, `Homepage poster: ${h.section_key}`)
    add(h.mobile_storage_path, `Homepage mobile: ${h.section_key}`)
  })
  siteSettings.data?.forEach((s) => {
    add(s.favicon_path, "Site favicon")
    add(s.default_og_image_path, "Site OG image")
  })

  return index
}

export async function deleteStorageObject(path: string, confirmed: boolean): Promise<ActionResult> {
  const user = await requireAdminSession()

  if (!confirmed) {
    const index = await buildUsageIndex()
    const usage = index.get(path)
    if (usage && usage.length > 0) {
      return {
        ok: false,
        error: `In use by: ${usage.map((u) => u.label).join(", ")}. Pass confirmed=true to delete anyway.`
      }
    }
  }

  const result = await deleteAsset(path)
  if (result.error) return { ok: false, error: result.error }

  await logActivity({ entityType: "storage", action: "deleted", actor: user.email, detail: path })
  revalidatePath("/admin/storage")
  return { ok: true, error: null }
}
