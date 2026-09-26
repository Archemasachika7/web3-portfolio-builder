"use client"

import Link from "next/link"
import { useLayoutEffect, useRef } from "react"
import { NAV_GROUPS, isUnder } from "./nav"
import Icon from "./Icon"
import styles from "./AdminShell.module.css"

/**
 * The sidebar's active marker is one element that slides to the current
 * item rather than a style that jumps between links, so moving between
 * sections reads as moving along one structure.
 */
export default function Sidebar({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  const groupsRef = useRef<HTMLDivElement>(null)
  const markerRef = useRef<HTMLSpanElement>(null)
  const placed = useRef(false)

  useLayoutEffect(() => {
    const groups = groupsRef.current
    const marker = markerRef.current
    if (!groups || !marker) return
    const active = groups.querySelector<HTMLElement>('[data-active="true"]')
    if (!active) {
      marker.style.opacity = "0"
      return
    }
    // First placement is instant; after that the marker glides.
    marker.style.transition = placed.current ? "" : "none"
    marker.style.opacity = "1"
    marker.style.transform = `translateY(${active.offsetTop}px)`
    marker.style.height = `${active.offsetHeight}px`
    placed.current = true
  }, [pathname])

  return (
    <nav className={styles.sidebar} aria-label="Admin navigation">
      <div className={styles.brand}>
        <span className={styles.brandMark} aria-hidden="true" />
        <span className={styles.brandText}>
          <span className={styles.brandName}>Archishman Das</span>
          <span className={styles.brandRole}>Portfolio CMS</span>
        </span>
      </div>

      <div className={styles.groups} ref={groupsRef}>
        <span className={styles.marker} ref={markerRef} aria-hidden="true" />
        {NAV_GROUPS.map((group, i) => (
          <div className={styles.group} key={i}>
            {group.label && <span className={styles.groupLabel}>{group.label}</span>}
            {group.items.map((item) => {
              const active = isUnder(pathname, item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={styles.navLink}
                  data-active={active ? "true" : "false"}
                  aria-current={active ? "page" : undefined}
                  onClick={onNavigate}
                >
                  <Icon name={item.icon} size={17} className={styles.navIcon} />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </div>
        ))}
      </div>
    </nav>
  )
}
