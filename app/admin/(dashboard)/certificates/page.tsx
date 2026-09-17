import { listCertificates } from "./actions"
import { listAllTags } from "@/lib/data/tags"
import CertificatesClient from "./CertificatesClient"

export const dynamic = "force-dynamic"

export default async function CertificatesPage() {
  const [certificates, tags] = await Promise.all([listCertificates(), listAllTags()])
  return <CertificatesClient certificates={certificates} allTags={tags} />
}
