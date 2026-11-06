/**
 * The mark at the top of a screen: SEIskolar's in the DOST console, and a school's crest in
 * its portal. Both are copied from 04-high-fidelity/_app.js.
 *
 * The crest is a stand-in drawn in the school's colours, not any university's real seal
 * (04-high-fidelity/README.md: a seal is its own mark, not ours to reproduce). Uploading a
 * real logo is part of the portal settings screen (FR-ADM-003), which is not built yet.
 */
import { brandColours } from '@/lib/portal/brand'
import type { Portal } from '@/lib/portal/types'

export function PortalMark({ portal }: { portal: Portal }) {
  if (portal.kind === 'console') {
    return (
      <span className="mark">
        <svg viewBox="0 0 40 40" aria-hidden="true">
          <rect width="40" height="40" rx="10" fill="#f2b705" />
          <path
            d="M26.5 13.2c-1.5-1.8-3.8-2.8-6.5-2.8-4 0-6.7 2.1-6.7 5.1 0 6.6 13.6 3.9 13.6 10 0 3-2.9 5.1-6.9 5.1-3 0-5.5-1.1-7.2-3.1"
            fill="none"
            stroke="#16365c"
            strokeWidth="3.6"
            strokeLinecap="round"
          />
        </svg>
      </span>
    )
  }

  const { brand, accent } = brandColours(
    portal.school.primaryColour,
    portal.school.secondaryColour,
  )
  return (
    <span className="mark">
      <svg viewBox="0 0 40 40" aria-hidden="true">
        <path d="M20 2 35 7v11c0 9.4-6.5 16-15 19C11.5 34 5 27.4 5 18V7z" fill={accent} />
        <path
          d="M20 5.2 32 9.3V18c0 7.7-5.2 13.2-12 15.8C13.2 31.2 8 25.7 8 18V9.3z"
          fill={brand}
        />
        <path
          d="M12.5 15.5c2.8-1 5.3-.7 7.5 1 2.2-1.7 4.7-2 7.5-1v10c-2.8-1-5.3-.7-7.5 1-2.2-1.7-4.7-2-7.5-1z"
          fill="#fff"
        />
        <path d="M20 16.5v10" stroke={brand} strokeWidth="1.2" />
      </svg>
    </span>
  )
}
