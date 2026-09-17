"use client"

import { useState, useTransition } from "react"
import FileDropzone from "@/components/admin/FileDropzone"
import { useToast } from "@/components/admin/Toast"
import { IMAGE_TYPES } from "@/lib/storageConstants"
import { publicAssetUrl } from "@/lib/publicUrl"
import { saveSiteSettings, uploadSiteImage } from "./actions"
import type { SiteSettings } from "@/shared/database.types"
import styles from "../profile/profile.module.css"

export default function SettingsForm({ settings }: { settings: SiteSettings | null }) {
  const { showToast } = useToast()
  const [pending, startTransition] = useTransition()
  const [faviconPath, setFaviconPath] = useState(settings?.favicon_path ?? null)
  const [ogImagePath, setOgImagePath] = useState(settings?.default_og_image_path ?? null)

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await saveSiteSettings(formData)
      showToast(result.ok ? "Saved" : result.error ?? "Save failed", result.ok ? "success" : "error")
    })
  }

  return (
    <form action={handleSubmit} className={styles.form}>
      <input type="hidden" name="id" value={settings?.id ?? ""} />

      <section className={`card ${styles.section}`}>
        <span className="label">SITE</span>
        <div className="field">
          <label>Site title</label>
          <input name="site_title" defaultValue={settings?.site_title ?? ""} className="input" />
        </div>
        <div className="field">
          <label>Site description</label>
          <textarea name="site_description" defaultValue={settings?.site_description ?? ""} className="textarea" rows={2} />
        </div>
      </section>

      <section className={`card ${styles.section}`}>
        <span className="label">CONTACT &amp; FOOTER</span>
        <div className={styles.grid2}>
          <div className="field">
            <label>Contact email</label>
            <input name="contact_email" type="email" defaultValue={settings?.contact_email ?? ""} className="input" />
          </div>
          <div className="field">
            <label>Primary location</label>
            <input name="primary_location" defaultValue={settings?.primary_location ?? ""} className="input" />
          </div>
        </div>
        <div className="field">
          <label>Availability text</label>
          <input name="availability_text" defaultValue={settings?.availability_text ?? ""} className="input" />
        </div>
        <div className="field">
          <label>Footer text</label>
          <input name="footer_text" defaultValue={settings?.footer_text ?? ""} className="input" />
        </div>
        <div className="field">
          <label>Copyright text</label>
          <input name="copyright_text" defaultValue={settings?.copyright_text ?? ""} className="input" />
        </div>
      </section>

      <section className={`card ${styles.section}`}>
        <span className="label">IMAGES</span>
        <div className={styles.grid2}>
          <div>
            <span className="label">Favicon</span>
            <FileDropzone
              accept={IMAGE_TYPES.join(",")}
              hint="JPG / PNG / WEBP"
              disabled={!settings?.id}
              currentLabel={faviconPath}
              onUpload={async (file) => {
                if (!settings?.id) return { path: null, error: "Save settings first." }
                const result = await uploadSiteImage(settings.id, "favicon_path", faviconPath, file)
                if (result.path) setFaviconPath(result.path)
                return result
              }}
            />
            {faviconPath && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={publicAssetUrl(faviconPath) ?? ""} alt="" width={32} height={32} />
            )}
          </div>
          <div>
            <span className="label">Default OG image</span>
            <FileDropzone
              accept={IMAGE_TYPES.join(",")}
              hint="JPG / PNG / WEBP"
              disabled={!settings?.id}
              currentLabel={ogImagePath}
              onUpload={async (file) => {
                if (!settings?.id) return { path: null, error: "Save settings first." }
                const result = await uploadSiteImage(settings.id, "default_og_image_path", ogImagePath, file)
                if (result.path) setOgImagePath(result.path)
                return result
              }}
            />
          </div>
        </div>
        {!settings?.id && (
          <p className={styles.hintMuted}>Save once before uploading images.</p>
        )}
      </section>

      <section className={`card ${styles.section}`}>
        <span className="label">MAINTENANCE</span>
        <label className="checkbox-row">
          <input type="checkbox" name="maintenance_mode" defaultChecked={settings?.maintenance_mode} />
          Maintenance mode
        </label>
        <p className="field-hint">
          Whether the public site actually honors this flag depends on whether it checks it — this
          just stores the setting.
        </p>
      </section>

      <div className={styles.saveBar}>
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending ? "Saving…" : "Save changes"}
        </button>
      </div>
    </form>
  )
}
