"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import type { ProjectListItem } from "./actions"
import { publicAssetUrl } from "@/lib/publicUrl"
import styles from "./projects.module.css"

function ReadinessBadge({ missing }: { missing: string[] }) {
  if (missing.length === 0) {
    return <span className="badge badge-published">Ready to publish</span>
  }
  return (
    <span className="badge badge-draft" title={`Missing: ${missing.join(", ")}`}>
      Incomplete
    </span>
  )
}

export default function ProjectsListClient({ projects }: { projects: ProjectListItem[] }) {
  const [query, setQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft">("all")
  const [featuredOnly, setFeaturedOnly] = useState(false)
  const [view, setView] = useState<"table" | "card">("table")

  const filtered = useMemo(() => {
    return projects.filter((p) => {
      if (query && !p.title.toLowerCase().includes(query.toLowerCase())) return false
      if (statusFilter === "published" && !p.published) return false
      if (statusFilter === "draft" && p.published) return false
      if (featuredOnly && !p.featured) return false
      return true
    })
  }, [projects, query, statusFilter, featuredOnly])

  return (
    <div className={styles.listWrap}>
      <div className={styles.toolbar}>
        <input
          type="search"
          placeholder="Search by title…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="input"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
          className="select"
        >
          <option value="all">All statuses</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </select>
        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={featuredOnly}
            onChange={(e) => setFeaturedOnly(e.target.checked)}
          />
          Featured only
        </label>
        <div className={styles.viewToggle}>
          <button
            type="button"
            className="btn"
            data-active={view === "table"}
            onClick={() => setView("table")}
          >
            Table
          </button>
          <button
            type="button"
            className="btn"
            data-active={view === "card"}
            onClick={() => setView("card")}
          >
            Cards
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className={styles.emptyState}>
          <p className={styles.empty}>No projects yet.</p>
        </div>
      ) : view === "table" ? (
        <table className="table">
          <thead>
            <tr>
              <th></th>
              <th>Title</th>
              <th>Status</th>
              <th>Readiness</th>
              <th>Featured</th>
              <th>Tags</th>
              <th>Report</th>
              <th>Updated</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id}>
                <td>
                  {p.thumbnail_path ? (
                    <Image
                      src={publicAssetUrl(p.thumbnail_path) ?? ""}
                      alt=""
                      width={48}
                      height={32}
                      className={styles.rowThumb}
                    />
                  ) : (
                    <div className={styles.rowThumbPlaceholder} />
                  )}
                </td>
                <td>
                  <Link href={`/admin/projects/${p.id}`} className={styles.rowLink}>
                    {p.title}
                  </Link>
                </td>
                <td>
                  <span className={`badge ${p.published ? "badge-published" : "badge-draft"}`}>
                    {p.published ? "Published" : "Draft"}
                  </span>
                </td>
                <td>
                  <ReadinessBadge missing={p.missing} />
                </td>
                <td>{p.featured ? "Yes" : "—"}</td>
                <td>{p.tagCount}</td>
                <td>
                  {p.publishedReportCount > 0
                    ? "Published"
                    : p.reportCount > 0
                      ? "Draft only"
                      : "None"}
                </td>
                <td>{new Date(p.updated_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className={styles.cardGrid}>
          {filtered.map((p) => (
            <Link href={`/admin/projects/${p.id}`} key={p.id} className={`card ${styles.projectCard}`}>
              <div className={styles.cardThumbWrap}>
                {p.thumbnail_path ? (
                  <Image
                    src={publicAssetUrl(p.thumbnail_path) ?? ""}
                    alt=""
                    fill
                    className={styles.cardThumb}
                  />
                ) : (
                  <div className={styles.cardThumbPlaceholder}>No thumbnail</div>
                )}
              </div>
              <div className={styles.cardBadgeRow}>
                <span className={`badge ${p.published ? "badge-published" : "badge-draft"}`}>
                  {p.published ? "Published" : "Draft"}
                </span>
                <ReadinessBadge missing={p.missing} />
              </div>
              <span className={styles.cardTitle}>{p.title}</span>
              {p.short_bio && <span className={styles.cardBio}>{p.short_bio}</span>}
              <span className={styles.cardMeta}>
                {p.tagCount} tags · {p.publishedReportCount > 0 ? "report published" : "no published report"}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
