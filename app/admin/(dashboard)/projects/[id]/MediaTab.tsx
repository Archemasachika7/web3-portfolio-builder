"use client"

import { useState } from "react"
import type { ProjectDetail } from "../actions"
import { deleteProjectMedia, reorderProjectMedia } from "../actions"
import { useToast } from "@/components/admin/Toast"
import UploadField from "@/components/admin/UploadField"
import { callAction } from "@/lib/callAction"
import { publicAssetUrl } from "@/lib/publicUrl"
import type { ProjectMedia } from "@/shared/database.types"
import styles from "./editor.module.css"

const byOrder = (a: ProjectMedia, b: ProjectMedia) => a.display_order - b.display_order

export default function MediaTab({ project }: { project: ProjectDetail }) {
  const { showToast } = useToast()
  const [media, setMedia] = useState<ProjectMedia[]>(() => [...project.media].sort(byOrder))
  const [busyId, setBusyId] = useState<string | null>(null)

  async function move(id: string, delta: -1 | 1) {
    const i = media.findIndex((x) => x.id === id)
    const j = i + delta
    if (i < 0 || j < 0 || j >= media.length || busyId) return
    const previous = media
    const next = [...media]
    ;[next[i], next[j]] = [next[j], next[i]]
    const renumbered = next.map((m, index) => ({ ...m, display_order: index }))
    setMedia(renumbered)
    setBusyId(id)
    const result = await callAction(() => reorderProjectMedia(project.id, renumbered.map((x) => x.id)))
    setBusyId(null)
    if (!result.ok) {
      setMedia(previous)
      showToast(result.error ?? "Couldn't reorder.", "error")
    }
  }

  async function remove(id: string) {
    if (busyId) return
    setBusyId(id)
    const result = await callAction(() => deleteProjectMedia(id, project.id))
    setBusyId(null)
    if (result.ok) {
      setMedia((prev) => prev.filter((x) => x.id !== id))
      showToast("Removed", "success")
    } else {
      showToast(result.error ?? "Delete failed", "error")
    }
  }

  return (
    <div className={styles.form}>
      <div className={styles.grid2}>
        <div className="field">
          <span className="label">THUMBNAIL</span>
          <UploadField kind="project-thumbnail" recordId={project.id} currentPath={project.thumbnail_path} removable />
          <span className="field-hint">Card and list image. Required to publish.</span>
        </div>

        <div className="field">
          <span className="label">HERO MEDIA</span>
          <UploadField kind="project-hero" recordId={project.id} currentPath={project.hero_media_path} removable />
          <span className="field-hint">Top of the project page. A still or a short loop.</span>
        </div>
      </div>

      <div className="field">
        <span className="label">GALLERY (screenshots, diagrams, models, video loops)</span>
        {media.length > 0 && (
          <div className={styles.mediaGrid}>
            {media.map((m, index) => {
              const url = publicAssetUrl(m.storage_path) ?? ""
              return (
                <div key={m.id} className={styles.mediaItem} data-busy={busyId === m.id ? "true" : undefined}>
                  {m.media_type === "model" ? (
                    <div className={styles.modelThumb}>
                      <span className={styles.modelBadge}>{(m.storage_path.split(".").pop() ?? "3D").toUpperCase()}</span>
                      <span className={styles.modelName}>{m.storage_path.split("/").pop()}</span>
                    </div>
                  ) : m.media_type === "video" ? (
                    <video src={url} className={styles.mediaThumb} muted playsInline preload="metadata" />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={url} alt={m.alt_text ?? ""} className={styles.mediaThumb} loading="lazy" />
                  )}
                  <div className={styles.mediaItemActions}>
                    <button
                      type="button"
                      className="btn btn-sm"
                      aria-label="Move earlier"
                      disabled={index === 0 || !!busyId}
                      onClick={() => move(m.id, -1)}
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm"
                      aria-label="Move later"
                      disabled={index === media.length - 1 || !!busyId}
                      onClick={() => move(m.id, 1)}
                    >
                      ↓
                    </button>
                    <button type="button" className="btn btn-sm btn-danger" disabled={!!busyId} onClick={() => remove(m.id)}>
                      {busyId === m.id ? "…" : "Delete"}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <UploadField
          kind="project-media"
          recordId={project.id}
          multiple
          onUploaded={(result) => {
            const added = result.media
            if (added) setMedia((prev) => [...prev, added])
          }}
        />
      </div>
    </div>
  )
}
