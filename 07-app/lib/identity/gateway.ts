/**
 * Everything the screens may ask about accounts and sessions.
 *
 * Today lib/mock/gateway.ts answers these from invented accounts. When the team moves to
 * Supabase, as the SRS plans (§2.1), a second implementation of this interface replaces it
 * and no screen changes. See lib/backend.ts.
 */
import type { Profile, SessionClaims } from '@/lib/identity/types'

export type SignInResult =
  | { ok: true; claims: SessionClaims }
  /** The same answer for a wrong password and an unknown email (S01.4). */
  | { ok: false; reason: 'wrong-credentials' | 'unavailable' }

/**
 * What a real backend does with an activation request is send an email, and tell the caller
 * nothing, so nobody can test which addresses are registered. The mock has no email to
 * send, so it hands the link over here for the demo screen to show instead. A real
 * implementation always returns null.
 */
export type DemoOutbox =
  | { kind: 'link'; token: string }
  | { kind: 'none'; reason: 'not-registered' | 'already-active' }
  | null

export type ActivateResult =
  | { ok: true; claims: SessionClaims }
  | { ok: false; reason: 'invalid-link' | 'unavailable' }

/** One account in a demo panel, which only exists while the data is mock. */
export interface DemoAccount {
  email: string
  name: string
  detail: string
  /** Absent for an account that is not activated yet: it cannot sign in. */
  password?: string
}

export interface DemoGroup {
  label: string
  accounts: DemoAccount[]
}

export interface IdentityGateway {
  /** S01.3 to S01.7: checks the password, and starts a session with the account's scope. */
  signIn(email: string, password: string): Promise<SignInResult>
  signOut(): Promise<void>
  /** The current session's verified claims, or null when signed out. */
  getClaims(): Promise<SessionClaims | null>
  /** The signed-in person's own profile row (SRS §2.2: a scholar reads their own). */
  getProfile(claims: SessionClaims): Promise<Profile | null>

  /** Assumed flow, see README.md: asks for a link to set a first password. */
  requestActivationLink(email: string): Promise<DemoOutbox>
  /** Whether a link still works, without using it up. */
  previewActivationLink(token: string): Promise<{ email: string } | null>
  /** Uses the link: sets the password and starts a session. */
  activate(token: string, password: string): Promise<ActivateResult>
}
