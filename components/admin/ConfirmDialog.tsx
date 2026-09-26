"use client"

import { forwardRef, useId, useImperativeHandle, useRef } from "react"
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
  onConfirm: () => void
}

const ConfirmDialog = forwardRef<ConfirmDialogHandle, ConfirmDialogProps>(function ConfirmDialog(
  { title, description, confirmLabel = "Delete", tone = "danger", onConfirm },
  ref
) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const titleId = useId()

  useImperativeHandle(ref, () => ({
    open: () => {
      const d = dialogRef.current
      if (!d) return
      delete d.dataset.closing
      d.showModal()
    }
  }))

  // Play the exit before the native close, so the dialog settles away
  // instead of vanishing.
  function close(then?: () => void) {
    const d = dialogRef.current
    if (!d || d.dataset.closing) return
    d.dataset.closing = "true"
    setTimeout(() => {
      d.close()
      delete d.dataset.closing
      then?.()
    }, CLOSE_MS)
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
      <div className={styles.actions}>
        <button type="button" className="btn" onClick={() => close()}>
          Cancel
        </button>
        <button
          type="button"
          className={tone === "danger" ? "btn btn-danger" : "btn btn-primary"}
          onClick={() => close(onConfirm)}
        >
          {confirmLabel}
        </button>
      </div>
    </dialog>
  )
})

export default ConfirmDialog
