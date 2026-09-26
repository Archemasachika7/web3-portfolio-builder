/**
 * Minimal line icons for the admin — one stroke weight, drawn on a 24px
 * grid, coloured by currentColor. Decorative: always aria-hidden.
 */

const PATHS = {
  dashboard: "M4 4h7v7H4zM13 4h7v4h-7zM13 10h7v10h-7zM4 13h7v7H4z",
  profile: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 20c1.4-3.6 4.4-5.6 8-5.6s6.6 2 8 5.6",
  education: "M2 9l10-5 10 5-10 5zM6 11v5c2.5 2.2 9.5 2.2 12 0v-5M22 9v6",
  experience: "M4 7h16a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1zM9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M3 13h18",
  achievements: "M12 3l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.4l-5.2 2.7 1-5.8L3.5 9.2l5.9-.9z",
  projects: "M12 3l9 5-9 5-9-5zM3 12.5l9 5 9-5M3 17l9 5 9-5",
  reports: "M6 3h9l4 4v14H6zM15 3v4h4M9 12h7M9 16h7",
  resumes: "M6 3h12v18H6zM9 8h6M9 12h6M9 16h4",
  certificates: "M12 14a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM8.6 12.8L7 21l5-3 5 3-1.6-8.2",
  media: "M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zM8.5 11.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM21 16l-5-5-9 8",
  tags: "M3 12V4h8l10 10-8 8zM7.5 8.7a1.2 1.2 0 1 0 0-2.4 1.2 1.2 0 0 0 0 2.4z",
  nodes: "M12 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM5 21a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM19 21a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM12 7v5M12 12l-5.6 5.4M12 12l5.6 5.4",
  links: "M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1",
  settings: "M4 6h9M17 6h3M4 12h3M11 12h9M4 18h11M19 18h1M15 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM9 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM17 20a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
  storage: "M12 8c4.4 0 8-1.3 8-3s-3.6-3-8-3-8 1.3-8 3 3.6 3 8 3zM4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3",
  activity: "M3 12h4l3-8 4 16 3-8h4",
  external: "M7 17L17 7M9 7h8v8",
  logout: "M15 4h4v16h-4M10 16l4-4-4-4M14 12H3",
  menu: "M4 7h16M4 12h16M4 17h16",
  plus: "M12 5v14M5 12h14",
  chevron: "M6 9l6 6 6-6",
  upload: "M12 16V4M7 9l5-5 5 5M4 20h16",
  arrow: "M5 12h14M13 6l6 6-6 6"
} as const

export type IconName = keyof typeof PATHS

export default function Icon({ name, size = 18, className }: { name: IconName; size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <path d={PATHS[name]} />
    </svg>
  )
}
