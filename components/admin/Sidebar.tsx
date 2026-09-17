"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { NAV_GROUPS } from "./nav"
import styles from "./AdminShell.module.css"

export default function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()

  return (
    <nav className={styles.sidebar} aria-label="Admin navigation">
      <div className={styles.brand}>
        <span className={styles.brandName}>Archishman Das</span>
        <span className={styles.brandRole}>Portfolio CMS</span>
      </div>
      <div className={styles.groups}>
        {NAV_GROUPS.map((group, i) => (
          <div className={styles.group} key={i}>
            {group.label && <span className={styles.groupLabel}>{group.label}</span>}
            {group.items.map((item) => {
              const active =
                pathname === item.href || pathname.startsWith(item.href + "/")
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={styles.navLink}
                  data-active={active ? "true" : "false"}
                  onClick={onNavigate}
                >
                  {item.label}
                </Link>
              )
            })}
          </div>
        ))}
      </div>
    </nav>
  )
}
