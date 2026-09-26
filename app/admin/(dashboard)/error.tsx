"use client"

import { useEffect } from "react"

/**
 * A failed page keeps the sidebar and topbar, explains what happened and
 * offers a retry — instead of a blank screen or a frozen click.
 */
export default function AdminPageError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="card page-error" role="alert">
      <span className="eyebrow">Couldn&rsquo;t load this page</span>
      <h2 className="page-error-title">Something went wrong talking to Supabase.</h2>
      <p>
        It&rsquo;s usually temporary: a dropped connection, a paused Supabase project, or a deploy that just finished.
        Try again; if it keeps happening, check the project in the Supabase dashboard.
      </p>
      {error.digest && <p className="page-error-digest">Reference: {error.digest}</p>}
      <div className="page-error-actions">
        <button type="button" className="btn btn-primary" onClick={reset}>
          Try again
        </button>
        <button type="button" className="btn" onClick={() => window.location.reload()}>
          Reload page
        </button>
      </div>
    </div>
  )
}
