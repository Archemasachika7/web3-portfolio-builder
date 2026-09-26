/**
 * Every upload slot in the admin, and what it accepts. Client-safe: the
 * browser checks a file against this before sending anything, and the
 * server checks it again before signing the upload.
 */
import { IMAGE_TYPES, VIDEO_TYPES, PDF_TYPES, RESUME_TYPES, MODEL_EXTENSIONS, extensionOf } from "./storageConstants"

export type FileClass = "image" | "video" | "pdf" | "resume" | "model"

const MB = 1024 * 1024

const CLASSES: Record<FileClass, { types: string[]; extensions: string[]; maxBytes: number; label: string }> = {
  image: { types: IMAGE_TYPES, extensions: ["jpg", "jpeg", "png", "webp"], maxBytes: 8 * MB, label: "JPG / PNG / WEBP" },
  video: { types: VIDEO_TYPES, extensions: ["mp4", "webm"], maxBytes: 200 * MB, label: "MP4 / WEBM" },
  pdf: { types: PDF_TYPES, extensions: ["pdf"], maxBytes: 25 * MB, label: "PDF" },
  resume: { types: RESUME_TYPES, extensions: ["pdf", "docx"], maxBytes: 25 * MB, label: "PDF / DOCX" },
  // Browsers report CAD formats with no MIME type, so models are matched
  // by extension only.
  model: { types: [], extensions: MODEL_EXTENSIONS, maxBytes: 150 * MB, label: "STEP / STL / GLB / OBJ" }
}

export const UPLOAD_KINDS = {
  "profile-picture": ["image"],
  "education-logo": ["image"],
  "experience-logo": ["image"],
  "achievement-image": ["image"],
  "certificate-thumbnail": ["image"],
  "certificate-file": ["pdf"],
  "resume-file": ["resume"],
  "project-thumbnail": ["image"],
  "project-hero": ["image", "video"],
  "project-media": ["image", "video", "model"],
  "project-report": ["pdf"],
  "homepage-media": ["image", "video"],
  "homepage-poster": ["image"],
  "homepage-mobile": ["image", "video"],
  "site-favicon": ["image"],
  "site-og": ["image"]
} as const satisfies Record<string, readonly FileClass[]>

export type UploadKind = keyof typeof UPLOAD_KINDS

export function isUploadKind(value: string): value is UploadKind {
  return Object.prototype.hasOwnProperty.call(UPLOAD_KINDS, value)
}

/** Which of the kind's classes this file belongs to, or null if none. */
export function classifyFile(kind: UploadKind, file: { name: string; type: string }): FileClass | null {
  const ext = extensionOf(file.name)
  // Either signal is enough: some systems report odd or empty MIME types
  // for perfectly ordinary files.
  for (const cls of UPLOAD_KINDS[kind]) {
    const spec = CLASSES[cls]
    if (spec.extensions.includes(ext) || spec.types.includes(file.type)) return cls
  }
  return null
}

function formatMB(bytes: number) {
  return `${Math.round(bytes / MB)} MB`
}

/** A human-readable problem with the file, or null if it's acceptable. */
export function checkFile(kind: UploadKind, file: { name: string; type: string; size: number }): string | null {
  if (file.size === 0) return "That file is empty."
  const cls = classifyFile(kind, file)
  if (!cls) return `This slot takes ${hintFor(kind, false)}. "${file.name}" isn't one of those.`
  const max = CLASSES[cls].maxBytes
  if (file.size > max) {
    return `"${file.name}" is ${(file.size / MB).toFixed(1)} MB; the limit for ${CLASSES[cls].label} is ${formatMB(max)}.`
  }
  return null
}

/** Value for an <input type="file" accept="…">. */
export function acceptFor(kind: UploadKind): string {
  return UPLOAD_KINDS[kind]
    .flatMap((cls) => [...CLASSES[cls].types, ...CLASSES[cls].extensions.map((e) => `.${e}`)])
    .join(",")
}

/** "JPG / PNG / WEBP up to 8 MB · MP4 / WEBM up to 200 MB" */
export function hintFor(kind: UploadKind, withSizes = true): string {
  return UPLOAD_KINDS[kind]
    .map((cls) => (withSizes ? `${CLASSES[cls].label} up to ${formatMB(CLASSES[cls].maxBytes)}` : CLASSES[cls].label))
    .join(withSizes ? " · " : " or ")
}

/** Content type to store the object with; models rarely carry one. */
export function contentTypeFor(file: { name: string; type: string }): string {
  if (file.type) return file.type
  const ext = extensionOf(file.name)
  const known: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
    mp4: "video/mp4",
    webm: "video/webm",
    pdf: "application/pdf",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    glb: "model/gltf-binary",
    gltf: "model/gltf+json",
    stl: "model/stl",
    obj: "model/obj",
    "3mf": "model/3mf",
    step: "application/step",
    stp: "application/step",
    iges: "application/iges",
    igs: "application/iges"
  }
  return known[ext] ?? "application/octet-stream"
}

export function isVideoPath(path: string | null | undefined): boolean {
  return !!path && /\.(mp4|webm)$/i.test(path)
}

export function isImagePath(path: string | null | undefined): boolean {
  return !!path && /\.(jpe?g|png|webp|gif|svg|avif)$/i.test(path)
}
