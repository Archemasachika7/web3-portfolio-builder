"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import EditableCard from "@/components/admin/EditableCard"
import FileDropzone from "@/components/admin/FileDropzone"
import { useToast } from "@/components/admin/Toast"
import { IMAGE_TYPES } from "@/lib/storageConstants"
import { publicAssetUrl } from "@/lib/publicUrl"
import { createEducation, updateEducation, deleteEducation, reorderEducation, uploadEducationLogo } from "./actions"
import type { Education } from "@/shared/database.types"
import styles from "../shared-list.module.css"

export default function EducationClient({ education: initial }: { education: Education[] }) {
  const [items, setItems] = useState(initial)
  const { showToast } = useToast()
  const router = useRouter()

  async function move(index: number, direction: -1 | 1) {
    const next = [...items]
    const target = index + direction
    if (target < 0 || target >= next.length) return
    ;[next[index], next[target]] = [next[target], next[index]]
    setItems(next)
    await reorderEducation(next.map((e) => e.id))
  }

  return (
    <div className={styles.page}>
      <div className={styles.toolbar}>
        <button
          type="button"
          className="btn btn-primary"
          onClick={async () => {
            const result = await createEducation()
            if (result.ok) router.refresh()
            else showToast(result.error ?? "Failed", "error")
          }}
        >
          Add education entry
        </button>
      </div>

      {items.length === 0 ? (
        <p className={styles.empty}>No education entries yet.</p>
      ) : (
        <div className={styles.list}>
          {items.map((edu, index) => (
            <EditableCard
              key={edu.id}
              summary={`${edu.institution}${edu.field ? " — " + edu.field : ""}`}
              badge={
                <>
                  <button
                    type="button"
                    className="btn"
                    disabled={index === 0}
                    onClick={(e) => {
                      e.stopPropagation()
                      move(index, -1)
                    }}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    className="btn"
                    disabled={index === items.length - 1}
                    onClick={(e) => {
                      e.stopPropagation()
                      move(index, 1)
                    }}
                  >
                    ↓
                  </button>
                  <span className={`badge ${edu.published ? "badge-published" : "badge-draft"}`}>
                    {edu.published ? "Published" : "Draft"}
                  </span>
                </>
              }
              onSave={(fd) => updateEducation(edu.id, fd)}
              onDelete={async () => {
                const result = await deleteEducation(edu.id)
                if (result.ok) setItems((prev) => prev.filter((e) => e.id !== edu.id))
                return result
              }}
              deleteWarning={`Remove ${edu.institution} from the education timeline. This cannot be undone.`}
            >
              <div className="grid-2">
                <div className="field">
                  <label>Institution</label>
                  <input name="institution" defaultValue={edu.institution} className="input" required />
                </div>
                <div className="field">
                  <label>Degree</label>
                  <input name="degree" defaultValue={edu.degree ?? ""} className="input" />
                </div>
                <div className="field">
                  <label>Field</label>
                  <input name="field" defaultValue={edu.field ?? ""} className="input" />
                </div>
                <div className="field">
                  <label>Program</label>
                  <input name="program" defaultValue={edu.program ?? ""} className="input" />
                </div>
                <div className="field">
                  <label>Location</label>
                  <input name="location" defaultValue={edu.location ?? ""} className="input" />
                </div>
                <div className="field">
                  <label>Website</label>
                  <input name="website_url" defaultValue={edu.website_url ?? ""} className="input" />
                </div>
              </div>

              <div className="grid-3">
                <div className="field">
                  <label>Start year</label>
                  <input name="start_year" type="number" defaultValue={edu.start_year ?? ""} className="input" />
                </div>
                <div className="field">
                  <label>End year</label>
                  <input name="end_year" type="number" defaultValue={edu.end_year ?? ""} className="input" />
                </div>
                <label className="checkbox-row" style={{ alignSelf: "flex-end", paddingBottom: 9 }}>
                  <input type="checkbox" name="current" defaultChecked={edu.current} />
                  Currently attending
                </label>
              </div>

              <div className="grid-3">
                <div className="field">
                  <label>CGPA</label>
                  <input name="cgpa" defaultValue={edu.cgpa ?? ""} className="input" />
                </div>
                <div className="field">
                  <label>Grade</label>
                  <input name="grade" defaultValue={edu.grade ?? ""} className="input" />
                </div>
                <div className="field">
                  <label>Score / Rank</label>
                  <input name="score" defaultValue={edu.score ?? ""} className="input" placeholder="Score" />
                </div>
              </div>
              <div className="field">
                <label>Rank</label>
                <input name="rank" defaultValue={edu.rank ?? ""} className="input" />
              </div>

              <div className="field">
                <label>Description</label>
                <textarea name="description" defaultValue={edu.description ?? ""} className="textarea" rows={3} />
              </div>

              <div className="field">
                <label>Logo</label>
                <FileDropzone
                  accept={IMAGE_TYPES.join(",")}
                  hint="JPG / PNG / WEBP"
                  currentLabel={edu.logo_path}
                  onUpload={(file) => uploadEducationLogo(edu.id, edu.logo_path, file)}
                />
                {edu.logo_path && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={publicAssetUrl(edu.logo_path) ?? ""} alt="" className={styles.logoPreview} />
                )}
              </div>

              <label className="checkbox-row">
                <input type="checkbox" name="published" defaultChecked={edu.published} />
                Published
              </label>
            </EditableCard>
          ))}
        </div>
      )}
    </div>
  )
}
