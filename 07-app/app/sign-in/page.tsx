import { SignInScreen, signInMetadata } from '@/components/screens/sign-in'

export const metadata = signInMetadata

export default function ConsoleSignIn() {
  return <SignInScreen portal={{ kind: 'console' }} />
}
