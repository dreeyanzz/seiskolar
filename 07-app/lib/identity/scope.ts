/**
 * Who may reach what, and where each role lands after signing in.
 *
 * S01.8: scholars and coordinators go to their school's portal, DOST staff to the console.
 * S01.10 to S01.12: anything outside the session's scope shows nothing, and no error.
 *
 * These checks stand in for the database's row-level security (FR-IAM-003), which is where
 * the rule will really live once Supabase replaces the mock data. Then these only decide
 * which screen to show, and the database decides which rows it holds.
 */
import { isDostStaff, type ScopedClaims } from '@/lib/identity/types'

/** The DOST console is for DOST staff only. */
export function canEnterConsole(claims: ScopedClaims): boolean {
  return isDostStaff(claims.user_role)
}

/** A school's portal is for that school's scholars and coordinator only. */
export function canEnterSchoolPortal(claims: ScopedClaims, schoolId: string): boolean {
  return !isDostStaff(claims.user_role) && claims.school_id === schoolId
}

/**
 * The path of a role's home (S01.8). A session cookie belongs to the address it was made
 * on, so a school's home stays on this address: "/" on the school's own subdomain, and the
 * path form anywhere else.
 */
export function homePath(
  claims: ScopedClaims,
  schoolSubdomain: string | null,
  hostSchool: string | null,
): string {
  if (isDostStaff(claims.user_role) || !schoolSubdomain) return '/console'
  return schoolSubdomain === hostSchool ? '/' : `/s/${schoolSubdomain}`
}
