"use client"

import { useRouter } from "next/navigation"
import { metaForPathname } from "./nav"
import { signOut } from "@/app/admin/login/actions"
import { PUBLIC_SITE_URL } from "@/lib/siteUrl"
import Icon from "./Icon"
import ThemeToggle from "./ThemeToggle"
import styles from "./AdminShell.module.css"

export default function Topbar({
  pathname,
  userEmail,
  onMenuClick
}: {
  pathname: string
  userEmail: string | null
  onMenuClick: () => void
}) {
  const router = useRouter()
  const meta = metaForPathname(pathname)
  const initial = userEmail?.trim().charAt(0).toUpperCase() || "A"

  async function handleLogout() {
    try {
      await signOut()
    } catch (e) {
      // Leave anyway; the login page re-checks the session.
      console.error(e)
    }
    router.replace("/admin/login")
    router.refresh()
  }

  return (
    <header className={styles.topbar}>
      <button type="button" className={styles.menuBtn} onClick={onMenuClick} aria-label="Toggle navigation">
        <Icon name="menu" size={20} />
      </button>

      <nav className={styles.breadcrumb} aria-label="Breadcrumb">
        <span className={styles.crumbRoot}>Admin</span>
        {meta.group && (
          <>
            <span className={styles.crumbSep} aria-hidden="true">/</span>
            <span className={styles.crumbRoot}>{meta.group}</span>
          </>
        )}
        <span className={styles.crumbSep} aria-hidden="true">/</span>
        <span className={styles.crumbCurrent}>
          {meta.item?.label ?? "Admin"}
          {meta.nested ? " — Edit" : ""}
        </span>
      </nav>

      <div className={styles.topbarActions}>
        <ThemeToggle />
        <a href={PUBLIC_SITE_URL} target="_blank" rel="noreferrer" className={`btn ${styles.previewBtn}`}>
          Preview site
          <Icon name="external" size={14} />
        </a>
        {userEmail && (
          <span className={styles.user} title={userEmail}>
            <span className={styles.avatar} aria-hidden="true">{initial}</span>
            <span className={styles.userEmail}>{userEmail}</span>
          </span>
        )}
        <button type="button" className={`btn ${styles.iconBtn}`} onClick={handleLogout} aria-label="Log out" title="Log out">
          <Icon name="logout" size={16} />
        </button>
      </div>
    </header>
  )
}
