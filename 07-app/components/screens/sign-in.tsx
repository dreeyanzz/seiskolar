/**
 * Sign in. Built from 04-high-fidelity/sign-in.html, with the same content and states.
 *
 * Serves swimlane steps S01.1 to S01.4 and S08.8, in 02-swimlanes/01-sign-in.html and
 * 02-swimlanes/08-set-up-schools-and-people.html.
 * SRS: FR-IAM-001, FR-IAM-002.
 * States: school (a school's portal), console (the DOST console), and wrong-password, which
 * is what the form shows after a failed attempt.
 * Owner in the design's index: @gnthril.
 *
 * What the wireframe's notes say: the address picks this screen (S01.2), and grants nothing;
 * the account's role, region and school decide what it sees (FR-IAM-002, FR-IAM-003).
 *
 * Assumed: the "First time here?" link, which is the team member's requested sign-up path.
 * The design has no such link. See components/screens/activate.tsx.
 */
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { Alone } from '@/components/alone'
import { SignInForm } from '@/components/sign-in-form'
import { demo, identity } from '@/lib/backend'
import { destinationFor } from '@/lib/identity/destination'
import { requestContext } from '@/lib/portal/request'
import type { Portal } from '@/lib/portal/types'

export const signInMetadata: Metadata = { title: 'Sign in · SEIskolar' }

export async function SignInScreen({ portal }: { portal: Portal }) {
  const claims = await identity.getClaims()
  if (claims) redirect(await destinationFor(claims))

  const { base } = await requestContext()
  return (
    <Alone portal={portal}>
      <SignInForm activateHref={`${base}/activate`} demoGroups={demo?.signIn ?? null} />
    </Alone>
  )
}
