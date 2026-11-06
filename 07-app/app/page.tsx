/**
 * The DOST console's address (S01.1). It has no screen of its own: signed out, it opens
 * sign-in; signed in, it opens the account's home (S01.8).
 */
import { redirect } from 'next/navigation'
import { identity } from '@/lib/backend'
import { destinationFor } from '@/lib/identity/destination'

export default async function ConsoleAddress() {
  const claims = await identity.getClaims()
  redirect(claims ? await destinationFor(claims) : '/sign-in')
}
