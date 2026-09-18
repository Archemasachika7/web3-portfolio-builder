"use client"

import { useState } from "react"
import EditableCard from "@/components/admin/EditableCard"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/admin/Toast"
import { createDomainNode, updateDomainNode, deleteDomainNode, reorderDomainNodes } from "./actions"
import type { DomainNodeWithTags } from "./actions"
import type { Tag } from "@/shared/database.types"
import styles from "../shared-list.module.css"

export default function DomainNodesClient({
  nodes: initial,
  allTags
}: {
  nodes: DomainNodeWithTags[]
  allTags: Tag[]
}) {
  const [items, setItems] = useState(initial)
  const { showToast } = useToast()
  const router = useRouter()

  async function handleCreate(formData: FormData) {
    const result = await createDomainNode(formData)
    if (result.ok) {
      showToast("Added", "success")
      router.refresh()
    } else {
      showToast(result.error ?? "Failed", "error")
    }
  }

  async function move(index: number, direction: -1 | 1) {
    const item = items[index]
    const sameLevel = items.filter((n) => n.level === item.level)
    const target = sameLevel.findIndex((n) => n.id === item.id) + direction
    if (target < 0 || target >= sameLevel.length) return
    const reordered = [...sameLevel]
    const currentIndex = sameLevel.findIndex((n) => n.id === item.id)
    ;[reordered[currentIndex], reordered[target]] = [reordered[target], reordered[currentIndex]]
    const otherLevel = items.filter((n) => n.level !== item.level)
    setItems(item.level === "primary" ? [...reordered, ...otherLevel] : [...otherLevel, ...reordered])
    await reorderDomainNodes(reordered.map((n) => n.id))
  }

  const primary = items.filter((n) => n.level === "primary")
  const lens = items.filter((n) => n.level === "lens")

  return (
    <div className={styles.page}>
      <p className="field-hint">
        Primary domains render on the homepage career map; lens nodes are the role-filter overlays
        on /map. Both resolve to projects/resumes entirely through their tags.
      </p>
      <form action={handleCreate} className={styles.newForm}>
        <input type="text" name="label" placeholder="New node label…" required className="input" />
        <select name="level" className="select">
          <option value="primary">Primary</option>
          <option value="lens">Lens</option>
        </select>
        <button type="submit" className="btn btn-primary">
          Add node
        </button>
      </form>

      {(["primary", "lens"] as const).map((level) => {
        const levelItems = level === "primary" ? primary : lens
        return (
          <div key={level} className={styles.list}>
            <span className="label">{level === "primary" ? "PRIMARY DOMAINS" : "LENS NODES"}</span>
            {levelItems.length === 0 ? (
              <p className={styles.empty}>None yet.</p>
            ) : (
              levelItems.map((node, index) => (
                <EditableCard
                  key={node.id}
                  summary={node.label}
                  badge={
                    <>
                      <button type="button" className="btn" disabled={index === 0} onClick={(e) => { e.stopPropagation(); move(items.indexOf(node), -1) }}>
                        ↑
                      </button>
                      <button type="button" className="btn" disabled={index === levelItems.length - 1} onClick={(e) => { e.stopPropagation(); move(items.indexOf(node), 1) }}>
                        ↓
                      </button>
                      <span className={`badge ${node.published ? "badge-published" : "badge-draft"}`}>
                        {node.published ? "Published" : "Draft"}
                      </span>
                    </>
                  }
                  onSave={(fd) => updateDomainNode(node.id, fd)}
                  onDelete={async () => {
                    const result = await deleteDomainNode(node.id)
                    if (result.ok) setItems((prev) => prev.filter((n) => n.id !== node.id))
                    return result
                  }}
                  deleteWarning={`Remove "${node.label}" from the career map.`}
                >
                  <div className="grid-2">
                    <div className="field">
                      <label>Label</label>
                      <input name="label" defaultValue={node.label} className="input" required />
                    </div>
                    <div className="field">
                      <label>Slug</label>
                      <input name="slug" defaultValue={node.slug} className="input" required />
                    </div>
                  </div>
                  <div className="field">
                    <label>Level</label>
                    <select name="level" defaultValue={node.level} className="select">
                      <option value="primary">Primary</option>
                      <option value="lens">Lens</option>
                    </select>
                  </div>
                  <div className="field">
                    <label>Description</label>
                    <textarea name="description" defaultValue={node.description ?? ""} className="textarea" rows={2} />
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
                            defaultChecked={node.tags.some((t) => t.id === tag.id)}
                          />
                          {tag.name}
                        </label>
                      ))}
                    </div>
                  </div>
                  <label className="checkbox-row">
                    <input type="checkbox" name="published" defaultChecked={node.published} />
                    Published
                  </label>
                </EditableCard>
              ))
            )}
          </div>
        )
      })}
    </div>
  )
}
