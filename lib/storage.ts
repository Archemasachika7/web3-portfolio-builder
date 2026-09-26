import "server-only"
import { createAdminClient } from "./supabase/admin"

export const PUBLIC_BUCKET = "portfolio-public"
export const PRIVATE_BUCKET = "portfolio-private"

export function getPublicAssetUrl(path: string | null | undefined): string | null {
  if (!path) return null
  const supabase = createAdminClient()
  const { data } = supabase.storage.from(PUBLIC_BUCKET).getPublicUrl(path)
  return data?.publicUrl ?? null
}

/**
 * Best-effort delete. Callers use this to clean up a file whose row is
 * already gone, so a failure is logged rather than surfaced — the object
 * stays visible (and removable) on the Storage page.
 */
export async function deleteAsset(
  path: string,
  bucket: string = PUBLIC_BUCKET
): Promise<{ error: string | null }> {
  const supabase = createAdminClient()
  const { error } = await supabase.storage.from(bucket).remove([path])
  if (error) {
    console.error("deleteAsset", error.message)
    return { error: "Storage delete failed." }
  }
  return { error: null }
}
