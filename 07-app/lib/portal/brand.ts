/**
 * Turns a school's two colours into the colour tokens globals.css reads (FR-ADM-003).
 *
 * A coordinator can choose any colours, and the SRS asks for WCAG 2.1 AA everywhere
 * (NFR-ACC-001), so this works out the rest of the palette to stay readable whatever they
 * choose: text on the brand colour picks white or dark, and the brand colour darkens when
 * it is used as text on a light background. The team's design has no rule for this yet;
 * it is an open question in the local implementation guide, and this is the assumed answer.
 *
 * Use: <div style={brandTokens(school.primaryColour, school.secondaryColour)}>.
 */
import type { CSSProperties } from 'react'

type Rgb = readonly [number, number, number]

const WHITE = '#ffffff'
const INK = '#17202b' // --ink in globals.css
const BLACK = '#000000'
const SURFACE = '#f3f5f8' // --surface in globals.css
const AA = 4.5

/** SEIskolar's own navy and gold: what an unusable colour falls back to. */
const FALLBACK_PRIMARY = '#16365c'
const FALLBACK_SECONDARY = '#f2b705'

const HEX = /^#[0-9a-f]{6}$/i

function toRgb(hex: string): Rgb {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ]
}

function toHex(rgb: Rgb): string {
  return `#${rgb.map((part) => Math.round(part).toString(16).padStart(2, '0')).join('')}`
}

/** `from`, moved by `amount` (0 to 1) towards `to`. */
function mix(from: string, to: string, amount: number): string {
  const a = toRgb(from)
  const b = toRgb(to)
  return toHex([
    a[0] + (b[0] - a[0]) * amount,
    a[1] + (b[1] - a[1]) * amount,
    a[2] + (b[2] - a[2]) * amount,
  ])
}

/** WCAG 2.1 relative luminance. */
function luminance(hex: string): number {
  const [r, g, b] = toRgb(hex).map((part) => {
    const channel = part / 255
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
  }) as unknown as Rgb
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** WCAG 2.1 contrast ratio, from 1 to 21. */
export function contrast(a: string, b: string): number {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [
    number,
    number,
  ]
  return (light + 0.05) / (dark + 0.05)
}

/** White if it reads on this colour, then the dark ink. Black always reads if neither does. */
function readableOn(background: string): string {
  if (contrast(WHITE, background) >= AA) return WHITE
  return contrast(INK, background) >= AA ? INK : BLACK
}

/** The brand colour for use as text and links: darkened only as far as it has to be. */
function inkFrom(primary: string): string {
  for (let amount = 0; amount <= 1; amount += 0.05) {
    const candidate = mix(primary, BLACK, amount)
    if (contrast(candidate, SURFACE) >= AA) return candidate
  }
  return BLACK
}

/** Text on the brand colour that recedes a little, without dropping below AA. */
function softOn(primary: string, onBrand: string): string {
  for (let amount = 0.16; amount > 0; amount -= 0.02) {
    const candidate = mix(onBrand, primary, amount)
    if (contrast(candidate, primary) >= AA) return candidate
  }
  return onBrand
}

export interface BrandColours {
  brand: string
  brandStrong: string
  brandTint: string
  brandInk: string
  onBrand: string
  onBrandSoft: string
  accent: string
}

export function brandColours(primary: string, secondary: string): BrandColours {
  const brand = HEX.test(primary) ? primary.toLowerCase() : FALLBACK_PRIMARY
  const accent = HEX.test(secondary) ? secondary.toLowerCase() : FALLBACK_SECONDARY
  const onBrand = readableOn(brand)
  return {
    brand,
    // Hovering moves away from the text colour, so the contrast only ever improves.
    brandStrong: onBrand === WHITE ? mix(brand, BLACK, 0.265) : mix(brand, WHITE, 0.2),
    brandTint: mix(brand, WHITE, 0.93),
    brandInk: inkFrom(brand),
    onBrand,
    onBrandSoft: softOn(brand, onBrand),
    accent,
  }
}

/** The same colours as CSS custom properties, for a style attribute. */
export function brandTokens(primary: string, secondary: string): CSSProperties {
  const colours = brandColours(primary, secondary)
  return {
    '--brand': colours.brand,
    '--brand-strong': colours.brandStrong,
    '--brand-tint': colours.brandTint,
    '--brand-ink': colours.brandInk,
    '--on-brand': colours.onBrand,
    '--on-brand-soft': colours.onBrandSoft,
    '--accent': colours.accent,
  } as CSSProperties
}
