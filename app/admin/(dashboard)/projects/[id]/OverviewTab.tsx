"use client"

import { useState, useTransition } from "react"
import type { ProjectDetail } from "../actions"
import { updateProjectOverview } from "../actions"
import { useToast } from "@/components/admin/Toast"
import styles from "./editor.module.css"

export default function OverviewTab({ project }: { project: ProjectDetail }) {
  const { showToast } = useToast()
  const [pending, startTransition] = useTransition()

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await updateProjectOverview(project.id, formData)
      showToast(result.ok ? "Saved" : result.error ?? "Save failed", result.ok ? "success" : "error")
    })
  }

  return (
    <form action={handleSubmit} className={styles.form}>
      <div className={styles.grid2}>
        <div className="field">
          <label htmlFor="title">Title</label>
          <input id="title" name="title" defaultValue={project.title} required className="input" />
        </div>
        <div className="field">
          <label htmlFor="slug">Slug</label>
          <input id="slug" name="slug" defaultValue={project.slug} required className="input" />
          <span className="field-hint">Used in the public URL: /work/{project.slug}</span>
        </div>
      </div>

      <div className="field">
        <label htmlFor="short_bio">Short bio</label>
        <textarea id="short_bio" name="short_bio" defaultValue={project.short_bio ?? ""} className="textarea" rows={2} />
      </div>

      <div className="field">
        <label htmlFor="long_description">Long description</label>
        <textarea
          id="long_description"
          name="long_description"
          defaultValue={project.long_description ?? ""}
          className="textarea"
          rows={8}
        />
      </div>

      <div className={styles.grid3}>
        <div className="field">
          <label htmlFor="year">Year</label>
          <input id="year" name="year" type="number" defaultValue={project.year ?? ""} className="input" />
        </div>
        <div className="field">
          <label htmlFor="role">Role</label>
          <input id="role" name="role" defaultValue={project.role ?? ""} className="input" />
        </div>
        <div className="field">
          <label htmlFor="status">Status</label>
          <select id="status" name="status" defaultValue={project.status} className="select">
            <option value="draft">Draft</option>
            <option value="in-progress">In progress</option>
            <option value="complete">Complete</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>

      <span className="label">LINKS</span>
      <div className={styles.grid2}>
        <div className="field">
          <label htmlFor="project_url">Project URL</label>
          <input id="project_url" name="project_url" defaultValue={project.project_url ?? ""} className="input" />
        </div>
        <div className="field">
          <label htmlFor="github_url">GitHub URL</label>
          <input id="github_url" name="github_url" defaultValue={project.github_url ?? ""} className="input" />
        </div>
        <div className="field">
          <label htmlFor="live_url">Live URL</label>
          <input id="live_url" name="live_url" defaultValue={project.live_url ?? ""} className="input" />
        </div>
        <div className="field">
          <label htmlFor="documentation_url">Documentation URL</label>
          <input
            id="documentation_url"
            name="documentation_url"
            defaultValue={project.documentation_url ?? ""}
            className="input"
          />
        </div>
      </div>
      <p className="field-hint">Empty link fields are simply not shown on the public site — no need to remove unused ones.</p>

      <div className={styles.saveRow}>
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending ? "Saving…" : "Save"}
        </button>
      </div>
    </form>
  )
}
