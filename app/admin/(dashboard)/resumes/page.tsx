import { listResumes } from "./actions"
import { listAllTags } from "@/lib/data/tags"
import ResumesClient from "./ResumesClient"

export const dynamic = "force-dynamic"

export default async function ResumesPage() {
  const [resumes, tags] = await Promise.all([listResumes(), listAllTags()])
  return <ResumesClient resumes={resumes} allTags={tags} />
}
