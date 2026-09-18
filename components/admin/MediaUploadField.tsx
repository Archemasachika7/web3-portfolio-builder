"use client"

import { useRef, useState, type DragEvent } from "react"
import styles from "./MediaUploadField.module.css"

type Status = "idle" | "uploading" | "complete" | "failed"

export interface MediaUploadFieldProps {
  accept: string
  hint: string
  /** Storage folder passed through to /api/upload, e.g. `PROJECTS/{slug}/media`. */
  folder: string
  allowedTypesKey: "video" | "image-or-video" | "model" | "image-video-or-model"
  /** Give multi-file collections a unique object key so concurrent uploads never overwrite each other. */
  unique?: boolean
  filenameOverride?: string | ((file: File) => string)
  onUploaded: (path: string, file: File) => void | Promise<void>
  currentLabel?: string | null
  disabled?: boolean
}

/**
 * Same visual contract as FileDropzone, but uploads via XMLHttpRequest
 * against /api/upload instead of a Server Action. Server Actions transport
 * over fetch(), which has no upload-progress event, so large video files
 * would otherwise show only an indeterminate "Uploading…" state — this
 * reports real, byte-level percentages via xhr.upload.onprogress.
 */
export default function MediaUploadField({
  accept,
  hint,
  folder,
  allowedTypesKey,
  unique,
  filenameOverride,
  onUploaded,
  currentLabel,
  disabled
}: MediaUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragActive, setDragActive] = useState(false)
  const [status, setStatus] = useState<Status>("idle")
  const [fileName, setFileName] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  function handleFile(file: File) {
    setFileName(file.name)
    setStatus("uploading")
    setProgress(0)
    setError(null)

    const formData = new FormData()
    formData.set("file", file)
    formData.set("folder", folder)
    formData.set("allowedTypesKey", allowedTypesKey)
    if (unique) formData.set("unique", "true")
    const resolvedFilename =
      typeof filenameOverride === "function" ? filenameOverride(file) : filenameOverride
    if (resolvedFilename) formData.set("filenameOverride", resolvedFilename)

    const xhr = new XMLHttpRequest()
    xhr.open("POST", "/api/upload")

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        setProgress(Math.round((event.loaded / event.total) * 100))
      }
    }

    xhr.onload = () => {
      let result: { path: string | null; error: string | null }
      try {
        result = JSON.parse(xhr.responseText)
      } catch {
        result = { path: null, error: "Unexpected response from upload server." }
      }
      if (xhr.status >= 200 && xhr.status < 300 && result.path) {
        setProgress(100)
        setStatus("complete")
        onUploaded(result.path, file)
      } else {
        setStatus("failed")
        setError(result.error ?? "Upload failed.")
      }
    }

    xhr.onerror = () => {
      setStatus("failed")
      setError("Network error during upload.")
    }

    xhr.send(formData)
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setDragActive(false)
    if (disabled) return
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  return (
    <div>
      <div
        className="dropzone"
        data-active={dragActive ? "true" : "false"}
        role="button"
        tabIndex={0}
        onClick={() => !disabled && inputRef.current?.click()}
        onKeyDown={(e) => {
          if (!disabled && (e.key === "Enter" || e.key === " ")) inputRef.current?.click()
        }}
        onDragOver={(e) => {
          e.preventDefault()
          if (!disabled) setDragActive(true)
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={onDrop}
        aria-disabled={disabled}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="visually-hidden"
          disabled={disabled}
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleFile(file)
            e.target.value = ""
          }}
        />
        <p className={styles.dropLabel}>Drop file here or click to browse</p>
        <p className={styles.hint}>{hint}</p>
      </div>

      {currentLabel && status === "idle" && (
        <p className={styles.current}>Current: {currentLabel}</p>
      )}

      {status !== "idle" && (
        <div className={styles.status}>
          <div className={styles.statusRow}>
            <span className={styles.fileName}>{fileName}</span>
            {status === "uploading" && <span className={styles.pct}>{progress}%</span>}
            {status === "complete" && <span className={styles.ok}>Complete</span>}
            {status === "failed" && <span className={styles.err}>{error}</span>}
          </div>
          {status === "uploading" && (
            <div className={styles.track}>
              <div className={styles.bar} style={{ width: `${progress}%` }} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
