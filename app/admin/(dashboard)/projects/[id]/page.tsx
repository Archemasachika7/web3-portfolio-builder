import { notFound } from "next/navigation"
import { getProject } from "../actions"
import { listAllTags } from "@/lib/data/tags"
import ProjectEditor from "./ProjectEditor"

export const dynamic = "force-dynamic"

export default async function ProjectEditorPage({ params }: { params: { id: string } }) {
  const [project, allTags] = await Promise.all([getProject(params.id), listAllTags()])

  if (!project) notFound()

  return <ProjectEditor project={project} allTags={allTags} />
}
