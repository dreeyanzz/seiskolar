// S01.8 and S01.10: where each role lands, and who may reach what.
import { describe, expect, it } from 'vitest'
import { canEnterConsole, canEnterSchoolPortal, homePath } from '@/lib/identity/scope'
import type { Role, ScopedClaims } from '@/lib/identity/types'

function claims(role: Role, schoolId: string | null = null): ScopedClaims {
  return {
    sub: 'a',
    email: 'a@example.test',
    user_role: role,
    region_id: null,
    school_id: schoolId,
    exp: 1,
  }
}

describe('homePath (S01.8)', () => {
  it('sends a school\'s people to "/" on their own subdomain', () => {
    expect(homePath(claims('scholar', 's'), 'citu', 'citu')).toBe('/')
    expect(homePath(claims('coordinator', 's'), 'citu', 'citu')).toBe('/')
  })

  it("sends them to the path form anywhere else, keeping the session's address", () => {
    expect(homePath(claims('scholar', 's'), 'citu', null)).toBe('/s/citu')
    expect(homePath(claims('scholar', 's'), 'citu', 'lsc')).toBe('/s/citu')
  })

  it.each<Role>(['checker', 'central_office', 'admin'])(
    'sends %s to the DOST console, whatever the address',
    (role) => {
      expect(homePath(claims(role), null, null)).toBe('/console')
      expect(homePath(claims(role), null, 'citu')).toBe('/console')
    },
  )
})

describe('who may enter what (FR-IAM-003)', () => {
  it('keeps the DOST console for DOST staff', () => {
    expect(canEnterConsole(claims('checker'))).toBe(true)
    expect(canEnterConsole(claims('central_office'))).toBe(true)
    expect(canEnterConsole(claims('admin'))).toBe(true)
    expect(canEnterConsole(claims('scholar', 's'))).toBe(false)
    expect(canEnterConsole(claims('coordinator', 's'))).toBe(false)
  })

  it("keeps a school's portal for that school's people", () => {
    expect(canEnterSchoolPortal(claims('scholar', 's'), 's')).toBe(true)
    expect(canEnterSchoolPortal(claims('coordinator', 's'), 's')).toBe(true)
    expect(canEnterSchoolPortal(claims('scholar', 's'), 'other')).toBe(false)
    expect(canEnterSchoolPortal(claims('checker'), 's')).toBe(false)
    expect(canEnterSchoolPortal(claims('admin'), 's')).toBe(false)
  })
})
