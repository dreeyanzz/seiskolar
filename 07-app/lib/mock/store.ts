/**
 * The mock backend's rules, with no web framework in them, so the unit tests can run them.
 * lib/mock/gateway.ts connects this to cookies for the running app.
 *
 * Passwords are compared as plain text because every one of them is an invented demo value.
 * Supabase hashes real ones.
 */
import { randomBytes } from 'node:crypto'
import type { DemoOutbox } from '@/lib/identity/gateway'
import type { Profile, SessionClaims } from '@/lib/identity/types'
import { ACCOUNTS, SCHOOLS, type MockAccount } from '@/lib/mock/data'

/** How long a session lasts. Assumed: the SRS names no number. */
const SESSION_SECONDS = 8 * 60 * 60
/** How long an activation link lasts, which the screen also tells the person. */
export const LINK_MINUTES = 60

/** FR-IAM-001. A missing or inactive profile gets a session with no scope at all. */
export function claimsFor(account: MockAccount, nowSeconds: number): SessionClaims {
  const profile = account.profile?.isActive ? account.profile : null
  const school = SCHOOLS.find((candidate) => candidate.id === profile?.schoolId)
  return {
    sub: account.id,
    email: account.email,
    user_role: profile?.role ?? null,
    // Supervision follows the school (SRS §1.3), so a school's people take its region.
    region_id: profile?.regionId ?? school?.regionId ?? null,
    school_id: profile?.schoolId ?? null,
    exp: nowSeconds + SESSION_SECONDS,
  }
}

export function createMockStore(now: () => number = Date.now) {
  const passwords = new Map(ACCOUNTS.map((account) => [account.id, account.password]))
  const links = new Map<string, { accountId: string; expiresAt: number }>()

  const nowSeconds = () => Math.floor(now() / 1000)
  const byEmail = (email: string) =>
    ACCOUNTS.find((account) => account.email === email.trim().toLowerCase())

  function liveLink(token: string) {
    const link = links.get(token)
    if (!link) return null
    if (link.expiresAt <= now()) {
      links.delete(token)
      return null
    }
    return link
  }

  return {
    /** S01.4 and S01.5: null covers a wrong password, an unknown email, and no password yet. */
    authenticate(email: string, password: string): SessionClaims | null {
      const account = byEmail(email)
      if (!account) return null
      const stored = passwords.get(account.id)
      if (!stored || stored !== password) return null
      return claimsFor(account, nowSeconds())
    },

    profile(sub: string): Profile | null {
      const account = ACCOUNTS.find((candidate) => candidate.id === sub)
      return account ? { fullName: account.fullName } : null
    },

    requestLink(email: string): Exclude<DemoOutbox, null> {
      const account = byEmail(email)
      if (!account) return { kind: 'none', reason: 'not-registered' }
      if (passwords.get(account.id)) return { kind: 'none', reason: 'already-active' }

      const token = randomBytes(32).toString('base64url')
      links.set(token, {
        accountId: account.id,
        expiresAt: now() + LINK_MINUTES * 60 * 1000,
      })
      return { kind: 'link', token }
    },

    previewLink(token: string): { email: string } | null {
      const link = liveLink(token)
      const account =
        link && ACCOUNTS.find((candidate) => candidate.id === link.accountId)
      return account ? { email: account.email } : null
    },

    /** Works once, for one hour. Null means the link is expired, used or never existed. */
    redeemLink(token: string, password: string): SessionClaims | null {
      const link = liveLink(token)
      const account =
        link && ACCOUNTS.find((candidate) => candidate.id === link.accountId)
      if (!account) return null

      links.delete(token)
      passwords.set(account.id, password)
      return claimsFor(account, nowSeconds())
    },
  }
}

export type MockStore = ReturnType<typeof createMockStore>
