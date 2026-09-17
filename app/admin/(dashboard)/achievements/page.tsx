import { listAchievements } from "./actions"
import AchievementsClient from "./AchievementsClient"

export const dynamic = "force-dynamic"

export default async function AchievementsPage() {
  const achievements = await listAchievements()
  return <AchievementsClient achievements={achievements} />
}
