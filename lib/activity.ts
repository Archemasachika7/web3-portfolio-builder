import "server-only"
import { createAdminClient } from "./supabase/admin"
import type { ActivityAction } from "@/shared/database.types"

export async function logActivity(params: {
  entityType: string
  entityId?: string | null
  action: ActivityAction
  actor?: string | null
  detail?: string | null
}) {
  const supabase = createAdminClient()
  const { error } = await supabase.from("activity_log").insert({
    entity_type: params.entityType,
    entity_id: params.entityId ?? null,
    action: params.action,
    actor: params.actor ?? null,
    detail: params.detail ?? null
  })
  if (error) {
    // Never let a logging failure block the actual mutation that
    // triggered it — surface it in server logs only.
    console.error("logActivity", error.message)
  }
}
