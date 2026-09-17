"use server"

import { revalidatePath } from "next/cache"
import { createAdminClient } from "@/lib/supabase/admin"
import { requireAdminSession } from "@/lib/auth"
import { logActivity } from "@/lib/activity"
import type { Tag } from "@/shared/database.types"

export interface ActionResult {
  ok: boolean
  error: string | null
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

export async function listTags(): Promise<Tag[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("tags")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true })
  if (error) {
    console.error("listTags", error.message)
    return []
  }
  return data as Tag[]
}

export async function createTag(formData: FormData): Promise<ActionResult> {
  const user = await requireAdminSession()
  const name = String(formData.get("name") ?? "").trim()
  const type = String(formData.get("type") ?? "").trim() || null
  if (!name) return { ok: false, error: "Name is required." }

  const supabase = createAdminClient()
  const baseSlug = slugify(name) || "tag"
  let slug = baseSlug
  let attempt = 1
  while (true) {
    const { data } = await supabase.from("tags").select("id").eq("slug", slug).maybeSingle()
    if (!data) break
    attempt += 1
    slug = `${baseSlug}-${attempt}`
  }

  const { error } = await supabase.from("tags").insert({ name, slug, type })
  if (error) return { ok: false, error: error.message }

  await logActivity({ entityType: "tag", action: "created", actor: user.email, detail: name })
  revalidatePath("/admin/tags")
  return { ok: true, error: null }
}

export async function updateTag(id: string, formData: FormData): Promise<ActionResult> {
  await requireAdminSession()
  const supabase = createAdminClient()

  const payload = {
    name: String(formData.get("name") ?? "").trim(),
    slug: String(formData.get("slug") ?? "").trim(),
    type: nullableString(formData.get("type")),
    description: nullableString(formData.get("description")),
    published: formData.get("published") === "on"
  }

  if (!payload.name || !payload.slug) return { ok: false, error: "Name and slug are required." }

  const { error } = await supabase.from("tags").update(payload).eq("id", id)
  if (error) return { ok: false, error: error.message }

  revalidatePath("/admin/tags")
  return { ok: true, error: null }
}

export async function deleteTag(id: string): Promise<ActionResult> {
  const user = await requireAdminSession()
  const supabase = createAdminClient()
  const { error } = await supabase.from("tags").delete().eq("id", id)
  if (error) return { ok: false, error: error.message }
  await logActivity({ entityType: "tag", entityId: id, action: "deleted", actor: user.email })
  revalidatePath("/admin/tags")
  return { ok: true, error: null }
}

export async function reorderTags(orderedIds: string[]): Promise<ActionResult> {
  await requireAdminSession()
  const supabase = createAdminClient()
  const results = await Promise.all(
    orderedIds.map((id, index) => supabase.from("tags").update({ sort_order: index }).eq("id", id))
  )
  const failed = results.find((r) => r.error)
  if (failed?.error) return { ok: false, error: failed.error.message }
  revalidatePath("/admin/tags")
  return { ok: true, error: null }
}

function nullableString(value: FormDataEntryValue | null): string | null {
  const s = String(value ?? "").trim()
  return s.length ? s : null
}
