/**
 * Who is signed in, in the SRS's own terms.
 *
 * `SessionClaims` is the signed token's payload in SRS §2.2: `sub`, `user_role`, `region_id`
 * and `school_id`. FR-IAM-001 says a missing or inactive profile leaves those three empty,
 * which denies everything by default.
 */

/** The role list of SRS §4.3. `checker` is the DOST Regional Office's staff. */
export type Role = 'scholar' | 'coordinator' | 'checker' | 'central_office' | 'admin'

/** The words the team's screens use (04-high-fidelity/_app.js). */
export const ROLE_LABELS: Record<Role, string> = {
  scholar: 'Scholar',
  coordinator: 'School Coordinator',
  checker: 'Regional Office',
  central_office: 'Central Office',
  admin: 'System administrator',
}

export interface SessionClaims {
  sub: string
  email: string
  user_role: Role | null
  region_id: string | null
  school_id: string | null
  /** When the session ends, in seconds since 1970. */
  exp: number
}

/** A claims object whose role is set: FR-IAM-001's checks passed. */
export type ScopedClaims = SessionClaims & { user_role: Role }

export function hasScope(claims: SessionClaims): claims is ScopedClaims {
  return claims.user_role !== null
}

/** S01.8: these roles' home is the DOST console; the others' is their school's portal. */
export function isDostStaff(role: Role): boolean {
  return role === 'checker' || role === 'central_office' || role === 'admin'
}

export interface Profile {
  fullName: string
}
