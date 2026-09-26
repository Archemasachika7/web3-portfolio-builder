import "server-only"
import { revalidatePath as revalidateAdminPath } from "next/cache"
import { waitUntil } from "@vercel/functions"
import { createClient } from "./supabase/server"
import { PUBLIC_SITE_URL } from "./siteUrl"

/**
 * Drop-in for next/cache's revalidatePath in admin actions: refreshes the
 * admin page and also tells the public portfolio to rebuild its cached
 * pages, so a save shows up on the site right away instead of after its
 * 60-second cache runs out.
 *
 * The site ping authenticates with the admin's own session token (the site
 * checks it with Supabase), runs after the response is sent, and never
 * fails the save — if it's missed, the site still refreshes within a minute.
 */
export function revalidatePath(path: string, type?: "layout" | "page") {
  revalidateAdminPath(path, type)
  pingSite()
}

// A ping that hasn't been sent yet covers every change made before it goes
// out, so several revalidatePath calls in one action send a single request.
let queued = false

function pingSite() {
  if (queued) return
  queued = true
  const task = (async () => {
    let token: string | undefined
    try {
      const supabase = await createClient()
      token = (await supabase.auth.getSession()).data.session?.access_token
    } finally {
      queued = false
    }
    if (!token) return
    const res = await fetch(`${PUBLIC_SITE_URL}/api/revalidate`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
      signal: AbortSignal.timeout(5000)
    })
    if (!res.ok) console.warn("site refresh", res.status)
  })().catch((e) => console.warn("site refresh", e instanceof Error ? e.message : e))
  waitUntil(task)
}
