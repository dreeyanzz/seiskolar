import { SetPasswordScreen, setPasswordMetadata } from '@/components/screens/set-password'

export const metadata = setPasswordMetadata

interface PageProps {
  searchParams: Promise<{ token?: string | string[] }>
}

export default async function ConsoleSetPassword({ searchParams }: PageProps) {
  const { token } = await searchParams
  return (
    <SetPasswordScreen
      portal={{ kind: 'console' }}
      token={typeof token === 'string' ? token : undefined}
    />
  )
}
