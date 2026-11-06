# SEIskolar app

A working build of SEIskolar's screens, made from the design in this repository. It starts with
signing in and signing up, and it runs on **mock data**: every person is invented, nothing is saved
past a restart, and no real email is sent.

**Read this if you are an agent or a teammate picking this up.** Everything you need is written
here or in the folders beside this one; nothing depends on a conversation you can't see.

## How it fits this repository

This is the next link in the repository's chain: the [SRS](../01-srs/SRS.md), then the
[swimlanes](../02-swimlanes/), the [wireframes](../03-low-fidelity/), the
[high-fidelity screens](../04-high-fidelity/), then this. The design stays the source of every
screen: a change to a screen starts in its wireframe, and comes here last.

**One rule still says otherwise, and only Adrian can settle it.** [`AGENTS.md`](../AGENTS.md) says
"Nothing is implemented, and nothing will be", and tells every person and tool not to write an app
in this repository. The team's plan, in `05-risk-matrix-and-gantt/`, says "design only". The team
member who asked for this build treats the app as part of the project, so it arrived as a pull
request for Adrian Seth Tabotabo, the project manager, to decide. If it is accepted, those two
documents and the root [`README.md`](../README.md) need changing to match, in his words. They were
left alone on purpose.

## Run it

You need Node 24 or newer. There is nothing else to set up: no database, no keys. Everything here
runs from this folder, which has its own packages, apart from the repository's own tools.

```bash
cd 07-app
```

```bash
npm install
```

```bash
npm run dev
```

| Open                           | What it is                                              |
| ------------------------------ | ------------------------------------------------------- |
| <http://localhost:3000>        | The DOST console                                        |
| <http://citu.localhost:3000>   | CIT-U's portal, by its own address (FR-IAM-002)         |
| <http://localhost:3000/s/citu> | The same portal, for places with no subdomains          |
| <http://localhost:3000/s/siit> | A school with a light colour, to see the text stay dark |
| <http://nosuch.localhost:3000> | An address no school has: "Nothing to show here"        |

Edge and Chrome open `*.localhost` addresses with no setup. In production, set
`NEXT_PUBLIC_ROOT_DOMAIN` to the real domain, such as `seiskolar.ph`.

## Demo accounts

Press **Demo accounts** under the sign-in form, then press a person to fill the form. The shared
password is `DEMO_PASSWORD` in [`lib/mock/data.ts`](lib/mock/data.ts). Every person there comes
from the team's screens and is invented.

| Try                          | What it shows                                     | Steps          |
| ---------------------------- | ------------------------------------------------- | -------------- |
| A scholar or coordinator     | Lands on their school's home, in its colours      | S01.8          |
| DOST staff                   | Land on the DOST console, wherever they signed in | S01.8          |
| Noel Abad, Rico Sarmiento    | Right password, but no scope: "Account not ready" | S01.5, S01.6   |
| Any account, wrong password  | "Wrong email or password."                        | S01.4          |
| A scholar opening `/s/lsc`   | Another school's portal: "Nothing to show here"   | S01.10, S01.12 |
| A scholar opening `/console` | Not their console: "Nothing to show here"         | S01.12         |

To try the **sign-up** path, press "Activate your account" on the sign-in card, and use Ella
Ramos, Mark Villanueva or Mia Cortez from the panel there. DOST "made" these accounts, and none
has a password yet. No email is sent in the mock, so the screen hands you the link that the
email would have held. Restarting the server makes them new again.

## What is built, and where it comes from

| Screen                | Code                                    | Design               | Steps                 | SRS                    |
| --------------------- | --------------------------------------- | -------------------- | --------------------- | ---------------------- |
| Sign in               | `components/screens/sign-in.tsx`        | `sign-in.html`       | S01.1 to S01.4, S08.8 | FR-IAM-001, FR-IAM-002 |
| Account not ready     | `components/screens/no-access.tsx`      | `no-access.html`     | S01.5, S01.6          | FR-IAM-001             |
| Nothing to show       | `components/screens/nothing-found.tsx`  | `nothing-found.html` | S01.9, S01.10, S01.12 | FR-IAM-003             |
| Activate your account | `components/screens/activate.tsx`       | None: assumed, below | None                  | FR-ADM-001             |
| Set your password     | `components/screens/set-password.tsx`   | None: assumed, below | None                  | FR-ADM-001             |
| You're signed in      | `components/screens/signed-in-home.tsx` | None: temporary      | S01.7, S01.8          | FR-IAM-001             |

The design files are in [`04-high-fidelity/`](../04-high-fidelity/), and each has its wireframe
of the same name in [`03-low-fidelity/`](../03-low-fidelity/). Each screen's own file says the same
at its top.

The rest:

- **[`middleware.ts`](middleware.ts)** picks the portal from the address, and never looks at the
  session. FR-IAM-002 says routing must never verify access.
- **[`lib/identity/`](lib/identity/)** is the session, in the SRS's own terms: `user_role`,
  `region_id` and `school_id`. A missing or inactive profile leaves all three empty (FR-IAM-001).
- **[`lib/portal/brand.ts`](lib/portal/brand.ts)** turns a school's two colours into a palette
  that stays WCAG AA, whatever they are.
- **[`lib/mock/`](lib/mock/)** is the mock data and its rules.
- **[`app/globals.css`](app/globals.css)** is the look, copied from the design's
  `04-high-fidelity/_style.css`, with what changed listed at its top.

## Moving from mock data to Supabase

The SRS plans Supabase (§2.1), and the app runs on mock data for now, on the team member's
instruction of 6 November 2026. [`lib/backend.ts`](lib/backend.ts) is the only file that names
the mock. To switch:

1. Create a Supabase project, and turn off "Allow new users to sign up", so that only DOST can
   make accounts (FR-ADM-001).
2. Write the database: regions, schools and profiles, row-level security on all of them, and the
   hook that puts role, region and school in the token (FR-IAM-001, FR-IAM-003). The archived
   prototype did this, at tag `prototype-final` in `dreeyanzz/seiskolar-archive`, in
   `supabase/migrations/`. Its notes on the hook are worth reading first: a hook that can't read
   `profiles` fails silently, and every account comes out empty.
3. Implement `IdentityGateway` and `Directory` with Supabase in `lib/supabase/`, and point
   `lib/backend.ts` at them. Set `demo` to null, and delete `lib/mock/`.
4. No screen changes. `lib/identity/scope.ts` then only decides which screen to show, and the
   database decides which rows exist.

## Assumed

This repository's rule (AGENTS.md) is that a gap you had to fill is labelled "assumed" and listed.
Each of these needs Adrian, who owns the SRS, to confirm or change.

1. **The sign-up path.** A team member asked for one, but the SRS has no public sign-up: DOST
   makes every account (FR-ADM-001). What the SRS leaves open is how that person then gets a
   password (the SDD's "Still open", item 8). So "Activate your account" lets someone DOST already
   registered prove they hold the address, then set a password. Nobody can create an account
   there. A public form was rejected because it contradicts FR-ADM-001. The answer reads the same
   whether or not an address is registered, so nobody can use it to learn who has an account.
2. **Password rules:** 8 to 72 characters. The SRS sets none. 72 is the limit of Supabase's
   password hashing.
3. **Timings:** a session lasts 8 hours, and an activation link one hour. The SRS names neither.
4. **Readable school colours.** The design doesn't say what happens if a coordinator chooses a
   colour that fails contrast, and NFR-ACC-001 asks for AA. So the app adjusts the text, not the
   school's colour.
5. **"Nothing to show" when signed out.** The design draws it only for someone signed in.
6. **The temporary home screen,** "You're signed in", until each role's first screen is built.

Four small changes from the design, none of them to its content. The design should take the first
two as well, in its own pull request, wireframe first:

- **The top bar's home link is 44 px tall.** The design's is 36 px, under its own 44 px rule.
- **The band is measured differently.** In the design it ends at 38% of the page's height wherever
  the card is, so on a very tall screen the white school name runs off the band and can't be read.
  Now the card always overlaps the band by the same amount. At the design's own sizes it looks the
  same.
- **Sign out is a button in a form,** not a link, because it changes something.
- **The password field has a show and hide button,** and forms have loading and field-error states,
  which the design had no need to draw.

Not built, because no source asks for it: password recovery ("Forgot password?"), which the SRS
never mentions. The team's open questions are also in `06-software-design-document`'s "Still open".

## How it was checked

Last run on 7 November 2026, against a production build:

- **`npm run test:e2e`: 117 pass, 3 skipped,** in Microsoft Edge at 360, 768 and 1440 px. They walk
  swimlane 01 step by step, and the activation path from end to end. On every screen they check
  that nothing scrolls sideways, that axe finds no WCAG 2.1 A or AA failure, and that every control
  is at least 44 px. The skipped ones: the keyboard test on a phone, which has no Tab key, and the
  JavaScript-off test on a phone and a tablet, because one device is enough for it.
- **`npm test`: 287 pass:** the address rules, the palette at 223 sample colours, what the forms
  accept, a session token that has been edited or has expired, and the mock accounts' rules.
- **By eye:** 18 screens and states, on all three devices, against the design's PNGs. Sign in lands
  within a couple of pixels of `04-high-fidelity/sign-in--school.desktop.png` and `.phone.png`,
  apart from the additions listed above.
- **`npm audit --omit=dev`: 0 vulnerabilities.** Next.js 15 brings a PostCSS with known advisories,
  so `overrides` in `package.json` pins a patched one. It only ever reads our own stylesheet.
- **`npm audit`, tools included: 7 moderate,** all from one advisory in `minimatch`, inside the
  linter. It only reads our own files, so it is left alone: `npm audit fix` "fixes" it by downgrading
  the linter's TypeScript plugin to a version that crashes on ESLint 9.
- **The Impeccable design detector: 0 findings.** Its finish review ran in the same session as the
  build rather than from fresh eyes.

Not checked: real email, Supabase (neither exists here yet), Safari and Firefox, real phones, and a
person using a screen reader.

## Rules that apply here too

From `AGENTS.md` and the design folders' READMEs, because this build must stay true to them:

- **Invented people only,** with `@example.test` addresses. CIT-U is the pilot school, and every
  other school is invented. CIT-U's crest is a stand-in, not its seal.
- **The SRS's words in every label:** Scholar, School Coordinator, DOST Regional Office, DOST
  Central Office, System administrator.
- **WCAG 2.1 AA, and phones 360 px wide:** text at 4.5:1, borders at 3:1, tap targets of 44 px,
  and a visible focus outline. The browser tests measure these on every screen.
- **Every screen for a phone, a tablet and a desktop,** at 360, 768 and 1440 px.
- **Every file says what it is,** at its top, and every choice that isn't obvious says why.

## Commands

Run these from this folder.

```bash
npm run dev
```

```bash
npm test
```

```bash
npm run test:e2e
```

```bash
npm run typecheck
```

```bash
npm run lint
```

```bash
npm run format:check
```

`npm run test:e2e` builds the app and runs it in Microsoft Edge on three device sizes, using the
browser already on the computer, so nothing is downloaded. It needs Edge installed.
