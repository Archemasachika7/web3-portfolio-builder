"use client"

import { useEffect } from "react"

/** Catches failures in the admin shell itself (e.g. the session check). */
export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <main className="config-error">
      <div className="card config-error-card" role="alert">
        <span className="eyebrow">Admin unavailable</span>
        <h1 className="page-title">The admin couldn&rsquo;t start</h1>
        <p>
          The server couldn&rsquo;t reach Supabase or check your session. If this just deployed, check the environment
          variables in Vercel and that the Supabase project isn&rsquo;t paused.
        </p>
        {error.digest && <p className="page-error-digest">Reference: {error.digest}</p>}
        <div className="page-error-actions">
          <button type="button" className="btn btn-primary" onClick={reset}>
            Try again
          </button>
          <a className="btn" href="/admin/login">
            Go to sign in
          </a>
        </div>
      </div>
    </main>
  )
}
