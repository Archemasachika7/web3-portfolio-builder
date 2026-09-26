/**
 * Admin theme. Light is the default for everyone, whatever the OS setting;
 * dark is an explicit choice from the topbar switch, remembered in
 * localStorage and applied by an inline script before first paint (see
 * app/layout.tsx), so there is never a flash of the wrong theme.
 */

export type Theme = "light" | "dark"

export const THEME_KEY = "admin-theme"

/** Inline, pre-paint. Must stay dependency-free. */
export const THEME_BOOT =
  `(function(){try{var t=localStorage.getItem('${THEME_KEY}');` +
  `if(t==='dark'||t==='light')document.documentElement.dataset.theme=t;}catch(e){}})()`

export function getTheme(): Theme {
  if (typeof document === "undefined") return "light"
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light"
}

export function setTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme
  try {
    localStorage.setItem(THEME_KEY, theme)
  } catch {
    // Private mode / blocked storage: the choice just won't persist.
  }
  window.dispatchEvent(new CustomEvent<Theme>("themechange", { detail: theme }))
}

export function onThemeChange(callback: (theme: Theme) => void) {
  const handler = (e: Event) => callback((e as CustomEvent<Theme>).detail)
  window.addEventListener("themechange", handler)
  return () => window.removeEventListener("themechange", handler)
}
