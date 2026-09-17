"use server"

import { revalidatePath } from "next/cache"
import { createAdminClient } from "@/lib/supabase/admin"
import { requireAdminSession } from "@/lib/auth"
import { logActivity } from "@/lib/activity"
import type { DomainNode, DomainNodeLevel, Tag } from "@/shared/database.types"

export interface ActionResult {
  ok: boolean
  error: string | null
}

export interface DomainNodeWithTags extends DomainNode {
  tags: Tag[]
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

export async function listDomainNodes(): Promise<DomainNodeWithTags[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("domain_nodes")
    .select("*, domain_node_tags(tags(*))")
    .order("level", { ascending: true })
    .order("sort_order", { ascending: true })
  if (error) {
    console.error("listDomainNodes", error.message)
    return []
  }
  return data.map((n) => ({
    ...(n as unknown as DomainNode),
    tags: ((n.domain_node_tags as { tags: Tag }[] | null) ?? []).map((dnt) => dnt.tags)
  }))
}

export async function createDomainNode(formData: FormData): Promise<ActionResult> {
  const user = await requireAdminSession()
  const label = String(formData.get("label") ?? "").trim()
  const level = String(formData.get("level") ?? "primary") as DomainNodeLevel
  if (!label) return { ok: false, error: "Label is required." }

  const supabase = createAdminClient()
  const baseSlug = slugify(label) || "node"
  let slug = baseSlug
  let attempt = 1
  while (true) {
    const { data } = await supabase.from("domain_nodes").select("id").eq("slug", slug).maybeSingle()
    if (!data) break
    attempt += 1
    slug = `${baseSlug}-${attempt}`
  }

  const { count } = await supabase.from("domain_nodes").select("id", { count: "exact", head: true }).eq("level", level)
  const { error } = await supabase
    .from("domain_nodes")
    .insert({ slug, label, level, published: false, sort_order: count ?? 0 })

  if (error) return { ok: false, error: error.message }
  await logActivity({ entityType: "domain_node", action: "created", actor: user.email, detail: label })
  revalidatePath("/admin/domain-nodes")
  return { ok: true, error: null }
}

export async function updateDomainNode(id: string, formData: FormData): Promise<ActionResult> {
  await requireAdminSession()
  const supabase = createAdminClient()

  const payload = {
    slug: String(formData.get("slug") ?? "").trim(),
    label: String(formData.get("label") ?? "").trim(),
    level: String(formData.get("level") ?? "primary") as DomainNodeLevel,
    description: nullableString(formData.get("description")),
    published: formData.get("published") === "on"
  }

  if (!payload.slug || !payload.label) return { ok: false, error: "Slug and label are required." }

  const { error } = await supabase.from("domain_nodes").update(payload).eq("id", id)
  if (error) return { ok: false, error: error.message }

  const tagIds = formData.getAll("tag_ids").map(String)
  await supabase.from("domain_node_tags").delete().eq("domain_node_id", id)
  if (tagIds.length > 0) {
    await supabase.from("domain_node_tags").insert(tagIds.map((tag_id) => ({ domain_node_id: id, tag_id })))
  }

  revalidatePath("/admin/domain-nodes")
  return { ok: true, error: null }
}

export async function deleteDomainNode(id: string): Promise<ActionResult> {
  const user = await requireAdminSession()
  const supabase = createAdminClient()
  const { error } = await supabase.from("domain_nodes").delete().eq("id", id)
  if (error) return { ok: false, error: error.message }
  await logActivity({ entityType: "domain_node", entityId: id, action: "deleted", actor: user.email })
  revalidatePath("/admin/domain-nodes")
  return { ok: true, error: null }
}

export async function reorderDomainNodes(orderedIds: string[]): Promise<ActionResult> {
  await requireAdminSession()
  const supabase = createAdminClient()
  const results = await Promise.all(
    orderedIds.map((id, index) => supabase.from("domain_nodes").update({ sort_order: index }).eq("id", id))
  )
  const failed = results.find((r) => r.error)
  if (failed?.error) return { ok: false, error: failed.error.message }
  revalidatePath("/admin/domain-nodes")
  return { ok: true, error: null }
}

function nullableString(value: FormDataEntryValue | null): string | null {
  const s = String(value ?? "").trim()
  return s.length ? s : null
}
