"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import EditableCard from "@/components/admin/EditableCard"
import UploadField from "@/components/admin/UploadField"
import { useToast } from "@/components/admin/Toast"
import { callAction } from "@/lib/callAction"
import { useServerState } from "@/lib/useServerState"
import {
  createHomepageSection,
  updateHomepageMedia,
  deleteHomepageSection
} from "./actions"
import type { HomepageMedia } from "@/shared/database.types"
import styles from "../shared-list.module.css"

export default function HomepageMediaClient({ sections: initial }: { sections: HomepageMedia[] }) {
  const [items, setItems] = useServerState(initial)
  const { showToast } = useToast()
  // The entry just added opens itself, so it's obvious where to type.
  const [newId, setNewId] = useState<string | null>(null)
  const router = useRouter()

  async function handleCreate(formData: FormData) {
    const result = await callAction(() => createHomepageSection(formData))
    if (result.ok) {
      if (result.id) setNewId(result.id)
      showToast("Added — fill in the details below", "success")
      router.refresh()
    } else {
      showToast(result.error ?? "Failed", "error")
    }
  }

  return (
    <div className={styles.page}>
      <form action={handleCreate} className={styles.newForm}>
        <input
          type="text"
          name="section_key"
          placeholder="New section key (e.g. testimonials)…"
          required
          className="input"
        />
        <button type="submit" className="btn btn-primary">
          Add section
        </button>
      </form>
      <p className="field-hint">
        Section keys are read directly by the public site&rsquo;s components — only add one that a
        component actually looks up, or it will simply have no effect.
      </p>
      <div className={styles.list}>
      {items.map((section) => (
        <EditableCard
          key={section.id}
          startOpen={section.id === newId}
          autoFocus={section.id === newId}
          summary={section.section_key}
          badge={
            <>
              <span className="badge badge-neutral">{section.media_type}</span>
              <span className={`badge ${section.enabled ? "badge-published" : "badge-draft"}`}>
                {section.enabled ? "Enabled" : "Disabled"}
              </span>
            </>
          }
          onSave={(fd) => updateHomepageMedia(section.id, fd)}
          onDelete={async () => {
            const result = await callAction(() => deleteHomepageSection(section.id))
            if (result.ok) setItems((prev) => prev.filter((x) => x.id !== section.id))
            return result
          }}
          deleteWarning={`Remove the "${section.section_key}" homepage section entirely — the public site will fall back to its local static image for this section.`}
        >
          <div className="grid-2">
            <div className="field">
              <label>Motion type</label>
              <input name="motion_type" defaultValue={section.motion_type ?? ""} className="input" placeholder="e.g. ambient, domain-beat" />
            </div>
            <div className="field">
              <label>Alt text</label>
              <input name="alt_text" defaultValue={section.alt_text ?? ""} className="input" />
            </div>
            <div className="field">
              <label>Sort order</label>
              <input name="sort_order" type="number" defaultValue={section.sort_order} className="input" />
            </div>
          </div>

          <label className="checkbox-row">
            <input type="checkbox" name="enabled" defaultChecked={section.enabled} />
            Enabled
          </label>

          <div className="grid-3">
            <div className="field">
              <label>Video or image</label>
              <UploadField kind="homepage-media" recordId={section.id} currentPath={section.storage_path} removable />
              <span className="field-hint">A video sets this section to play video; an image makes it a still.</span>
            </div>
            <div className="field">
              <label>Poster (video fallback frame)</label>
              <UploadField kind="homepage-poster" recordId={section.id} currentPath={section.poster_path} removable />
            </div>
            <div className="field">
              <label>Mobile version</label>
              <UploadField kind="homepage-mobile" recordId={section.id} currentPath={section.mobile_storage_path} removable />
              <span className="field-hint">Optional, cropped for phones.</span>
            </div>
          </div>
        </EditableCard>
      ))}
      </div>
    </div>
  )
}

