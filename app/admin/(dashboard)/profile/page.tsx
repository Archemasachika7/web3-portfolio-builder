import { getProfile } from "./actions"
import { publicAssetUrl } from "@/lib/publicUrl"
import ProfileForm from "./ProfileForm"

export const dynamic = "force-dynamic"

export default async function ProfilePage() {
  const profile = await getProfile()

  return (
    <ProfileForm
      profile={profile}
      profilePictureUrl={publicAssetUrl(profile?.profile_image_path)}
    />
  )
}
