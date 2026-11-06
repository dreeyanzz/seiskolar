import { NoAccessScreen, noAccessMetadata } from '@/components/screens/no-access'
import { schoolPortal, type SchoolParams } from '@/lib/portal/school-route'

export const metadata = noAccessMetadata

export default async function SchoolNoAccess({ params }: { params: SchoolParams }) {
  return <NoAccessScreen portal={await schoolPortal(params)} />
}
