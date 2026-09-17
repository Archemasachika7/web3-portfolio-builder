import "server-only"
import { createAdminClient } from "@/lib/supabase/admin"

export interface DashboardCounts {
  projects: { published: number; draft: number }
  reports: number
  resumes: { current: number; archived: number }
  certificates: { published: number; draft: number }
  homepageMedia: { configured: number; missing: number }
  tags: number
  education: number
  experience: number
  achievements: number
}

export interface RecentItem {
  id: string
  label: string
  meta: string
  href: string
}

const HOMEPAGE_SECTIONS = [
  "hero",
  "domains",
  "career-branches",
  "engineering",
  "data",
  "analytics",
  "leadership",
  "methodology",
  "integrated",
  "closing"
]

/** Every count here is a real Supabase query — nothing is fabricated. */
export async function getDashboardCounts(): Promise<DashboardCounts> {
  const supabase = createAdminClient()

  const [
    projectsRes,
    reportsRes,
    resumesRes,
    certificatesRes,
    homepageMediaRes,
    tagsRes,
    educationRes,
    experienceRes,
    achievementsRes
  ] = await Promise.all([
    supabase.from("projects").select("published"),
    supabase.from("reports").select("id", { count: "exact", head: true }),
    supabase.from("resumes").select("is_current"),
    supabase.from("certificates").select("published"),
    supabase.from("homepage_media").select("section_key"),
    supabase.from("tags").select("id", { count: "exact", head: true }),
    supabase.from("education").select("id", { count: "exact", head: true }),
    supabase.from("experience").select("id", { count: "exact", head: true }),
    supabase.from("achievements").select("id", { count: "exact", head: true })
  ])

  const projects = projectsRes.data ?? []
  const resumes = resumesRes.data ?? []
  const certificates = certificatesRes.data ?? []
  const configuredSections = new Set((homepageMediaRes.data ?? []).map((r) => r.section_key))

  return {
    projects: {
      published: projects.filter((p) => p.published).length,
      draft: projects.filter((p) => !p.published).length
    },
    reports: reportsRes.count ?? 0,
    resumes: {
      current: resumes.filter((r) => r.is_current).length,
      archived: resumes.filter((r) => !r.is_current).length
    },
    certificates: {
      published: certificates.filter((c) => c.published).length,
      draft: certificates.filter((c) => !c.published).length
    },
    homepageMedia: {
      configured: configuredSections.size,
      missing: HOMEPAGE_SECTIONS.filter((s) => !configuredSections.has(s)).length
    },
    tags: tagsRes.count ?? 0,
    education: educationRes.count ?? 0,
    experience: experienceRes.count ?? 0,
    achievements: achievementsRes.count ?? 0
  }
}

export async function getRecentProjects(limit = 5): Promise<RecentItem[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("projects")
    .select("id, title, slug, published, updated_at")
    .order("updated_at", { ascending: false })
    .limit(limit)

  if (error || !data) return []

  return data.map((p) => ({
    id: p.id,
    label: p.title,
    meta: `${p.published ? "Published" : "Draft"} · updated ${new Date(p.updated_at).toLocaleDateString()}`,
    href: `/admin/projects/${p.id}`
  }))
}

export interface MissingFieldWarning {
  entity: string
  label: string
  missing: string[]
  href: string
}

/** Draft projects that are close to publishable but missing something — surfaced on the dashboard so nothing silently stalls. */
export async function getDraftProjectWarnings(limit = 5): Promise<MissingFieldWarning[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("projects")
    .select("id, title, short_bio, thumbnail_path, project_url, project_tags(tag_id), reports(published)")
    .eq("published", false)
    .order("updated_at", { ascending: false })
    .limit(limit)

  if (error || !data) return []

  return data
    .map((p) => {
      const missing: string[] = []
      if (!p.title) missing.push("Title")
      if (!p.short_bio) missing.push("Short bio")
      if (!p.thumbnail_path) missing.push("Thumbnail")
      if (!p.project_url) missing.push("Project URL")
      if (!p.project_tags || (p.project_tags as unknown[]).length === 0) missing.push("Tags")
      const hasPublishedReport = (p.reports as { published: boolean }[] | null)?.some(
        (r) => r.published
      )
      if (!hasPublishedReport) missing.push("Published report")

      return {
        entity: "project",
        label: p.title || "Untitled project",
        missing,
        href: `/admin/projects/${p.id}`
      }
    })
    .filter((w) => w.missing.length > 0)
}
