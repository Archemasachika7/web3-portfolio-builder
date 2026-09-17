/**
 * Canonical types for the shared Supabase schema. This file starts as a
 * copy of 3dportfolio/shared/database.types.ts, extended with the
 * columns and tables this admin app added. Keep both repos' copies in
 * sync by hand until one is regenerated via
 * `supabase gen types typescript --project-id <ref>` and adopted as the
 * single source of truth for both repos.
 */

export type UUID = string

export interface OtherLink {
  label: string
  url: string
}

export interface Profile {
  id: UUID
  name: string
  headline: string | null
  short_bio: string | null
  long_bio: string | null
  profile_image_path: string | null
  current_cgpa: string | null
  current_status: string | null
  email: string | null
  published: boolean
  // Added by 20260917230000_extend_profiles.sql
  display_name: string | null
  location: string | null
  phone: string | null
  show_phone: boolean
  website_url: string | null
  github_url: string | null
  linkedin_url: string | null
  instagram_url: string | null
  other_links: OtherLink[]
  availability_status: string | null
  current_role_title: string | null
  current_company: string | null
  primary_domain: string | null
  secondary_domains: string[]
  resume_id: UUID | null
  featured_profile: boolean
  created_at: string
  updated_at: string
}

export interface Education {
  id: UUID
  institution: string
  degree: string | null
  field: string | null
  start_year: number | null
  end_year: number | null
  cgpa: string | null
  description: string | null
  sort_order: number
  published: boolean
  // Added by 20260917230100_extend_education.sql
  program: string | null
  location: string | null
  is_current: boolean
  grade: string | null
  score: string | null
  rank: string | null
  logo_path: string | null
  website_url: string | null
  created_at: string
  updated_at: string
}

export interface Achievement {
  id: UUID
  title: string
  value: string | null
  description: string | null
  year: number | null
  link: string | null
  published: boolean
  sort_order: number
  // Added by 20260917230200_extend_achievements.sql
  organization: string | null
  category: string | null
  credential_url: string | null
  certificate_id: string | null
  image_path: string | null
  created_at: string
  updated_at: string
}

export interface Tag {
  id: UUID
  name: string
  slug: string
  type: string | null
  description: string | null
  // Added by 20260917230300_extend_tags.sql
  published: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export interface Project {
  id: UUID
  title: string
  slug: string
  short_bio: string | null
  long_description: string | null
  year: number | null
  role: string | null
  status: string
  thumbnail_path: string | null
  hero_media_path: string | null
  project_url: string | null
  github_url: string | null
  live_url: string | null
  documentation_url: string | null
  featured: boolean
  published: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export type ProjectMediaType = "screenshot" | "diagram" | "model" | "video" | "other"

export interface ProjectMedia {
  id: UUID
  project_id: UUID
  media_type: ProjectMediaType
  storage_path: string
  poster_path: string | null
  alt_text: string | null
  caption: string | null
  display_order: number
  featured: boolean
  motion_type: string | null
  created_at: string
  updated_at: string
}

export interface Report {
  id: UUID
  project_id: UUID
  title: string
  file_path: string
  file_type: string
  file_size: number | null
  description: string | null
  published: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export interface Resume {
  id: UUID
  title: string
  slug: string
  description: string | null
  file_path: string
  version: number
  priority: number
  is_current: boolean
  published: boolean
  created_at: string
  updated_at: string
}

export type HomepageMediaType = "image" | "video"

export interface HomepageMedia {
  id: UUID
  section_key: string
  media_type: HomepageMediaType
  storage_path: string | null
  poster_path: string | null
  mobile_storage_path: string | null
  alt_text: string | null
  motion_type: string | null
  enabled: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export type DomainNodeLevel = "primary" | "lens"

export interface DomainNode {
  id: UUID
  slug: string
  label: string
  level: DomainNodeLevel
  description: string | null
  sort_order: number
  published: boolean
  created_at: string
  updated_at: string
}

// New tables added by this admin build --------------------------------

export interface Experience {
  id: UUID
  organization: string
  role: string
  employment_type: string | null
  location: string | null
  start_date: string | null
  end_date: string | null
  is_current: boolean
  short_description: string | null
  long_description: string | null
  website_url: string | null
  logo_path: string | null
  published: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export interface Certificate {
  id: UUID
  title: string
  issuer: string
  credential_name: string | null
  issue_date: string | null
  expiry_date: string | null
  credential_id: string | null
  credential_url: string | null
  certificate_file_path: string | null
  thumbnail_path: string | null
  description: string | null
  published: boolean
  featured: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export interface SocialLink {
  id: UUID
  platform: string
  label: string
  url: string
  icon_key: string | null
  enabled: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export interface SiteSettings {
  id: UUID
  site_title: string | null
  site_description: string | null
  favicon_path: string | null
  default_og_image_path: string | null
  contact_email: string | null
  footer_text: string | null
  copyright_text: string | null
  availability_text: string | null
  primary_location: string | null
  maintenance_mode: boolean
  created_at: string
  updated_at: string
}

export type ActivityAction =
  | "created"
  | "updated"
  | "published"
  | "unpublished"
  | "deleted"
  | "uploaded"

export interface ActivityLogEntry {
  id: UUID
  entity_type: string
  entity_id: UUID | null
  action: ActivityAction
  actor: string | null
  detail: string | null
  created_at: string
}

// Join-table rows ------------------------------------------------------

export interface ProjectTag {
  project_id: UUID
  tag_id: UUID
}

export interface ResumeTag {
  resume_id: UUID
  tag_id: UUID
}

export interface AchievementTag {
  achievement_id: UUID
  tag_id: UUID
}

export interface DomainNodeTag {
  domain_node_id: UUID
  tag_id: UUID
}

export interface ExperienceTag {
  experience_id: UUID
  tag_id: UUID
}

export interface CertificateTag {
  certificate_id: UUID
  tag_id: UUID
}

// Hydrated shapes --------------------------------------------------------

export interface ProjectWithTags extends Project {
  tags: Tag[]
  reports: Report[]
  media: ProjectMedia[]
}

export interface ResumeWithTags extends Resume {
  tags: Tag[]
}

export interface DomainNodeWithTags extends DomainNode {
  tags: Tag[]
}

export interface ExperienceWithTags extends Experience {
  tags: Tag[]
}

export interface CertificateWithTags extends Certificate {
  tags: Tag[]
}
