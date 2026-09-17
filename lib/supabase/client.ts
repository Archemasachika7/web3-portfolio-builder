"use client"

import { createBrowserClient } from "@supabase/ssr"

/**
 * Browser client — anon key only, RLS-scoped to public/published reads.
 * The admin UI never mutates data through this client; all writes go
 * through Server Actions using the service-role client instead.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
