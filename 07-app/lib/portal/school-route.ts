/**
 * For the pages under /s/[school]: the school the address names, as a Portal, or the
 * "Nothing to show" screen if no school has that address.
 */
import 'server-only'
import { notFound } from 'next/navigation'
import { directory } from '@/lib/backend'
import type { Portal } from '@/lib/portal/types'

export type SchoolParams = Promise<{ school: string }>

export async function schoolPortal(
  params: SchoolParams,
): Promise<Extract<Portal, { kind: 'school' }>> {
  const { school: subdomain } = await params
  const school = await directory.schoolBySubdomain(subdomain)
  if (!school) notFound()
  return { kind: 'school', school }
}
