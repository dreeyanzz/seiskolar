---
name: SEIskolar
description: One system with two front doors, each school's own portal and the DOST console.
colors:
  brand-navy: '#16365c'
  brand-navy-strong: '#0e2540'
  brand-navy-tint: '#e7eef7'
  on-brand: '#ffffff'
  on-brand-soft: '#c9d6e6'
  accent-gold: '#f2b705'
  ink: '#17202b'
  ink-2: '#3c4655'
  ink-3: '#5a6472'
  line: '#d8dde4'
  line-strong: '#848e9c'
  surface: '#f3f5f8'
  card: '#ffffff'
  bad-bg: '#fde6e4'
  bad-ink: '#9b1b13'
  bad-dot: '#d4382a'
  info-bg: '#e5efff'
  info-ink: '#164a8a'
  info-dot: '#2d6fd2'
  focus: '#1f6feb'
typography:
  headline:
    fontFamily: "'Segoe UI Variable Text', 'Segoe UI', system-ui, -apple-system, Roboto, 'Helvetica Neue', Arial, sans-serif"
    fontSize: '26px'
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: '-0.01em'
  title:
    fontFamily: "'Segoe UI Variable Text', 'Segoe UI', system-ui, -apple-system, Roboto, 'Helvetica Neue', Arial, sans-serif"
    fontSize: '18px'
    fontWeight: 700
    lineHeight: 1.3
  body:
    fontFamily: "'Segoe UI Variable Text', 'Segoe UI', system-ui, -apple-system, Roboto, 'Helvetica Neue', Arial, sans-serif"
    fontSize: '15px'
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "'Segoe UI Variable Text', 'Segoe UI', system-ui, -apple-system, Roboto, 'Helvetica Neue', Arial, sans-serif"
    fontSize: '14px'
    fontWeight: 600
  # The smaller steps of the approved stylesheet, kept as they are there.
  headline-phone:
    fontSize: '23px'
    fontWeight: 700
  portal-name:
    fontSize: '18px'
    fontWeight: 700
  bar-name:
    fontSize: '16px'
    fontWeight: 700
  lead:
    fontSize: '16px'
    fontWeight: 400
  small:
    fontSize: '13.5px'
    fontWeight: 400
  hint:
    fontSize: '13px'
    fontWeight: 400
  badge:
    fontSize: '12.5px'
    fontWeight: 700
  caption:
    fontSize: '12px'
    fontWeight: 400
rounded:
  sm: '8px'
  control: '10px'
  md: '12px'
  pill: '999px'
spacing:
  gap: '16px'
  card: '20px'
  card-alone: '28px'
components:
  button-primary:
    backgroundColor: '{colors.brand-navy}'
    textColor: '{colors.on-brand}'
    rounded: '{rounded.control}'
    height: '44px'
    padding: '0 18px'
  button-primary-hover:
    backgroundColor: '{colors.brand-navy-strong}'
    textColor: '{colors.on-brand}'
  button-secondary:
    backgroundColor: '{colors.card}'
    textColor: '{colors.ink}'
    rounded: '{rounded.control}'
    height: '44px'
    padding: '0 18px'
  input:
    backgroundColor: '{colors.card}'
    textColor: '{colors.ink}'
    rounded: '{rounded.control}'
    height: '44px'
    padding: '9px 12px'
  card:
    backgroundColor: '{colors.card}'
    rounded: '{rounded.md}'
    padding: '{spacing.card}'
---

# Design System: SEIskolar

This records the look the team approved, in `../04-high-fidelity/_style.css`. **That file is the
source of truth.** A change to the look starts there, in its wireframe first (AGENTS.md), and comes
here after.
It was written from the code and the approved screens, with no separate interview.

## Overview

A plain, official counter. Scholars come here to get a task done and to find out where their
money is, often on a phone on mobile data, so the screens are familiar, calm and quick. The
school's identity is the one strong gesture: its colour fills a band across the top of the
sign-in screen, and the bar across every screen after that.

**Key Characteristics:**

- Each school's colours, set by its coordinator; SEIskolar's own navy and gold in the DOST
  console.
- One system font, for speed: nothing to download on mobile data.
- White cards on a cool grey surface, with hairline borders and a soft shadow.
- States are said in words as well as colour.

## Colors

Restrained neutrals, with one brand colour that changes per portal and one accent.

### Primary

- **DOST Navy:** the band, the top bar and primary buttons in the DOST console. A school's
  portal replaces it with that school's primary colour.
- **Deep Navy:** the primary button's hover state.

### Secondary

- **Signal Gold:** the 3 px line under the top bar, and the crest's rim. Never carries text.
  A school's portal replaces it with that school's secondary colour.

### Neutral

- **Ink, Ink 2, Ink 3:** body text, secondary text, and hints and placeholders.
- **Line, Strong Line:** card borders, and the borders of fields and buttons.
- **Cool Surface, Card White:** the page, and what sits on it.

### Named Rules

**The School's Colours Rule.** A school may choose any colours, so nothing is hard-coded on top
of them. `lib/portal/brand.ts` works out the rest: text on the brand colour picks white or dark,
and `--brand-ink`, the brand colour darkened only as far as it must be, is what links and text
use. Every pair stays at 4.5:1 or better, whatever the school chooses.

**The Blue Ring Rule.** Keyboard focus is one blue everywhere, except on the brand-coloured bar,
where it takes the bar's text colour, because blue is lost on navy.

## Typography

**Body Font:** Segoe UI Variable, then the platform's own sans.

**Character:** A workhorse. One family carries headings, buttons, labels and body, because this
is a tool people use, and a web font would cost a scholar's mobile data.

### Hierarchy

- **Headline:** each screen's one `h1` (23 px on a phone).
- **Title:** a card's heading.
- **Body:** everything read (16 px on a phone, which also stops phones zooming into fields).
- **Label:** field labels. Hints are 13 px in Ink 3.

## Layout

A phone is narrower than 600 px, a tablet 600 to 1023 px, and a desktop 1024 px or wider. Every
screen is drawn at 360, 768 and 1440 px, and nothing may scroll sideways at any of them.

Screens without the frame (sign-in and activation) put a 440 px column on the band: the band is
38% of the viewport's height at least, and the card overlaps its lower edge by 22 px, so the
school's name always sits on the colour it was made to be read on. Framed screens have the top
bar, then the page, up to 1200 px wide.

## Elevation & Depth

Almost flat. Cards lift off the surface with one soft, offset shadow, and nothing else has one.

### Shadow Vocabulary

- **Card** (`box-shadow: 0 1px 2px rgb(16 24 40 / 6%), 0 2px 8px rgb(16 24 40 / 6%)`): every card.

## Shapes

Gently rounded: 12 px on cards, 10 px on fields and buttons, 8 px on smaller boxes, and fully
round on badges and the avatar. Fields and buttons have 1.5 px borders, so they meet 3:1 against
white.

## Components

### Buttons

- **Shape:** gently rounded (10 px), and never under 44 px tall.
- **Primary:** the brand colour, with text that reads on it. One per screen.
- **Secondary:** white with a strong border.
- **Hover:** a darker brand colour, or the surface colour on a secondary button.
- **While working:** a small spinner and a label saying what is happening, such as "Signing in…".
  The button keeps focus and ignores further presses.

### Inputs / Fields

- **Style:** white, with a strong border and a visible label above. A placeholder is an example,
  never the label.
- **Focus:** the border takes the brand ink, with a soft blue ring.
- **Error:** a red border, and the problem in words directly below, tied to the field.
- **Password:** a 44 px show and hide button inside the box. Pasting and password managers always
  work.

### Cards / Containers

- **Corner Style:** gently rounded (12 px).
- **Internal Padding:** 20 px; 28 px on screens without the frame; 16 to 20 px on a phone.

### Navigation

- **Top bar:** the brand colour with a 3 px accent line, holding the portal's mark and name, the
  person's name and role, and sign-out. On a phone it shows the school's short name, and hides the
  name and role. The rest of the frame (`04-high-fidelity/_app.js`) comes with the screens it leads
  to.

## Do's and Don'ts

### Do:

- **Do** use the SRS's words in every label (AGENTS.md).
- **Do** say what happened and how to fix it, in words near where it happened.
- **Do** keep demo-only help visibly apart from the design, with a dashed border and a
  "Mock data" badge.

### Don't:

- **Don't** use a colour of your own: everything comes from the tokens above.
- **Don't** add colours or layouts here that the approved design doesn't have. Change the design
  first.
- **Don't** let the address decide anything but the look (FR-IAM-002).
