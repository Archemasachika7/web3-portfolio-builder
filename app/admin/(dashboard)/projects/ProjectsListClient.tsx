"use client"

import { useMemo, useRef, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import type { ProjectListItem } from "./actions"
import { deleteProjects } from "./actions"
import { publicAssetUrl } from "@/lib/publicUrl"
import { useToast } from "@/components/admin/Toast"
import ConfirmDialog, { type ConfirmDialogHandle } from "@/components/admin/ConfirmDialog"
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
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [pending, setPending] = useState<{ ids: string[]; label: string } | null>(null)
  const [busy, setBusy] = useState(false)

  const confirmRef = useRef<ConfirmDialogHandle>(null)
  const { showToast } = useToast()
  const router = useRouter()

  const filtered = useMemo(() => {
    return projects.filter((p) => {
      if (query && !p.title.toLowerCase().includes(query.toLowerCase())) return false
      if (statusFilter === "published" && !p.published) return false
      if (statusFilter === "draft" && p.published) return false
      if (featuredOnly && !p.featured) return false
      return true
    })
  }, [projects, query, statusFilter, featuredOnly])

  const draftCount = useMemo(() => projects.filter((p) => !p.published).length, [projects])
  const allVisibleSelected = filtered.length > 0 && filtered.every((p) => selected.has(p.id))

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleAllVisible() {
    setSelected((prev) => {
      const next = new Set(prev)
      if (allVisibleSelected) filtered.forEach((p) => next.delete(p.id))
      else filtered.forEach((p) => next.add(p.id))
      return next
    })
  }

  function requestDelete(ids: string[], label: string) {
    setPending({ ids, label })
    confirmRef.current?.open()
  }

  async function handleConfirmedDelete() {
    if (!pending) return
    setBusy(true)
    const result = await deleteProjects(pending.ids)
    setBusy(false)

    if (result.ok) {
      showToast(
        pending.ids.length === 1 ? "Project deleted" : `${pending.ids.length} projects deleted`,
        "success"
      )
      setSelected(new Set())
      router.refresh()
    } else {
      showToast(result.error ?? "Delete failed", "error")
    }
    setPending(null)
  }

  const publishedInSelection = useMemo(
    () => projects.filter((p) => selected.has(p.id) && p.published).length,
    [projects, selected]
  )

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
          <option value="draft">Draft ({draftCount})</option>
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

      {selected.size > 0 && (
        <div className={styles.bulkBar}>
          <span className={styles.bulkCount}>
            {selected.size} selected
            {publishedInSelection > 0 && (
              <span className={styles.bulkWarn}>
                {" "}
                · {publishedInSelection} published
              </span>
            )}
          </span>
          <div className={styles.bulkActions}>
            <button type="button" className="btn" onClick={() => setSelected(new Set())}>
              Clear
            </button>
            <button
              type="button"
              className="btn btn-danger"
              disabled={busy}
              onClick={() =>
                requestDelete(
                  [...selected],
                  selected.size === 1 ? "this project" : `these ${selected.size} projects`
                )
              }
            >
              Delete selected
            </button>
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className={styles.emptyState}>
          <p className={styles.empty}>
            {projects.length === 0
              ? "No projects yet. Use “Add Project” to create your first one."
              : "No projects match these filters."}
          </p>
        </div>
      ) : view === "table" ? (
        <table className="table">
          <thead>
            <tr>
              <th className={styles.checkCell}>
                <input
                  type="checkbox"
                  checked={allVisibleSelected}
                  onChange={toggleAllVisible}
                  aria-label="Select all visible projects"
                />
              </th>
              <th></th>
              <th>Title</th>
              <th>Status</th>
              <th>Readiness</th>
              <th>Featured</th>
              <th>Tags</th>
              <th>Report</th>
              <th>Updated</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id} className={selected.has(p.id) ? styles.rowSelected : undefined}>
                <td className={styles.checkCell}>
                  <input
                    type="checkbox"
                    checked={selected.has(p.id)}
                    onChange={() => toggle(p.id)}
                    aria-label={`Select ${p.title}`}
                  />
                </td>
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
                <td>
                  <button
                    type="button"
                    className={`btn btn-danger ${styles.rowDelete}`}
                    disabled={busy}
                    onClick={() => requestDelete([p.id], `“${p.title}”`)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className={styles.cardGrid}>
          {filtered.map((p) => (
            <div key={p.id} className={`card ${styles.projectCard}`} data-selected={selected.has(p.id)}>
              <label className={styles.cardSelect}>
                <input
                  type="checkbox"
                  checked={selected.has(p.id)}
                  onChange={() => toggle(p.id)}
                  aria-label={`Select ${p.title}`}
                />
              </label>
              <Link href={`/admin/projects/${p.id}`} className={styles.cardBody}>
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
                  {p.tagCount} tags ·{" "}
                  {p.publishedReportCount > 0 ? "report published" : "no published report"}
                </span>
              </Link>
              <div className={styles.cardActions}>
                <button
                  type="button"
                  className="btn btn-danger"
                  disabled={busy}
                  onClick={() => requestDelete([p.id], `“${p.title}”`)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        ref={confirmRef}
        title={pending && pending.ids.length > 1 ? "Delete these projects?" : "Delete this project?"}
        description={
          pending
            ? `This permanently removes ${pending.label}, along with their media, reports and tag associations. Anything already published disappears from the public portfolio immediately.`
            : ""
        }
        confirmLabel="Delete"
        onConfirm={handleConfirmedDelete}
      />
    </div>
  )
}
