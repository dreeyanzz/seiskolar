/**
 * Activate your account: the sign-up path, step one. Asks for a link to set a first password.
 *
 * Assumed, and not in the team's design. The team member asked for a sign-up, but the SRS has
 * no public sign-up: the DOST Regional Office makes scholar and coordinator accounts, and the
 * system administrator makes DOST staff accounts (FR-ADM-001, S08.2 to S08.6). What it leaves
 * open is how that person then gets a password (the SDD's "Still open", item 8). So nobody
 * can create an account here; someone DOST already registered proves they hold the address,
 * then sets a password. The SRS's data model points the same way: a scholar's profile is
 * "nullable until account claimed" (§4.3). Adrian owns the SRS and should confirm this.
 *
 * It looks like the sign-in screen because it extends it: same shell, same parts.
 */
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { ActivateForm } from '@/components/activate-form'
import { Alone } from '@/components/alone'
import { demo, identity } from '@/lib/backend'
import { destinationFor } from '@/lib/identity/destination'
import { requestContext } from '@/lib/portal/request'
import type { Portal } from '@/lib/portal/types'

export const activateMetadata: Metadata = { title: 'Activate your account · SEIskolar' }

export async function ActivateScreen({ portal }: { portal: Portal }) {
  const claims = await identity.getClaims()
  if (claims) redirect(await destinationFor(claims))

  const { base } = await requestContext()
  return (
    <Alone portal={portal}>
      <ActivateForm
        signInHref={`${base}/sign-in`}
        contact={
          portal.kind === 'school'
            ? 'your DOST Regional Office'
            : 'the system administrator'
        }
        demoGroups={demo?.activation ?? null}
      />
    </Alone>
  )
}
