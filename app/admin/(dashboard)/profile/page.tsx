import { getProfile, listResumeOptions } from "./actions"
import ProfileForm from "./ProfileForm"

export const dynamic = "force-dynamic"

export default async function ProfilePage() {
  const [profile, resumeOptions] = await Promise.all([getProfile(), listResumeOptions()])

  return <ProfileForm profile={profile} resumeOptions={resumeOptions} />
}
