"use client"

import { useState } from "react"
import { useToast } from "@/components/admin/Toast"
import { createSocialLink, updateSocialLink, deleteSocialLink, reorderSocialLinks } from "./actions"
import type { SocialLink } from "@/shared/database.types"
import styles from "../shared-list.module.css"
import tableStyles from "../tags/tags.module.css"

export default function SocialLinksClient({ links: initial }: { links: SocialLink[] }) {
  const [links, setLinks] = useState(initial)
  const [editingId, setEditingId] = useState<string | null>(null)
  const { showToast } = useToast()

  async function handleCreate(formData: FormData) {
    const result = await createSocialLink(formData)
    if (result.ok) {
      showToast("Added", "success")
      window.location.reload()
    } else {
      showToast(result.error ?? "Failed", "error")
    }
  }

  async function handleSave(link: SocialLink, formData: FormData) {
    const result = await updateSocialLink(link.id, formData)
    if (result.ok) {
      setLinks((prev) =>
        prev.map((l) =>
          l.id === link.id
            ? {
                ...l,
                platform: String(formData.get("platform")),
                label: String(formData.get("label")),
                url: String(formData.get("url")),
                icon_key: (formData.get("icon_key") as string) || null,
                enabled: formData.get("enabled") === "on"
              }
            : l
        )
      )
      setEditingId(null)
      showToast("Saved", "success")
    } else {
      showToast(result.error ?? "Save failed", "error")
    }
  }

  async function move(index: number, direction: -1 | 1) {
    const next = [...links]
    const target = index + direction
    if (target < 0 || target >= next.length) return
    ;[next[index], next[target]] = [next[target], next[index]]
    setLinks(next)
    await reorderSocialLinks(next.map((l) => l.id))
  }

  return (
    <div className={styles.page}>
      <form action={handleCreate} className={tableStyles.newForm}>
        <input type="text" name="platform" placeholder="Platform (e.g. github)" required className="input" />
        <input type="text" name="label" placeholder="Label (e.g. GitHub)" required className="input" />
        <input type="text" name="url" placeholder="https://…" required className="input" />
        <button type="submit" className="btn btn-primary">
          Add link
        </button>
      </form>

      <table className="table">
        <thead>
          <tr>
            <th></th>
            <th>Platform</th>
            <th>Label</th>
            <th>URL</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {links.map((link, index) =>
            editingId === link.id ? (
              <tr key={link.id}>
                <td colSpan={6}>
                  <form action={(fd) => handleSave(link, fd)} className={tableStyles.editRow}>
                    <input name="platform" defaultValue={link.platform} className="input" required />
                    <input name="label" defaultValue={link.label} className="input" required />
                    <input name="url" defaultValue={link.url} className="input" required />
                    <input name="icon_key" defaultValue={link.icon_key ?? ""} className="input" placeholder="icon key" />
                    <label className="checkbox-row">
                      <input type="checkbox" name="enabled" defaultChecked={link.enabled} />
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
              <tr key={link.id}>
                <td className={tableStyles.reorderCell}>
                  <button className="btn" disabled={index === 0} onClick={() => move(index, -1)}>
                    ↑
                  </button>
                  <button className="btn" disabled={index === links.length - 1} onClick={() => move(index, 1)}>
                    ↓
                  </button>
                </td>
                <td>{link.platform}</td>
                <td>{link.label}</td>
                <td className={tableStyles.slug}>{link.url}</td>
                <td>
                  <span className={`badge ${link.enabled ? "badge-published" : "badge-neutral"}`}>
                    {link.enabled ? "Enabled" : "Disabled"}
                  </span>
                </td>
                <td className={tableStyles.actionsCell}>
                  <button className="btn" onClick={() => setEditingId(link.id)}>
                    Edit
                  </button>
                  <button
                    className="btn btn-danger"
                    onClick={async () => {
                      const result = await deleteSocialLink(link.id)
                      if (result.ok) {
                        setLinks((prev) => prev.filter((l) => l.id !== link.id))
                        showToast("Deleted", "success")
                      } else {
                        showToast(result.error ?? "Delete failed", "error")
                      }
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
    </div>
  )
}
