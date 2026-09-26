"use client"

import { useEffect, useState } from "react"
import { getTheme, onThemeChange, setTheme } from "@/lib/theme"
import styles from "./ThemeToggle.module.css"

/**
 * Light / dark switch, the same control as on the public site. The visible
 * state comes from CSS on <html data-theme>, so the server render is right
 * for either theme. Switching wipes the new theme in from the top (View
 * Transitions); unsupported browsers and reduced motion switch instantly.
 */
export default function ThemeToggle() {
  const [dark, setDark] = useState(false)

  useEffect(() => {
    setDark(getTheme() === "dark")
    return onThemeChange((t) => setDark(t === "dark"))
  }, [])

  function toggle() {
    const next = getTheme() === "dark" ? "light" : "dark"
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const doc = document as Document & { startViewTransition?: (cb: () => void) => { ready: Promise<void> } }
    if (!doc.startViewTransition || reduce) {
      setTheme(next)
      return
    }
    doc
      .startViewTransition(() => setTheme(next))
      .ready.then(() =>
        document.documentElement.animate(
          { clipPath: ["inset(0 0 100% 0)", "inset(0 0 0% 0)"] },
          { duration: 600, easing: "cubic-bezier(0.65, 0, 0.08, 1)", pseudoElement: "::view-transition-new(root)" }
        )
      )
      .catch(() => {})
  }

  return (
    <button type="button" className={styles.toggle} onClick={toggle} aria-label="Dark theme" aria-pressed={dark}>
      <span className={styles.track} aria-hidden="true">
        <span className={styles.knob} />
      </span>
      <span className={styles.label} aria-hidden="true">
        <span className={styles.light}>Light</span>
        <span className={styles.dark}>Dark</span>
      </span>
    </button>
  )
}
