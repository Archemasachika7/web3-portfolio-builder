"use client"

import { useState, useTransition } from "react"
import Image from "next/image"
import FileDropzone from "@/components/admin/FileDropzone"
import { useToast } from "@/components/admin/Toast"
import { saveProfile, uploadProfilePicture } from "./actions"
import { IMAGE_TYPES } from "@/lib/storageConstants"
import { publicAssetUrl } from "@/lib/publicUrl"
import type { Profile } from "@/shared/database.types"
import styles from "./profile.module.css"

export default function ProfileForm({
  profile,
  profilePictureUrl
}: {
  profile: Profile | null
  profilePictureUrl: string | null
}) {
  const { showToast } = useToast()
  const [pending, startTransition] = useTransition()
  const [imagePath, setImagePath] = useState(profile?.profile_image_path ?? null)
  const [imageUrl, setImageUrl] = useState(profilePictureUrl)
  const [dirty, setDirty] = useState(false)

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await saveProfile(formData)
      if (result.ok) {
        showToast("Saved", "success")
        setDirty(false)
      } else {
        showToast(result.error ?? "Save failed", "error")
      }
    })
  }

  return (
    <form
      action={handleSubmit}
      onChange={() => setDirty(true)}
      className={styles.form}
    >
      <input type="hidden" name="id" value={profile?.id ?? ""} />

      <section className={`card ${styles.section}`}>
        <span className="label">PROFILE PICTURE</span>
        <div className={styles.pictureRow}>
          {imageUrl && (
            <Image
              src={imageUrl}
              alt=""
              width={96}
              height={96}
              className={styles.picturePreview}
            />
          )}
          <div className={styles.dropzoneWrap}>
            <FileDropzone
              accept={IMAGE_TYPES.join(",")}
              hint="JPG / JPEG / PNG / WEBP, up to 8MB"
              disabled={!profile?.id}
              currentLabel={imagePath}
              onUpload={async (file) => {
                if (!profile?.id) return { path: null, error: "Save the profile first." }
                const result = await uploadProfilePicture(profile.id, imagePath, file)
                if (result.path) {
                  setImagePath(result.path)
                  // Cache-bust: the filename is fixed (profile-picture.*),
                  // so a replaced image needs a fresh URL to avoid the
                  // browser/CDN serving the old cached bytes.
                  const url = publicAssetUrl(result.path)
                  setImageUrl(url ? `${url}?t=${Date.now()}` : null)
                }
                return result
              }}
            />
            {!profile?.id && (
              <p className={styles.hintMuted}>Save the profile once before uploading a picture.</p>
            )}
          </div>
        </div>
      </section>

      <section className={`card ${styles.section}`}>
        <span className="label">IDENTITY</span>
        <div className={styles.grid2}>
          <TextField label="Full name" name="name" defaultValue={profile?.name} required />
          <TextField label="Display name" name="display_name" defaultValue={profile?.display_name} />
        </div>
        <TextField label="Headline" name="headline" defaultValue={profile?.headline} />
        <div className={styles.grid2}>
          <TextField label="Current role" name="current_role_title" defaultValue={profile?.current_role_title} />
          <TextField label="Current company" name="current_company" defaultValue={profile?.current_company} />
        </div>
      </section>

      <section className={`card ${styles.section}`}>
        <span className="label">BIO</span>
        <TextAreaField
          label="Short bio"
          name="short_bio"
          defaultValue={profile?.short_bio}
          hint="One or two sentences. Used wherever space is tight."
        />
        <TextAreaField
          label="Long bio"
          name="long_bio"
          defaultValue={profile?.long_bio}
          rows={8}
          hint="Plain text, paragraphs separated by a blank line — the public site renders this as-is, not as HTML."
        />
      </section>

      <section className={`card ${styles.section}`}>
        <span className="label">LOCATION &amp; CONTACT</span>
        <div className={styles.grid2}>
          <TextField label="Location" name="location" defaultValue={profile?.location} />
          <TextField label="Email" name="email" type="email" defaultValue={profile?.email} />
        </div>
        <div className={styles.grid2}>
          <TextField label="Phone" name="phone" defaultValue={profile?.phone} />
          <label className={styles.checkboxField}>
            <input type="checkbox" name="show_phone" defaultChecked={profile?.show_phone} />
            Show phone publicly
          </label>
        </div>
      </section>

      <section className={`card ${styles.section}`}>
        <span className="label">LINKS</span>
        <div className={styles.grid2}>
          <TextField label="Website" name="website_url" defaultValue={profile?.website_url} />
          <TextField label="GitHub" name="github_url" defaultValue={profile?.github_url} />
          <TextField label="LinkedIn" name="linkedin_url" defaultValue={profile?.linkedin_url} />
          <TextField label="Instagram" name="instagram_url" defaultValue={profile?.instagram_url} />
        </div>
      </section>

      <section className={`card ${styles.section}`}>
        <span className="label">FOCUS</span>
        <div className={styles.grid2}>
          <TextField label="Primary domain" name="primary_domain" defaultValue={profile?.primary_domain} />
          <TextField
            label="Secondary domains (comma-separated)"
            name="secondary_domains"
            defaultValue={profile?.secondary_domains?.join(", ")}
          />
        </div>
        <TextField label="Availability status" name="availability_status" defaultValue={profile?.availability_status} />
      </section>

      <section className={`card ${styles.section}`}>
        <span className="label">STATUS</span>
        <div className={styles.grid2}>
          <label className={styles.checkboxField}>
            <input type="checkbox" name="published" defaultChecked={profile?.published ?? true} />
            Published
          </label>
          <label className={styles.checkboxField}>
            <input type="checkbox" name="featured_profile" defaultChecked={profile?.featured_profile ?? true} />
            Featured profile
          </label>
        </div>
      </section>

      <input type="hidden" name="other_links" value="[]" />

      <div className={styles.saveBar}>
        {dirty && <span className={styles.unsaved}>Unsaved changes</span>}
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending ? "Saving…" : "Save changes"}
        </button>
      </div>
    </form>
  )
}

function TextField({
  label,
  name,
  defaultValue,
  type = "text",
  required
}: {
  label: string
  name: string
  defaultValue?: string | null
  type?: string
  required?: boolean
}) {
  return (
    <div className="field">
      <label htmlFor={name}>{label}</label>
      <input
        id={name}
        name={name}
        type={type}
        defaultValue={defaultValue ?? ""}
        required={required}
        className="input"
      />
    </div>
  )
}

function TextAreaField({
  label,
  name,
  defaultValue,
  rows = 4,
  hint
}: {
  label: string
  name: string
  defaultValue?: string | null
  rows?: number
  hint?: string
}) {
  return (
    <div className="field">
      <label htmlFor={name}>{label}</label>
      <textarea
        id={name}
        name={name}
        defaultValue={defaultValue ?? ""}
        rows={rows}
        className="textarea"
      />
      {hint && <span className="field-hint">{hint}</span>}
    </div>
  )
}
