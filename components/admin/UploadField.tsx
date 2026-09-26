"use client"

import { useEffect, useRef, useState, type DragEvent } from "react"
import { directUpload, type UploadResult } from "@/lib/directUpload"
import { clearUpload } from "@/lib/uploadActions"
import { callAction } from "@/lib/callAction"
import { acceptFor, hintFor, isImagePath, isVideoPath, type UploadKind } from "@/lib/uploadKinds"
import { publicAssetUrl } from "@/lib/publicUrl"
import { useToast } from "./Toast"
import ConfirmDialog, { type ConfirmDialogHandle } from "./ConfirmDialog"
import styles from "./UploadField.module.css"

type Status = "idle" | "uploading" | "done" | "error"

export interface UploadFieldProps {
  kind: UploadKind
  /** Row the file belongs to. Without one the field is disabled and shows `disabledReason`. */
  recordId: string | null
  /** Current stored path, for single-file slots. */
  currentPath?: string | null
  disabledReason?: string
  /** Report title (project reports only). */
  title?: string
  /** Accept several files at once, uploaded one after another (gallery). */
  multiple?: boolean
  /** Offer a "Remove" button for the current file. */
  removable?: boolean
  onUploaded?: (result: Extract<UploadResult, { ok: true }>) => void
  onRemoved?: () => void
}

/**
 * The one upload control used everywhere in the admin. Files go straight
 * to Supabase Storage (see lib/directUpload.ts) with real progress, can
 * be cancelled, and every outcome ends in a visible state — never a
 * permanent "Uploading…".
 */
export default function UploadField({
  kind,
  recordId,
  currentPath = null,
  disabledReason = "Save this item first.",
  title,
  multiple = false,
  removable = false,
  onUploaded,
  onRemoved
}: UploadFieldProps) {
  const { showToast } = useToast()
  const inputRef = useRef<HTMLInputElement>(null)
  const abortRef = useRef<AbortController | null>(null)
  const removeRef = useRef<ConfirmDialogHandle>(null)
  const [current, setCurrent] = useState<string | null>(currentPath)
  const [status, setStatus] = useState<Status>("idle")
  const [progress, setProgress] = useState(0)
  const [label, setLabel] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const lastFiles = useRef<File[]>([])
  // A ref, not state: two quick picks in the same tick must not both start.
  const runningRef = useRef(false)

  // Follow the server's value when the page data refreshes.
  useEffect(() => setCurrent(currentPath), [currentPath])
  // Abandon an in-flight upload if the field unmounts (card closed, tab switched).
  useEffect(() => () => abortRef.current?.abort(), [])

  const busy = status === "uploading"
  const disabled = !recordId || busy

  async function run(files: File[]) {
    if (!recordId || files.length === 0 || runningRef.current) return
    runningRef.current = true
    lastFiles.current = files
    const controller = new AbortController()
    abortRef.current = controller
    setError(null)
    setStatus("uploading")

    let failed: string | null = null
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        setLabel(files.length > 1 ? `${file.name} (${i + 1} of ${files.length})` : file.name)
        setProgress(0)
        const result = await directUpload({
          kind,
          recordId,
          file,
          title,
          signal: controller.signal,
          onProgress: (f) => setProgress(f)
        })
        if (!result.ok) {
          failed = result.error
          break
        }
        if (!multiple) setCurrent(result.path)
        onUploaded?.(result)
      }
    } catch (e) {
      console.error(e)
      failed = "Something went wrong during the upload. Try again."
    } finally {
      abortRef.current = null
      runningRef.current = false
    }
    if (failed) {
      setStatus("error")
      setError(failed)
      if (failed !== "Upload cancelled.") showToast(failed, "error")
    } else {
      setStatus("done")
      showToast(files.length > 1 ? `${files.length} files uploaded` : "Uploaded", "success")
    }
  }

  function pick(list: FileList | null) {
    const files = Array.from(list ?? [])
    run(multiple ? files : files.slice(0, 1))
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setDragActive(false)
    if (!disabled) pick(e.dataTransfer.files)
  }

  async function remove() {
    if (!recordId) return
    const result = await callAction(() => clearUpload({ kind, recordId }))
    if (result.ok) {
      setCurrent(null)
      setStatus("idle")
      onRemoved?.()
      showToast("Removed", "success")
    } else {
      showToast(result.error ?? "Couldn't remove the file.", "error")
    }
    return result
  }

  const url = publicAssetUrl(current)

  return (
    <div className={styles.field}>
      {!multiple && current && (
        <div className={styles.current}>
          {isImagePath(current) && url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt="" className={styles.preview} loading="lazy" />
          ) : isVideoPath(current) && url ? (
            <video src={url} className={styles.preview} muted playsInline preload="metadata" />
          ) : (
            <span className={styles.fileBadge}>{(current.split(".").pop() ?? "file").toUpperCase()}</span>
          )}
          <span className={styles.currentName} title={current}>
            {current.split("/").pop()}
          </span>
          <span className={styles.currentActions}>
            {url && (
              <a href={url} target="_blank" rel="noreferrer" className="btn btn-sm">
                View
              </a>
            )}
            {removable && (
              <button type="button" className="btn btn-sm" onClick={() => removeRef.current?.open()} disabled={busy}>
                Remove
              </button>
            )}
          </span>
        </div>
      )}

      <div
        className="dropzone"
        data-active={dragActive ? "true" : "false"}
        data-disabled={disabled ? "true" : undefined}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled}
        onClick={() => !disabled && inputRef.current?.click()}
        onKeyDown={(e) => {
          if (!disabled && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault()
            inputRef.current?.click()
          }
        }}
        onDragOver={(e) => {
          e.preventDefault()
          if (!disabled) setDragActive(true)
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={onDrop}
      >
        <input
          ref={inputRef}
          type="file"
          accept={acceptFor(kind)}
          multiple={multiple}
          className="visually-hidden"
          tabIndex={-1}
          disabled={disabled}
          onChange={(e) => {
            pick(e.target.files)
            e.target.value = ""
          }}
        />
        <p className={styles.dropLabel}>
          {!recordId
            ? disabledReason
            : busy
              ? "Uploading…"
              : current && !multiple
                ? "Drop a file to replace, or click to browse"
                : `Drop ${multiple ? "files" : "a file"} here, or click to browse`}
        </p>
        <p className={styles.hint}>{hintFor(kind)}</p>
      </div>

      {status !== "idle" && (
        <div className={styles.status} role="status" aria-live="polite">
          <div className={styles.statusRow}>
            <span className={styles.fileName}>{label}</span>
            {status === "uploading" && (
              <span className={styles.statusRight}>
                <span className={styles.pct}>{Math.round(progress * 100)}%</span>
                <button type="button" className="btn btn-sm" onClick={() => abortRef.current?.abort()}>
                  Cancel
                </button>
              </span>
            )}
            {status === "done" && <span className={styles.ok}>Uploaded</span>}
            {status === "error" && (
              <button type="button" className="btn btn-sm" onClick={() => run(lastFiles.current)}>
                Retry
              </button>
            )}
          </div>
          {status === "uploading" && (
            <div className={styles.track}>
              <div className={styles.bar} style={{ transform: `scaleX(${progress})` }} />
            </div>
          )}
          {status === "error" && error && <p className={styles.err}>{error}</p>}
        </div>
      )}

      {removable && (
        <ConfirmDialog
          ref={removeRef}
          title="Remove this file?"
          description="It's cleared from this item and deleted from Storage."
          confirmLabel="Remove"
          onConfirm={remove}
        />
      )}
    </div>
  )
}
