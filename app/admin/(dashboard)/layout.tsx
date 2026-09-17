import { requireAdminSession } from "@/lib/auth"
import AdminShell from "@/components/admin/AdminShell"

/**
 * This route group's layout is the one place requireAdminSession() runs.
 * /admin/login lives OUTSIDE this group (a sibling of the group folder),
 * so it is never wrapped by this layout — visiting it while signed out
 * does not redirect back to itself.
 */
export default async function ProtectedAdminLayout({
  children
}: {
  children: React.ReactNode
}) {
  const user = await requireAdminSession()

  return <AdminShell userEmail={user.email ?? null}>{children}</AdminShell>
}
