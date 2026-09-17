import { listTags } from "./actions"
import TagsClient from "./TagsClient"

export const dynamic = "force-dynamic"

export default async function TagsPage() {
  const tags = await listTags()
  return <TagsClient tags={tags} />
}
