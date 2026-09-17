import "server-only"
import { createAdminClient } from "@/lib/supabase/admin"
import type { Tag } from "@/shared/database.types"

/** Every tag, for admin multi-select pickers (not filtered to published — the admin needs to see and manage everything). */
export async function listAllTags(): Promise<Tag[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("tags")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true })
  if (error) {
    console.error("listAllTags", error.message)
    return []
  }
  return data as Tag[]
}
