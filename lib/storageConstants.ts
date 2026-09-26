/**
 * Client-safe constants and pure functions split out of lib/storage.ts
 * (which is server-only) so Client Components can reference allowed
 * file types without pulling in the service-role upload/delete code.
 */

export const IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
export const VIDEO_TYPES = ["video/mp4", "video/webm"]
export const PDF_TYPES = ["application/pdf"]
export const RESUME_TYPES = [
  ...PDF_TYPES,
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
]

/**
 * CAD and 3D mesh formats the public site's viewer can open.
 *
 * These are matched by EXTENSION, not MIME type: browsers report most of
 * them as "" or "application/octet-stream" because there is no registered
 * type for STEP/IGES/STL, so MIME-based validation rejects perfectly valid
 * CAD files. Keep this list in sync with components/cad/formats.js on the
 * public site — a file accepted here but unknown there uploads fine and
 * then refuses to render.
 */
export const MODEL_EXTENSIONS = [
  "step",
  "stp",
  "iges",
  "igs",
  "brep",
  "stl",
  "obj",
  "glb",
  "gltf",
  "3mf",
  "ply",
  "fbx",
  "dae"
]

/** Lowercased extension of a filename, without the dot. */
export function extensionOf(name: string): string {
  const clean = name.split(/[?#]/)[0]
  const last = clean.split("/").pop() ?? ""
  const dot = last.lastIndexOf(".")
  return dot === -1 ? "" : last.slice(dot + 1).toLowerCase()
}
