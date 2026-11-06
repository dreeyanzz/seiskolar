/**
 * Picks which portal a request gets, from its address (FR-IAM-002, swimlane step S01.2).
 *
 * citu.seiskolar.ph/sign-in becomes /s/citu/sign-in. The path form, /s/citu/sign-in, also
 * works directly, because wildcard subdomains are not available everywhere (the archived
 * prototype's README says the same of Vercel's free plan). /console stays the DOST console
 * on any address.
 *
 * Presentation only: FR-IAM-002 says routing must never be used to verify access, so
 * nothing here looks at the session. Deleting this file must not expose any record. The
 * checks that decide access are in lib/identity/scope.ts today, standing in for the
 * database's row-level security (FR-IAM-003) until Supabase replaces the mock data.
 */
import { NextResponse, type NextRequest } from 'next/server'
import {
  isConsolePath,
  PORTAL_HEADERS,
  schoolFromHost,
  schoolFromPath,
} from '@/lib/portal/host'

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? 'localhost'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const hostSchool = schoolFromHost(request.headers.get('host') ?? '', ROOT_DOMAIN)
  const pathSchool = schoolFromPath(pathname)
  const rewrite = hostSchool !== null && pathSchool === null && !isConsolePath(pathname)

  // Set on every request, replacing whatever the visitor sent, because screens build their
  // links and redirects from these.
  const headers = new Headers(request.headers)
  headers.set(PORTAL_HEADERS.hostSchool, hostSchool ?? '')
  headers.set(PORTAL_HEADERS.school, pathSchool ?? (rewrite ? hostSchool! : ''))
  headers.set(PORTAL_HEADERS.base, pathSchool ? `/s/${pathSchool}` : '')

  if (rewrite) {
    const url = request.nextUrl.clone()
    url.pathname = `/s/${hostSchool}${pathname === '/' ? '' : pathname}`
    return NextResponse.rewrite(url, { request: { headers } })
  }
  return NextResponse.next({ request: { headers } })
}

export const config = {
  // Everything except Next's own files and anything with a file extension.
  matcher: ['/((?!_next/static|_next/image|.*\\.[a-z0-9]+$).*)'],
}
