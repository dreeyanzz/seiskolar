/**
 * What the middleware worked out about this request's address. See middleware.ts.
 *
 * Use `base` to build a link that stays in this portal: `${base}/sign-in`.
 */
import { headers } from 'next/headers'
import { PORTAL_HEADERS } from '@/lib/portal/host'

export interface RequestContext {
  /** "/s/citu" when the school is in the path, otherwise empty. */
  base: string
  /** The school the subdomain names, if any. */
  hostSchool: string | null
  /** The school this request's screen belongs to, if any. */
  school: string | null
}

export async function requestContext(): Promise<RequestContext> {
  const requestHeaders = await headers()
  return {
    base: requestHeaders.get(PORTAL_HEADERS.base) ?? '',
    hostSchool: requestHeaders.get(PORTAL_HEADERS.hostSchool) || null,
    school: requestHeaders.get(PORTAL_HEADERS.school) || null,
  }
}
