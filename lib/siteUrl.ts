/**
 * The live public portfolio this admin publishes to. NEXT_PUBLIC_SITE_URL
 * overrides it per-environment; the fallback keeps every "Preview" link
 * working even when that variable isn't set on the deployment.
 */
export const PUBLIC_SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "") || "https://3dportfolio-gray.vercel.app"

export function publicSiteLink(path = ""): string {
  if (!path) return PUBLIC_SITE_URL
  return `${PUBLIC_SITE_URL}/${path.replace(/^\/+/, "")}`
}
