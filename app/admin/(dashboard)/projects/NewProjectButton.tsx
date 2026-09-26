"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { createProject } from "./actions"
import { callAction } from "@/lib/callAction"
import { useToast } from "@/components/admin/Toast"
import Icon from "@/components/admin/Icon"

/** Creates a draft and opens its editor; shows why if that fails. */
export default function NewProjectButton({ className = "", label = "New project" }: { className?: string; label?: string }) {
  const [pending, startTransition] = useTransition()
  const { showToast } = useToast()
  const router = useRouter()

  return (
    <button
      type="button"
      className={`btn btn-primary ${className}`}
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const result = await callAction(() => createProject())
          if (result.ok && "id" in result && result.id) router.push(`/admin/projects/${result.id}`)
          else showToast(result.error ?? "Couldn't create the project.", "error")
        })
      }
    >
      <Icon name="plus" size={16} />
      {pending ? "Creating…" : label}
    </button>
  )
}
