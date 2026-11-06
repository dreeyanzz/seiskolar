// FR-ADM-003 and NFR-ACC-001: whatever colours a school chooses, its portal stays readable.
import { describe, expect, it } from 'vitest'
import { brandColours, contrast } from '@/lib/portal/brand'

const WHITE = '#ffffff'
const SURFACE = '#f3f5f8'
const AA = 4.5

function hex(r: number, g: number, b: number): string {
  return `#${[r, g, b].map((part) => part.toString(16).padStart(2, '0')).join('')}`
}

describe('contrast', () => {
  it('agrees with WCAG at the extremes', () => {
    expect(contrast('#000000', '#ffffff')).toBeCloseTo(21)
    expect(contrast('#777777', '#777777')).toBeCloseTo(1)
  })
})

describe('brandColours', () => {
  it("reproduces CIT-U's approved colours from 04-high-fidelity/_style.css", () => {
    const colours = brandColours('#800000', '#F2C200')
    expect(colours.brand).toBe('#800000')
    expect(colours.brandStrong).toBe('#5e0000')
    expect(colours.onBrand).toBe('#ffffff')
    expect(colours.brandInk).toBe('#800000')
    expect(colours.accent).toBe('#f2c200')
  })

  it('uses dark text on a light brand colour', () => {
    expect(brandColours('#f2c200', '#16365c').onBrand).not.toBe('#ffffff')
  })

  it('falls back to SEIskolar navy for anything that is not a six-digit colour', () => {
    for (const bad of ['', 'red', '#fff', '#12345g', 'url(evil)']) {
      expect(brandColours(bad, bad).brand).toBe('#16365c')
    }
  })

  // Every step of a 6 × 6 × 6 cube of colours, plus some mid-tones that are hardest to read.
  const steps = [0, 51, 102, 153, 204, 255]
  const samples = steps.flatMap((r) =>
    steps.flatMap((g) => steps.flatMap((b) => hex(r, g, b))),
  )
  samples.push(
    '#808080',
    '#767676',
    '#7f7f00',
    '#008080',
    '#b35900',
    '#00a0a0',
    '#d9534f',
  )

  it.each(samples)('stays AA with %s as the brand colour', (primary) => {
    const colours = brandColours(primary, '#f2c200')
    expect(contrast(colours.onBrand, colours.brand)).toBeGreaterThanOrEqual(AA)
    expect(contrast(colours.onBrand, colours.brandStrong)).toBeGreaterThanOrEqual(AA)
    expect(contrast(colours.onBrandSoft, colours.brand)).toBeGreaterThanOrEqual(AA)
    expect(contrast(colours.brandInk, WHITE)).toBeGreaterThanOrEqual(AA)
    expect(contrast(colours.brandInk, SURFACE)).toBeGreaterThanOrEqual(AA)
  })
})
