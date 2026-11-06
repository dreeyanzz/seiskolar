/**
 * Works out which school's portal an address is asking for (FR-IAM-002, S01.2).
 *
 * The address only picks the screens. It never grants access to anything; that comes from
 * the session (FR-IAM-003). These are pure functions, so the middleware and the unit tests
 * share them.
 */

/** FR-IAM-002's reserved words: none of these can ever be a school's portal address. */
export const RESERVED_SUBDOMAINS: ReadonlySet<string> = new Set([
  'www',
  'app',
  'api',
  'admin',
  'console',
  'auth',
  'mail',
  'static',
])

/** One DNS label. A dot fails this, so a.b.seiskolar.ph is not a school. */
const LABEL = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/

/** Headers the middleware sets on every request, for screens to build their links from. */
export const PORTAL_HEADERS = {
  /** The school the address's subdomain names, or empty. */
  hostSchool: 'x-seiskolar-host-school',
  /** The school this request's screen belongs to, from the subdomain or the path, or empty. */
  school: 'x-seiskolar-school',
  /** What this portal's links start with: "/s/citu" in the path form, otherwise empty. */
  base: 'x-seiskolar-base',
} as const

/** The school a `Host` header names, or null for the DOST console's address. */
export function schoolFromHost(host: string, rootDomain: string): string | null {
  const hostname = (host.split(':')[0] ?? '').trim().toLowerCase()
  const root = (rootDomain.split(':')[0] ?? '').trim().toLowerCase()
  if (!root || hostname === root || !hostname.endsWith(`.${root}`)) return null

  const label = hostname.slice(0, -(root.length + 1))
  return LABEL.test(label) && !RESERVED_SUBDOMAINS.has(label) ? label : null
}

/** The school a path names, such as "citu" in /s/citu/sign-in, or null. */
export function schoolFromPath(pathname: string): string | null {
  return /^\/s\/([a-z0-9-]+)(?:\/|$)/.exec(pathname)?.[1] ?? null
}

/** Whether a path is the DOST console, which a school's address must not rewrite. */
export function isConsolePath(pathname: string): boolean {
  return pathname === '/console' || pathname.startsWith('/console/')
}
