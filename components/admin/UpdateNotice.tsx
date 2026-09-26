"use client"

import { useEffect, useState } from "react"

const BUILD = process.env.NEXT_PUBLIC_BUILD_VERSION
const CHECK_EVERY_MS = 5 * 60_000

/**
 * A tab opened before a deploy keeps running the old code until it's
 * reloaded, which can look like a fix "didn't work". This checks the
 * deployed version when the tab regains focus (and every few minutes)
 * and asks for a reload once it has changed.
 */
export default function UpdateNotice() {
  const [stale, setStale] = useState(false)

  useEffect(() => {
    if (!BUILD) return
    let stopped = false

    async function check() {
      if (stopped || document.visibilityState !== "visible") return
      try {
        const res = await fetch("/api/version", { cache: "no-store" })
        if (!res.ok) return
        const { version } = (await res.json()) as { version: string | null }
        if (version && version !== BUILD && !stopped) setStale(true)
      } catch {
        // Offline or mid-deploy: try again on the next focus or tick.
      }
    }

    check()
    const timer = setInterval(check, CHECK_EVERY_MS)
    document.addEventListener("visibilitychange", check)
    window.addEventListener("focus", check)
    return () => {
      stopped = true
      clearInterval(timer)
      document.removeEventListener("visibilitychange", check)
      window.removeEventListener("focus", check)
    }
  }, [])

  if (!stale) return null

  return (
    <div className="update-notice" role="status">
      <span>A new version of the admin is available. Reload to use it — save any open edits first.</span>
      <button type="button" className="btn btn-sm btn-primary" onClick={() => window.location.reload()}>
        Reload
      </button>
    </div>
  )
}
