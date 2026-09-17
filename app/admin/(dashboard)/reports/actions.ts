"use server"

import { revalidatePath } from "next/cache"
import { createAdminClient } from "@/lib/supabase/admin"
import { requireAdminSession } from "@/lib/auth"
import { deleteAsset } from "@/lib/storage"
import { logActivity } from "@/lib/activity"
import type { Report } from "@/shared/database.types"

export interface ActionResult {
  ok: boolean
  error: string | null
}

export interface ReportWithProject extends Report {
  project_title: string | null
}

export async function listAllReports(): Promise<ReportWithProject[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("reports")
    .select("*, projects(title)")
    .order("created_at", { ascending: false })
  if (error) {
    console.error("listAllReports", error.message)
    return []
  }
  return data.map((r) => ({
    ...(r as unknown as Report),
    project_title: (r.projects as { title: string } | null)?.title ?? null
  }))
}

export async function toggleReportPublished(id: string, published: boolean): Promise<ActionResult> {
  await requireAdminSession()
  const supabase = createAdminClient()
  const { error } = await supabase.from("reports").update({ published }).eq("id", id)
  if (error) return { ok: false, error: error.message }
  revalidatePath("/admin/reports")
  return { ok: true, error: null }
}

export async function deleteReport(id: string, filePath: string): Promise<ActionResult> {
  const user = await requireAdminSession()
  const supabase = createAdminClient()
  const { error } = await supabase.from("reports").delete().eq("id", id)
  if (error) return { ok: false, error: error.message }
  if (filePath) await deleteAsset(filePath)
  await logActivity({ entityType: "report", entityId: id, action: "deleted", actor: user.email })
  revalidatePath("/admin/reports")
  return { ok: true, error: null }
}
