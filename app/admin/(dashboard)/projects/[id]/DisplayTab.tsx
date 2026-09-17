"use client"

import { useTransition } from "react"
import type { ProjectDetail } from "../actions"
import { updateProjectDisplay } from "../actions"
import { useToast } from "@/components/admin/Toast"
import styles from "./editor.module.css"

export default function DisplayTab({ project }: { project: ProjectDetail }) {
  const { showToast } = useToast()
  const [pending, startTransition] = useTransition()

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await updateProjectDisplay(project.id, formData)
      showToast(result.ok ? "Saved" : result.error ?? "Save failed", result.ok ? "success" : "error")
    })
  }

  return (
    <form action={handleSubmit} className={styles.form}>
      <label className="checkbox-row">
        <input type="checkbox" name="featured" defaultChecked={project.featured} />
        Featured on the homepage
      </label>

      <div className="field">
        <label htmlFor="sort_order">Sort order</label>
        <input
          id="sort_order"
          name="sort_order"
          type="number"
          defaultValue={project.sort_order}
          className="input"
        />
        <span className="field-hint">Lower numbers appear first.</span>
      </div>

      <p className="field-hint">
        Publish state is controlled from the header above, not here — publishing is validated
        against the required-fields checklist first.
      </p>

      <div className={styles.saveRow}>
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending ? "Saving…" : "Save"}
        </button>
      </div>
    </form>
  )
}
