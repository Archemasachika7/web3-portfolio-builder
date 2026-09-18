"use client"

import { useRef, useState } from "react"
import { createTag, updateTag, deleteTag, reorderTags } from "./actions"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/admin/Toast"
import ConfirmDialog, { type ConfirmDialogHandle } from "@/components/admin/ConfirmDialog"
import type { Tag } from "@/shared/database.types"
import styles from "./tags.module.css"

export default function TagsClient({ tags: initialTags }: { tags: Tag[] }) {
  const { showToast } = useToast()
  const router = useRouter()
  const [tags, setTags] = useState(initialTags)
  const [editingId, setEditingId] = useState<string | null>(null)
  const deleteDialogRef = useRef<ConfirmDialogHandle>(null)
  const deleteTargetRef = useRef<Tag | null>(null)

  async function handleCreate(formData: FormData) {
    const result = await createTag(formData)
    if (result.ok) {
      showToast("Tag created", "success")
      router.refresh()
    } else {
      showToast(result.error ?? "Failed", "error")
    }
  }

  async function handleSaveRow(tag: Tag, formData: FormData) {
    const result = await updateTag(tag.id, formData)
    if (result.ok) {
      setTags((prev) =>
        prev.map((t) =>
          t.id === tag.id
            ? {
                ...t,
                name: String(formData.get("name")),
                slug: String(formData.get("slug")),
                type: (formData.get("type") as string) || null,
                published: formData.get("published") === "on"
              }
            : t
        )
      )
      setEditingId(null)
      showToast("Saved", "success")
    } else {
      showToast(result.error ?? "Save failed", "error")
    }
  }

  async function move(index: number, direction: -1 | 1) {
    const next = [...tags]
    const target = index + direction
    if (target < 0 || target >= next.length) return
    ;[next[index], next[target]] = [next[target], next[index]]
    setTags(next)
    await reorderTags(next.map((t) => t.id))
  }

  return (
    <div className={styles.page}>
      <form action={handleCreate} className={styles.newForm}>
        <input type="text" name="name" placeholder="New tag name…" required className="input" />
        <select name="type" className="select">
          <option value="">No category</option>
          <option value="Engineering">Engineering</option>
          <option value="Data">Data</option>
          <option value="Analytics">Analytics</option>
          <option value="Software">Software</option>
          <option value="Leadership">Leadership</option>
          <option value="Research">Research</option>
          <option value="Other">Other</option>
        </select>
        <button type="submit" className="btn btn-primary">
          Add tag
        </button>
      </form>

      <table className="table">
        <thead>
          <tr>
            <th></th>
            <th>Name</th>
            <th>Slug</th>
            <th>Category</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {tags.map((tag, index) =>
            editingId === tag.id ? (
              <tr key={tag.id}>
                <td colSpan={6}>
                  <form
                    action={(fd) => handleSaveRow(tag, fd)}
                    className={styles.editRow}
                  >
                    <input name="name" defaultValue={tag.name} className="input" required />
                    <input name="slug" defaultValue={tag.slug} className="input" required />
                    <input name="type" defaultValue={tag.type ?? ""} className="input" placeholder="Category" />
                    <label className="checkbox-row">
                      <input type="checkbox" name="published" defaultChecked={tag.published} />
                      Enabled
                    </label>
                    <button type="submit" className="btn btn-primary">
                      Save
                    </button>
                    <button type="button" className="btn" onClick={() => setEditingId(null)}>
                      Cancel
                    </button>
                  </form>
                </td>
              </tr>
            ) : (
              <tr key={tag.id}>
                <td className={styles.reorderCell}>
                  <button className="btn" disabled={index === 0} onClick={() => move(index, -1)}>
                    ↑
                  </button>
                  <button className="btn" disabled={index === tags.length - 1} onClick={() => move(index, 1)}>
                    ↓
                  </button>
                </td>
                <td>{tag.name}</td>
                <td className={styles.slug}>{tag.slug}</td>
                <td>{tag.type ?? "—"}</td>
                <td>
                  <span className={`badge ${tag.published ? "badge-published" : "badge-neutral"}`}>
                    {tag.published ? "Enabled" : "Disabled"}
                  </span>
                </td>
                <td className={styles.actionsCell}>
                  <button className="btn" onClick={() => setEditingId(tag.id)}>
                    Edit
                  </button>
                  <button
                    className="btn btn-danger"
                    onClick={() => {
                      deleteTargetRef.current = tag
                      deleteDialogRef.current?.open()
                    }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            )
          )}
        </tbody>
      </table>

      <ConfirmDialog
        ref={deleteDialogRef}
        title="Delete tag?"
        description="This removes it from every project, resume, achievement, experience entry and certificate it's attached to."
        onConfirm={async () => {
          const target = deleteTargetRef.current
          if (!target) return
          const result = await deleteTag(target.id)
          if (result.ok) {
            setTags((prev) => prev.filter((t) => t.id !== target.id))
            showToast("Deleted", "success")
          } else {
            showToast(result.error ?? "Delete failed", "error")
          }
        }}
      />
    </div>
  )
}
