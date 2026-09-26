"use client"

import type { ProjectDetail } from "../actions"
import { missingRequirements } from "@/lib/projectReadiness"
import styles from "./editor.module.css"

const ALL_REQUIREMENTS = ["Title", "Short bio", "Thumbnail", "Project link", "Tags", "Published report"]

/**
 * Computed from the page's own project data, which the server refreshes
 * after every save or upload — so it updates as soon as a requirement is
 * met, with no extra request. The publish action re-checks on the server.
 */
export default function ReadinessBanner({ project }: { project: ProjectDetail }) {
  const missing = missingRequirements({
    ...project,
    tagCount: project.tags.length,
    publishedReportCount: project.reports.filter((r) => r.published).length
  })

  return (
    <div className={styles.readiness}>
      <span className="label">PROJECT READINESS</span>
      <div className={styles.readinessGrid}>
        {ALL_REQUIREMENTS.map((req) => {
          const isMissing = missing.includes(req)
          return (
            <span key={req} className={styles.readinessItem} data-met={isMissing ? "false" : "true"}>
              {isMissing ? "✗" : "✓"} {req}
            </span>
          )
        })}
      </div>
      {missing.length === 0 ? (
        <span className={styles.readinessReady}>Ready to publish.</span>
      ) : (
        <span className={styles.readinessNotReady}>Missing: {missing.join(", ")}</span>
      )}
    </div>
  )
}
