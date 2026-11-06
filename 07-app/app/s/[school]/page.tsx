/**
 * A school's portal address (S01.1), and the home of that school's scholars and coordinator
 * (S01.8). Someone with no session is sent to sign in. DOST staff, and another school's
 * people, get nothing back (S01.12): the address grants nothing (FR-IAM-002, FR-IAM-003).
 */
import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { SignedInHome } from '@/components/screens/signed-in-home'
import { identity } from '@/lib/backend'
import { canEnterSchoolPortal } from '@/lib/identity/scope'
import { hasScope } from '@/lib/identity/types'
import { requestContext } from '@/lib/portal/request'
import { schoolPortal, type SchoolParams } from '@/lib/portal/school-route'

export const metadata: Metadata = { title: 'Home · SEIskolar' }

export default async function SchoolHome({ params }: { params: SchoolParams }) {
  const portal = await schoolPortal(params)
  const { base } = await requestContext()
  const claims = await identity.getClaims()
  if (!claims) redirect(`${base}/sign-in`)
  if (!hasScope(claims)) redirect(`${base}/no-access`)
  if (!canEnterSchoolPortal(claims, portal.school.id)) notFound()

  return <SignedInHome portal={portal} claims={claims} homeHref={base || '/'} />
}
