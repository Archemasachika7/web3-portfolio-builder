import Link from "next/link"
import { getDashboardCounts, getRecentProjects, getDraftProjectWarnings } from "@/lib/data/dashboard"
import { createProject } from "./projects/actions"
import { PUBLIC_SITE_URL } from "@/lib/siteUrl"
import Icon, { type IconName } from "@/components/admin/Icon"
import styles from "./dashboard.module.css"

export const dynamic = "force-dynamic"

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`

export default async function DashboardPage() {
  const [counts, recentProjects, warnings] = await Promise.all([
    getDashboardCounts(),
    getRecentProjects(),
    getDraftProjectWarnings()
  ])

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <span className="eyebrow">Overview</span>
          <h1 className="page-title">Welcome back</h1>
          <p className={styles.lede}>
            {plural(counts.projects.published, "published project")}, {counts.projects.draft} in draft
            {warnings.length > 0
              ? ` — ${warnings.length} ${warnings.length === 1 ? "needs" : "need"} attention before going live.`
              : "."}
          </p>
        </div>
        <div className={styles.quickActions}>
          <form action={createProject}>
            <input type="hidden" name="title" value="Untitled Project" />
            <button type="submit" className="btn btn-primary">
              <Icon name="plus" size={16} />
              New project
            </button>
          </form>
          <Link href="/admin/resumes" className="btn">
            <Icon name="upload" size={16} />
            Resumes
          </Link>
          <a href={PUBLIC_SITE_URL} target="_blank" rel="noreferrer" className="btn">
            Open site
            <Icon name="external" size={14} />
          </a>
        </div>
      </header>

      <div className={styles.grid}>
        <StatCard icon="projects" label="Projects" value={counts.projects.published} caption="published" secondary={plural(counts.projects.draft, "draft")} href="/admin/projects" />
        <StatCard icon="reports" label="Reports" value={counts.reports} caption="total" href="/admin/reports" />
        <StatCard icon="resumes" label="Resumes" value={counts.resumes.current} caption="current" secondary={`${counts.resumes.archived} archived`} href="/admin/resumes" />
        <StatCard icon="certificates" label="Certificates" value={counts.certificates.published} caption="published" secondary={plural(counts.certificates.draft, "draft")} href="/admin/certificates" />
        <StatCard icon="media" label="Homepage media" value={counts.homepageMedia.configured} caption="configured" secondary={`${counts.homepageMedia.missing} missing`} warn={counts.homepageMedia.missing > 0} href="/admin/homepage-media" />
        <StatCard icon="tags" label="Tags" value={counts.tags} caption="total" href="/admin/tags" />
        <StatCard icon="education" label="Education" value={counts.education} caption={counts.education === 1 ? "entry" : "entries"} href="/admin/education" />
        <StatCard icon="experience" label="Experience" value={counts.experience} caption={counts.experience === 1 ? "entry" : "entries"} href="/admin/experience" />
        <StatCard icon="achievements" label="Achievements" value={counts.achievements} caption={counts.achievements === 1 ? "entry" : "entries"} href="/admin/achievements" />
      </div>

      <div className={styles.columns}>
        <section className={`card ${styles.panel}`}>
          <div className={styles.panelHead}>
            <span className="label">Content health</span>
            <span className={warnings.length ? styles.countWarn : styles.countOk}>
              {warnings.length ? `${warnings.length} to fix` : "All clear"}
            </span>
          </div>
          {warnings.length === 0 ? (
            <p className={styles.healthy}>
              <span className={styles.okDot} aria-hidden="true" />
              No draft projects are missing required fields.
            </p>
          ) : (
            <ul className={styles.list}>
              {warnings.map((w) => (
                <li key={w.href}>
                  <Link href={w.href} className={styles.row}>
                    <span className={styles.warnDot} aria-hidden="true" />
                    <span className={styles.rowMain}>
                      <span className={styles.rowTitle}>{w.label}</span>
                      <span className={styles.rowMeta}>Missing: {w.missing.join(", ")}</span>
                    </span>
                    <Icon name="arrow" size={16} className={styles.rowArrow} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className={`card ${styles.panel}`}>
          <div className={styles.panelHead}>
            <span className="label">Recent projects</span>
            <Link href="/admin/projects" className={styles.panelLink}>
              View all
            </Link>
          </div>
          {recentProjects.length === 0 ? (
            <p className={styles.healthy}>No projects yet.</p>
          ) : (
            <ul className={styles.list}>
              {recentProjects.map((item) => (
                <li key={item.id}>
                  <Link href={item.href} className={styles.row}>
                    <span className={styles.rowMain}>
                      <span className={styles.rowTitle}>{item.label}</span>
                      <span className={styles.rowMeta}>{item.meta}</span>
                    </span>
                    <Icon name="arrow" size={16} className={styles.rowArrow} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  caption,
  secondary,
  warn = false,
  href
}: {
  icon: IconName
  label: string
  value: number
  caption: string
  secondary?: string
  warn?: boolean
  href: string
}) {
  return (
    <Link href={href} className={`card ${styles.stat}`}>
      <span className={styles.statTop}>
        <span className="label">{label}</span>
        <Icon name={icon} size={16} className={styles.statIcon} />
      </span>
      <span className={styles.statValue}>
        {value}
        <span className={styles.statCaption}>{caption}</span>
      </span>
      <span className={styles.statSecondary} data-warn={warn ? "true" : undefined}>
        {secondary ?? " "}
      </span>
    </Link>
  )
}
