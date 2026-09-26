"use client"

import { useState } from "react"
import type { ProjectDetail } from "../actions"
import { deleteProjectReport, toggleReportPublished } from "../actions"
import { useToast } from "@/components/admin/Toast"
import UploadField from "@/components/admin/UploadField"
import { callAction } from "@/lib/callAction"
import { publicAssetUrl } from "@/lib/publicUrl"
import styles from "./editor.module.css"

export default function ReportTab({ project }: { project: ProjectDetail }) {
  const { showToast } = useToast()
  const [reports, setReports] = useState(project.reports)
  const [title, setTitle] = useState("")
  const [busyId, setBusyId] = useState<string | null>(null)

  async function togglePublished(id: string, published: boolean) {
    if (busyId) return
    setBusyId(id)
    const result = await callAction(() => toggleReportPublished(id, project.id, published))
    setBusyId(null)
    if (result.ok) {
      setReports((prev) => prev.map((x) => (x.id === id ? { ...x, published } : x)))
    } else {
      showToast(result.error ?? "Failed", "error")
    }
  }

  async function remove(id: string) {
    if (busyId) return
    setBusyId(id)
    const result = await callAction(() => deleteProjectReport(id, project.id))
    setBusyId(null)
    if (result.ok) {
      setReports((prev) => prev.filter((x) => x.id !== id))
      showToast("Removed", "success")
    } else {
      showToast(result.error ?? "Delete failed", "error")
    }
  }

  return (
    <div className={styles.form}>
      {reports.length === 0 ? (
        <p className="field-hint">No reports attached yet. A published report is required before this project can be published.</p>
      ) : (
        <ul className={styles.reportList}>
          {reports.map((r) => {
            const url = publicAssetUrl(r.file_path) ?? "#"
            const busy = busyId === r.id
            return (
              <li key={r.id} className={styles.reportItem}>
                <div>
                  <span className={styles.reportTitle}>{r.title}</span>
                  <span className={styles.reportMeta}>
                    {[r.published ? "Published" : "Hidden", r.file_size ? `${(r.file_size / 1024 / 1024).toFixed(1)} MB` : ""]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                </div>
                <div className={styles.reportActions}>
                  <a href={url} target="_blank" rel="noreferrer" className="btn btn-sm">
                    View
                  </a>
                  <button type="button" className="btn btn-sm" disabled={!!busyId} onClick={() => togglePublished(r.id, !r.published)}>
                    {busy ? "…" : r.published ? "Hide" : "Publish"}
                  </button>
                  <button type="button" className="btn btn-sm btn-danger" disabled={!!busyId} onClick={() => remove(r.id)}>
                    Delete
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <div className="field">
        <label htmlFor="report-title">New report title (optional — defaults to the file name)</label>
        <input
          id="report-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="input"
          placeholder="Project Report"
        />
      </div>
      <UploadField
        kind="project-report"
        recordId={project.id}
        title={title}
        onUploaded={(result) => {
          const added = result.report
          if (added) setReports((prev) => [...prev, added])
          setTitle("")
        }}
      />
    </div>
  )
}
