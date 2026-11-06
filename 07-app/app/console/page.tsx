/**
 * The home of DOST staff (S01.8). Anyone else who opens this address gets nothing back
 * (S01.12), and someone with no session is sent to sign in.
 */
import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { SignedInHome } from '@/components/screens/signed-in-home'
import { identity } from '@/lib/backend'
import { canEnterConsole } from '@/lib/identity/scope'
import { hasScope } from '@/lib/identity/types'
import { requestContext } from '@/lib/portal/request'

export const metadata: Metadata = { title: 'DOST console · SEIskolar' }

export default async function ConsoleHome() {
  const claims = await identity.getClaims()
  const { base } = await requestContext()
  if (!claims) redirect(`${base}/sign-in`)
  if (!hasScope(claims)) redirect(`${base}/no-access`)
  if (!canEnterConsole(claims)) notFound()

  return <SignedInHome portal={{ kind: 'console' }} claims={claims} homeHref="/console" />
}
