# High-fidelity screens

The finished screens: each wireframe drawn for real, with colour, type and working links.
Together they are a clickable prototype. Open any file in a browser, and its buttons lead
to the next screen its swimlane shows.

## Rules

- **Same name as its wireframe:** `04-high-fidelity/scholar-requirement.html` finishes
  `03-low-fidelity/scholar-requirement.html`, with the same content and states. Its
  pictures, one for each device and state, sit beside it (`npm run render`). Why: the
  name is the link back. From a screen you find its wireframe, and from the wireframe its
  swimlane steps and SRS items; change the wireframe first, then the screen.
- **A comment at the top of each screen** names its wireframe, the swimlane steps it
  serves and the swimlanes they are in, its SRS items, its states, its owner, and what the
  wireframe's notes say. Why: a finished screen shows no notes or trace line, so without
  the comment an agent that opens one file cannot see where it comes from. Keep it in step
  with the wireframe.
- **One look.** Every screen uses the shared `_style.css` for colour, type and spacing,
  and `_app.js` for its frame, as the wireframes use theirs. No colours of your own:
  inside a school's portal the brand colours are the school's, as its coordinator set them
  (FR-ADM-003), and in the DOST console they are SEIskolar's. Why: one stylesheet keeps the
  29 screens consistent and makes a change of colour or spacing in one place; FR-ADM-003
  lets each school brand its own portal, so the colours there are the school's to choose.
- **Shared parts are filled in for you.** `_app.js` puts an icon in
  `<span data-icon="upload">`, the school's crest or SEIskolar's mark in
  `<span data-mark="school">`, and a scanned grade report in `<div data-doc="grades">`.
  Its comments list the rest. Why: copied into many files, icons and drawings would drift
  apart; filled in from one place, they stay the same everywhere.
- **Clickable.** Links and buttons open the screen that comes next in the swimlane. A
  button whose action would save something says what happened instead
  (`data-toast="Saved."`), because nothing is saved here. The grade lines work out their
  weighted average as you type (FR-SCH-003). Why: the team presents the design by clicking
  through it, so every button should go where a person would expect, and the message
  makes clear when the prototype only pretends to save.
- **Readable by everyone:** WCAG 2.1 AA (SRS NFR-ACC-001), so text contrast of at least
  4.5:1, borders of fields and buttons at 3:1, tap targets of at least 44 px, a visible
  focus outline, and nothing that scrolls sideways at 360 px. Why: the SRS requires it,
  and a design that fails it would pass the failure on to anything built from it.
- **Static only.** HTML, CSS and a little browser JavaScript. No build step, no packages,
  no server, and nothing saved anywhere. Why: this repository holds the design, not an
  implementation (AGENTS.md, "There is no code here"), and anyone can open a screen in a
  browser with nothing to install.
- **Invented people only.** CIT-U's crest here is a stand-in, not its seal. Why: real
  scholars' records stay out of a student project (SRS §2.3), and a university's seal is
  its own mark, not ours to reproduce.

## Index

Every wireframe has its screen here, with the same name and states. The pictures linked
are of the first state; the others follow the naming rule above.

| Screen                                                                                                                                                                                                                           | Wireframe                                                                              | Owner         | Status |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- | ------------- | ------ |
| [Sign in](sign-in.html): [phone](sign-in--school.phone.png), [tablet](sign-in--school.tablet.png), [desktop](sign-in--school.desktop.png)                                                                                        | [sign-in](../03-low-fidelity/sign-in.html)                                             | `@gnthril`    | done   |
| [Account not ready](no-access.html): [phone](no-access.phone.png), [tablet](no-access.tablet.png), [desktop](no-access.desktop.png)                                                                                              | [no-access](../03-low-fidelity/no-access.html)                                         | `@gnthril`    | done   |
| [Nothing to show](nothing-found.html): [phone](nothing-found.phone.png), [tablet](nothing-found.tablet.png), [desktop](nothing-found.desktop.png)                                                                                | [nothing-found](../03-low-fidelity/nothing-found.html)                                 | `@gnthril`    | done   |
| [Scholar: dashboard](scholar-dashboard.html): [phone](scholar-dashboard.phone.png), [tablet](scholar-dashboard.tablet.png), [desktop](scholar-dashboard.desktop.png)                                                             | [scholar-dashboard](../03-low-fidelity/scholar-dashboard.html)                         | `@gnthril`    | done   |
| [Scholar: a requirement](scholar-requirement.html): [phone](scholar-requirement--not-started.phone.png), [tablet](scholar-requirement--not-started.tablet.png), [desktop](scholar-requirement--not-started.desktop.png)          | [scholar-requirement](../03-low-fidelity/scholar-requirement.html)                     | `@gnthril`    | done   |
| [Scholar: stipend and tuition](scholar-status.html): [phone](scholar-status.phone.png), [tablet](scholar-status.tablet.png), [desktop](scholar-status.desktop.png)                                                               | [scholar-status](../03-low-fidelity/scholar-status.html)                               | `@Tiamporado` | done   |
| [Coordinator: home](coordinator-home.html): [phone](coordinator-home.phone.png), [tablet](coordinator-home.tablet.png), [desktop](coordinator-home.desktop.png)                                                                  | [coordinator-home](../03-low-fidelity/coordinator-home.html)                           | `@zedric-git` | done   |
| [Coordinator: academic calendar](coordinator-terms.html): [phone](coordinator-terms.phone.png), [tablet](coordinator-terms.tablet.png), [desktop](coordinator-terms.desktop.png)                                                 | [coordinator-terms](../03-low-fidelity/coordinator-terms.html)                         | `@dbeenutsz`  | done   |
| [Coordinator: requirement names](coordinator-requirement-names.html): [phone](coordinator-requirement-names.phone.png), [tablet](coordinator-requirement-names.tablet.png), [desktop](coordinator-requirement-names.desktop.png) | [coordinator-requirement-names](../03-low-fidelity/coordinator-requirement-names.html) | `@dbeenutsz`  | done   |
| [Coordinator: tuition remittances](coordinator-remittances.html): [phone](coordinator-remittances--check.phone.png), [tablet](coordinator-remittances--check.tablet.png), [desktop](coordinator-remittances--check.desktop.png)  | [coordinator-remittances](../03-low-fidelity/coordinator-remittances.html)             | `@Tiamporado` | done   |
| [Coordinator: portal settings](coordinator-portal-settings.html): [phone](coordinator-portal-settings.phone.png), [tablet](coordinator-portal-settings.tablet.png), [desktop](coordinator-portal-settings.desktop.png)           | [coordinator-portal-settings](../03-low-fidelity/coordinator-portal-settings.html)     | `@Tiamporado` | done   |
| [Regional Office: home](regional-home.html): [phone](regional-home.phone.png), [tablet](regional-home.tablet.png), [desktop](regional-home.desktop.png)                                                                          | [regional-home](../03-low-fidelity/regional-home.html)                                 | `@zedric-git` | done   |
| [Regional Office: checklist and deadline](regional-term-setup.html): [phone](regional-term-setup.phone.png), [tablet](regional-term-setup.tablet.png), [desktop](regional-term-setup.desktop.png)                                | [regional-term-setup](../03-low-fidelity/regional-term-setup.html)                     | `@zedric-git` | done   |
| [Regional Office: queue](regional-queue.html): [phone](regional-queue.phone.png), [tablet](regional-queue.tablet.png), [desktop](regional-queue.desktop.png)                                                                     | [regional-queue](../03-low-fidelity/regional-queue.html)                               | `@zedric-git` | done   |
| [Regional Office: check a filing](regional-review.html): [phone](regional-review--unclaimed.phone.png), [tablet](regional-review--unclaimed.tablet.png), [desktop](regional-review--unclaimed.desktop.png)                       | [regional-review](../03-low-fidelity/regional-review.html)                             | `@zedric-git` | done   |
| [Regional Office: release batches](regional-release-batch.html): [phone](regional-release-batch--draft.phone.png), [tablet](regional-release-batch--draft.tablet.png), [desktop](regional-release-batch--draft.desktop.png)      | [regional-release-batch](../03-low-fidelity/regional-release-batch.html)               | `@dreeyanzz`  | done   |
| [Regional Office: tuition remittances](regional-remittance.html): [phone](regional-remittance--record.phone.png), [tablet](regional-remittance--record.tablet.png), [desktop](regional-remittance--record.desktop.png)           | [regional-remittance](../03-low-fidelity/regional-remittance.html)                     | `@Tiamporado` | done   |
| [Regional Office: benefit proposals](regional-benefit-proposal.html): [phone](regional-benefit-proposal.phone.png), [tablet](regional-benefit-proposal.tablet.png), [desktop](regional-benefit-proposal.desktop.png)             | [regional-benefit-proposal](../03-low-fidelity/regional-benefit-proposal.html)         | `@dreeyanzz`  | done   |
| [Regional Office: schools](regional-schools.html): [phone](regional-schools.phone.png), [tablet](regional-schools.tablet.png), [desktop](regional-schools.desktop.png)                                                           | [regional-schools](../03-low-fidelity/regional-schools.html)                           | `@dbeenutsz`  | done   |
| [Regional Office: accounts](regional-accounts.html): [phone](regional-accounts--scholars.phone.png), [tablet](regional-accounts--scholars.tablet.png), [desktop](regional-accounts--scholars.desktop.png)                        | [regional-accounts](../03-low-fidelity/regional-accounts.html)                         | `@dbeenutsz`  | done   |
| [Regional Office: transfers](regional-transfer.html): [phone](regional-transfer.phone.png), [tablet](regional-transfer.tablet.png), [desktop](regional-transfer.desktop.png)                                                     | [regional-transfer](../03-low-fidelity/regional-transfer.html)                         | `@dbeenutsz`  | done   |
| [A record's history](record-history.html): [phone](record-history.phone.png), [tablet](record-history.tablet.png), [desktop](record-history.desktop.png)                                                                         | [record-history](../03-low-fidelity/record-history.html)                               | `@zedric-git` | done   |
| [Central Office: release batches](central-batches.html): [phone](central-batches.phone.png), [tablet](central-batches.tablet.png), [desktop](central-batches.desktop.png)                                                        | [central-batches](../03-low-fidelity/central-batches.html)                             | `@dreeyanzz`  | done   |
| [Central Office: a release batch](central-batch.html): [phone](central-batch--review.phone.png), [tablet](central-batch--review.tablet.png), [desktop](central-batch--review.desktop.png)                                        | [central-batch](../03-low-fidelity/central-batch.html)                                 | `@dreeyanzz`  | done   |
| [Central Office: benefits](central-benefits.html): [phone](central-benefits--benefits.phone.png), [tablet](central-benefits--benefits.tablet.png), [desktop](central-benefits--benefits.desktop.png)                             | [central-benefits](../03-low-fidelity/central-benefits.html)                           | `@dreeyanzz`  | done   |
| [Central Office: proposals](central-proposals.html): [phone](central-proposals.phone.png), [tablet](central-proposals.tablet.png), [desktop](central-proposals.desktop.png)                                                      | [central-proposals](../03-low-fidelity/central-proposals.html)                         | `@dreeyanzz`  | done   |
| [Central Office: thresholds](central-thresholds.html): [phone](central-thresholds.phone.png), [tablet](central-thresholds.tablet.png), [desktop](central-thresholds.desktop.png)                                                 | [central-thresholds](../03-low-fidelity/central-thresholds.html)                       | `@Tiamporado` | done   |
| [Administrator: DOST staff accounts](admin-staff-accounts.html): [phone](admin-staff-accounts.phone.png), [tablet](admin-staff-accounts.tablet.png), [desktop](admin-staff-accounts.desktop.png)                                 | [admin-staff-accounts](../03-low-fidelity/admin-staff-accounts.html)                   | `@gnthril`    | done   |
| [Administrator: regions](admin-regions.html): [phone](admin-regions.phone.png), [tablet](admin-regions.tablet.png), [desktop](admin-regions.desktop.png)                                                                         | [admin-regions](../03-low-fidelity/admin-regions.html)                                 | `@dbeenutsz`  | done   |
