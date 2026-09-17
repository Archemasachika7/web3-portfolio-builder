"use client"

import { useState } from "react"
import Sidebar from "./Sidebar"
import Topbar from "./Topbar"
import { ToastProvider } from "./Toast"
import styles from "./AdminShell.module.css"

export default function AdminShell({
  userEmail,
  children
}: {
  userEmail: string | null
  children: React.ReactNode
}) {
  const [drawerOpen, setDrawerOpen] = useState(false)

  return (
    <ToastProvider>
      <div className={styles.shell}>
        <div className={styles.sidebarSlot} data-open={drawerOpen ? "true" : "false"}>
          <Sidebar onNavigate={() => setDrawerOpen(false)} />
        </div>
        {drawerOpen && (
          <button
            type="button"
            className={styles.scrim}
            aria-label="Close navigation"
            onClick={() => setDrawerOpen(false)}
          />
        )}
        <div className={styles.main}>
          <Topbar userEmail={userEmail} onMenuClick={() => setDrawerOpen((v) => !v)} />
          <main className={styles.content}>{children}</main>
        </div>
      </div>
    </ToastProvider>
  )
}
