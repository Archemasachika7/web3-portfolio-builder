/**
 * Browser side of an upload: check the file, get a signed URL, send the
 * bytes straight to Supabase Storage with real progress, then record it.
 * See lib/uploadActions.ts for the two server steps.
 */
import { prepareUpload, finishUpload, type FinishResult } from "./uploadActions"
import { callAction } from "./callAction"
import { checkFile, contentTypeFor, type UploadKind } from "./uploadKinds"

export type UploadResult = FinishResult

/** Supabase's default per-file upload limit on the Free plan. */
const FREE_PLAN_LIMIT = 50 * 1024 * 1024

export interface DirectUploadOptions {
  kind: UploadKind
  recordId: string
  file: File
  /** Report title, for project reports. */
  title?: string
  onProgress?: (fraction: number) => void
  signal?: AbortSignal
}

export async function directUpload({ kind, recordId, file, title, onProgress, signal }: DirectUploadOptions): Promise<UploadResult> {
  const problem = checkFile(kind, file)
  if (problem) return { ok: false, error: problem }

  const info = { name: file.name, type: file.type, size: file.size }
  const prepared = await callAction(() => prepareUpload({ kind, recordId, file: info }))
  if (!prepared.ok) return { ok: false, error: prepared.error ?? "Couldn't start the upload." }
  if (!("uploadUrl" in prepared)) return { ok: false, error: "Couldn't start the upload." }

  const sent = await putFile(prepared.uploadUrl, file, onProgress, signal)
  if (sent) return { ok: false, error: sent }

  const finished = await callAction(() => finishUpload({ kind, recordId, path: prepared.path, file: info, title }))
  return finished.ok ? (finished as UploadResult) : { ok: false, error: finished.error ?? "Upload finished but couldn't be saved." }
}

/**
 * PUT the file to a Supabase signed upload URL — the same request
 * storage-js's uploadToSignedUrl makes, but over XHR so there are
 * progress events. Resolves to an error message, or null on success.
 */
function putFile(url: string, file: File, onProgress?: (f: number) => void, signal?: AbortSignal): Promise<string | null> {
  return new Promise((resolve) => {
    if (signal?.aborted) return resolve("Upload cancelled.")

    const body = new FormData()
    body.append("cacheControl", "31536000")
    // Models usually arrive without a MIME type; give Storage a sensible one.
    const typed = file.type ? file : new File([file], file.name, { type: contentTypeFor(file) })
    body.append("", typed)

    const xhr = new XMLHttpRequest()
    xhr.open("PUT", url)
    xhr.setRequestHeader("x-upsert", "false")
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (anonKey) xhr.setRequestHeader("apikey", anonKey)

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && e.total > 0) onProgress?.(e.loaded / e.total)
    }
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress?.(1)
        return resolve(null)
      }
      resolve(storageError(xhr.status, xhr.responseText))
    }
    xhr.onerror = () =>
      resolve(
        file.size > FREE_PLAN_LIMIT
          ? "The upload was cut off. Supabase does this when a file is over the project's upload limit (50 MB on the Free plan; raise it in Supabase → Storage → Settings). Otherwise, check your connection and try again."
          : "The upload was interrupted. Check your connection and try again."
      )
    xhr.ontimeout = () => resolve("The upload timed out. Try again on a steadier connection.")
    xhr.onabort = () => resolve("Upload cancelled.")
    signal?.addEventListener("abort", () => xhr.abort(), { once: true })

    xhr.send(body)
  })
}

function storageError(status: number, text: string): string {
  let message = ""
  try {
    const json = JSON.parse(text) as { message?: string; error?: string }
    message = json.message || json.error || ""
  } catch {
    message = text.slice(0, 200)
  }
  if (status === 413 || /maximum allowed size|too large/i.test(message)) {
    return "This file is larger than your Supabase project allows. Raise the limit in Supabase → Storage → Settings (Free plan max is 50 MB), or upload a smaller file."
  }
  if (/mime type/i.test(message)) return `Storage refused this file type: ${message}`
  if (status === 401 || status === 403 || /signature|jwt|token/i.test(message)) {
    return "The upload link expired or was rejected. Try again."
  }
  return `Storage rejected the upload (${status})${message ? `: ${message}` : "."}`
}
