import { ActivateScreen, activateMetadata } from '@/components/screens/activate'

export const metadata = activateMetadata

export default function ConsoleActivate() {
  return <ActivateScreen portal={{ kind: 'console' }} />
}
