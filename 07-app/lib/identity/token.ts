/**
 * Signs and checks the mock session token, so a visitor cannot edit their cookie to become
 * someone else. Supabase issues a real signed JWT in its place later (FR-IAM-001); this is
 * the same idea in as little code as possible, and it is not a JWT.
 *
 * Format: base64url(JSON claims) + "." + base64url(HMAC-SHA256 of the first part).
 */
import { createHmac, timingSafeEqual } from 'node:crypto'
import type { SessionClaims } from '@/lib/identity/types'

function signature(payload: string, secret: string): Buffer {
  return createHmac('sha256', secret).update(payload).digest()
}

export function signClaims(claims: SessionClaims, secret: string): string {
  const payload = Buffer.from(JSON.stringify(claims)).toString('base64url')
  return `${payload}.${signature(payload, secret).toString('base64url')}`
}

/** The claims, or null if the token was altered, was signed elsewhere or has expired. */
export function verifyClaims(
  token: string,
  secret: string,
  nowSeconds: number,
): SessionClaims | null {
  const [payload, sent, extra] = token.split('.')
  if (!payload || !sent || extra !== undefined) return null

  const expected = signature(payload, secret)
  const actual = Buffer.from(sent, 'base64url')
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null

  try {
    const claims = JSON.parse(
      Buffer.from(payload, 'base64url').toString(),
    ) as SessionClaims
    return claims.exp > nowSeconds ? claims : null
  } catch {
    return null
  }
}
