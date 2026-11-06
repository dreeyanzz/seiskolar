/**
 * Where to send someone who is signed in (S01.6 and S01.8), for redirects and "Back to Home".
 */
import 'server-only'
import { directory } from '@/lib/backend'
import { homePath } from '@/lib/identity/scope'
import { hasScope, type SessionClaims } from '@/lib/identity/types'
import { requestContext } from '@/lib/portal/request'

export async function destinationFor(claims: SessionClaims): Promise<string> {
  const { base, hostSchool } = await requestContext()
  if (!hasScope(claims)) return `${base}/no-access`

  const school = claims.school_id ? await directory.schoolById(claims.school_id) : null
  return homePath(claims, school?.subdomain ?? null, hostSchool)
}
