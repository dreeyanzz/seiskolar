/**
 * Account not ready. Built from 04-high-fidelity/no-access.html, with the same content.
 *
 * Serves swimlane steps S01.5 and S01.6, in 02-swimlanes/01-sign-in.html.
 * SRS: FR-IAM-001.
 * It has one state.
 * Owner in the design's index: @gnthril.
 *
 * What the wireframe's notes say: without a role, region and school, SEIskolar returns no
 * records at all (FR-IAM-001, S01.6). Pointing the person to their Regional Office is the
 * team's wording; the SRS says only that every list is empty.
 */
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { Alone } from '@/components/alone'
import { identity } from '@/lib/backend'
import { destinationFor } from '@/lib/identity/destination'
import { hasScope } from '@/lib/identity/types'
import { requestContext } from '@/lib/portal/request'
import type { Portal } from '@/lib/portal/types'

export const noAccessMetadata: Metadata = {
  title: "Your account isn't ready yet · SEIskolar",
}

export async function NoAccessScreen({ portal }: { portal: Portal }) {
  const claims = await identity.getClaims()
  const { base } = await requestContext()
  if (!claims) redirect(`${base}/sign-in`)
  if (hasScope(claims)) redirect(await destinationFor(claims))

  return (
    <Alone portal={portal}>
      <section className="card stack">
        <h1>Your account isn&apos;t ready yet</h1>
        <p className="small muted">Signed in as {claims.email}</p>
        <p>
          Your account has no role, region or school yet, so there is nothing to show you.
        </p>
        <p className="muted">Your DOST Regional Office sets up scholar accounts.</p>
        <form action={`${base}/sign-out`} method="post">
          <button className="btn block" type="submit">
            Sign out
          </button>
        </form>
      </section>
    </Alone>
  )
}
