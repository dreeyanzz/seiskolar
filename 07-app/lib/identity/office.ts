/**
 * The office named under "SEIskolar" in the DOST console's top bar. The words are those of
 * `office` in 04-high-fidelity/_app.js.
 */
import 'server-only'
import { directory } from '@/lib/backend'
import type { ScopedClaims } from '@/lib/identity/types'

export async function officeOf(claims: ScopedClaims): Promise<string> {
  if (claims.user_role === 'central_office') return 'DOST-SEI Central Office'
  if (claims.user_role === 'admin') return 'System administration'
  const region = claims.region_id ? await directory.regionById(claims.region_id) : null
  return region?.officeName ?? 'DOST console'
}
