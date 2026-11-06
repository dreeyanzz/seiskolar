/**
 * Connects the mock backend to the running app: the session lives in a signed, http-only
 * cookie that scripts on the page cannot read.
 *
 * The store and the signing secret are kept on globalThis because Next.js can load this
 * module more than once in one server process, and every copy must share the same accounts.
 * A restart forgets activations and signs everyone out, which suits mock data.
 */
import 'server-only'
import { randomBytes } from 'node:crypto'
import { cookies, headers } from 'next/headers'
import type { DemoGroup, IdentityGateway } from '@/lib/identity/gateway'
import { signClaims, verifyClaims } from '@/lib/identity/token'
import { ROLE_LABELS, type SessionClaims } from '@/lib/identity/types'
import { ACCOUNTS, DEMO_PASSWORD, REGIONS, SCHOOLS } from '@/lib/mock/data'
import { createMockStore, type MockStore } from '@/lib/mock/store'
import type { Directory } from '@/lib/portal/types'

const COOKIE = 'seiskolar-session'

const shared = globalThis as typeof globalThis & {
  seiskolarMockStore?: MockStore
  seiskolarMockSecret?: string
}

const store = (shared.seiskolarMockStore ??= createMockStore())

function secret(): string {
  return (shared.seiskolarMockSecret ??= randomBytes(32).toString('hex'))
}

async function startSession(claims: SessionClaims): Promise<void> {
  const requestHeaders = await headers()
  ;(await cookies()).set(COOKIE, signClaims(claims, secret()), {
    httpOnly: true,
    sameSite: 'lax',
    secure: requestHeaders.get('x-forwarded-proto') === 'https',
    path: '/',
    expires: new Date(claims.exp * 1000),
  })
}

export const mockIdentity: IdentityGateway = {
  async signIn(email, password) {
    const claims = store.authenticate(email, password)
    if (!claims) return { ok: false, reason: 'wrong-credentials' }
    await startSession(claims)
    return { ok: true, claims }
  },

  async signOut() {
    ;(await cookies()).delete(COOKIE)
  },

  async getClaims() {
    const token = (await cookies()).get(COOKIE)?.value
    return token ? verifyClaims(token, secret(), Math.floor(Date.now() / 1000)) : null
  },

  async getProfile(claims) {
    return store.profile(claims.sub)
  },

  async requestActivationLink(email) {
    return store.requestLink(email)
  },

  async previewActivationLink(token) {
    return store.previewLink(token)
  },

  async activate(token, password) {
    const claims = store.redeemLink(token, password)
    if (!claims) return { ok: false, reason: 'invalid-link' }
    await startSession(claims)
    return { ok: true, claims }
  },
}

export const mockDirectory: Directory = {
  async schoolBySubdomain(subdomain) {
    return SCHOOLS.find((school) => school.subdomain === subdomain) ?? null
  },
  async schoolById(id) {
    return SCHOOLS.find((school) => school.id === id) ?? null
  },
  async regionById(id) {
    return REGIONS.find((region) => region.id === id) ?? null
  },
}

function describe(account: (typeof ACCOUNTS)[number]): string {
  const profile = account.profile
  if (!profile) return 'No profile'
  const role = ROLE_LABELS[profile.role]
  if (!profile.isActive) return `${role} · inactive`
  const school = SCHOOLS.find((candidate) => candidate.id === profile.schoolId)
  const region = REGIONS.find((candidate) => candidate.id === profile.regionId)
  const where = school?.shortName ?? region?.officeName
  return where ? `${role} · ${where}` : role
}

function group(label: string, matches: (account: (typeof ACCOUNTS)[number]) => boolean) {
  return {
    label,
    accounts: ACCOUNTS.filter(matches).map((account) => ({
      email: account.email,
      name: account.fullName,
      detail: describe(account),
      ...(account.password ? { password: DEMO_PASSWORD } : {}),
    })),
  }
}

/** The groups the sign-in screen's demo panel offers. */
export const demoSignInGroups: DemoGroup[] = [
  group("A school's people", ({ profile, password }) =>
    Boolean(password && profile?.isActive && profile.schoolId !== null),
  ),
  group('DOST staff', ({ profile, password }) =>
    Boolean(password && profile?.isActive && profile.schoolId === null),
  ),
  group('Signs in, but has no access (S01.6)', ({ profile, password }) =>
    Boolean(password && !profile?.isActive),
  ),
]

/** The accounts waiting to be activated, for the activation screen's demo panel. */
export const demoActivationGroups: DemoGroup[] = [
  group('Made by DOST, not activated yet', ({ password }) => password === null),
]
