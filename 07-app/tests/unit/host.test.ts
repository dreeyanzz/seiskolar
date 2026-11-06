// FR-IAM-002: the address picks the portal, and reserved words are never schools.
import { describe, expect, it } from 'vitest'
import {
  isConsolePath,
  RESERVED_SUBDOMAINS,
  schoolFromHost,
  schoolFromPath,
} from '@/lib/portal/host'

describe('schoolFromHost', () => {
  it('reads the school from a subdomain', () => {
    expect(schoolFromHost('citu.seiskolar.ph', 'seiskolar.ph')).toBe('citu')
  })

  it('ignores the port on either side', () => {
    expect(schoolFromHost('citu.localhost:3000', 'localhost')).toBe('citu')
    expect(schoolFromHost('citu.localhost:3000', 'localhost:3000')).toBe('citu')
  })

  it('ignores letter case', () => {
    expect(schoolFromHost('CITU.SEISKOLAR.PH', 'seiskolar.ph')).toBe('citu')
  })

  it('treats the bare domain as the DOST console', () => {
    expect(schoolFromHost('seiskolar.ph', 'seiskolar.ph')).toBeNull()
    expect(schoolFromHost('localhost:3000', 'localhost')).toBeNull()
  })

  it.each([...RESERVED_SUBDOMAINS])('never treats "%s" as a school', (word) => {
    expect(schoolFromHost(`${word}.seiskolar.ph`, 'seiskolar.ph')).toBeNull()
  })

  it('lists exactly the reserved words FR-IAM-002 names', () => {
    expect([...RESERVED_SUBDOMAINS].sort()).toEqual(
      ['admin', 'api', 'app', 'auth', 'console', 'mail', 'static', 'www'].sort(),
    )
  })

  it('refuses a nested subdomain', () => {
    expect(schoolFromHost('a.citu.seiskolar.ph', 'seiskolar.ph')).toBeNull()
  })

  it('refuses another domain, even one ending in the same letters', () => {
    expect(schoolFromHost('citu.example.test', 'seiskolar.ph')).toBeNull()
    expect(schoolFromHost('notseiskolar.ph', 'seiskolar.ph')).toBeNull()
  })

  it('refuses a label that cannot be a subdomain', () => {
    expect(schoolFromHost('-citu.localhost', 'localhost')).toBeNull()
    expect(schoolFromHost('ci_tu.localhost', 'localhost')).toBeNull()
  })

  it('copes with an empty or numeric host', () => {
    expect(schoolFromHost('', 'localhost')).toBeNull()
    expect(schoolFromHost('127.0.0.1:3000', 'localhost')).toBeNull()
    expect(schoolFromHost('citu.localhost', '')).toBeNull()
  })
})

describe('schoolFromPath', () => {
  it('reads the school from /s/[school]', () => {
    expect(schoolFromPath('/s/citu')).toBe('citu')
    expect(schoolFromPath('/s/citu/sign-in')).toBe('citu')
  })

  it('refuses anything else, so a redirect built from it stays on this site', () => {
    expect(schoolFromPath('/')).toBeNull()
    expect(schoolFromPath('/sign-in')).toBeNull()
    expect(schoolFromPath('/s/')).toBeNull()
    expect(schoolFromPath('/s//evil.example/')).toBeNull()
    expect(schoolFromPath('/s/CITU')).toBeNull()
    expect(schoolFromPath('/school/citu')).toBeNull()
  })
})

describe('isConsolePath', () => {
  it('matches only the console', () => {
    expect(isConsolePath('/console')).toBe(true)
    expect(isConsolePath('/console/queue')).toBe(true)
    expect(isConsolePath('/consoles')).toBe(false)
    expect(isConsolePath('/')).toBe(false)
  })
})
