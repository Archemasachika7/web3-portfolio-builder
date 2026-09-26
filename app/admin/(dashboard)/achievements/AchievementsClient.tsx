"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import EditableCard from "@/components/admin/EditableCard"
import UploadField from "@/components/admin/UploadField"
import { useToast } from "@/components/admin/Toast"
import { callAction } from "@/lib/callAction"
import { useServerState } from "@/lib/useServerState"
import {
  createAchievement,
  updateAchievement,
  deleteAchievement,
  reorderAchievements
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
  const [items, setItems] = useServerState(initial)
  const { showToast } = useToast()
  // The entry just added opens itself, so it's obvious where to type.
  const [newId, setNewId] = useState<string | null>(null)
  const router = useRouter()

  async function move(index: number, direction: -1 | 1) {
    const next = [...items]
    const target = index + direction
    if (target < 0 || target >= next.length) return
    ;[next[index], next[target]] = [next[target], next[index]]
    setItems(next)
    const result = await callAction(() => reorderAchievements(next.map((a) => a.id)))
    if (!result.ok) {
      setItems(items)
      showToast(result.error ?? "Couldn't save the new order.", "error")
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.toolbar}>
        <button
          type="button"
          className="btn btn-primary"
          onClick={async () => {
            const result = await callAction(() => createAchievement())
            if (result.ok) {
              if (result.id) setNewId(result.id)
              showToast("Added — fill in the details below", "success")
              router.refresh()
            }
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
              startOpen={a.id === newId}
              autoFocus={a.id === newId}
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
                const result = await callAction(() => deleteAchievement(a.id))
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
                <UploadField kind="achievement-image" recordId={a.id} currentPath={a.image_path} removable />
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
