import { createAdminClient } from "@/lib/supabase/admin"
import styles from "../shared-list.module.css"

export const dynamic = "force-dynamic"

export default async function ActivityPage() {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("activity_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200)

  if (error) console.error("ActivityPage", error.message)
  const entries = data ?? []

  return (
    <div className={styles.page}>
      {entries.length === 0 ? (
        <p className={styles.empty}>No activity recorded yet.</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>When</th>
              <th>Action</th>
              <th>Entity</th>
              <th>Detail</th>
              <th>By</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.id}>
                <td>{new Date(entry.created_at).toLocaleString()}</td>
                <td>
                  <span className="badge badge-neutral">{entry.action}</span>
                </td>
                <td>{entry.entity_type}</td>
                <td>{entry.detail ?? "—"}</td>
                <td>{entry.actor ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
