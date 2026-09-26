import type { Metadata } from "next"
import { THEME_BOOT } from "@/lib/theme"
import "./globals.css"

export const metadata: Metadata = {
  title: "Portfolio Admin",
  description: "Content management for the Archishman Das portfolio."
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // The boot script sets data-theme before hydration, so React is told
    // not to treat that attribute as a mismatch.
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT }} />
      </head>
      <body>{children}</body>
    </html>
  )
}
