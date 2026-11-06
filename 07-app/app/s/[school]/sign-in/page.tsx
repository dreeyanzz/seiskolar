import { SignInScreen, signInMetadata } from '@/components/screens/sign-in'
import { schoolPortal, type SchoolParams } from '@/lib/portal/school-route'

export const metadata = signInMetadata

export default async function SchoolSignIn({ params }: { params: SchoolParams }) {
  return <SignInScreen portal={await schoolPortal(params)} />
}
