"use client"

import { useRef, useState, type DragEvent } from "react"
import styles from "./FileDropzone.module.css"

type Status = "idle" | "uploading" | "complete" | "failed"

export interface FileDropzoneProps {
  accept: string
  hint: string
  /** Runs the actual Server Action upload; returns the new storage path or an error. */
  onUpload: (file: File) => Promise<{ path: string | null; error: string | null }>
  onUploaded?: (path: string) => void
  currentLabel?: string | null
  disabled?: boolean
}

export default function FileDropzone({
  accept,
  hint,
  onUpload,
  onUploaded,
  currentLabel,
  disabled
}: FileDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragActive, setDragActive] = useState(false)
  const [status, setStatus] = useState<Status>("idle")
  const [fileName, setFileName] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleFile(file: File) {
    setFileName(file.name)
    setStatus("uploading")
    setError(null)
    const result = await onUpload(file)
    if (result.error || !result.path) {
      setStatus("failed")
      setError(result.error ?? "Upload failed.")
      return
    }
    setStatus("complete")
    onUploaded?.(result.path)
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
          <span className={styles.fileName}>{fileName}</span>
          {status === "uploading" && <span className="label">Uploading…</span>}
          {status === "complete" && <span className={styles.ok}>Complete</span>}
          {status === "failed" && <span className={styles.err}>{error}</span>}
        </div>
      )}
    </div>
  )
}
