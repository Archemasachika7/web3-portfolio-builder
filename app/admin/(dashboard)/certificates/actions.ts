"use server"

import { revalidatePath } from "next/cache"
import { createAdminClient } from "@/lib/supabase/admin"
import { requireAdminSession } from "@/lib/auth"
import { uploadAsset, deleteAsset, IMAGE_TYPES, PDF_TYPES } from "@/lib/storage"
import { logActivity } from "@/lib/activity"
import type { Certificate, Tag } from "@/shared/database.types"

export interface ActionResult {
  ok: boolean
  error: string | null
}

export interface CertificateWithTags extends Certificate {
  tags: Tag[]
}

export async function listCertificates(): Promise<CertificateWithTags[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("certificates")
    .select("*, certificate_tags(tags(*))")
    .order("sort_order", { ascending: true })
  if (error) {
    console.error("listCertificates", error.message)
    return []
  }
  return data.map((c) => ({
    ...(c as unknown as Certificate),
    tags: ((c.certificate_tags as { tags: Tag }[] | null) ?? []).map((ct) => ct.tags)
  }))
}

export async function createCertificate(): Promise<ActionResult> {
  const user = await requireAdminSession()
  const supabase = createAdminClient()
  const { count } = await supabase.from("certificates").select("id", { count: "exact", head: true })
  const { error } = await supabase
    .from("certificates")
    .insert({ title: "New certificate", issuer: "Issuer", published: false, sort_order: count ?? 0 })
  if (error) return { ok: false, error: error.message }
  await logActivity({ entityType: "certificate", action: "created", actor: user.email })
  revalidatePath("/admin/certificates")
  return { ok: true, error: null }
}

export async function updateCertificate(id: string, formData: FormData): Promise<ActionResult> {
  await requireAdminSession()
  const supabase = createAdminClient()

  const payload = {
    title: String(formData.get("title") ?? "").trim(),
    issuer: String(formData.get("issuer") ?? "").trim(),
    credential_name: nullableString(formData.get("credential_name")),
    issue_date: nullableString(formData.get("issue_date")),
    expiry_date: nullableString(formData.get("expiry_date")),
    credential_id: nullableString(formData.get("credential_id")),
    credential_url: nullableString(formData.get("credential_url")),
    description: nullableString(formData.get("description")),
    published: formData.get("published") === "on",
    featured: formData.get("featured") === "on"
  }

  if (!payload.title || !payload.issuer) return { ok: false, error: "Title and issuer are required." }

  const { error } = await supabase.from("certificates").update(payload).eq("id", id)
  if (error) return { ok: false, error: error.message }

  const tagIds = formData.getAll("tag_ids").map(String)
  await supabase.from("certificate_tags").delete().eq("certificate_id", id)
  if (tagIds.length > 0) {
    await supabase.from("certificate_tags").insert(tagIds.map((tag_id) => ({ certificate_id: id, tag_id })))
  }

  revalidatePath("/admin/certificates")
  return { ok: true, error: null }
}

export async function deleteCertificate(id: string, filePath: string | null, thumbPath: string | null): Promise<ActionResult> {
  const user = await requireAdminSession()
  const supabase = createAdminClient()
  const { error } = await supabase.from("certificates").delete().eq("id", id)
  if (error) return { ok: false, error: error.message }
  if (filePath) await deleteAsset(filePath)
  if (thumbPath) await deleteAsset(thumbPath)
  await logActivity({ entityType: "certificate", entityId: id, action: "deleted", actor: user.email })
  revalidatePath("/admin/certificates")
  return { ok: true, error: null }
}

export async function uploadCertificateFile(
  id: string,
  previousPath: string | null,
  file: File
): Promise<{ path: string | null; error: string | null }> {
  await requireAdminSession()
  const result = await uploadAsset({ file, folder: `CERTIFICATES/${id}`, allowedTypes: PDF_TYPES })
  if (result.error || !result.path) return { path: null, error: result.error }

  const supabase = createAdminClient()
  const { error } = await supabase.from("certificates").update({ certificate_file_path: result.path }).eq("id", id)
  if (error) return { path: null, error: "Saved file but failed to update the record." }

  if (previousPath && previousPath !== result.path) await deleteAsset(previousPath)
  revalidatePath("/admin/certificates")
  return { path: result.path, error: null }
}

export async function uploadCertificateThumbnail(
  id: string,
  previousPath: string | null,
  file: File
): Promise<{ path: string | null; error: string | null }> {
  await requireAdminSession()
  const result = await uploadAsset({
    file,
    folder: `CERTIFICATES/${id}`,
    allowedTypes: IMAGE_TYPES,
    filenameOverride: `thumbnail.${file.name.split(".").pop()?.toLowerCase() ?? "webp"}`
  })
  if (result.error || !result.path) return { path: null, error: result.error }

  const supabase = createAdminClient()
  const { error } = await supabase.from("certificates").update({ thumbnail_path: result.path }).eq("id", id)
  if (error) return { path: null, error: "Saved file but failed to update the record." }

  if (previousPath && previousPath !== result.path) await deleteAsset(previousPath)
  revalidatePath("/admin/certificates")
  return { path: result.path, error: null }
}

function nullableString(value: FormDataEntryValue | null): string | null {
  const s = String(value ?? "").trim()
  return s.length ? s : null
}
