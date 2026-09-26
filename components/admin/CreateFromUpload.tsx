"use client"

import { useRef, useState, type DragEvent } from "react"
import { useRouter } from "next/navigation"
import { directUpload } from "@/lib/directUpload"
import { callAction } from "@/lib/callAction"
import { acceptFor, type UploadKind } from "@/lib/uploadKinds"
import { useToast } from "./Toast"
import styles from "./UploadField.module.css"

type Outcome = { ok: boolean; error: string | null; id?: string }

export interface CreateFromUploadProps {
  /** Which upload slot a given file goes into (e.g. picture vs PDF). */
  kindFor: (file: File) => UploadKind
  /** Kinds accepted by the picker, for its `accept` attribute. */
  kinds: UploadKind[]
  label: string
  hint: string
  /** Creates the row the file belongs to. */
  create: (fileName: string) => Promise<Outcome>
  /** Runs after the file is in place (e.g. publish). */
  finish?: (id: string) => Promise<Outcome>
  /** Removes the row again if the upload fails. */
  discard?: (id: string) => Promise<Outcome>
  onCreated?: (id: string) => void
  successMessage?: string
}

/**
 * "Drop a file and it's posted": creates the entry, uploads the file into
 * it and finishes it in one go, so a PDF resume or a certificate picture
 * doesn't need a form filled in first.
 */
export default function CreateFromUpload({
  kindFor,
  kinds,
  label,
  hint,
  create,
  finish,
  discard,
  onCreated,
  successMessage = "Posted"
}: CreateFromUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const runningRef = useRef(false)
  const abortRef = useRef<AbortController | null>(null)
  const router = useRouter()
  const { showToast } = useToast()
  const [status, setStatus] = useState<"idle" | "working" | "done" | "error">("idle")
  const [progress, setProgress] = useState(0)
  const [fileName, setFileName] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)

  const accept = Array.from(new Set(kinds.flatMap((k) => acceptFor(k).split(",")))).join(",")
  const busy = status === "working"

  async function run(file: File) {
    if (runningRef.current) return
    runningRef.current = true
    setFileName(file.name)
    setStatus("working")
    setError(null)
    setProgress(0)
    const controller = new AbortController()
    abortRef.current = controller

    let failure: string | null = null
    let createdId: string | undefined
    try {
      const created = await callAction(() => create(file.name))
      createdId = "id" in created ? created.id : undefined
      if (!created.ok || !createdId) {
        failure = created.error ?? "Couldn't create the entry."
      } else {
        const id = createdId
        const up = await directUpload({ kind: kindFor(file), recordId: id, file, signal: controller.signal, onProgress: setProgress })
        if (!up.ok) {
          failure = up.error
        } else if (finish) {
          const done = await callAction(() => finish(id))
          if (!done.ok) failure = done.error ?? "Uploaded, but couldn't publish it."
        }
      }
    } catch (e) {
      console.error(e)
      failure = "Something went wrong. Try again."
    } finally {
      abortRef.current = null
      runningRef.current = false
    }

    if (failure) {
      // Don't leave an empty entry behind for a failed upload.
      if (createdId && discard) await callAction(() => discard(createdId as string))
      setStatus("error")
      setError(failure)
      if (failure !== "Upload cancelled.") showToast(failure, "error")
      return
    }

    setStatus("done")
    showToast(successMessage, "success")
    if (createdId) onCreated?.(createdId)
    router.refresh()
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setDragActive(false)
    const file = e.dataTransfer.files?.[0]
    if (file && !busy) run(file)
  }

  return (
    <div className={styles.field}>
      <div
        className="dropzone"
        data-active={dragActive ? "true" : "false"}
        data-disabled={busy ? "true" : undefined}
        role="button"
        tabIndex={busy ? -1 : 0}
        aria-disabled={busy}
        onClick={() => !busy && inputRef.current?.click()}
        onKeyDown={(e) => {
          if (!busy && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault()
            inputRef.current?.click()
          }
        }}
        onDragOver={(e) => {
          e.preventDefault()
          if (!busy) setDragActive(true)
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={onDrop}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="visually-hidden"
          tabIndex={-1}
          disabled={busy}
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) run(file)
            e.target.value = ""
          }}
        />
        <p className={styles.dropLabel}>{busy ? "Uploading…" : label}</p>
        <p className={styles.hint}>{hint}</p>
      </div>

      {status !== "idle" && (
        <div className={styles.status} role="status" aria-live="polite">
          <div className={styles.statusRow}>
            <span className={styles.fileName}>{fileName}</span>
            {busy && (
              <span className={styles.statusRight}>
                <span className={styles.pct}>{Math.round(progress * 100)}%</span>
                <button type="button" className="btn btn-sm" onClick={() => abortRef.current?.abort()}>
                  Cancel
                </button>
              </span>
            )}
            {status === "done" && <span className={styles.ok}>Posted</span>}
          </div>
          {busy && (
            <div className={styles.track}>
              <div className={styles.bar} style={{ transform: `scaleX(${progress})` }} />
            </div>
          )}
          {status === "error" && error && <p className={styles.err}>{error}</p>}
        </div>
      )}
    </div>
  )
}
