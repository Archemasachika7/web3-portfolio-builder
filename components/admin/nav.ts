import type { IconName } from "./Icon"

export interface NavItem {
  label: string
  href: string
  icon: IconName
  /** One line shown under the page title. */
  description?: string
  /** The page draws its own header (a custom title, or header actions). */
  ownHeader?: boolean
}

export interface NavGroup {
  /** Section heading shown above the group; omitted for the top-level entry. */
  label?: string
  items: NavItem[]
}

// Grouped exactly per the admin spec's sidebar layout.
export const NAV_GROUPS: NavGroup[] = [
  { items: [{ label: "Dashboard", href: "/admin", icon: "dashboard", ownHeader: true }] },
  {
    label: "Identity",
    items: [
      { label: "Profile", href: "/admin/profile", icon: "profile", description: "Name, headline, photo and the details shown across the site." },
      { label: "Education", href: "/admin/education", icon: "education", description: "Degrees and institutions on the homepage education timeline." },
      { label: "Experience", href: "/admin/experience", icon: "experience", description: "Roles and positions, newest first." },
      { label: "Achievements", href: "/admin/achievements", icon: "achievements", description: "Awards and recognition, tagged by domain." }
    ]
  },
  {
    label: "Work",
    items: [
      { label: "Projects", href: "/admin/projects", icon: "projects", ownHeader: true },
      { label: "Reports / PDFs", href: "/admin/reports", icon: "reports", description: "Technical reports attached to projects." }
    ]
  },
  {
    label: "Documents",
    items: [
      { label: "Resumes", href: "/admin/resumes", icon: "resumes", description: "Resume versions — one per domain, one marked current." },
      { label: "Certificates", href: "/admin/certificates", icon: "certificates", description: "Certificates with their PDFs and preview images." }
    ]
  },
  {
    label: "Site content",
    items: [
      { label: "Homepage Media", href: "/admin/homepage-media", icon: "media", description: "Videos and images for each homepage section." },
      { label: "Tags", href: "/admin/tags", icon: "tags", description: "The shared vocabulary for projects, resumes and achievements." },
      { label: "Domain Nodes", href: "/admin/domain-nodes", icon: "nodes", description: "The domains on the homepage diagram and the career map." }
    ]
  },
  {
    label: "Configuration",
    items: [
      { label: "Social Links", href: "/admin/social-links", icon: "links", description: "Profiles linked from the site." },
      { label: "Site Settings", href: "/admin/settings", icon: "settings", description: "Site-wide defaults and metadata." }
    ]
  },
  {
    label: "System",
    items: [
      { label: "Storage", href: "/admin/storage", icon: "storage", description: "Every uploaded file, and what uses it." },
      { label: "Activity", href: "/admin/activity", icon: "activity", description: "A log of recent changes." }
    ]
  }
]

export interface RouteMeta {
  group?: string
  item?: NavItem
  /** A nested route under the item (e.g. one project in the editor). */
  nested: boolean
}

const isUnder = (pathname: string, href: string) =>
  href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(href + "/")

export function metaForPathname(pathname: string): RouteMeta {
  for (const group of NAV_GROUPS) {
    for (const item of group.items) {
      if (isUnder(pathname, item.href)) {
        return { group: group.label, item, nested: pathname !== item.href }
      }
    }
  }
  return { nested: false }
}

export function titleForPathname(pathname: string): string {
  return metaForPathname(pathname).item?.label ?? "Admin"
}

export { isUnder }
