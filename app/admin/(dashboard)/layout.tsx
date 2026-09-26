import { requireAdminSession } from "@/lib/auth"
import { missingEnv } from "@/lib/env"
import AdminShell from "@/components/admin/AdminShell"
import ConfigError from "@/components/admin/ConfigError"

/**
 * Gates the admin shell. Pages render in parallel with this layout, so
 * every data helper and Server Action also checks the session itself
 * (cached per request, so it costs one Supabase call in total).
 * /admin/login lives outside this group, so it's never wrapped by it.
 */
export default async function ProtectedAdminLayout({
  children
}: {
  children: React.ReactNode
}) {
  const missing = missingEnv()
  if (missing.length > 0) return <ConfigError missing={missing} />

  const user = await requireAdminSession()

  return <AdminShell userEmail={user.email ?? null}>{children}</AdminShell>
}
