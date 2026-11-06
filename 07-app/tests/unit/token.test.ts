// A session token can't be edited, reused from elsewhere, or kept past its expiry.
import { describe, expect, it } from 'vitest'
import { signClaims, verifyClaims } from '@/lib/identity/token'
import type { SessionClaims } from '@/lib/identity/types'

const NOW = 1_800_000_000
const SECRET = 'test-secret'
const CLAIMS: SessionClaims = {
  sub: 'a',
  email: 'bea.santiago@example.test',
  user_role: 'scholar',
  region_id: 'r',
  school_id: 's',
  exp: NOW + 60,
}

describe('session tokens', () => {
  it('returns what was signed', () => {
    expect(verifyClaims(signClaims(CLAIMS, SECRET), SECRET, NOW)).toEqual(CLAIMS)
  })

  it('refuses an edited payload, such as a scholar making themselves an administrator', () => {
    const [, signature] = signClaims(CLAIMS, SECRET).split('.')
    const forged = Buffer.from(
      JSON.stringify({ ...CLAIMS, user_role: 'admin' }),
    ).toString('base64url')
    expect(verifyClaims(`${forged}.${signature}`, SECRET, NOW)).toBeNull()
  })

  it('refuses a token signed with another secret', () => {
    expect(verifyClaims(signClaims(CLAIMS, 'other'), SECRET, NOW)).toBeNull()
  })

  it('refuses an expired token', () => {
    expect(verifyClaims(signClaims(CLAIMS, SECRET), SECRET, NOW + 60)).toBeNull()
  })

  it.each(['', 'abc', 'a.b.c', '.', 'not base64!.not base64!'])(
    'refuses the malformed token "%s"',
    (token) => {
      expect(verifyClaims(token, SECRET, NOW)).toBeNull()
    },
  )
})
