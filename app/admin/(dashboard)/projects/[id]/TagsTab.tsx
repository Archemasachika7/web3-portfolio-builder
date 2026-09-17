"use client"

import { useMemo, useState, useTransition } from "react"
import type { ProjectDetail } from "../actions"
import { setProjectTags } from "../actions"
import { useToast } from "@/components/admin/Toast"
import type { Tag } from "@/shared/database.types"
import styles from "./editor.module.css"

export default function TagsTab({ project, allTags }: { project: ProjectDetail; allTags: Tag[] }) {
  const { showToast } = useToast()
  const [pending, startTransition] = useTransition()
  const [selected, setSelected] = useState<Set<string>>(new Set(project.tags.map((t) => t.id)))

  const grouped = useMemo(() => {
    const groups = new Map<string, Tag[]>()
    for (const tag of allTags) {
      const key = tag.type ?? "Other"
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key)!.push(tag)
    }
    return groups
  }, [allTags])

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function handleSave() {
    startTransition(async () => {
      const result = await setProjectTags(project.id, [...selected])
      showToast(result.ok ? "Tags saved" : result.error ?? "Save failed", result.ok ? "success" : "error")
    })
  }

  if (allTags.length === 0) {
    return <p className="field-hint">No tags exist yet. Create some in Tags first.</p>
  }

  return (
    <div className={styles.form}>
      {[...grouped.entries()].map(([type, tags]) => (
        <div key={type}>
          <span className="label">{type.toUpperCase()}</span>
          <div className={styles.tagGrid}>
            {tags.map((tag) => (
              <label key={tag.id} className={styles.tagCheckbox} data-checked={selected.has(tag.id)}>
                <input
                  type="checkbox"
                  checked={selected.has(tag.id)}
                  onChange={() => toggle(tag.id)}
                />
                {tag.name}
              </label>
            ))}
          </div>
        </div>
      ))}
      <div className={styles.saveRow}>
        <button type="button" className="btn btn-primary" onClick={handleSave} disabled={pending}>
          {pending ? "Saving…" : "Save tags"}
        </button>
      </div>
    </div>
  )
}
