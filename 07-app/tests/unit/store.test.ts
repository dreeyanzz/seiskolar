// The mock backend's rules: FR-IAM-001's claims, and the assumed activation flow.
import { describe, expect, it } from 'vitest'
import {
  ACCOUNTS,
  DEMO_PASSWORD,
  REGIONS,
  SCHOOLS,
  type MockAccount,
} from '@/lib/mock/data'
import { createMockStore, LINK_MINUTES } from '@/lib/mock/store'

const CITU = SCHOOLS.find((school) => school.subdomain === 'citu')!

function clock(start = 1_800_000_000_000) {
  let time = start
  return {
    now: () => time,
    advance: (minutes: number) => {
      time += minutes * 60 * 1000
    },
  }
}

describe('signing in (FR-IAM-001)', () => {
  it("gives a scholar their role, school, and the school's region", () => {
    const claims = createMockStore().authenticate(
      'bea.santiago@example.test',
      DEMO_PASSWORD,
    )
    expect(claims).toMatchObject({
      email: 'bea.santiago@example.test',
      user_role: 'scholar',
      school_id: CITU.id,
      region_id: CITU.regionId,
    })
  })

  it('ignores letter case and spaces in the email', () => {
    const claims = createMockStore().authenticate(
      ' Bea.Santiago@EXAMPLE.test',
      DEMO_PASSWORD,
    )
    expect(claims?.user_role).toBe('scholar')
  })

  it('gives DOST Regional Office staff a region and no school', () => {
    const claims = createMockStore().authenticate(
      'ana.villareal@example.test',
      DEMO_PASSWORD,
    )
    expect(claims?.user_role).toBe('checker')
    expect(claims?.region_id).toBe(CITU.regionId)
    expect(claims?.school_id).toBeNull()
  })

  it('gives Central Office and the administrator neither', () => {
    const store = createMockStore()
    for (const email of ['paolo.reyes@example.test', 'lara.domingo@example.test']) {
      const claims = store.authenticate(email, DEMO_PASSWORD)
      expect(claims?.region_id).toBeNull()
      expect(claims?.school_id).toBeNull()
    }
  })

  it.each(['noel.abad@example.test', 'rico.sarmiento@example.test'])(
    'strips every scope claim from %s, whose profile is missing or inactive',
    (email) => {
      const claims = createMockStore().authenticate(email, DEMO_PASSWORD)
      expect(claims).not.toBeNull()
      expect(claims?.user_role).toBeNull()
      expect(claims?.region_id).toBeNull()
      expect(claims?.school_id).toBeNull()
    },
  )

  it('answers the same for a wrong password, an unknown email and no password yet', () => {
    const store = createMockStore()
    expect(store.authenticate('bea.santiago@example.test', 'wrong')).toBeNull()
    expect(store.authenticate('nobody@example.test', DEMO_PASSWORD)).toBeNull()
    expect(store.authenticate('ella.ramos@example.test', DEMO_PASSWORD)).toBeNull()
    expect(store.authenticate('ella.ramos@example.test', '')).toBeNull()
  })
})

describe('activating an account (assumed flow)', () => {
  const EMAIL = 'ella.ramos@example.test'

  function linkFor(store: ReturnType<typeof createMockStore>, email = EMAIL): string {
    const outbox = store.requestLink(email)
    if (outbox.kind !== 'link') throw new Error(`no link for ${email}`)
    return outbox.token
  }

  it('makes a link only for an account waiting to be activated', () => {
    const store = createMockStore()
    expect(store.requestLink(EMAIL).kind).toBe('link')
    expect(store.requestLink('nobody@example.test')).toEqual({
      kind: 'none',
      reason: 'not-registered',
    })
    expect(store.requestLink('bea.santiago@example.test')).toEqual({
      kind: 'none',
      reason: 'already-active',
    })
  })

  it('cannot create an account: an unknown email can never sign in afterwards', () => {
    const store = createMockStore()
    store.requestLink('nobody@example.test')
    expect(store.authenticate('nobody@example.test', 'anything-at-all')).toBeNull()
  })

  it('previewing a link does not use it up', () => {
    const store = createMockStore()
    const token = linkFor(store)
    expect(store.previewLink(token)).toEqual({ email: EMAIL })
    expect(store.previewLink(token)).toEqual({ email: EMAIL })
    expect(store.redeemLink(token, 'a-new-password')).not.toBeNull()
  })

  it('sets the password, signs the person in with their scope, and works once', () => {
    const store = createMockStore()
    const token = linkFor(store)
    const claims = store.redeemLink(token, 'a-new-password')
    expect(claims).toMatchObject({
      email: EMAIL,
      user_role: 'scholar',
      school_id: CITU.id,
    })

    expect(store.authenticate(EMAIL, 'a-new-password')).not.toBeNull()
    expect(store.redeemLink(token, 'another-password')).toBeNull()
    expect(store.previewLink(token)).toBeNull()
    expect(store.authenticate(EMAIL, 'another-password')).toBeNull()
  })

  it('stops working after an hour', () => {
    const { now, advance } = clock()
    const store = createMockStore(now)
    const token = linkFor(store)
    advance(LINK_MINUTES - 1)
    expect(store.previewLink(token)).not.toBeNull()
    advance(1)
    expect(store.previewLink(token)).toBeNull()
    expect(store.redeemLink(token, 'a-new-password')).toBeNull()
  })

  it('refuses a made-up link', () => {
    const store = createMockStore()
    expect(store.previewLink('made-up')).toBeNull()
    expect(store.redeemLink('made-up', 'a-new-password')).toBeNull()
  })

  it('keeps each store separate, so a test or a restart starts clean', () => {
    const first = createMockStore()
    first.redeemLink(linkFor(first), 'a-new-password')
    expect(createMockStore().authenticate(EMAIL, 'a-new-password')).toBeNull()
  })
})

describe('the mock data follows AGENTS.md', () => {
  it('uses only @example.test addresses', () => {
    for (const account of ACCOUNTS) expect(account.email).toMatch(/@example\.test$/)
  })

  it('has one account per address, all in lowercase', () => {
    const emails = ACCOUNTS.map((account) => account.email)
    expect(new Set(emails).size).toBe(emails.length)
    for (const email of emails) expect(email).toBe(email.toLowerCase())
  })

  it('gives every school and account a real parent', () => {
    const regionIds = REGIONS.map((region) => region.id)
    const schoolIds = SCHOOLS.map((school) => school.id)
    for (const school of SCHOOLS) expect(regionIds).toContain(school.regionId)
    for (const { profile } of ACCOUNTS as readonly MockAccount[]) {
      if (profile?.schoolId) expect(schoolIds).toContain(profile.schoolId)
      if (profile?.regionId) expect(regionIds).toContain(profile.regionId)
    }
  })

  it('never lets a school take a reserved portal address', () => {
    for (const school of SCHOOLS) {
      expect([
        'www',
        'app',
        'api',
        'admin',
        'console',
        'auth',
        'mail',
        'static',
      ]).not.toContain(school.subdomain)
    }
  })
})
