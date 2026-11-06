import { NoAccessScreen, noAccessMetadata } from '@/components/screens/no-access'

export const metadata = noAccessMetadata

export default function ConsoleNoAccess() {
  return <NoAccessScreen portal={{ kind: 'console' }} />
}
