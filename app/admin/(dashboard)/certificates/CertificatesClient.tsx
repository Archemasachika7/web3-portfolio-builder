"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import EditableCard from "@/components/admin/EditableCard"
import UploadField from "@/components/admin/UploadField"
import CreateFromUpload from "@/components/admin/CreateFromUpload"
import { useToast } from "@/components/admin/Toast"
import { callAction } from "@/lib/callAction"
import { useServerState } from "@/lib/useServerState"
import { publicAssetUrl } from "@/lib/publicUrl"
import {
  createCertificate,
  createCertificateFromFile,
  publishCertificate,
  updateCertificate,
  deleteCertificate
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
  const [items, setItems] = useServerState(initial)
  const { showToast } = useToast()
  // The entry just added opens itself, so it's obvious where to type.
  const [newId, setNewId] = useState<string | null>(null)
  const router = useRouter()

  return (
    <div className={styles.page}>
      <CreateFromUpload
        kinds={["certificate-thumbnail", "certificate-file"]}
        kindFor={(file) => (/pdf$/i.test(file.type) || /\.pdf$/i.test(file.name) ? "certificate-file" : "certificate-thumbnail")}
        label="Drop a certificate picture or PDF here to post it, or click to browse"
        hint="JPG / PNG / WEBP up to 8 MB · PDF up to 25 MB · then add the issuer and a description"
        create={createCertificateFromFile}
        finish={publishCertificate}
        discard={deleteCertificate}
        onCreated={setNewId}
        successMessage="Certificate posted — add the details below"
      />

      <div className={styles.toolbar}>
        <button
          type="button"
          className="btn"
          onClick={async () => {
            const result = await callAction(() => createCertificate())
            if (result.ok) {
              if (result.id) setNewId(result.id)
              showToast("Added — fill in the details below", "success")
              router.refresh()
            }
            else showToast(result.error ?? "Failed", "error")
          }}
        >
          Add without a file
        </button>
      </div>

      {items.length === 0 ? (
        <p className={styles.empty}>No certificates yet.</p>
      ) : (
        <div className={styles.list}>
          {items.map((c) => (
            <EditableCard
              key={c.id}
              startOpen={c.id === newId}
              autoFocus={c.id === newId}
              summary={
                <span className={styles.certSummary}>
                  {c.thumbnail_path && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={publicAssetUrl(c.thumbnail_path) ?? ""}
                      alt=""
                      width={32}
                      height={32}
                      loading="lazy"
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
                const result = await callAction(() => deleteCertificate(c.id))
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
                <label>Description (shown on the site)</label>
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
                  <label>Picture</label>
                  <UploadField kind="certificate-thumbnail" recordId={c.id} currentPath={c.thumbnail_path} removable />
                </div>
                <div className="field">
                  <label>Certificate PDF</label>
                  <UploadField kind="certificate-file" recordId={c.id} currentPath={c.certificate_file_path} removable />
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
