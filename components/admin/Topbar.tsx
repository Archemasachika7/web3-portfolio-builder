"use client"

import { usePathname, useRouter } from "next/navigation"
import { titleForPathname } from "./nav"
import { signOut } from "@/app/admin/login/actions"
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
      <h1 className={styles.pageTitle}>{title}</h1>
      <div className={styles.topbarActions}>
        <a
          href={process.env.NEXT_PUBLIC_SITE_URL ?? "#"}
          target="_blank"
          rel="noreferrer"
          className="btn"
        >
          Preview site
        </a>
        {userEmail && <span className={styles.userEmail}>{userEmail}</span>}
        <button type="button" className="btn" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </header>
  )
}
