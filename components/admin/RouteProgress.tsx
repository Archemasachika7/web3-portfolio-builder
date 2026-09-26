"use client"

import { useEffect, useState } from "react"
import styles from "./AdminShell.module.css"

/**
 * A hairline progress bar under the topbar while a navigation is in
 * flight. Every admin page is server-rendered on demand, so without it a
 * click can look ignored for a moment; this acknowledges it instantly.
 * Starts on any same-origin /admin link click, finishes when the pathname
 * changes.
 */
export default function RouteProgress({ pathname }: { pathname: string }) {
  const [state, setState] = useState<"idle" | "loading" | "done">("idle")

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      const a = (e.target as Element | null)?.closest?.("a")
      if (!a || a.target === "_blank" || a.hasAttribute("download")) return
      const url = new URL(a.href, location.href)
      if (url.origin !== location.origin || !url.pathname.startsWith("/admin")) return
      if (url.pathname === location.pathname) return
      setState("loading")
    }
    document.addEventListener("click", onClick)
    return () => document.removeEventListener("click", onClick)
  }, [])

  useEffect(() => {
    setState((s) => (s === "loading" ? "done" : s))
  }, [pathname])

  useEffect(() => {
    if (state !== "done") return
    const t = setTimeout(() => setState("idle"), 420)
    return () => clearTimeout(t)
  }, [state])

  return <span className={styles.progress} data-state={state} aria-hidden="true" />
}
