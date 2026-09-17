import { listStorageObjects, buildUsageIndex } from "./actions"
import StorageClient from "./StorageClient"

export const dynamic = "force-dynamic"

export default async function StoragePage() {
  const [objects, usageIndex] = await Promise.all([listStorageObjects(), buildUsageIndex()])
  const usage = Object.fromEntries(usageIndex.entries())

  return <StorageClient objects={objects} usage={usage} />
}
