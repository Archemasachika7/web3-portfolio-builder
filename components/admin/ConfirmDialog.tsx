"use client"

import { forwardRef, useId, useImperativeHandle, useRef, useState } from "react"
import styles from "./ConfirmDialog.module.css"

const CLOSE_MS = 140 // matches dialog-out in ConfirmDialog.module.css

export interface ConfirmDialogHandle {
  open: () => void
}

interface ConfirmDialogProps {
  title: string
  description: string
  confirmLabel?: string
  tone?: "danger" | "default"
  /**
   * May be async. The dialog stays open showing "Working…" until it
   * settles; a result of `{ ok: false, error }` (or a thrown error) keeps
   * it open with the message, so nothing fails silently.
   */
  onConfirm: () => unknown
}

const ConfirmDialog = forwardRef<ConfirmDialogHandle, ConfirmDialogProps>(function ConfirmDialog(
  { title, description, confirmLabel = "Delete", tone = "danger", onConfirm },
  ref
) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const busyRef = useRef(false)
  const titleId = useId()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function setWorking(value: boolean) {
    busyRef.current = value
    setBusy(value)
  }

  useImperativeHandle(ref, () => ({
    open: () => {
      const d = dialogRef.current
      if (!d || d.open) return
      delete d.dataset.closing
      setError(null)
      setWorking(false)
      d.showModal()
    }
  }))

  // Play the exit before the native close, so the dialog settles away
  // instead of vanishing.
  function close() {
    const d = dialogRef.current
    if (!d || d.dataset.closing || busyRef.current) return
    d.dataset.closing = "true"
    setTimeout(() => {
      d.close()
      delete d.dataset.closing
    }, CLOSE_MS)
  }

  async function confirm() {
    if (busyRef.current) return
    setWorking(true)
    setError(null)
    try {
      const result = await onConfirm()
      if (result && typeof result === "object" && (result as { ok?: boolean }).ok === false) {
        setError((result as { error?: string | null }).error ?? "That didn't work. Try again.")
        return
      }
      busyRef.current = false
      close()
    } catch (e) {
      if (String((e as { digest?: unknown })?.digest ?? "").startsWith("NEXT_REDIRECT")) throw e
      console.error(e)
      setError("Something went wrong. Try again, or reload the page.")
    } finally {
      setWorking(false)
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      aria-labelledby={titleId}
      // A click on the backdrop lands on the <dialog> itself.
      onClick={(e) => {
        if (e.target === e.currentTarget) close()
      }}
      onCancel={(e) => {
        e.preventDefault()
        close()
      }}
    >
      <h2 id={titleId} className={styles.title}>
        {title}
      </h2>
      <p className={styles.description}>{description}</p>
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
      <div className={styles.actions}>
        <button type="button" className="btn" onClick={close} disabled={busy}>
          Cancel
        </button>
        <button
          type="button"
          className={tone === "danger" ? "btn btn-danger" : "btn btn-primary"}
          onClick={confirm}
          disabled={busy}
        >
          {busy ? "Working…" : confirmLabel}
        </button>
      </div>
    </dialog>
  )
})

export default ConfirmDialog
