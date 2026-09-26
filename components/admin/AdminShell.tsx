"use client"

import { useState } from "react"
import { usePathname } from "next/navigation"
import Sidebar from "./Sidebar"
import Topbar from "./Topbar"
import PageHeader from "./PageHeader"
import RouteProgress from "./RouteProgress"
import UpdateNotice from "./UpdateNotice"
import { ToastProvider } from "./Toast"
import { metaForPathname } from "./nav"
import styles from "./AdminShell.module.css"

export default function AdminShell({
  userEmail,
  children
}: {
  userEmail: string | null
  children: React.ReactNode
}) {
  return (
    <ShellFrame pathname={usePathname()} userEmail={userEmail}>
      {children}
    </ShellFrame>
  )
}

/** The shell itself, driven entirely by props. */
export function ShellFrame({
  pathname,
  userEmail,
  children
}: {
  pathname: string
  userEmail: string | null
  children: React.ReactNode
}) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const meta = metaForPathname(pathname)
  const header = meta.item && !meta.item.ownHeader && !meta.nested

  return (
    <ToastProvider>
      <div className={styles.shell}>
        <div className={styles.sidebarSlot} data-open={drawerOpen ? "true" : "false"}>
          <Sidebar pathname={pathname} onNavigate={() => setDrawerOpen(false)} />
        </div>
        <button
          type="button"
          className={styles.scrim}
          data-open={drawerOpen ? "true" : "false"}
          aria-label="Close navigation"
          tabIndex={drawerOpen ? 0 : -1}
          onClick={() => setDrawerOpen(false)}
        />
        <div className={styles.main}>
          <Topbar pathname={pathname} userEmail={userEmail} onMenuClick={() => setDrawerOpen((v) => !v)} />
          <RouteProgress pathname={pathname} />
          <UpdateNotice />
          <main key={pathname} className={`${styles.content} page-enter`}>
            {header && meta.item && (
              <PageHeader eyebrow={meta.group} title={meta.item.label} description={meta.item.description} />
            )}
            {children}
          </main>
        </div>
      </div>
    </ToastProvider>
  )
}
