import { NextResponse } from "next/server"
import { getAdminUserForApi } from "@/lib/auth"
import { uploadAsset, uniqueFilename, IMAGE_TYPES, VIDEO_TYPES, MODEL_EXTENSIONS } from "@/lib/storage"

/**
 * Used specifically by client-side XHR uploads that need real byte-level
 * progress (large video files) — Server Actions transport over fetch,
 * which has no upload-progress event, so those flows can't report real
 * percentages. Everything else (images, PDFs, resumes — all capped well
 * under a size where progress actually matters) stays on the simpler
 * Server Action + FileDropzone path.
 *
 * allowedTypesKey is resolved server-side rather than trusting a
 * client-supplied MIME list, even though this endpoint is auth-gated —
 * uploadAsset() would reject an unlisted type either way, but this
 * keeps the set of accepted types an explicit, auditable server-side
 * decision.
 */
const TYPE_SETS: Record<string, string[]> = {
  video: VIDEO_TYPES,
  "image-or-video": [...IMAGE_TYPES, ...VIDEO_TYPES],
  // Models carry no usable MIME type, so this set is empty and the
  // extension allowlist below does the validating instead.
  model: [],
  "image-video-or-model": [...IMAGE_TYPES, ...VIDEO_TYPES]
}

/** Keys whose uploads are additionally allowed by extension. */
const EXTENSION_SETS: Record<string, string[]> = {
  model: MODEL_EXTENSIONS,
  "image-video-or-model": MODEL_EXTENSIONS
}

export async function POST(request: Request) {
  const user = await getAdminUserForApi()
  if (!user) {
    return NextResponse.json({ path: null, error: "Not authenticated." }, { status: 401 })
  }

  const formData = await request.formData()
  const file = formData.get("file")
  const folder = String(formData.get("folder") ?? "")
  const allowedTypesKey = String(formData.get("allowedTypesKey") ?? "")
  const makeUnique = formData.get("unique") === "true"
  const filenameOverride = formData.get("filenameOverride")

  if (!(file instanceof File) || !folder || !TYPE_SETS[allowedTypesKey]) {
    return NextResponse.json({ path: null, error: "Malformed upload request." }, { status: 400 })
  }

  const result = await uploadAsset({
    file,
    folder,
    allowedTypes: TYPE_SETS[allowedTypesKey],
    allowedExtensions: EXTENSION_SETS[allowedTypesKey],
    filenameOverride:
      typeof filenameOverride === "string" && filenameOverride
        ? filenameOverride
        : makeUnique
          ? uniqueFilename(file.name)
          : undefined
  })

  return NextResponse.json(result, { status: result.error ? 400 : 200 })
}
