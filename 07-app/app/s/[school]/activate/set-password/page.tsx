import { SetPasswordScreen, setPasswordMetadata } from '@/components/screens/set-password'
import { schoolPortal, type SchoolParams } from '@/lib/portal/school-route'

export const metadata = setPasswordMetadata

interface PageProps {
  params: SchoolParams
  searchParams: Promise<{ token?: string | string[] }>
}

export default async function SchoolSetPassword({ params, searchParams }: PageProps) {
  const { token } = await searchParams
  return (
    <SetPasswordScreen
      portal={await schoolPortal(params)}
      token={typeof token === 'string' ? token : undefined}
    />
  )
}
