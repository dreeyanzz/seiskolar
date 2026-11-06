/**
 * The bar across the top once someone is signed in: where they are, who they are, and how
 * to sign out. From `topbar()` in 04-high-fidelity/_app.js.
 *
 * Signing out is a button in a form, not a link as in the prototype, because it changes
 * something: a link could be followed by accident, or by a browser fetching pages ahead.
 */
import { Icon } from '@/components/icons'
import { PortalMark } from '@/components/portal-mark'
import { ROLE_LABELS, type Role } from '@/lib/identity/types'
import { requestContext } from '@/lib/portal/request'
import type { Portal } from '@/lib/portal/types'

function initials(name: string): string {
  return name
    .split(' ')
    .map((part) => part.charAt(0))
    .join('')
    .slice(0, 2)
}

interface TopBarProps {
  portal: Portal
  homeHref: string
  role: Role
  fullName: string
  /** Under the name in the console: the person's office. */
  office: string
}

export async function TopBar({ portal, homeHref, role, fullName, office }: TopBarProps) {
  const { base } = await requestContext()
  return (
    <header className="topbar">
      <a className="brand" href={homeHref}>
        <PortalMark portal={portal} />
        <span className="brand-text">
          {portal.kind === 'school' ? (
            <>
              {/* A phone shows the school's short name rather than cutting the long one off. */}
              <span className="brand-name">
                <span className="long">{portal.school.name}</span>
                <span className="short">{portal.school.shortName}</span>
              </span>
              <span className="brand-sub">Scholar portal · SEIskolar</span>
            </>
          ) : (
            <>
              <span className="brand-name">SEIskolar</span>
              <span className="brand-sub">{office}</span>
            </>
          )}
        </span>
      </a>

      <div className="user">
        <span className="user-text">
          <span className="user-name">{fullName}</span>
          <span className="user-role">{ROLE_LABELS[role]}</span>
        </span>
        <span className="avatar" aria-hidden="true">
          {initials(fullName)}
        </span>
        <form action={`${base}/sign-out`} method="post">
          <button
            className="icon-btn"
            type="submit"
            aria-label="Sign out"
            title="Sign out"
          >
            <Icon name="logout" />
          </button>
        </form>
      </div>
    </header>
  )
}
