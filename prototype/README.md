# SEIskolar Interactive Prototype (React + Vite + shadcn/ui)

Interactive React + Vite prototype built with Tailwind CSS v4 and `shadcn/ui` (Radix UI primitives, `shadcn-admin` collapsible sidebar shell, `⌘K` command menu, and Light/Dark mode) from the 29 screens on the `04 High-fidelity` page of `SEIskolar – current design (Asph)` and the HTML specifications in `../04-high-fidelity/`.

This directory is self-contained so the design chain (`01-srs/` through `06-software-design-document/`) and `tools/figma/` stay untouched.

## Run locally

```bash
cd prototype
npm install
npm run dev
```

## Build

```bash
cd prototype
npm run build
```

## What is interactive

- **Shell & `⌘K` Command Menu:** Collapsible sidebar with top-left Workspace/Role Switcher, global `⌘K` (`Ctrl+K`) screen & role search palette, Light/Dark mode toggle, and `sonner` toast notifications.
- **Sign in & Access Isolation:** Switch between CIT-U School Portal and DOST Console, test `"Wrong email or password."` alert validation, test `no-access` and `nothing-found` guards, or use 1-click demo logins.
- **Cross-Role Live State (`localStorage`):**
  - **Scholar:** View dynamic term countdown/alerts, inspect/resubmit filings with drag-and-drop upload, live 4-decimal weighted average & §VII.A threshold calculation, expandable document scan modal, and live stipend/tuition steppers.
  - **School Coordinator:** Add academic terms, customize requirement names/instructions, match/dispute (with `AlertDialog` guardrail)/credit tuition remittances, and live-customize School Portal primary/secondary colors and grading scale.
  - **DOST Regional Office:** Configure term checklists/deadlines, search/filter queue, claim/verify/return filings (all 8 `FR-CHK-004` reasons), inspect immutable `Before`/`After` audit history diffs, manage release batches, record/correct remittances with scholar picker dialog, submit benefit proposals, create schools/accounts, and record transfers.
  - **DOST Central Office:** Review/approve/return/release batches, edit benefits/rules/scholar overrides, decide regional proposals, and update school §VII.A thresholds.
  - **System Administrator:** Create DOST staff accounts and add regions.
