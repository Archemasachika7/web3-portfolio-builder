/**
 * Shown instead of the admin when Supabase isn't configured, so a missing
 * environment variable reads as a setup step rather than a blank crash.
 */
export default function ConfigError({ missing }: { missing: string[] }) {
  return (
    <main className="config-error">
      <div className="card config-error-card">
        <span className="eyebrow">Setup needed</span>
        <h1 className="page-title">The admin can&rsquo;t reach Supabase yet</h1>
        <p>These environment variables aren&rsquo;t set for this deployment:</p>
        <ul>
          {missing.map((name) => (
            <li key={name}>
              <code>{name}</code>
            </li>
          ))}
        </ul>
        <p>
          On Vercel: <strong>Project → Settings → Environment Variables</strong>, add them for Production and Preview,
          then redeploy. Locally: put them in <code>.env.local</code> and restart the dev server. The values are in
          Supabase → Project Settings → API Keys.
        </p>
      </div>
    </main>
  )
}
