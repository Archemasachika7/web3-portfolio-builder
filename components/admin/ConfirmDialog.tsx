"use client"

import { forwardRef, useImperativeHandle, useRef } from "react"
import styles from "./ConfirmDialog.module.css"

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

  useImperativeHandle(ref, () => ({
    open: () => dialogRef.current?.showModal()
  }))

  return (
    <dialog ref={dialogRef} className={styles.dialog}>
      <h2 className={styles.title}>{title}</h2>
      <p className={styles.description}>{description}</p>
      <div className={styles.actions}>
        <button type="button" className="btn" onClick={() => dialogRef.current?.close()}>
          Cancel
        </button>
        <button
          type="button"
          className={tone === "danger" ? "btn btn-danger" : "btn btn-primary"}
          onClick={() => {
            dialogRef.current?.close()
            onConfirm()
          }}
        >
          {confirmLabel}
        </button>
      </div>
    </dialog>
  )
})

export default ConfirmDialog
