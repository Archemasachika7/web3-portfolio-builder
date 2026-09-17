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
