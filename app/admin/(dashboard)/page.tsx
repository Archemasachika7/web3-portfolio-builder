import Link from "next/link"
import { getDashboardCounts, getRecentProjects, getDraftProjectWarnings } from "@/lib/data/dashboard"
import styles from "./dashboard.module.css"

export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  const [counts, recentProjects, warnings] = await Promise.all([
    getDashboardCounts(),
    getRecentProjects(),
    getDraftProjectWarnings()
  ])

  return (
    <div className={styles.page}>
      <div className={styles.grid}>
        <StatCard label="Projects" primary={`${counts.projects.published} published`} secondary={`${counts.projects.draft} drafts`} href="/admin/projects" />
        <StatCard label="Reports" primary={`${counts.reports} total`} href="/admin/reports" />
        <StatCard label="Resumes" primary={`${counts.resumes.current} current`} secondary={`${counts.resumes.archived} archived`} href="/admin/resumes" />
        <StatCard label="Certificates" primary={`${counts.certificates.published} published`} secondary={`${counts.certificates.draft} drafts`} href="/admin/certificates" />
        <StatCard label="Homepage Media" primary={`${counts.homepageMedia.configured} configured`} secondary={`${counts.homepageMedia.missing} missing`} href="/admin/homepage-media" />
        <StatCard label="Tags" primary={`${counts.tags} total`} href="/admin/tags" />
        <StatCard label="Education" primary={`${counts.education} entries`} href="/admin/education" />
        <StatCard label="Experience" primary={`${counts.experience} entries`} href="/admin/experience" />
        <StatCard label="Achievements" primary={`${counts.achievements} entries`} href="/admin/achievements" />
      </div>

      <section className={styles.section}>
        <span className="label">CONTENT HEALTH</span>
        {warnings.length === 0 ? (
          <p className={styles.healthy}>No draft projects are missing required fields.</p>
        ) : (
          <ul className={styles.warningList}>
            {warnings.map((w) => (
              <li key={w.href} className={styles.warningItem}>
                <Link href={w.href} className={styles.warningLink}>
                  {w.label}
                </Link>
                <span className={styles.warningMissing}>Missing: {w.missing.join(", ")}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className={styles.section}>
        <span className="label">RECENT PROJECTS</span>
        {recentProjects.length === 0 ? (
          <p className={styles.empty}>No projects yet.</p>
        ) : (
          <ul className={styles.recentList}>
            {recentProjects.map((item) => (
              <li key={item.id}>
                <Link href={item.href} className={styles.recentLink}>
                  <span>{item.label}</span>
                  <span className={styles.recentMeta}>{item.meta}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

function StatCard({
  label,
  primary,
  secondary,
  href
}: {
  label: string
  primary: string
  secondary?: string
  href: string
}) {
  return (
    <Link href={href} className={`card ${styles.stat}`}>
      <span className="label">{label}</span>
      <span className={styles.statPrimary}>{primary}</span>
      {secondary && <span className={styles.statSecondary}>{secondary}</span>}
    </Link>
  )
}
