/**
 * Where sign-in ends for now: each role's home (S01.8), until the real home screens are
 * built. It shows what S01.7 put in the session, which proves the sign-in worked and which
 * scope it gave. Not in the team's design; the screen named in NEXT_SCREEN replaces it.
 *
 * Built around the frame of 04-high-fidelity/_app.js, without its navigation, because the
 * screens the navigation leads to don't exist here yet.
 */
import { TopBar } from '@/components/top-bar'
import { directory, identity } from '@/lib/backend'
import { officeOf } from '@/lib/identity/office'
import { ROLE_LABELS, type Role, type ScopedClaims } from '@/lib/identity/types'
import type { Portal } from '@/lib/portal/types'

/** Each role's first screen, as the design's index names it. */
const NEXT_SCREEN: Record<Role, string> = {
  scholar: 'Scholar: dashboard',
  coordinator: 'Coordinator: home',
  checker: 'Regional Office: home',
  central_office: 'Central Office: release batches',
  admin: 'Administrator: DOST staff accounts',
}

interface SignedInHomeProps {
  portal: Portal
  claims: ScopedClaims
  homeHref: string
}

export async function SignedInHome({ portal, claims, homeHref }: SignedInHomeProps) {
  const profile = await identity.getProfile(claims)
  const school = claims.school_id ? await directory.schoolById(claims.school_id) : null
  const region = claims.region_id ? await directory.regionById(claims.region_id) : null
  const fullName = profile?.fullName ?? claims.email

  const facts: [string, string][] = [
    ['Name', fullName],
    ['Email', claims.email],
    ['Role', ROLE_LABELS[claims.user_role]],
    ['Region', region?.officeName ?? 'Every region'],
    ['School', school?.name ?? 'None: DOST staff work across schools'],
  ]

  return (
    <div className="app">
      <TopBar
        portal={portal}
        homeHref={homeHref}
        role={claims.user_role}
        fullName={fullName}
        office={await officeOf(claims)}
      />
      <main className="page">
        <div className="stack narrow">
          <div>
            <h1>You&apos;re signed in</h1>
            <p className="lead">
              This is as far as the app goes for now. The next screen to build here is
              &ldquo;{NEXT_SCREEN[claims.user_role]}&rdquo;.
            </p>
          </div>
          <section className="card">
            <h2>Your session</h2>
            <dl className="facts">
              {facts.map(([label, value]) => (
                <div className="list-item" key={label}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          </section>
          <p className="hint">Mock data: every person and record here is invented.</p>
        </div>
      </main>
    </div>
  )
}
