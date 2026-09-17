import { listHomepageMedia } from "./actions"
import HomepageMediaClient from "./HomepageMediaClient"

export const dynamic = "force-dynamic"

export default async function HomepageMediaPage() {
  const sections = await listHomepageMedia()
  return <HomepageMediaClient sections={sections} />
}
