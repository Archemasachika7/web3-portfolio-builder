"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import EditableCard from "@/components/admin/EditableCard"
import FileDropzone from "@/components/admin/FileDropzone"
import { useToast } from "@/components/admin/Toast"
import { IMAGE_TYPES } from "@/lib/storageConstants"
import {
  createAchievement,
  updateAchievement,
  deleteAchievement,
  reorderAchievements,
  uploadAchievementImage
} from "./actions"
import type { AchievementWithTags } from "./actions"
import type { Tag } from "@/shared/database.types"
import styles from "../shared-list.module.css"

export default function AchievementsClient({
  achievements: initial,
  allTags
}: {
  achievements: AchievementWithTags[]
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
    await reorderAchievements(next.map((a) => a.id))
  }

  return (
    <div className={styles.page}>
      <div className={styles.toolbar}>
        <button
          type="button"
          className="btn btn-primary"
          onClick={async () => {
            const result = await createAchievement()
            if (result.ok) router.refresh()
            else showToast(result.error ?? "Failed", "error")
          }}
        >
          Add achievement
        </button>
      </div>

      {items.length === 0 ? (
        <p className={styles.empty}>No achievements yet.</p>
      ) : (
        <div className={styles.list}>
          {items.map((a, index) => (
            <EditableCard
              key={a.id}
              summary={a.title}
              badge={
                <>
                  <button type="button" className="btn" disabled={index === 0} onClick={(e) => { e.stopPropagation(); move(index, -1) }}>
                    ↑
                  </button>
                  <button type="button" className="btn" disabled={index === items.length - 1} onClick={(e) => { e.stopPropagation(); move(index, 1) }}>
                    ↓
                  </button>
                  <span className={`badge ${a.published ? "badge-published" : "badge-draft"}`}>
                    {a.published ? "Published" : "Draft"}
                  </span>
                </>
              }
              onSave={(fd) => updateAchievement(a.id, fd)}
              onDelete={async () => {
                const result = await deleteAchievement(a.id)
                if (result.ok) setItems((prev) => prev.filter((x) => x.id !== a.id))
                return result
              }}
              deleteWarning={`Remove "${a.title}".`}
            >
              <div className="grid-2">
                <div className="field">
                  <label>Title</label>
                  <input name="title" defaultValue={a.title} className="input" required />
                </div>
                <div className="field">
                  <label>Organization</label>
                  <input name="organization" defaultValue={a.organization ?? ""} className="input" />
                </div>
                <div className="field">
                  <label>Value (e.g. &ldquo;Top 1%&rdquo;, &ldquo;₹50,000&rdquo;)</label>
                  <input name="value" defaultValue={a.value ?? ""} className="input" />
                </div>
                <div className="field">
                  <label>Category</label>
                  <input name="category" defaultValue={a.category ?? ""} className="input" />
                </div>
                <div className="field">
                  <label>Year</label>
                  <input name="year" type="number" defaultValue={a.year ?? ""} className="input" />
                </div>
              </div>

              <div className="field">
                <label>Description</label>
                <textarea name="description" defaultValue={a.description ?? ""} className="textarea" rows={3} />
              </div>

              <div className="grid-2">
                <div className="field">
                  <label>Link</label>
                  <input name="link" defaultValue={a.link ?? ""} className="input" />
                </div>
                <div className="field">
                  <label>Credential URL</label>
                  <input name="credential_url" defaultValue={a.credential_url ?? ""} className="input" />
                </div>
                <div className="field">
                  <label>Certificate ID</label>
                  <input name="certificate_id" defaultValue={a.certificate_id ?? ""} className="input" />
                </div>
              </div>

              <div className="field">
                <label>Image</label>
                <FileDropzone
                  accept={IMAGE_TYPES.join(",")}
                  hint="JPG / PNG / WEBP"
                  currentLabel={a.image_path}
                  onUpload={(file) => uploadAchievementImage(a.id, a.image_path, file)}
                />
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
                        defaultChecked={a.tags.some((t) => t.id === tag.id)}
                      />
                      {tag.name}
                    </label>
                  ))}
                </div>
              </div>

              <label className="checkbox-row">
                <input type="checkbox" name="published" defaultChecked={a.published} />
                Published
              </label>
            </EditableCard>
          ))}
        </div>
      )}
    </div>
  )
}
