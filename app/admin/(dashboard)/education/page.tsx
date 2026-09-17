import { listEducation } from "./actions"
import EducationClient from "./EducationClient"

export const dynamic = "force-dynamic"

export default async function EducationPage() {
  const education = await listEducation()
  return <EducationClient education={education} />
}
