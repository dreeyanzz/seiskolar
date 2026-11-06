import { ActivateScreen, activateMetadata } from '@/components/screens/activate'
import { schoolPortal, type SchoolParams } from '@/lib/portal/school-route'

export const metadata = activateMetadata

export default async function SchoolActivate({ params }: { params: SchoolParams }) {
  return <ActivateScreen portal={await schoolPortal(params)} />
}
