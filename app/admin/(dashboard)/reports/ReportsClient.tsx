"use client"

import { useState } from "react"
import Link from "next/link"
import { useToast } from "@/components/admin/Toast"
import { publicAssetUrl } from "@/lib/publicUrl"
import { toggleReportPublished, deleteReport } from "./actions"
import type { ReportWithProject } from "./actions"
import styles from "../shared-list.module.css"

export default function ReportsClient({ reports: initial }: { reports: ReportWithProject[] }) {
  const [reports, setReports] = useState(initial)
  const { showToast } = useToast()

  return (
    <div className={styles.page}>
      <p className="field-hint">
        Reports are uploaded per-project from that project&rsquo;s Report tab — this is a read/manage
        overview across every project.
      </p>
      {reports.length === 0 ? (
        <p className={styles.empty}>No reports uploaded yet.</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Project</th>
              <th>Size</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {reports.map((r) => (
              <tr key={r.id}>
                <td>{r.title}</td>
                <td>
                  {r.project_title ? (
                    <Link href={`/admin/projects/${r.project_id}`} className={styles.previewLink}>
                      {r.project_title}
                    </Link>
                  ) : (
                    "—"
                  )}
                </td>
                <td>{r.file_size ? `${(r.file_size / 1024 / 1024).toFixed(1)}MB` : "—"}</td>
                <td>
                  <span className={`badge ${r.published ? "badge-published" : "badge-draft"}`}>
                    {r.published ? "Published" : "Draft"}
                  </span>
                </td>
                <td className={styles.fileActions}>
                  <a href={publicAssetUrl(r.file_path) ?? "#"} target="_blank" rel="noreferrer" className="btn">
                    View
                  </a>
                  <button
                    className="btn"
                    onClick={async () => {
                      const result = await toggleReportPublished(r.id, !r.published)
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
                    className="btn btn-danger"
                    onClick={async () => {
                      const result = await deleteReport(r.id, r.file_path)
                      if (result.ok) {
                        setReports((prev) => prev.filter((x) => x.id !== r.id))
                        showToast("Deleted", "success")
                      } else {
                        showToast(result.error ?? "Delete failed", "error")
                      }
                    }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
