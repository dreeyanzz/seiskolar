/**
 * The organisation records sign-in needs, named after SRS §4.3's REGIONS and SCHOOLS, plus
 * the branding FR-ADM-003 gives a school. The grading columns come with the screens that
 * use them.
 */

export interface Region {
  id: string
  /** Such as "VII". */
  code: string
  name: string
  /** Such as "DOST-VII Regional Office". */
  officeName: string
}

export interface School {
  id: string
  /** The supervising region. Supervision follows the school (SRS §1.3). */
  regionId: string
  code: string
  name: string
  /** What a phone shows instead of the full name, such as "CIT-U". */
  shortName: string
  /** Its portal address, such as "citu" (FR-ADM-001). */
  subdomain: string
  /** FR-ADM-003: the coordinator sets these. Six-digit hex. */
  primaryColour: string
  secondaryColour: string
}

/** Which of the two front doors a screen belongs to (FR-IAM-002, S01.2). */
export type Portal = { kind: 'console' } | { kind: 'school'; school: School }

/** Where screens read organisation records from. See lib/backend.ts. */
export interface Directory {
  schoolBySubdomain(subdomain: string): Promise<School | null>
  schoolById(id: string): Promise<School | null>
  regionById(id: string): Promise<Region | null>
}
