export interface NavItem {
  label: string
  href: string
}

export interface NavGroup {
  items: NavItem[]
}

// Grouped exactly per the admin spec's sidebar layout.
export const NAV_GROUPS: NavGroup[] = [
  { items: [{ label: "Dashboard", href: "/admin" }] },
  {
    items: [
      { label: "Profile", href: "/admin/profile" },
      { label: "Education", href: "/admin/education" },
      { label: "Experience", href: "/admin/experience" },
      { label: "Achievements", href: "/admin/achievements" }
    ]
  },
  {
    items: [
      { label: "Projects", href: "/admin/projects" },
      { label: "Reports / PDFs", href: "/admin/reports" }
    ]
  },
  {
    items: [
      { label: "Resumes", href: "/admin/resumes" },
      { label: "Certificates", href: "/admin/certificates" }
    ]
  },
  {
    items: [
      { label: "Homepage Media", href: "/admin/homepage-media" },
      { label: "Tags", href: "/admin/tags" },
      { label: "Domain Nodes", href: "/admin/domain-nodes" }
    ]
  },
  {
    items: [
      { label: "Social Links", href: "/admin/social-links" },
      { label: "Site Settings", href: "/admin/settings" }
    ]
  },
  { items: [{ label: "Storage", href: "/admin/storage" }] },
  { items: [{ label: "Activity", href: "/admin/activity" }] }
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
