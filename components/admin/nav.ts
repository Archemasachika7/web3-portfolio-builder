export interface NavItem {
  label: string
  href: string
}

export interface NavGroup {
  /** Section heading shown above the group; omitted for the top-level entry. */
  label?: string
  items: NavItem[]
}

// Grouped exactly per the admin spec's sidebar layout.
export const NAV_GROUPS: NavGroup[] = [
  { items: [{ label: "Dashboard", href: "/admin" }] },
  {
    label: "Identity",
    items: [
      { label: "Profile", href: "/admin/profile" },
      { label: "Education", href: "/admin/education" },
      { label: "Experience", href: "/admin/experience" },
      { label: "Achievements", href: "/admin/achievements" }
    ]
  },
  {
    label: "Work",
    items: [
      { label: "Projects", href: "/admin/projects" },
      { label: "Reports / PDFs", href: "/admin/reports" }
    ]
  },
  {
    label: "Documents",
    items: [
      { label: "Resumes", href: "/admin/resumes" },
      { label: "Certificates", href: "/admin/certificates" }
    ]
  },
  {
    label: "Site content",
    items: [
      { label: "Homepage Media", href: "/admin/homepage-media" },
      { label: "Tags", href: "/admin/tags" },
      { label: "Domain Nodes", href: "/admin/domain-nodes" }
    ]
  },
  {
    label: "Configuration",
    items: [
      { label: "Social Links", href: "/admin/social-links" },
      { label: "Site Settings", href: "/admin/settings" }
    ]
  },
  {
    label: "System",
    items: [
      { label: "Storage", href: "/admin/storage" },
      { label: "Activity", href: "/admin/activity" }
    ]
  }
]

export function titleForPathname(pathname: string): string {
  for (const group of NAV_GROUPS) {
    for (const item of group.items) {
      if (pathname === item.href || pathname.startsWith(item.href + "/")) {
        return item.label
      }
    }
  }
  return "Admin"
}
