# Product

<!-- impeccable:product-schema 1 -->

Everything here comes from the design in this repository, mainly `../01-srs/SRS.md` version 2.2.
It was inferred from those files rather than from an interview: on 6 November 2026 the team member
building this asked to follow the project's files instead of answering questions. Treat it as a
summary of those files; where they disagree, they win.

## Platform

web

## Stack

Next.js 15 and TypeScript, as SRS §2.1 names. The SRS plans Supabase behind it. For now the
app runs on mock data, on the team member's instruction of 6 November 2026, behind
`lib/backend.ts`, so Supabase can replace the mock without changing a screen.

## Users

- **Scholars:** DOST-SEI undergraduates, often on a phone and on mobile data, who must file a
  Periodic Report every term and want to know where their stipend and tuition stand.
- **School Coordinators:** university employees who run the school's portal settings and
  calendar, and credit tuition.
- **DOST Regional Office** (the checker): check filings from one queue, send release batches
  and tuition remittances, and create schools and accounts.
- **DOST Central Office:** national staff who approve, return and record releases, and manage
  benefits.
- **System administrator:** keeps reference data and DOST staff accounts. Makes no program
  decision.

## Product Purpose

Replaces a shared Google Drive folder, where anyone with the link could change or delete
scholars' records, with a system where scholars file into set slots, DOST checks from a queue,
and everyone sees what is outstanding, released and settled (SRS §1.1).

## Positioning

Full lifecycle transparency over scholar compliance, school tuition settlement and the stipend
release pipeline (the SRS's core maxim): each step shows a recorded date, and nothing is
predicted or calculated.

## Operating Context

One system, reached through two front doors: each school's own portal, in its own colours, and
the DOST console. The pilot is Cebu Institute of Technology – University, under DOST Regional
Office No. VII.

## Capabilities and Constraints

- **Use the SRS's words:** Scholar, School Coordinator, DOST Regional Office, DOST Central
  Office, System administrator. Cleared is not released. A release batch is not an award batch.
- **Never** calculate a total, predict a date, declare standing, probation or termination, or
  move money. Those are the SRS's "won't have" list (§6.1).
- **The address picks the screens, never the data** (FR-IAM-002, FR-IAM-003). Anything out of
  scope shows nothing, and no error.
- **Accounts are made for people, not by them** (FR-ADM-001). How a new person first sets a
  password is open (the SDD's "Still open", item 8); this app assumes an emailed link.

## Brand Commitments

- A school's portal wears that school's colours, as its coordinator set them; the DOST console
  wears SEIskolar's navy and gold (FR-ADM-003).
- The look is the team's approved `../04-high-fidelity/` screens, whose stylesheet is the source
  of truth. A change to the design starts there (AGENTS.md: wireframe first, then the screen).
- CIT-U's crest here is a stand-in, never its real seal.

## Evidence on Hand

No real data, testimonials or customers. Invented people only, with `@example.test` addresses
(SRS §2.3, AGENTS.md). Amounts and dates in the design are sample values, not DOST's rates.

## Product Principles

- Show recorded facts with their dates. Never imply a promise.
- A scholar on a cheap phone on mobile data is the design's first user.
- Deny by default: an account with no scope sees nothing.
- Say plainly what is known, what is assumed, and who can settle it.

## Accessibility & Inclusion

WCAG 2.1 Level AA and phones 360 px wide (NFR-ACC-001). The design adds: text at 4.5:1, borders
of fields and buttons at 3:1, tap targets of at least 44 px, a visible focus outline, and
nothing that scrolls sideways at 360 px.
