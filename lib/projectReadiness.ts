/**
 * What a project still needs before it can be published. Same rules as
 * the database's enforce_project_publish_requirements trigger; shared by
 * the list, the editor banner and the publish action so they never drift.
 * Client-safe (no server imports).
 */
export function missingRequirements(p: {
  title: string | null
  short_bio: string | null
  thumbnail_path: string | null
  project_url: string | null
  tagCount: number
  publishedReportCount: number
}): string[] {
  const missing: string[] = []
  if (!p.title?.trim()) missing.push("Title")
  if (!p.short_bio?.trim()) missing.push("Short bio")
  if (!p.thumbnail_path) missing.push("Thumbnail")
  if (!p.project_url?.trim()) missing.push("Project link")
  if (p.tagCount === 0) missing.push("Tags")
  if (p.publishedReportCount === 0) missing.push("Published report")
  return missing
}
