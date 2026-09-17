import { listExperience } from "./actions"
import { listAllTags } from "@/lib/data/tags"
import ExperienceClient from "./ExperienceClient"

export const dynamic = "force-dynamic"

export default async function ExperiencePage() {
  const [experience, tags] = await Promise.all([listExperience(), listAllTags()])
  return <ExperienceClient experience={experience} allTags={tags} />
}
