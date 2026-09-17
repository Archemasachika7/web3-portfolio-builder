"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import EditableCard from "@/components/admin/EditableCard"
import FileDropzone from "@/components/admin/FileDropzone"
import { useToast } from "@/components/admin/Toast"
import { IMAGE_TYPES, PDF_TYPES } from "@/lib/storageConstants"
import { publicAssetUrl } from "@/lib/publicUrl"
import {
  createCertificate,
  updateCertificate,
  deleteCertificate,
  uploadCertificateFile,
  uploadCertificateThumbnail
} from "./actions"
import type { CertificateWithTags } from "./actions"
import type { Tag } from "@/shared/database.types"
import styles from "../shared-list.module.css"

export default function CertificatesClient({
  certificates: initial,
  allTags
}: {
  certificates: CertificateWithTags[]
  allTags: Tag[]
}) {
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
            const result = await createCertificate()
            if (result.ok) router.refresh()
            else showToast(result.error ?? "Failed", "error")
          }}
        >
          Add certificate
        </button>
      </div>

      {items.length === 0 ? (
        <p className={styles.empty}>No certificates yet.</p>
      ) : (
        <div className={styles.list}>
          {items.map((c) => (
            <EditableCard
              key={c.id}
              summary={
                <span className={styles.certSummary}>
                  {c.thumbnail_path && (
                    <Image
                      src={publicAssetUrl(c.thumbnail_path) ?? ""}
                      alt=""
                      width={32}
                      height={32}
                      className={styles.certThumb}
                    />
                  )}
                  {c.title} — {c.issuer}
                </span>
              }
              badge={
                <>
                  {c.featured && <span className="badge badge-neutral">Featured</span>}
                  <span className={`badge ${c.published ? "badge-published" : "badge-draft"}`}>
                    {c.published ? "Published" : "Draft"}
                  </span>
                </>
              }
              onSave={(fd) => updateCertificate(c.id, fd)}
              onDelete={async () => {
                const result = await deleteCertificate(c.id, c.certificate_file_path, c.thumbnail_path)
                if (result.ok) setItems((prev) => prev.filter((x) => x.id !== c.id))
                return result
              }}
              deleteWarning={`Remove "${c.title}" and its uploaded files.`}
            >
              <div className="grid-2">
                <div className="field">
                  <label>Title</label>
                  <input name="title" defaultValue={c.title} className="input" required />
                </div>
                <div className="field">
                  <label>Issuer</label>
                  <input name="issuer" defaultValue={c.issuer} className="input" required />
                </div>
                <div className="field">
                  <label>Credential name</label>
                  <input name="credential_name" defaultValue={c.credential_name ?? ""} className="input" />
                </div>
                <div className="field">
                  <label>Credential ID</label>
                  <input name="credential_id" defaultValue={c.credential_id ?? ""} className="input" />
                </div>
                <div className="field">
                  <label>Issue date</label>
                  <input name="issue_date" type="date" defaultValue={c.issue_date ?? ""} className="input" />
                </div>
                <div className="field">
                  <label>Expiry date</label>
                  <input name="expiry_date" type="date" defaultValue={c.expiry_date ?? ""} className="input" />
                </div>
              </div>

              <div className="field">
                <label>Credential URL</label>
                <input name="credential_url" defaultValue={c.credential_url ?? ""} className="input" />
              </div>
              <div className="field">
                <label>Description</label>
                <textarea name="description" defaultValue={c.description ?? ""} className="textarea" rows={3} />
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
                        defaultChecked={c.tags.some((t) => t.id === tag.id)}
                      />
                      {tag.name}
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid-2">
                <div className="field">
                  <label>Thumbnail image</label>
                  <FileDropzone
                    accept={IMAGE_TYPES.join(",")}
                    hint="JPG / PNG / WEBP"
                    currentLabel={c.thumbnail_path}
                    onUpload={(file) => uploadCertificateThumbnail(c.id, c.thumbnail_path, file)}
                  />
                </div>
                <div className="field">
                  <label>Certificate PDF</label>
                  <FileDropzone
                    accept={PDF_TYPES.join(",")}
                    hint="PDF, up to 25MB"
                    currentLabel={c.certificate_file_path}
                    onUpload={(file) => uploadCertificateFile(c.id, c.certificate_file_path, file)}
                  />
                  {c.certificate_file_path && (
                    <div className={styles.fileActions}>
                      <a href={publicAssetUrl(c.certificate_file_path) ?? "#"} target="_blank" rel="noreferrer" className="btn">
                        View
                      </a>
                      <a href={publicAssetUrl(c.certificate_file_path) ?? "#"} download className="btn">
                        Download
                      </a>
                    </div>
                  )}
                </div>
              </div>

              <div className={styles.inlineActions}>
                <label className="checkbox-row">
                  <input type="checkbox" name="published" defaultChecked={c.published} />
                  Published
                </label>
                <label className="checkbox-row">
                  <input type="checkbox" name="featured" defaultChecked={c.featured} />
                  Featured
                </label>
              </div>
            </EditableCard>
          ))}
        </div>
      )}
    </div>
  )
}
