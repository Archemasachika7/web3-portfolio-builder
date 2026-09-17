"use client"

import { useState } from "react"
import Image from "next/image"
import type { ProjectDetail } from "../actions"
import {
  uploadProjectImage,
  attachProjectHeroMedia,
  attachProjectMedia,
  deleteProjectMedia,
  reorderProjectMedia
} from "../actions"
import { useToast } from "@/components/admin/Toast"
import FileDropzone from "@/components/admin/FileDropzone"
import MediaUploadField from "@/components/admin/MediaUploadField"
import { IMAGE_TYPES, VIDEO_TYPES } from "@/lib/storageConstants"
import { publicAssetUrl } from "@/lib/publicUrl"
import type { ProjectMedia } from "@/shared/database.types"
import styles from "./editor.module.css"

function isVideoPath(path: string | null): boolean {
  if (!path) return false
  return /\.(mp4|webm)$/i.test(path)
}

export default function MediaTab({ project }: { project: ProjectDetail }) {
  const { showToast } = useToast()
  const [thumbnailPath, setThumbnailPath] = useState(project.thumbnail_path)
  const [heroPath, setHeroPath] = useState(project.hero_media_path)
  const [media, setMedia] = useState<ProjectMedia[]>(project.media)

  return (
    <div className={styles.form}>
      <div className={styles.grid2}>
        <div>
          <span className="label">THUMBNAIL</span>
          {thumbnailPath && (
            <Image
              src={publicAssetUrl(thumbnailPath) ?? ""}
              alt=""
              width={200}
              height={130}
              className={styles.mediaPreview}
            />
          )}
          <FileDropzone
            accept={IMAGE_TYPES.join(",")}
            hint="JPG / PNG / WEBP, up to 8MB"
            currentLabel={thumbnailPath}
            onUpload={(file) =>
              uploadProjectImage(project.id, project.slug, "thumbnail_path", thumbnailPath, file)
            }
            onUploaded={(path) => setThumbnailPath(path)}
          />
        </div>

        <div>
          <span className="label">HERO MEDIA</span>
          {heroPath &&
            (isVideoPath(heroPath) ? (
              <video
                src={publicAssetUrl(heroPath) ?? ""}
                className={styles.mediaPreview}
                muted
                controls
              />
            ) : (
              <Image
                src={publicAssetUrl(heroPath) ?? ""}
                alt=""
                width={200}
                height={130}
                className={styles.mediaPreview}
              />
            ))}
          <MediaUploadField
            accept={[...IMAGE_TYPES, ...VIDEO_TYPES].join(",")}
            hint="JPG / PNG / WEBP up to 8MB, or MP4 / WEBM up to 200MB — shows real upload progress"
            folder={`PROJECTS/${project.slug}`}
            allowedTypesKey="image-or-video"
            filenameOverride={(file) => `hero.${file.name.split(".").pop()?.toLowerCase() ?? "webp"}`}
            currentLabel={heroPath}
            onUploaded={async (path) => {
              const result = await attachProjectHeroMedia(project.id, path, heroPath)
              if (result.ok) {
                setHeroPath(path)
              } else {
                showToast(result.error ?? "Saved file but failed to update the project record.", "error")
              }
            }}
          />
        </div>
      </div>

      <div>
        <span className="label">GALLERY (screenshots, diagrams, models, video loops)</span>
        <div className={styles.mediaGrid}>
          {media
            .sort((a, b) => a.display_order - b.display_order)
            .map((m, index) => (
              <div key={m.id} className={styles.mediaItem}>
                {m.media_type === "video" ? (
                  <video src={publicAssetUrl(m.storage_path) ?? ""} className={styles.mediaThumb} muted />
                ) : (
                  <Image
                    src={publicAssetUrl(m.storage_path) ?? ""}
                    alt={m.alt_text ?? ""}
                    width={140}
                    height={100}
                    className={styles.mediaThumb}
                  />
                )}
                <div className={styles.mediaItemActions}>
                  <button
                    type="button"
                    className="btn"
                    disabled={index === 0}
                    onClick={async () => {
                      const reordered = [...media]
                      const sorted = reordered.sort((a, b) => a.display_order - b.display_order)
                      const i = sorted.findIndex((x) => x.id === m.id)
                      if (i <= 0) return
                      ;[sorted[i - 1], sorted[i]] = [sorted[i], sorted[i - 1]]
                      setMedia(sorted)
                      await reorderProjectMedia(project.id, sorted.map((x) => x.id))
                    }}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    className="btn"
                    disabled={index === media.length - 1}
                    onClick={async () => {
                      const sorted = [...media].sort((a, b) => a.display_order - b.display_order)
                      const i = sorted.findIndex((x) => x.id === m.id)
                      if (i < 0 || i >= sorted.length - 1) return
                      ;[sorted[i + 1], sorted[i]] = [sorted[i], sorted[i + 1]]
                      setMedia(sorted)
                      await reorderProjectMedia(project.id, sorted.map((x) => x.id))
                    }}
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={async () => {
                      const result = await deleteProjectMedia(m.id, project.id, m.storage_path)
                      if (result.ok) {
                        setMedia((prev) => prev.filter((x) => x.id !== m.id))
                        showToast("Removed", "success")
                      } else {
                        showToast(result.error ?? "Delete failed", "error")
                      }
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
        </div>

        <div className={styles.addMediaRow}>
          <MediaUploadField
            accept={[...IMAGE_TYPES, ...VIDEO_TYPES].join(",")}
            hint="Image or video — add another gallery item, shows real upload progress"
            folder={`PROJECTS/${project.slug}/media`}
            allowedTypesKey="image-or-video"
            unique
            onUploaded={async (path, file) => {
              const mediaType = VIDEO_TYPES.includes(file.type) ? "video" : "screenshot"
              const result = await attachProjectMedia(project.id, mediaType, path)
              if (result.ok) {
                window.location.reload()
              } else {
                showToast(result.error ?? "Saved file but failed to add it to the gallery.", "error")
              }
            }}
          />
        </div>
      </div>
    </div>
  )
}
