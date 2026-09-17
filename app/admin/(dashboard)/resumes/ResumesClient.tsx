"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import EditableCard from "@/components/admin/EditableCard"
import FileDropzone from "@/components/admin/FileDropzone"
import { useToast } from "@/components/admin/Toast"
import { RESUME_TYPES } from "@/lib/storageConstants"
import { publicAssetUrl } from "@/lib/publicUrl"
import { createResume, updateResume, deleteResume, setCurrentResume, uploadResumeFile } from "./actions"
import type { ResumeWithTags } from "./actions"
import type { Tag } from "@/shared/database.types"
import styles from "../shared-list.module.css"

export default function ResumesClient({ resumes: initial, allTags }: { resumes: ResumeWithTags[]; allTags: Tag[] }) {
  const [items, setItems] = useState(initial)
  const { showToast } = useToast()
  const router = useRouter()

  return (
    <div className={styles.page}>
      <div className={styles.toolbar}>
        <button
          type="button"
          className="btn btn-primary"
          onClick={async () => {
            const result = await createResume()
            if (result.ok) router.refresh()
            else showToast(result.error ?? "Failed", "error")
          }}
        >
          Add resume
        </button>
      </div>

      {items.length === 0 ? (
        <p className={styles.empty}>No resumes yet.</p>
      ) : (
        <div className={styles.list}>
          {items.map((r) => (
            <EditableCard
              key={r.id}
              summary={r.title}
              badge={
                <>
                  {r.is_current && <span className="badge badge-published">Current</span>}
                  <span className={`badge ${r.published ? "badge-published" : "badge-draft"}`}>
                    {r.published ? "Published" : "Draft"}
                  </span>
                </>
              }
              onSave={(fd) => updateResume(r.id, fd)}
              onDelete={async () => {
                const result = await deleteResume(r.id, r.file_path)
                if (result.ok) setItems((prev) => prev.filter((x) => x.id !== r.id))
                return result
              }}
              deleteWarning={`Remove "${r.title}" and its uploaded file.`}
            >
              <div className="grid-2">
                <div className="field">
                  <label>Title</label>
                  <input name="title" defaultValue={r.title} className="input" required />
                </div>
                <div className="field">
                  <label>Slug</label>
                  <input name="slug" defaultValue={r.slug} className="input" required />
                </div>
                <div className="field">
                  <label>Version</label>
                  <input name="version" type="number" defaultValue={r.version} className="input" />
                </div>
                <div className="field">
                  <label>Priority</label>
                  <input name="priority" type="number" defaultValue={r.priority} className="input" />
                  <span className="field-hint">Higher priority wins tag-overlap ties on the public map.</span>
                </div>
              </div>

              <div className="field">
                <label>Description</label>
                <textarea name="description" defaultValue={r.description ?? ""} className="textarea" rows={3} />
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
                        defaultChecked={r.tags.some((t) => t.id === tag.id)}
                      />
                      {tag.name}
                    </label>
                  ))}
                </div>
              </div>

              <div className="field">
                <label>PDF file</label>
                <FileDropzone
                  accept={RESUME_TYPES.join(",")}
                  hint="PDF (or DOCX), up to 25MB"
                  currentLabel={r.file_path || null}
                  onUpload={(file) => uploadResumeFile(r.id, r.slug, r.file_path || null, file)}
                />
                {r.file_path && (
                  <div className={styles.fileActions}>
                    <a href={publicAssetUrl(r.file_path) ?? "#"} target="_blank" rel="noreferrer" className="btn">
                      Preview
                    </a>
                    <a href={publicAssetUrl(r.file_path) ?? "#"} download className="btn">
                      Download
                    </a>
                  </div>
                )}
              </div>

              <div className={styles.inlineActions}>
                <label className="checkbox-row">
                  <input type="checkbox" name="published" defaultChecked={r.published} />
                  Published
                </label>
                {!r.is_current && (
                  <button
                    type="button"
                    className="btn"
                    onClick={async () => {
                      const result = await setCurrentResume(r.id)
                      if (result.ok) {
                        setItems((prev) => prev.map((x) => ({ ...x, is_current: x.id === r.id })))
                        showToast("Set as current", "success")
                      } else {
                        showToast(result.error ?? "Failed", "error")
                      }
                    }}
                  >
                    Set as current
                  </button>
                )}
              </div>
            </EditableCard>
          ))}
        </div>
      )}
    </div>
  )
}
