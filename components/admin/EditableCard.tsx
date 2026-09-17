"use client"

import { useRef, useState } from "react"
import { useToast } from "./Toast"
import ConfirmDialog, { type ConfirmDialogHandle } from "./ConfirmDialog"
import styles from "./EditableCard.module.css"

export interface EditableCardProps {
  summary: React.ReactNode
  badge?: React.ReactNode
  /** Rendered inside the expanded <form> — pass your field inputs. */
  children: React.ReactNode
  onSave: (formData: FormData) => Promise<{ ok: boolean; error: string | null }>
  onDelete: () => Promise<{ ok: boolean; error: string | null }>
  deleteWarning?: string
  startOpen?: boolean
}

export default function EditableCard({
  summary,
  badge,
  children,
  onSave,
  onDelete,
  deleteWarning = "This cannot be undone.",
  startOpen = false
}: EditableCardProps) {
  const [open, setOpen] = useState(startOpen)
  const [pending, setPending] = useState(false)
  const { showToast } = useToast()
  const deleteDialogRef = useRef<ConfirmDialogHandle>(null)

  async function handleSubmit(formData: FormData) {
    setPending(true)
    const result = await onSave(formData)
    setPending(false)
    showToast(result.ok ? "Saved" : result.error ?? "Save failed", result.ok ? "success" : "error")
    if (result.ok) setOpen(false)
  }

  return (
    <div className={`card ${styles.card}`}>
      <button type="button" className={styles.summaryRow} onClick={() => setOpen((v) => !v)}>
        <span className={styles.summary}>{summary}</span>
        <span className={styles.summaryRight}>
          {badge}
          <span className={styles.chevron} data-open={open}>
            ▾
          </span>
        </span>
      </button>

      {open && (
        <form action={handleSubmit} className={styles.form}>
          {children}
          <div className={styles.formActions}>
            <button
              type="button"
              className="btn btn-danger"
              onClick={() => deleteDialogRef.current?.open()}
            >
              Delete
            </button>
            <div className={styles.formActionsRight}>
              <button type="button" className="btn" onClick={() => setOpen(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={pending}>
                {pending ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </form>
      )}

      <ConfirmDialog
        ref={deleteDialogRef}
        title="Delete this entry?"
        description={deleteWarning}
        onConfirm={async () => {
          const result = await onDelete()
          showToast(result.ok ? "Deleted" : result.error ?? "Delete failed", result.ok ? "success" : "error")
        }}
      />
    </div>
  )
}
