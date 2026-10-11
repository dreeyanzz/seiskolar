# Low-fidelity wireframes

One wireframe per screen, drawn for a phone, a tablet and a desktop. Each one serves steps
of a swimlane, and names them at its foot.

## Rules

- **One file per screen:** `role-screen.html`. A screen that changes, such as a requirement
  before and after it is returned, lists its states in its `<head>`,
  `<meta name="render-states" content="not-started returned" />`, and marks what each
  state shows with `data-state="returned"`. Open one state with `?state=returned`.
- **Three pictures of every state.** `npm run render` saves `name.phone.png` (360 px wide),
  `name.tablet.png` (768 px) and `name.desktop.png` (1440 px), or `name--state.phone.png`
  and so on for each state. Commit them with the screen. Nothing may scroll sideways on any
  of the three; the renderer fails if it does.
- **Grey boxes and real words.** No colour, images or branding: only the layout, the
  labels, and what each part holds. Every wireframe uses the shared `_wireframe.css`, and
  `_wireframe.js` draws its frame from `<body data-role="scholar" data-nav="...">`: the top
  bar, then a bar of tabs along the bottom of a phone, a rail on a tablet, and a sidebar on
  a desktop. A screen holds only its own content, in `<main class="page">`.
- **Real content, invented people.** The SRS's labels and states. CIT-U is the pilot
  school; every other school and every person is invented, with `@example.test` addresses.
  Amounts and dates are sample values, not DOST's rates.
- **Only what the swimlane and the SRS say.** A gap you had to fill is labelled
  `<span class="assumed">Assumed</span>` and listed in the pull request.
- **Notes are for reviewers.** A dashed NOTE box says what the screen itself does not,
  citing the SRS, and the grey line at the foot names the steps served. Neither is part of
  the screen.
- **Change `_wireframe.css` or `_wireframe.js` only in their own pull request,** and
  re-render every wireframe in it.

## Index

Every swimlane step a person takes or sees is served by a screen below. Five have no screen
of their own: S01.7 and S10.2 to S10.4 are done by SEIskolar alone, and S10.1, changing a
record, happens on every screen that saves something. Each screen's owner is the owner of
the swimlane it mostly serves. The pictures linked are of the first state; the others
follow the naming rule above.

| Screen                                                                                                                                                                                                                           | States                                | Serves                                         | Owner         | Status |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- | ---------------------------------------------- | ------------- | ------ |
| [Sign in](sign-in.html): [phone](sign-in--school.phone.png), [tablet](sign-in--school.tablet.png), [desktop](sign-in--school.desktop.png)                                                                                        | `school`, `console`, `wrong-password` | S01.1 to S01.4, S08.8                          | `@gnthril`    | done   |
| [Account not ready](no-access.html): [phone](no-access.phone.png), [tablet](no-access.tablet.png), [desktop](no-access.desktop.png)                                                                                              |                                       | S01.5, S01.6                                   | `@gnthril`    | done   |
| [Nothing to show](nothing-found.html): [phone](nothing-found.phone.png), [tablet](nothing-found.tablet.png), [desktop](nothing-found.desktop.png)                                                                                |                                       | S01.9, S01.10, S01.12                          | `@gnthril`    | done   |
| [Scholar: dashboard](scholar-dashboard.html): [phone](scholar-dashboard.phone.png), [tablet](scholar-dashboard.tablet.png), [desktop](scholar-dashboard.desktop.png)                                                             |                                       | S01.8, S02.8 to S02.11, S03.1 to S03.3, S08.12 | `@gnthril`    | done   |
| [Scholar: a requirement](scholar-requirement.html): [phone](scholar-requirement--not-started.phone.png), [tablet](scholar-requirement--not-started.tablet.png), [desktop](scholar-requirement--not-started.desktop.png)          | `not-started`, `returned`, `verified` | S01.11, S03.3 to S03.10, S04.10, S04.11, S09.6 | `@gnthril`    | done   |
| [Scholar: stipend and tuition](scholar-status.html): [phone](scholar-status.phone.png), [tablet](scholar-status.tablet.png), [desktop](scholar-status.desktop.png)                                                               |                                       | S05.12, S05.13, S06.12, S07.9                  | `@dreeyanzz`  | done   |
| [Coordinator: home](coordinator-home.html): [phone](coordinator-home.phone.png), [tablet](coordinator-home.tablet.png), [desktop](coordinator-home.desktop.png)                                                                  |                                       | S04.12                                         | `@zedric-git` | done   |
| [Coordinator: academic calendar](coordinator-terms.html): [phone](coordinator-terms.phone.png), [tablet](coordinator-terms.tablet.png), [desktop](coordinator-terms.desktop.png)                                                 |                                       | S02.1, S02.2, S02.4                            | `@dbeenutsz`  | done   |
| [Coordinator: requirement names](coordinator-requirement-names.html): [phone](coordinator-requirement-names.phone.png), [tablet](coordinator-requirement-names.tablet.png), [desktop](coordinator-requirement-names.desktop.png) |                                       | S02.3, S02.4                                   | `@dbeenutsz`  | done   |
| [Coordinator: tuition remittances](coordinator-remittances.html): [phone](coordinator-remittances--check.phone.png), [tablet](coordinator-remittances--check.tablet.png), [desktop](coordinator-remittances--check.desktop.png)  | `check`, `crediting`                  | S06.3 to S06.11, S06.13                        | `@Tiamporado` | done   |
| [Coordinator: portal settings](coordinator-portal-settings.html): [phone](coordinator-portal-settings.phone.png), [tablet](coordinator-portal-settings.tablet.png), [desktop](coordinator-portal-settings.desktop.png)           |                                       | S09.1 to S09.3                                 | `@Tiamporado` | done   |
| [Regional Office: home](regional-home.html): [phone](regional-home.phone.png), [tablet](regional-home.tablet.png), [desktop](regional-home.desktop.png)                                                                          |                                       | S04.1                                          | `@zedric-git` | done   |
| [Regional Office: checklist and deadline](regional-term-setup.html): [phone](regional-term-setup.phone.png), [tablet](regional-term-setup.tablet.png), [desktop](regional-term-setup.desktop.png)                                |                                       | S02.5 to S02.7                                 | `@dbeenutsz`  | done   |
| [Regional Office: queue](regional-queue.html): [phone](regional-queue.phone.png), [tablet](regional-queue.tablet.png), [desktop](regional-queue.desktop.png)                                                                     |                                       | S04.2, S04.3                                   | `@zedric-git` | done   |
| [Regional Office: check a filing](regional-review.html): [phone](regional-review--unclaimed.phone.png), [tablet](regional-review--unclaimed.tablet.png), [desktop](regional-review--unclaimed.desktop.png)                       | `unclaimed`, `claimed`, `returning`   | S04.3 to S04.9                                 | `@zedric-git` | done   |
| [Regional Office: release batches](regional-release-batch.html): [phone](regional-release-batch--draft.phone.png), [tablet](regional-release-batch--draft.tablet.png), [desktop](regional-release-batch--draft.desktop.png)      | `draft`, `returned`                   | S05.1 to S05.5, S05.8, S05.13                  | `@dreeyanzz`  | done   |
| [Regional Office: tuition remittances](regional-remittance.html): [phone](regional-remittance--record.phone.png), [tablet](regional-remittance--record.tablet.png), [desktop](regional-remittance--record.desktop.png)           | `record`, `disputed`                  | S06.1, S06.2, S06.5, S06.13                    | `@Tiamporado` | done   |
| [Regional Office: benefit proposals](regional-benefit-proposal.html): [phone](regional-benefit-proposal.phone.png), [tablet](regional-benefit-proposal.tablet.png), [desktop](regional-benefit-proposal.desktop.png)             |                                       | S07.1, S07.2, S07.5                            | `@dreeyanzz`  | done   |
| [Regional Office: schools](regional-schools.html): [phone](regional-schools.phone.png), [tablet](regional-schools.tablet.png), [desktop](regional-schools.desktop.png)                                                           |                                       | S08.4                                          | `@dbeenutsz`  | done   |
| [Regional Office: accounts](regional-accounts.html): [phone](regional-accounts--scholars.phone.png), [tablet](regional-accounts--scholars.tablet.png), [desktop](regional-accounts--scholars.desktop.png)                        | `scholars`, `coordinators`            | S08.5 to S08.7                                 | `@dbeenutsz`  | done   |
| [Regional Office: transfers](regional-transfer.html): [phone](regional-transfer.phone.png), [tablet](regional-transfer.tablet.png), [desktop](regional-transfer.desktop.png)                                                     |                                       | S08.9 to S08.11, S08.13                        | `@dbeenutsz`  | done   |
| [A record's history](record-history.html): [phone](record-history.phone.png), [tablet](record-history.tablet.png), [desktop](record-history.desktop.png)                                                                         |                                       | S10.5 to S10.8                                 | `@zedric-git` | done   |
| [Central Office: release batches](central-batches.html): [phone](central-batches.phone.png), [tablet](central-batches.tablet.png), [desktop](central-batches.desktop.png)                                                        |                                       | S05.6                                          | `@dreeyanzz`  | done   |
| [Central Office: a release batch](central-batch.html): [phone](central-batch--review.phone.png), [tablet](central-batch--review.tablet.png), [desktop](central-batch--review.desktop.png)                                        | `review`, `approved`                  | S05.6 to S05.11                                | `@dreeyanzz`  | done   |
| [Central Office: benefits](central-benefits.html): [phone](central-benefits--benefits.phone.png), [tablet](central-benefits--benefits.tablet.png), [desktop](central-benefits--benefits.desktop.png)                             | `benefits`, `rules`, `scholar`        | S07.7, S07.8                                   | `@dreeyanzz`  | done   |
| [Central Office: proposals](central-proposals.html): [phone](central-proposals.phone.png), [tablet](central-proposals.tablet.png), [desktop](central-proposals.desktop.png)                                                      |                                       | S07.3, S07.4, S07.6                            | `@dreeyanzz`  | done   |
| [Central Office: thresholds](central-thresholds.html): [phone](central-thresholds.phone.png), [tablet](central-thresholds.tablet.png), [desktop](central-thresholds.desktop.png)                                                 |                                       | S09.4, S09.5                                   | `@Tiamporado` | done   |
| [Administrator: DOST staff accounts](admin-staff-accounts.html): [phone](admin-staff-accounts.phone.png), [tablet](admin-staff-accounts.tablet.png), [desktop](admin-staff-accounts.desktop.png)                                 |                                       | S08.2, S08.3                                   | `@dbeenutsz`  | done   |
| [Administrator: regions](admin-regions.html): [phone](admin-regions.phone.png), [tablet](admin-regions.tablet.png), [desktop](admin-regions.desktop.png)                                                                         |                                       | S08.1                                          | `@dbeenutsz`  | done   |
