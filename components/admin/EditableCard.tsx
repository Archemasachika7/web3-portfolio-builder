"use client"

import { useEffect, useId, useRef, useState } from "react"
import { useToast } from "./Toast"
import ConfirmDialog, { type ConfirmDialogHandle } from "./ConfirmDialog"
import Icon from "./Icon"
import styles from "./EditableCard.module.css"

const CLOSE_MS = 300 // matches the panel transition in EditableCard.module.css

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
  // The form stays mounted through the closing animation, then unmounts —
  // so Cancel still discards unsaved edits, exactly as before.
  const [mounted, setMounted] = useState(startOpen)
  const [expanded, setExpanded] = useState(startOpen)
  const [pending, setPending] = useState(false)
  const { showToast } = useToast()
  const deleteDialogRef = useRef<ConfirmDialogHandle>(null)
  const panelId = useId()

  useEffect(() => {
    if (open) {
      setMounted(true)
      // Two frames: let the collapsed panel paint before it expands.
      let inner = 0
      const outer = requestAnimationFrame(() => {
        inner = requestAnimationFrame(() => setExpanded(true))
      })
      return () => {
        cancelAnimationFrame(outer)
        cancelAnimationFrame(inner)
      }
    }
    setExpanded(false)
    const t = setTimeout(() => setMounted(false), CLOSE_MS)
    return () => clearTimeout(t)
  }, [open])

  async function handleSubmit(formData: FormData) {
    setPending(true)
    const result = await onSave(formData)
    setPending(false)
    showToast(result.ok ? "Saved" : result.error ?? "Save failed", result.ok ? "success" : "error")
    if (result.ok) setOpen(false)
  }

  return (
    <div className={`card ${styles.card}`} data-open={open}>
      {/* The toggle and the badge's controls are siblings, not nested:
          a button inside a button is invalid HTML and breaks hydration. */}
      <div className={styles.summaryRow}>
        <button
          type="button"
          className={styles.toggle}
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls={panelId}
        >
          <span className={styles.summary}>{summary}</span>
        </button>
        <span className={styles.summaryRight}>
          {badge}
          <button
            type="button"
            className={styles.chevronBtn}
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls={panelId}
            aria-label={open ? "Collapse" : "Expand"}
          >
            <Icon name="chevron" size={16} className={styles.chevron} />
          </button>
        </span>
      </div>

      <div id={panelId} className={styles.panel} data-expanded={expanded}>
        <div className={styles.panelInner}>
          {mounted && (
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
        </div>
      </div>

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
