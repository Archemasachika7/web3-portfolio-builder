import "server-only"
import { cache } from "react"
import { redirect } from "next/navigation"
import { createClient } from "./supabase/server"

/**
 * The signed-in user, verified with Supabase Auth. Cached per request, so
 * the layout, the page and any data helpers share one round trip instead
 * of each asking Supabase again.
 */
const getVerifiedUser = cache(async () => {
  const supabase = await createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()
  return user
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
