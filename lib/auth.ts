import "server-only"
import { cache } from "react"
import { redirect } from "next/navigation"
import { createClient } from "./supabase/server"

export type AdminUser = { id: string; email: string | null }

/**
 * The signed-in user, verified with Supabase Auth. getClaims checks the
 * session's JWT against the project's signing keys (cached), so most saves
 * skip the extra round trip to the Auth server that getUser makes; projects
 * still on a shared JWT secret fall back to that request inside getClaims.
 * Cached per request, so the layout, the page and any data helpers share it.
 */
const getVerifiedUser = cache(async (): Promise<AdminUser | null> => {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getClaims()
  const claims = data?.claims
  if (error || !claims?.sub) return null
  return { id: claims.sub, email: typeof claims.email === "string" ? claims.email : null }
})

/**
 * Call at the top of every protected layout, page helper and Server
 * Action. Server Actions are public endpoints, so each one must check
 * the session itself — middleware alone doesn't protect them.
 */
export async function requireAdminSession() {
  const user = await getVerifiedUser()
  if (!user) redirect("/admin/login")
  return user
}
