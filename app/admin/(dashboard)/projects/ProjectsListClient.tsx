"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import type { ProjectListItem } from "./actions"
import styles from "./projects.module.css"

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
        <p className={styles.empty}>No projects match.</p>
      ) : view === "table" ? (
        <table className="table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Status</th>
              <th>Featured</th>
              <th>Tags</th>
              <th>Reports</th>
              <th>Updated</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id}>
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
                <td>{p.featured ? "Yes" : "—"}</td>
                <td>{p.tagCount}</td>
                <td>{p.reportCount}</td>
                <td>{new Date(p.updated_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className={styles.cardGrid}>
          {filtered.map((p) => (
            <Link href={`/admin/projects/${p.id}`} key={p.id} className={`card ${styles.projectCard}`}>
              <span className={`badge ${p.published ? "badge-published" : "badge-draft"}`}>
                {p.published ? "Published" : "Draft"}
              </span>
              <span className={styles.cardTitle}>{p.title}</span>
              <span className={styles.cardMeta}>
                {p.tagCount} tags · {p.reportCount} reports
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
