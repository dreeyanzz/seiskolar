/**
 * Signing out: what a plain form post to /sign-out does, with or without JavaScript. A plain
 * post means a full page load, for the reasons in lib/actions/auth.ts.
 *
 * It refuses a post from another site, so a page elsewhere can't sign someone out.
 *
 * Use: <form action={`${base}/sign-out`} method="post">. Both app/sign-out/route.ts and
 * app/s/[school]/sign-out/route.ts use this, one for each kind of portal.
 */
import 'server-only'
import { headers } from 'next/headers'
import { identity } from '@/lib/backend'
import { requestContext } from '@/lib/portal/request'

function hostOf(origin: string): string | null {
  try {
    return new URL(origin).host
  } catch {
    return null
  }
}

export async function signOutRoute(): Promise<Response> {
  const requestHeaders = await headers()
  const origin = requestHeaders.get('origin')
  if (origin && hostOf(origin) !== requestHeaders.get('host')) {
    return new Response(null, { status: 403 })
  }

  await identity.signOut()
  const { base } = await requestContext()
  // A relative address: behind the middleware's rewrite, the request's own URL here doesn't
  // always name the address the browser is on.
  return new Response(null, { status: 303, headers: { Location: `${base}/sign-in` } })
}
