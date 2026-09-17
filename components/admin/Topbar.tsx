"use client"

import { usePathname, useRouter } from "next/navigation"
import { titleForPathname } from "./nav"
import { signOut } from "@/app/admin/login/actions"
import { PUBLIC_SITE_URL } from "@/lib/siteUrl"
import styles from "./AdminShell.module.css"

export default function Topbar({
  userEmail,
  onMenuClick
}: {
  userEmail: string | null
  onMenuClick: () => void
}) {
  const pathname = usePathname()
  const router = useRouter()
  const title = titleForPathname(pathname)

  async function handleLogout() {
    await signOut()
    router.replace("/admin/login")
    router.refresh()
  }

  return (
    <header className={styles.topbar}>
      <button
        type="button"
        className={styles.menuBtn}
        onClick={onMenuClick}
        aria-label="Toggle navigation"
      >
        ☰
      </button>
      <nav className={styles.breadcrumb} aria-label="Breadcrumb">
        <span className={styles.crumbRoot}>Admin</span>
        <span className={styles.crumbSep} aria-hidden="true">
          /
        </span>
        <span className={styles.crumbCurrent}>{title}</span>
      </nav>
      <div className={styles.topbarActions}>
        <a href={PUBLIC_SITE_URL} target="_blank" rel="noreferrer" className="btn">
          Preview site ↗
        </a>
        {userEmail && <span className={styles.userEmail}>{userEmail}</span>}
        <button type="button" className="btn" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </header>
  )
}
