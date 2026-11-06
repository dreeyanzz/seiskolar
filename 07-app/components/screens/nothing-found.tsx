/**
 * Nothing to show. Built from 04-high-fidelity/nothing-found.html, with the same content.
 *
 * Serves swimlane steps S01.9, S01.10 and S01.12, in 02-swimlanes/01-sign-in.html.
 * SRS: FR-IAM-003.
 * It has one state in the design, for someone signed in. The signed-out version is assumed:
 * the design doesn't draw it, and a visitor with no session can reach this address too.
 * Owner in the design's index: @gnthril.
 *
 * What the wireframe's notes say: SEIskolar returns no rows rather than an error
 * (FR-IAM-003), so this page cannot tell "does not exist" from "not yours", and must not hint
 * which. Everything that is out of scope, or simply missing, lands here looking the same.
 */
import type { Metadata } from 'next'
import Link from 'next/link'
import { Alone } from '@/components/alone'
import { TopBar } from '@/components/top-bar'
import { directory, identity } from '@/lib/backend'
import { destinationFor } from '@/lib/identity/destination'
import { officeOf } from '@/lib/identity/office'
import { hasScope } from '@/lib/identity/types'
import { requestContext } from '@/lib/portal/request'
import type { Portal } from '@/lib/portal/types'

export const nothingFoundMetadata: Metadata = { title: 'Nothing to show · SEIskolar' }

export async function NothingFoundScreen() {
  const { base, hostSchool, school: subdomain } = await requestContext()
  const school = subdomain ? await directory.schoolBySubdomain(subdomain) : null
  const portal: Portal = school ? { kind: 'school', school } : { kind: 'console' }
  const claims = await identity.getClaims()

  if (claims && hasScope(claims)) {
    const profile = await identity.getProfile(claims)
    const home = await destinationFor(claims)
    return (
      <div className="app">
        <TopBar
          portal={portal}
          homeHref={home}
          role={claims.user_role}
          fullName={profile?.fullName ?? claims.email}
          office={await officeOf(claims)}
        />
        <main className="page">
          <div className="stack narrow">
            <section className="card stack">
              <h1>Nothing to show here</h1>
              <p>
                There is no record at this address that your account can see. If someone
                sent you the link, it may be for someone else&apos;s record.
              </p>
              <Link className="btn" href={home}>
                Back to Home
              </Link>
            </section>
          </div>
        </main>
      </div>
    )
  }

  // A subdomain that is no school's has no sign-in screen to send anyone to.
  const signInHref = school ? `${base}/sign-in` : hostSchool ? null : '/sign-in'
  return (
    <Alone portal={portal}>
      <section className="card stack">
        <h1>Nothing to show here</h1>
        <p>
          There is no record at this address that you can see. If someone sent you the
          link, it may be for someone else&apos;s record.
        </p>
        {signInHref ? (
          <Link className="btn" href={signInHref}>
            Go to sign in
          </Link>
        ) : null}
      </section>
    </Alone>
  )
}
