"use client"

import { useTransition } from "react"
import UploadField from "@/components/admin/UploadField"
import { useToast } from "@/components/admin/Toast"
import { callAction } from "@/lib/callAction"
import { saveSiteSettings } from "./actions"
import type { SiteSettings } from "@/shared/database.types"
import styles from "../profile/profile.module.css"

export default function SettingsForm({ settings }: { settings: SiteSettings | null }) {
  const { showToast } = useToast()
  const [pending, startTransition] = useTransition()

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await callAction(() => saveSiteSettings(formData))
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
          <div className="field">
            <span className="label">Favicon</span>
            <UploadField
              kind="site-favicon"
              recordId={settings?.id ?? null}
              currentPath={settings?.favicon_path}
              disabledReason="Save the settings once, then add images."
              removable
            />
          </div>
          <div className="field">
            <span className="label">Default OG image</span>
            <UploadField
              kind="site-og"
              recordId={settings?.id ?? null}
              currentPath={settings?.default_og_image_path}
              disabledReason="Save the settings once, then add images."
              removable
            />
          </div>
        </div>
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
