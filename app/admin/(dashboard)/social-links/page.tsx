import { listSocialLinks } from "./actions"
import SocialLinksClient from "./SocialLinksClient"

export const dynamic = "force-dynamic"

export default async function SocialLinksPage() {
  const links = await listSocialLinks()
  return <SocialLinksClient links={links} />
}
