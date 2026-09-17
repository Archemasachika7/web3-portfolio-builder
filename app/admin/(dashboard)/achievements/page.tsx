import { listAchievements } from "./actions"
import { listAllTags } from "@/lib/data/tags"
import AchievementsClient from "./AchievementsClient"

export const dynamic = "force-dynamic"

export default async function AchievementsPage() {
  const [achievements, tags] = await Promise.all([listAchievements(), listAllTags()])
  return <AchievementsClient achievements={achievements} allTags={tags} />
}
