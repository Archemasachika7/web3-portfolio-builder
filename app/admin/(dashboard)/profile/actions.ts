"use server"

import { revalidatePath } from "next/cache"
import { createAdminClient } from "@/lib/supabase/admin"
import { uploadAsset, deleteAsset, IMAGE_TYPES } from "@/lib/storage"
import { logActivity } from "@/lib/activity"
import { requireAdminSession } from "@/lib/auth"
import type { Profile } from "@/shared/database.types"

export interface ActionResult {
  ok: boolean
  error: string | null
}

export async function getProfile(): Promise<Profile | null> {
  const supabase = createAdminClient()
  const { data, error } = await supabase.from("profiles").select("*").limit(1).maybeSingle()
  if (error) {
    console.error("getProfile (admin)", error.message)
    return null
  }
  return data as Profile | null
}

export async function saveProfile(formData: FormData): Promise<ActionResult> {
  const user = await requireAdminSession()
  const supabase = createAdminClient()

  const id = String(formData.get("id") ?? "")

  const otherLinksRaw = String(formData.get("other_links") ?? "[]")
  let otherLinks: unknown
  try {
    otherLinks = JSON.parse(otherLinksRaw)
  } catch {
    otherLinks = []
  }

  const secondaryDomains = String(formData.get("secondary_domains") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)

  const payload = {
    name: String(formData.get("name") ?? "").trim(),
    display_name: nullableString(formData.get("display_name")),
    headline: nullableString(formData.get("headline")),
    short_bio: nullableString(formData.get("short_bio")),
    long_bio: nullableString(formData.get("long_bio")),
    location: nullableString(formData.get("location")),
    email: nullableString(formData.get("email")),
    phone: nullableString(formData.get("phone")),
    show_phone: formData.get("show_phone") === "on",
    website_url: nullableString(formData.get("website_url")),
    github_url: nullableString(formData.get("github_url")),
    linkedin_url: nullableString(formData.get("linkedin_url")),
    instagram_url: nullableString(formData.get("instagram_url")),
    other_links: otherLinks,
    availability_status: nullableString(formData.get("availability_status")),
    current_role_title: nullableString(formData.get("current_role_title")),
    current_company: nullableString(formData.get("current_company")),
    primary_domain: nullableString(formData.get("primary_domain")),
    secondary_domains: secondaryDomains,
    featured_profile: formData.get("featured_profile") === "on",
    published: formData.get("published") === "on"
  }

  if (!payload.name) {
    return { ok: false, error: "Full name is required." }
  }

  const { error } = id
    ? await supabase.from("profiles").update(payload).eq("id", id)
    : await supabase.from("profiles").insert(payload)

  if (error) {
    console.error("saveProfile", error.message)
    return { ok: false, error: "Save failed. Check server logs." }
  }

  await logActivity({
    entityType: "profile",
    entityId: id || null,
    action: id ? "updated" : "created",
    actor: user.email
  })

  revalidatePath("/admin/profile")
  return { ok: true, error: null }
}

export async function uploadProfilePicture(
  profileId: string,
  previousPath: string | null,
  file: File
): Promise<{ path: string | null; error: string | null }> {
  await requireAdminSession()

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "webp"
  const result = await uploadAsset({
    file,
    folder: "PROFILE",
    allowedTypes: IMAGE_TYPES,
    filenameOverride: `profile-picture.${ext}`
  })

  if (result.error || !result.path) {
    return { path: null, error: result.error }
  }

  const supabase = createAdminClient()
  const { error } = await supabase
    .from("profiles")
    .update({ profile_image_path: result.path })
    .eq("id", profileId)

  if (error) {
    console.error("uploadProfilePicture db update", error.message)
    return { path: null, error: "Uploaded, but saving the new path failed. Try again." }
  }

  if (previousPath && previousPath !== result.path) {
    await deleteAsset(previousPath)
  }

  await logActivity({ entityType: "profile", entityId: profileId, action: "uploaded", detail: "profile picture" })
  revalidatePath("/admin/profile")
  return { path: result.path, error: null }
}

function nullableString(value: FormDataEntryValue | null): string | null {
  const s = String(value ?? "").trim()
  return s.length ? s : null
}
