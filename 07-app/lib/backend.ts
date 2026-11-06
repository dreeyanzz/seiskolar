/**
 * Where the app gets its data: the one place that names the mock.
 *
 * The app runs on mock data for now, on the team member's instruction of 6 November 2026.
 * The SRS plans Supabase (§2.1), so to switch: write lib/supabase/gateway.ts implementing
 * IdentityGateway and Directory, point these exports at it, set `demo` to null, and delete
 * lib/mock. No screen imports from lib/mock.
 */
import 'server-only'
import type { DemoGroup, IdentityGateway } from '@/lib/identity/gateway'
import {
  demoActivationGroups,
  demoSignInGroups,
  mockDirectory,
  mockIdentity,
} from '@/lib/mock/gateway'
import type { Directory } from '@/lib/portal/types'

export const identity: IdentityGateway = mockIdentity
export const directory: Directory = mockDirectory

/** Extra help for demos, shown only while the data is mock. Null removes every demo panel. */
export const demo: { signIn: DemoGroup[]; activation: DemoGroup[] } | null = {
  signIn: demoSignInGroups,
  activation: demoActivationGroups,
}
