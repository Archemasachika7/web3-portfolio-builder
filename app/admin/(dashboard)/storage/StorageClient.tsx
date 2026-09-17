"use client"

import { useMemo, useRef, useState } from "react"
import { useToast } from "@/components/admin/Toast"
import ConfirmDialog, { type ConfirmDialogHandle } from "@/components/admin/ConfirmDialog"
import { publicAssetUrl } from "@/lib/publicUrl"
import { deleteStorageObject } from "./actions"
import type { StorageObjectInfo, UsageEntry } from "./actions"
import styles from "./storage.module.css"

export default function StorageClient({
  objects,
  usage
}: {
  objects: StorageObjectInfo[]
  usage: Record<string, UsageEntry[]>
}) {
  const [items, setItems] = useState(objects)
  const [query, setQuery] = useState("")
  const [folderFilter, setFolderFilter] = useState("all")
  const { showToast } = useToast()
  const confirmDialogRef = useRef<ConfirmDialogHandle>(null)
  const targetRef = useRef<{ path: string; usedBy: UsageEntry[] } | null>(null)

  const folders = useMemo(() => [...new Set(items.map((o) => o.folder))].sort(), [items])

  const filtered = useMemo(() => {
    return items.filter((o) => {
      if (folderFilter !== "all" && o.folder !== folderFilter) return false
      if (query && !o.path.toLowerCase().includes(query.toLowerCase())) return false
      return true
    })
  }, [items, query, folderFilter])

  async function handleDeleteClick(obj: StorageObjectInfo) {
    const usedBy = usage[obj.path] ?? []
    targetRef.current = { path: obj.path, usedBy }
    confirmDialogRef.current?.open()
  }

  async function performDelete() {
    const target = targetRef.current
    if (!target) return
    const confirmed = target.usedBy.length > 0
    const result = await deleteStorageObject(target.path, confirmed)
    if (result.ok) {
      setItems((prev) => prev.filter((o) => o.path !== target.path))
      showToast("Deleted", "success")
    } else {
      showToast(result.error ?? "Delete failed", "error")
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.toolbar}>
        <input
          type="search"
          placeholder="Search by path…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="input"
        />
        <select value={folderFilter} onChange={(e) => setFolderFilter(e.target.value)} className="select">
          <option value="all">All folders</option>
          {folders.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <p className={styles.empty}>No files match.</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Path</th>
              <th>Type</th>
              <th>Size</th>
              <th>Updated</th>
              <th>Used by</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((obj) => {
              const usedBy = usage[obj.path] ?? []
              const url = publicAssetUrl(obj.path)
              return (
                <tr key={obj.path}>
                  <td className={styles.pathCell}>{obj.path}</td>
                  <td>{obj.contentType ?? "—"}</td>
                  <td>{obj.size ? `${(obj.size / 1024).toFixed(0)} KB` : "—"}</td>
                  <td>{obj.updatedAt ? new Date(obj.updatedAt).toLocaleDateString() : "—"}</td>
                  <td>
                    {usedBy.length === 0 ? (
                      <span className={styles.unused}>Unused</span>
                    ) : (
                      <span title={usedBy.map((u) => u.label).join(", ")}>{usedBy.length} reference(s)</span>
                    )}
                  </td>
                  <td className={styles.actionsCell}>
                    {url && (
                      <>
                        <a href={url} target="_blank" rel="noreferrer" className="btn">
                          Open
                        </a>
                        <a href={url} download className="btn">
                          Download
                        </a>
                      </>
                    )}
                    <button className="btn btn-danger" onClick={() => handleDeleteClick(obj)}>
                      Delete
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}

      <ConfirmDialog
        ref={confirmDialogRef}
        title="Delete this file?"
        description={
          targetRef.current?.usedBy.length
            ? `USED BY: ${targetRef.current.usedBy.map((u) => u.label).join(", ")}. Deleting it will leave those references broken.`
            : "This file isn't referenced by any known record. This cannot be undone."
        }
        confirmLabel="Delete"
        onConfirm={performDelete}
      />
    </div>
  )
}
