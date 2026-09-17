"use server"

import { revalidatePath } from "next/cache"
import { createAdminClient } from "@/lib/supabase/admin"
import { requireAdminSession } from "@/lib/auth"
import { uploadAsset, deleteAsset, IMAGE_TYPES } from "@/lib/storage"
import { logActivity } from "@/lib/activity"
import type { Education } from "@/shared/database.types"

export interface ActionResult {
  ok: boolean
  error: string | null
}

export async function listEducation(): Promise<Education[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("education")
    .select("*")
    .order("sort_order", { ascending: true })
  if (error) {
    console.error("listEducation", error.message)
    return []
  }
  return data as Education[]
}

export async function createEducation(): Promise<ActionResult> {
  const user = await requireAdminSession()
  const supabase = createAdminClient()
  const { count } = await supabase.from("education").select("id", { count: "exact", head: true })
  const { error } = await supabase
    .from("education")
    .insert({ institution: "New institution", published: false, sort_order: count ?? 0 })
  if (error) return { ok: false, error: error.message }
  await logActivity({ entityType: "education", action: "created", actor: user.email })
  revalidatePath("/admin/education")
  return { ok: true, error: null }
}

export async function updateEducation(id: string, formData: FormData): Promise<ActionResult> {
  await requireAdminSession()
  const supabase = createAdminClient()

  const payload = {
    institution: String(formData.get("institution") ?? "").trim(),
    degree: nullableString(formData.get("degree")),
    field: nullableString(formData.get("field")),
    program: nullableString(formData.get("program")),
    location: nullableString(formData.get("location")),
    start_year: numberOrNull(formData.get("start_year")),
    end_year: numberOrNull(formData.get("end_year")),
    current: formData.get("current") === "on",
    cgpa: nullableString(formData.get("cgpa")),
    grade: nullableString(formData.get("grade")),
    score: nullableString(formData.get("score")),
    rank: nullableString(formData.get("rank")),
    website_url: nullableString(formData.get("website_url")),
    description: nullableString(formData.get("description")),
    published: formData.get("published") === "on"
  }

  if (!payload.institution) return { ok: false, error: "Institution is required." }

  const { error } = await supabase.from("education").update(payload).eq("id", id)
  if (error) return { ok: false, error: error.message }

  revalidatePath("/admin/education")
  return { ok: true, error: null }
}

export async function deleteEducation(id: string): Promise<ActionResult> {
  const user = await requireAdminSession()
  const supabase = createAdminClient()
  const { error } = await supabase.from("education").delete().eq("id", id)
  if (error) return { ok: false, error: error.message }
  await logActivity({ entityType: "education", entityId: id, action: "deleted", actor: user.email })
  revalidatePath("/admin/education")
  return { ok: true, error: null }
}

export async function reorderEducation(orderedIds: string[]): Promise<ActionResult> {
  await requireAdminSession()
  const supabase = createAdminClient()
  const results = await Promise.all(
    orderedIds.map((id, index) => supabase.from("education").update({ sort_order: index }).eq("id", id))
  )
  const failed = results.find((r) => r.error)
  if (failed?.error) return { ok: false, error: failed.error.message }
  revalidatePath("/admin/education")
  return { ok: true, error: null }
}

export async function uploadEducationLogo(
  id: string,
  previousPath: string | null,
  file: File
): Promise<{ path: string | null; error: string | null }> {
  await requireAdminSession()
  const result = await uploadAsset({
    file,
    folder: `EDUCATION/${id}`,
    allowedTypes: IMAGE_TYPES,
    filenameOverride: `logo.${file.name.split(".").pop()?.toLowerCase() ?? "webp"}`
  })
  if (result.error || !result.path) return { path: null, error: result.error }

  const supabase = createAdminClient()
  const { error } = await supabase.from("education").update({ logo_path: result.path }).eq("id", id)
  if (error) return { path: null, error: "Saved file but failed to update the record." }

  if (previousPath && previousPath !== result.path) await deleteAsset(previousPath)
  revalidatePath("/admin/education")
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
