"use client"

import { useEffect, useState } from "react"
import { checkPublishRequirements, type PublishCheck } from "../actions"
import styles from "./editor.module.css"

const ALL_REQUIREMENTS = ["Title", "Short bio", "Thumbnail", "Project link", "Tags", "Published report"]

export default function ReadinessBanner({
  projectId,
  refreshKey
}: {
  projectId: string
  refreshKey: unknown
}) {
  const [check, setCheck] = useState<PublishCheck | null>(null)

  useEffect(() => {
    let cancelled = false
    checkPublishRequirements(projectId).then((result) => {
      if (!cancelled) setCheck(result)
    })
    return () => {
      cancelled = true
    }
    // refreshKey intentionally re-triggers this on tab switches, since
    // each tab's own local state can change fields the checklist covers.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, refreshKey])

  if (!check) return null

  return (
    <div className={styles.readiness}>
      <span className="label">PROJECT READINESS</span>
      <div className={styles.readinessGrid}>
        {ALL_REQUIREMENTS.map((req) => {
          const isMissing = check.missing.some((m) => m.toLowerCase() === req.toLowerCase())
          return (
            <span
              key={req}
              className={styles.readinessItem}
              data-met={isMissing ? "false" : "true"}
            >
              {isMissing ? "✗" : "✓"} {req}
            </span>
          )
        })}
      </div>
      {check.canPublish ? (
        <span className={styles.readinessReady}>Ready to publish.</span>
      ) : (
        <span className={styles.readinessNotReady}>
          Missing: {check.missing.join(", ")}
        </span>
      )}
    </div>
  )
}
