import "server-only"
import { waitUntil } from "@vercel/functions"
import { createAdminClient } from "./supabase/admin"
import type { ActivityAction } from "@/shared/database.types"

/**
 * Records an entry in the activity log. The insert runs in the background
 * (kept alive past the response with waitUntil), so saving doesn't wait on
 * a second database write.
 */
export async function logActivity(params: {
  entityType: string
  entityId?: string | null
  action: ActivityAction
  actor?: string | null
  detail?: string | null
}) {
  const task = (async () => {
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
  })().catch((e) => console.error("logActivity", e))
  waitUntil(task)
}
