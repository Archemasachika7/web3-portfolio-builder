"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import type { ProjectDetail } from "../actions"
import type { Tag } from "@/shared/database.types"
import { setProjectPublished, deleteProject, checkPublishRequirements } from "../actions"
import { useToast } from "@/components/admin/Toast"
import ConfirmDialog, { type ConfirmDialogHandle } from "@/components/admin/ConfirmDialog"
import OverviewTab from "./OverviewTab"
import MediaTab from "./MediaTab"
import TagsTab from "./TagsTab"
import ReportTab from "./ReportTab"
import DisplayTab from "./DisplayTab"
import styles from "./editor.module.css"

const TABS = ["Overview", "Media", "Tags", "Report", "Display"] as const
type TabName = (typeof TABS)[number]

export default function ProjectEditor({
  project,
  allTags
}: {
  project: ProjectDetail
  allTags: Tag[]
}) {
  const [tab, setTab] = useState<TabName>("Overview")
  const [published, setPublished] = useState(project.published)
  const [publishing, setPublishing] = useState(false)
  const { showToast } = useToast()
  const router = useRouter()
  const deleteDialogRef = useRef<ConfirmDialogHandle>(null)

  async function handlePublishToggle() {
    setPublishing(true)
    if (!published) {
      const check = await checkPublishRequirements(project.id)
      if (!check.canPublish) {
        showToast(`Cannot publish. Missing: ${check.missing.join(", ")}`, "error")
        setPublishing(false)
        return
      }
    }
    const result = await setProjectPublished(project.id, !published)
    if (result.ok) {
      setPublished(!published)
      showToast(!published ? "Published" : "Unpublished", "success")
    } else {
      showToast(result.error ?? "Failed", "error")
    }
    setPublishing(false)
  }

  async function handleDelete() {
    const result = await deleteProject(project.id)
    if (result.ok) {
      showToast("Project deleted", "success")
      router.push("/admin/projects")
    } else {
      showToast(result.error ?? "Delete failed", "error")
    }
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h2 className={styles.title}>{project.title || "Untitled project"}</h2>
          <span className={`badge ${published ? "badge-published" : "badge-draft"}`}>
            {published ? "Published" : "Draft"}
          </span>
        </div>
        <div className={styles.headerActions}>
          {siteUrl && (
            <a
              href={`${siteUrl}/work/${project.slug}`}
              target="_blank"
              rel="noreferrer"
              className="btn"
            >
              Preview
            </a>
          )}
          <button type="button" className="btn" onClick={handlePublishToggle} disabled={publishing}>
            {publishing ? "Working…" : published ? "Unpublish" : "Publish"}
          </button>
          <button
            type="button"
            className="btn btn-danger"
            onClick={() => deleteDialogRef.current?.open()}
          >
            Delete
          </button>
        </div>
      </div>

      <div className={styles.tabBar} role="tablist">
        {TABS.map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            className={styles.tabBtn}
            data-active={tab === t}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>

      <div className={styles.tabPanel}>
        {tab === "Overview" && <OverviewTab project={project} />}
        {tab === "Media" && <MediaTab project={project} />}
        {tab === "Tags" && <TagsTab project={project} allTags={allTags} />}
        {tab === "Report" && <ReportTab project={project} />}
        {tab === "Display" && <DisplayTab project={project} />}
      </div>

      <ConfirmDialog
        ref={deleteDialogRef}
        title={published ? "Delete published project?" : "Delete this project?"}
        description={
          published
            ? "This action will remove it from the public portfolio immediately, along with its media, reports and tag associations."
            : "This will permanently remove the draft, its media, reports and tag associations."
        }
        confirmLabel="Delete"
        onConfirm={handleDelete}
      />
    </div>
  )
}
