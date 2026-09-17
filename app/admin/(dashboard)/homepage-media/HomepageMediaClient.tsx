"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import EditableCard from "@/components/admin/EditableCard"
import FileDropzone from "@/components/admin/FileDropzone"
import { useToast } from "@/components/admin/Toast"
import { IMAGE_TYPES, VIDEO_TYPES } from "@/lib/storageConstants"
import { publicAssetUrl } from "@/lib/publicUrl"
import { createHomepageSection, updateHomepageMedia, deleteHomepageSection, uploadHomepageAsset } from "./actions"
import type { HomepageMedia } from "@/shared/database.types"
import styles from "../shared-list.module.css"

export default function HomepageMediaClient({ sections: initial }: { sections: HomepageMedia[] }) {
  const [items, setItems] = useState(initial)
  const { showToast } = useToast()
  const router = useRouter()

  async function handleCreate(formData: FormData) {
    const result = await createHomepageSection(formData)
    if (result.ok) {
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
            const result = await deleteHomepageSection(section.id)
            if (result.ok) setItems((prev) => prev.filter((x) => x.id !== section.id))
            return result
          }}
          deleteWarning={`Remove the "${section.section_key}" homepage section entirely — the public site will fall back to its local static image for this section.`}
        >
          <div className="grid-2">
            <div className="field">
              <label>Media type</label>
              <select name="media_type" defaultValue={section.media_type} className="select">
                <option value="image">Image</option>
                <option value="video">Video</option>
              </select>
            </div>
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
            <UploadField
              label="Video / image"
              current={section.storage_path}
              accept={[...IMAGE_TYPES, ...VIDEO_TYPES].join(",")}
              hint="Image or MP4/WEBM"
              onUpload={(file) =>
                uploadHomepageAsset(section.id, section.section_key, "storage_path", section.storage_path, file)
              }
            />
            <UploadField
              label="Poster (video fallback frame)"
              current={section.poster_path}
              accept={IMAGE_TYPES.join(",")}
              hint="JPG / PNG / WEBP"
              onUpload={(file) =>
                uploadHomepageAsset(section.id, section.section_key, "poster_path", section.poster_path, file)
              }
            />
            <UploadField
              label="Mobile version"
              current={section.mobile_storage_path}
              accept={[...IMAGE_TYPES, ...VIDEO_TYPES].join(",")}
              hint="Optional, differently-cropped"
              onUpload={(file) =>
                uploadHomepageAsset(
                  section.id,
                  section.section_key,
                  "mobile_storage_path",
                  section.mobile_storage_path,
                  file
                )
              }
            />
          </div>
        </EditableCard>
      ))}
      </div>
    </div>
  )
}

function UploadField({
  label,
  current,
  accept,
  hint,
  onUpload
}: {
  label: string
  current: string | null
  accept: string
  hint: string
  onUpload: (file: File) => Promise<{ path: string | null; error: string | null }>
}) {
  return (
    <div className="field">
      <label>{label}</label>
      {current && (
        <a href={publicAssetUrl(current) ?? "#"} target="_blank" rel="noreferrer" className={styles.previewLink}>
          View current
        </a>
      )}
      <FileDropzone accept={accept} hint={hint} currentLabel={current} onUpload={onUpload} />
    </div>
  )
}
