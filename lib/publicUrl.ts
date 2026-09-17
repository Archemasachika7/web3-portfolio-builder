/**
 * Client-safe public URL builder for the portfolio-public bucket —
 * deterministic from NEXT_PUBLIC_SUPABASE_URL, no Supabase client
 * needed. Use lib/storage.ts's getPublicAssetUrl() instead when you're
 * already server-side.
 */
export function publicAssetUrl(path: string | null | undefined): string | null {
  if (!path) return null
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!base) return null
  return `${base}/storage/v1/object/public/portfolio-public/${path}`
}
