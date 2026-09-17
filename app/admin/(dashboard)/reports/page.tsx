import { listAllReports } from "./actions"
import ReportsClient from "./ReportsClient"

export const dynamic = "force-dynamic"

export default async function ReportsPage() {
  const reports = await listAllReports()
  return <ReportsClient reports={reports} />
}
