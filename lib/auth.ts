import { redirect } from "next/navigation"
import { createClient } from "./supabase/server"
import type { User } from "@supabase/supabase-js"

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

/**
 * Route Handler equivalent of requireAdminSession() — redirect() is
 * meant for page rendering and doesn't produce a sane response from an
 * API route, so this returns null instead of throwing/redirecting and
 * lets the caller respond with a normal 401.
 */
export async function getAdminUserForApi(): Promise<User | null> {
  const supabase = await createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()
  return user
}
