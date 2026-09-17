import { listDomainNodes } from "./actions"
import { listAllTags } from "@/lib/data/tags"
import DomainNodesClient from "./DomainNodesClient"

export const dynamic = "force-dynamic"

export default async function DomainNodesPage() {
  const [nodes, tags] = await Promise.all([listDomainNodes(), listAllTags()])
  return <DomainNodesClient nodes={nodes} allTags={tags} />
}
