/**
 * Calls a Server Action from a click handler and always comes back with
 * `{ ok, error }`. A thrown error (network drop, server crash, a deploy
 * mid-session) becomes a readable message instead of an unhandled
 * rejection that leaves a button stuck on "Saving…".
 */

export type ActionOutcome = { ok: boolean; error: string | null }

function isNextControlFlow(e: unknown): boolean {
  const digest = (e as { digest?: unknown } | null)?.digest
  return typeof digest === "string" && (digest.startsWith("NEXT_REDIRECT") || digest === "NEXT_NOT_FOUND")
}

export async function callAction<T extends ActionOutcome>(fn: () => Promise<T>): Promise<T | { ok: false; error: string }> {
  try {
    const result = await fn()
    if (!result || typeof result !== "object") {
      return { ok: false, error: "No response from the server. Your session may have expired — reload the page." }
    }
    return result
  } catch (e) {
    // Let Next handle redirects (e.g. an expired session sending you to login).
    if (isNextControlFlow(e)) throw e
    console.error(e)
    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      return { ok: false, error: "You're offline. Reconnect and try again." }
    }
    const message = e instanceof Error ? e.message : ""
    // A tab opened before a deploy calls actions the new build no longer has.
    if (/server action/i.test(message) && /find|not found/i.test(message)) {
      return { ok: false, error: "The admin was updated since this page was opened. Reload the page and try again." }
    }
    if (/fetch|network|load failed/i.test(message)) {
      return { ok: false, error: "Couldn't reach the server. Check your connection and try again." }
    }
    return { ok: false, error: "Something went wrong on the server. Try again, or reload the page if it keeps happening." }
  }
}
