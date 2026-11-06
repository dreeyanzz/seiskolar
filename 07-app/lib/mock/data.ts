/**
 * The mock data: every region's office, school and account the app knows about today.
 *
 * Invented people only (AGENTS.md, SRS §2.3). Names and addresses come from the team's
 * screens in 04-high-fidelity, so the app and the design tell the same story. CIT-U is the
 * pilot school; every other school is invented, and their colours are sample values.
 *
 * IDs: Region VII and CIT-U use the ones in SRS §2.2's token example.
 *
 * To add a demo account, add a row to ACCOUNTS. The demo panel on the sign-in screen lists
 * them all. The server keeps this in memory, so a restart undoes any activation.
 */
import type { Role } from '@/lib/identity/types'
import type { Region, School } from '@/lib/portal/types'

/** Every activated demo account's password. Shown in the demo panel, and only there. */
export const DEMO_PASSWORD = 'SEIskolar-demo-2026'

const VII = '77777777-7777-4000-8000-000000000007'
const VI = '77777777-7777-4000-8000-000000000006'
const X = '77777777-7777-4000-8000-000000000010'
const NCR = '77777777-7777-4000-8000-000000000013'

export const REGIONS: readonly Region[] = [
  {
    id: VII,
    code: 'VII',
    name: 'Central Visayas',
    officeName: 'DOST-VII Regional Office',
  },
  { id: VI, code: 'VI', name: 'Western Visayas', officeName: 'DOST-VI Regional Office' },
  { id: X, code: 'X', name: 'Northern Mindanao', officeName: 'DOST-X Regional Office' },
  {
    id: NCR,
    code: 'NCR',
    name: 'National Capital Region',
    officeName: 'DOST-NCR Regional Office',
  },
]

const CITU = '11111111-1111-4000-8000-000000000001'
const LSC = '11111111-1111-4000-8000-000000000002'
const SIIT = '11111111-1111-4000-8000-000000000003'
const MSC = '11111111-1111-4000-8000-000000000004'
const LPC = '11111111-1111-4000-8000-000000000005'
const MSI = '11111111-1111-4000-8000-000000000006'

export const SCHOOLS: readonly School[] = [
  {
    id: CITU,
    regionId: VII,
    code: 'CITU',
    name: 'Cebu Institute of Technology – University',
    shortName: 'CIT-U',
    subdomain: 'citu',
    // From 04-high-fidelity/coordinator-portal-settings.html.
    primaryColour: '#800000',
    secondaryColour: '#f2c200',
  },
  {
    id: LSC,
    regionId: VII,
    code: 'LSC',
    name: 'Lapu Science College',
    shortName: 'LSC',
    subdomain: 'lsc',
    primaryColour: '#0b5d3b',
    secondaryColour: '#f2c200',
  },
  {
    // A light brand colour on purpose: it proves the portal stays readable (lib/portal/brand.ts).
    id: SIIT,
    regionId: VII,
    code: 'SIIT',
    name: 'San Isidro Institute of Technology',
    shortName: 'SIIT',
    subdomain: 'siit',
    primaryColour: '#f2c200',
    secondaryColour: '#16365c',
  },
  {
    id: MSC,
    regionId: VII,
    code: 'MSC',
    name: 'Mabini State College',
    shortName: 'MSC',
    subdomain: 'msc',
    primaryColour: '#1d4f91',
    secondaryColour: '#e8c547',
  },
  {
    id: LPC,
    regionId: VII,
    code: 'LPC',
    name: 'Liloan Polytechnic College',
    shortName: 'LPC',
    subdomain: 'lpc',
    primaryColour: '#00695c',
    secondaryColour: '#ffb300',
  },
  {
    id: MSI,
    regionId: VI,
    code: 'MSI',
    name: 'Molo Science Institute',
    shortName: 'MSI',
    subdomain: 'msi',
    primaryColour: '#8a3b12',
    secondaryColour: '#f2d16b',
  },
]

export interface MockProfile {
  role: Role
  /** DOST Regional Office staff only. A school's people take the region of their school. */
  regionId: string | null
  /** Scholars and coordinators only. */
  schoolId: string | null
  isActive: boolean
}

export interface MockAccount {
  id: string
  email: string
  fullName: string
  /** Null until the account is activated: DOST made it, and nobody has set a password. */
  password: string | null
  /** Null is FR-IAM-001's "profile is missing". */
  profile: MockProfile | null
}

function account(
  serial: number,
  email: string,
  fullName: string,
  password: string | null,
  profile: MockProfile | null,
): MockAccount {
  const id = `aaaaaaaa-0000-4000-8000-${String(serial).padStart(12, '0')}`
  return { id, email, fullName, password, profile }
}

function scholar(schoolId: string): MockProfile {
  return { role: 'scholar', regionId: null, schoolId, isActive: true }
}

function coordinator(schoolId: string): MockProfile {
  return { role: 'coordinator', regionId: null, schoolId, isActive: true }
}

function regionalOffice(regionId: string): MockProfile {
  return { role: 'checker', regionId, schoolId: null, isActive: true }
}

const CENTRAL: MockProfile = {
  role: 'central_office',
  regionId: null,
  schoolId: null,
  isActive: true,
}

const ADMIN: MockProfile = {
  role: 'admin',
  regionId: null,
  schoolId: null,
  isActive: true,
}

const PW = DEMO_PASSWORD

export const ACCOUNTS: readonly MockAccount[] = [
  account(1, 'bea.santiago@example.test', 'Bea Santiago', PW, scholar(CITU)),
  account(2, 'marites.ocampo@example.test', 'Marites Ocampo', PW, scholar(LSC)),
  account(3, 'ruel.mendoza@example.test', 'Ruel Mendoza', PW, coordinator(CITU)),
  account(4, 'dina.flores@example.test', 'Dina Flores', PW, coordinator(LSC)),
  account(5, 'ana.villareal@example.test', 'Ana Villareal', PW, regionalOffice(VII)),
  account(6, 'grace.lim@example.test', 'Grace Lim', PW, regionalOffice(VI)),
  account(7, 'paolo.reyes@example.test', 'Paolo Reyes', PW, CENTRAL),
  account(8, 'lara.domingo@example.test', 'Lara Domingo', PW, ADMIN),

  // S01.5 and S01.6: right password, but no scope, so every list is empty.
  account(9, 'noel.abad@example.test', 'Noel Abad', PW, null),
  account(10, 'rico.sarmiento@example.test', 'Rico Sarmiento', PW, {
    ...scholar(CITU),
    isActive: false,
  }),

  // Made by DOST, not activated yet (S08.5, S08.6; "Not signed in yet" in the team's screens).
  account(11, 'ella.ramos@example.test', 'Ella Ramos', null, scholar(CITU)),
  account(12, 'mark.villanueva@example.test', 'Mark Villanueva', null, coordinator(LPC)),
  account(13, 'mia.cortez@example.test', 'Mia Cortez', null, CENTRAL),
]
