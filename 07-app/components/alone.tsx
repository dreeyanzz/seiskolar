/**
 * The shell of a screen without the frame: sign-in, activation, and "Account not ready".
 * The brand colour fills a band across the top, holding the portal's name, and the screen's
 * card overlaps its lower edge. From `.alone` in 04-high-fidelity/_style.css.
 *
 * Use: <Alone portal={portal}><section className="card stack">…</section></Alone>.
 */
import type { ReactNode } from 'react'
import { PortalMark } from '@/components/portal-mark'
import type { Portal } from '@/lib/portal/types'

export function Alone({ portal, children }: { portal: Portal; children: ReactNode }) {
  return (
    <main className="alone">
      <header className="alone-band">
        <div className="alone-brand">
          <PortalMark portal={portal} />
          <div className="brand-text">
            <span className="brand-name">
              {portal.kind === 'school' ? portal.school.name : 'SEIskolar'}
            </span>
            <span className="brand-sub">
              {portal.kind === 'school' ? 'Scholar portal · SEIskolar' : 'DOST console'}
            </span>
          </div>
        </div>
      </header>
      <div className="alone-body">{children}</div>
    </main>
  )
}
