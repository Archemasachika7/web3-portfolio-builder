import { redirect } from "next/navigation"
import { createClient } from "./supabase/server"

/**
 * Call at the top of any protected Server Component/layout. Redirects
 * to /admin/login if there's no signed-in Supabase Auth session —
 * belt-and-suspenders alongside middleware.ts, since middleware alone
 * can be bypassed by direct data fetches in some edge cases.
 */
export async function requireAdminSession() {
  const supabase = await createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/admin/login")
  }

  return user
}
