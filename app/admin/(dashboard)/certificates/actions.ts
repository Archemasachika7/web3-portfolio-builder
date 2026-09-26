"use server"

import { revalidatePath } from "@/lib/revalidate"
import { createAdminClient } from "@/lib/supabase/admin"
import { requireAdminSession } from "@/lib/auth"
import { deleteAsset } from "@/lib/storage"
import { logActivity } from "@/lib/activity"
import type { Certificate, Tag } from "@/shared/database.types"
import { titleFromFileName } from "@/lib/names"

export interface ActionResult {
  ok: boolean
  error: string | null
  id?: string
}

export interface CertificateWithTags extends Certificate {
  tags: Tag[]
}

export async function listCertificates(): Promise<CertificateWithTags[]> {
  await requireAdminSession()
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
  const { data: created, error } = await supabase
    .from("certificates")
    .insert({ title: "New certificate", issuer: "Issuer", published: false, sort_order: count ?? 0 })
    .select("id")
    .single()
  if (error) return { ok: false, error: error.message }
  await logActivity({ entityType: "certificate", action: "created", actor: user.email })
  revalidatePath("/admin/certificates")
  return { ok: true, error: null, id: created?.id as string | undefined }
}

/** First step of "drop a picture or PDF to post a certificate". */
export async function createCertificateFromFile(fileName: string): Promise<ActionResult> {
  const user = await requireAdminSession()
  const supabase = createAdminClient()
  const { count } = await supabase.from("certificates").select("id", { count: "exact", head: true })
  const { data: created, error } = await supabase
    .from("certificates")
    .insert({ title: titleFromFileName(String(fileName ?? "")), issuer: "", published: false, sort_order: count ?? 0 })
    .select("id")
    .single()
  if (error) return { ok: false, error: error.message }
  await logActivity({ entityType: "certificate", entityId: created?.id, action: "created", actor: user.email })
  return { ok: true, error: null, id: created?.id as string | undefined }
}

/** Puts a just-uploaded certificate live; details can be filled in afterwards. */
export async function publishCertificate(id: string): Promise<ActionResult> {
  const user = await requireAdminSession()
  const supabase = createAdminClient()
  const { error } = await supabase.from("certificates").update({ published: true }).eq("id", id)
  if (error) return { ok: false, error: error.message }
  await logActivity({ entityType: "certificate", entityId: id, action: "published", actor: user.email })
  revalidatePath("/admin/certificates")
  return { ok: true, error: null, id }
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

  if (!payload.title) return { ok: false, error: "Title is required." }

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

export async function deleteCertificate(id: string): Promise<ActionResult> {
  const user = await requireAdminSession()
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("certificates")
    .delete()
    .eq("id", id)
    .select("certificate_file_path, thumbnail_path")
    .maybeSingle()
  if (error) return { ok: false, error: error.message }
  if (data?.certificate_file_path) await deleteAsset(data.certificate_file_path)
  if (data?.thumbnail_path) await deleteAsset(data.thumbnail_path)
  await logActivity({ entityType: "certificate", entityId: id, action: "deleted", actor: user.email })
  revalidatePath("/admin/certificates")
  return { ok: true, error: null }
}

function nullableString(value: FormDataEntryValue | null): string | null {
  const s = String(value ?? "").trim()
  return s.length ? s : null
}
