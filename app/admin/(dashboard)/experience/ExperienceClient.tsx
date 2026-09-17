"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import EditableCard from "@/components/admin/EditableCard"
import FileDropzone from "@/components/admin/FileDropzone"
import { useToast } from "@/components/admin/Toast"
import { IMAGE_TYPES } from "@/lib/storageConstants"
import { createExperience, updateExperience, deleteExperience, reorderExperience, uploadExperienceLogo } from "./actions"
import type { ExperienceWithTags } from "./actions"
import type { Tag } from "@/shared/database.types"
import styles from "../shared-list.module.css"

export default function ExperienceClient({
  experience: initial,
  allTags
}: {
  experience: ExperienceWithTags[]
  allTags: Tag[]
}) {
  const [items, setItems] = useState(initial)
  const { showToast } = useToast()
  const router = useRouter()

  async function move(index: number, direction: -1 | 1) {
    const next = [...items]
    const target = index + direction
    if (target < 0 || target >= next.length) return
    ;[next[index], next[target]] = [next[target], next[index]]
    setItems(next)
    await reorderExperience(next.map((e) => e.id))
  }

  return (
    <div className={styles.page}>
      <div className={styles.toolbar}>
        <button
          type="button"
          className="btn btn-primary"
          onClick={async () => {
            const result = await createExperience()
            if (result.ok) router.refresh()
            else showToast(result.error ?? "Failed", "error")
          }}
        >
          Add experience entry
        </button>
      </div>

      {items.length === 0 ? (
        <p className={styles.empty}>No experience entries yet.</p>
      ) : (
        <div className={styles.list}>
          {items.map((exp, index) => (
            <EditableCard
              key={exp.id}
              summary={`${exp.role} — ${exp.organization}`}
              badge={
                <>
                  <button type="button" className="btn" disabled={index === 0} onClick={(e) => { e.stopPropagation(); move(index, -1) }}>
                    ↑
                  </button>
                  <button type="button" className="btn" disabled={index === items.length - 1} onClick={(e) => { e.stopPropagation(); move(index, 1) }}>
                    ↓
                  </button>
                  <span className={`badge ${exp.published ? "badge-published" : "badge-draft"}`}>
                    {exp.published ? "Published" : "Draft"}
                  </span>
                </>
              }
              onSave={(fd) => updateExperience(exp.id, fd)}
              onDelete={async () => {
                const result = await deleteExperience(exp.id)
                if (result.ok) setItems((prev) => prev.filter((e) => e.id !== exp.id))
                return result
              }}
              deleteWarning={`Remove ${exp.role} at ${exp.organization}.`}
            >
              <div className="grid-2">
                <div className="field">
                  <label>Organization</label>
                  <input name="organization" defaultValue={exp.organization} className="input" required />
                </div>
                <div className="field">
                  <label>Role</label>
                  <input name="role" defaultValue={exp.role} className="input" required />
                </div>
                <div className="field">
                  <label>Employment type</label>
                  <select name="employment_type" defaultValue={exp.employment_type ?? ""} className="select">
                    <option value="">—</option>
                    <option value="full-time">Full-time</option>
                    <option value="internship">Internship</option>
                    <option value="contract">Contract</option>
                    <option value="freelance">Freelance</option>
                    <option value="volunteer">Volunteer</option>
                  </select>
                </div>
                <div className="field">
                  <label>Location</label>
                  <input name="location" defaultValue={exp.location ?? ""} className="input" />
                </div>
              </div>

              <div className="grid-3">
                <div className="field">
                  <label>Start date</label>
                  <input name="start_date" type="date" defaultValue={exp.start_date ?? ""} className="input" />
                </div>
                <div className="field">
                  <label>End date</label>
                  <input name="end_date" type="date" defaultValue={exp.end_date ?? ""} className="input" />
                </div>
                <label className="checkbox-row" style={{ alignSelf: "flex-end", paddingBottom: 9 }}>
                  <input type="checkbox" name="current" defaultChecked={exp.current} />
                  Current role
                </label>
              </div>

              <div className="field">
                <label>Short description</label>
                <textarea name="short_description" defaultValue={exp.short_description ?? ""} className="textarea" rows={2} />
              </div>
              <div className="field">
                <label>Long description</label>
                <textarea name="long_description" defaultValue={exp.long_description ?? ""} className="textarea" rows={5} />
              </div>
              <div className="field">
                <label>Website</label>
                <input name="website_url" defaultValue={exp.website_url ?? ""} className="input" />
              </div>

              <div className="field">
                <label>Tags</label>
                <div className={styles.tagRow}>
                  {allTags.map((tag) => (
                    <label key={tag.id} className={styles.tagCheck}>
                      <input
                        type="checkbox"
                        name="tag_ids"
                        value={tag.id}
                        defaultChecked={exp.tags.some((t) => t.id === tag.id)}
                      />
                      {tag.name}
                    </label>
                  ))}
                </div>
              </div>

              <div className="field">
                <label>Logo</label>
                <FileDropzone
                  accept={IMAGE_TYPES.join(",")}
                  hint="JPG / PNG / WEBP"
                  currentLabel={exp.logo_path}
                  onUpload={(file) => uploadExperienceLogo(exp.id, exp.logo_path, file)}
                />
              </div>

              <label className="checkbox-row">
                <input type="checkbox" name="published" defaultChecked={exp.published} />
                Published
              </label>
            </EditableCard>
          ))}
        </div>
      )}
    </div>
  )
}
