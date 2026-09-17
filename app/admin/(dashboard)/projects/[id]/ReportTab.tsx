"use client"

import { useState } from "react"
import type { ProjectDetail } from "../actions"
import { uploadProjectReport, deleteProjectReport, toggleReportPublished } from "../actions"
import { useToast } from "@/components/admin/Toast"
import FileDropzone from "@/components/admin/FileDropzone"
import { PDF_TYPES } from "@/lib/storageConstants"
import { publicAssetUrl } from "@/lib/publicUrl"
import styles from "./editor.module.css"

export default function ReportTab({ project }: { project: ProjectDetail }) {
  const { showToast } = useToast()
  const [reports, setReports] = useState(project.reports)
  const [title, setTitle] = useState("")

  return (
    <div className={styles.form}>
      {reports.length === 0 ? (
        <p className="field-hint">No reports attached yet. A published report is required before this project can be published.</p>
      ) : (
        <ul className={styles.reportList}>
          {reports.map((r) => (
            <li key={r.id} className={styles.reportItem}>
              <div>
                <span className={styles.reportTitle}>{r.title}</span>
                <span className={styles.reportMeta}>
                  {r.file_size ? `${(r.file_size / 1024 / 1024).toFixed(1)}MB` : ""}
                </span>
              </div>
              <div className={styles.reportActions}>
                <a href={publicAssetUrl(r.file_path) ?? "#"} target="_blank" rel="noreferrer" className="btn">
                  View
                </a>
                <a href={publicAssetUrl(r.file_path) ?? "#"} download className="btn">
                  Download
                </a>
                <button
                  type="button"
                  className="btn"
                  onClick={async () => {
                    const result = await toggleReportPublished(r.id, project.id, !r.published)
                    if (result.ok) {
                      setReports((prev) =>
                        prev.map((x) => (x.id === r.id ? { ...x, published: !x.published } : x))
                      )
                    } else {
                      showToast(result.error ?? "Failed", "error")
                    }
                  }}
                >
                  {r.published ? "Unpublish" : "Publish"}
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={async () => {
                    const result = await deleteProjectReport(r.id, project.id, r.file_path)
                    if (result.ok) {
                      setReports((prev) => prev.filter((x) => x.id !== r.id))
                      showToast("Removed", "success")
                    } else {
                      showToast(result.error ?? "Delete failed", "error")
                    }
                  }}
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="field">
        <label htmlFor="report-title">New report title (optional — defaults to filename)</label>
        <input
          id="report-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="input"
          placeholder="Project Report"
        />
      </div>
      <FileDropzone
        accept={PDF_TYPES.join(",")}
        hint="PDF, up to 25MB"
        onUpload={async (file) => {
          const result = await uploadProjectReport(project.id, project.slug, title, file)
          if (result.ok) window.location.reload()
          return { path: result.ok ? "added" : null, error: result.error }
        }}
      />
    </div>
  )
}
