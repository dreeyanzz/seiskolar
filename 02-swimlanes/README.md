# Swimlanes

One swimlane per workflow in the SRS. Each one shows who does what, in order, from the
moment the workflow starts until it ends.

## Rules

- **One file per workflow:** `NN-short-name.html`, with `NN-short-name.png` beside it
  (`npm run render`). `NN` is its number in the index below.
- **Title and scope at the top:** "Swimlane NN: name", the SRS requirements it covers,
  and one line saying where it starts and where it ends.
- **One lane per person who acts,** using the names the SRS uses, plus a **SEIskolar**
  lane for what the system does or works out by itself.
- **Every step and decision is numbered** `SNN.n` (`S02.3`), in order. Wireframes cite
  these numbers, so renumbering a step means updating every wireframe that cites it.
- **Every path ends.** Each branch of a decision reaches an end or rejoins the flow.
- **Only what the SRS says.** A gap you had to fill is labelled "assumed".
- **Start from [`_template.html`](_template.html).** Its shared `_swimlane.css` and
  `_swimlane.js` place the steps, draw the arrows and add the legend, so every swimlane
  looks the same; [`_template.png`](_template.png) shows how. Change those two files only
  in their own pull request, and re-render every swimlane in it.

## Index

Every functional requirement in SRS §3 is covered by one of these. Where the SRS gives a
workflow no requirement ID of its own, the row cites the section or the use case (§4.1)
it comes from instead.

| #   | Workflow                                                                                                                                 | Covers                                                                                                        | Owner         | Status |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | ------------- | ------ |
| 01  | [Sign in, and reach only your own screens](01-sign-in.html) ([picture](01-sign-in.png))                                                  | FR-IAM-001, FR-IAM-002, FR-IAM-003                                                                            | `@gnthril`    | done   |
| 02  | [Set up a term: calendar, requirement names, checklist, deadline](02-set-up-a-term.html) ([picture](02-set-up-a-term.png))               | §1.3 (who sets what); §4.1 "Configure Campus Terms" and "Customize Requirement Labels"; FR-SCH-001's deadline | `@dbeenutsz`  | done   |
| 03  | [File a Periodic Report](03-file-a-periodic-report.html) ([picture](03-file-a-periodic-report.png))                                      | FR-SCH-001, FR-SCH-002, FR-SCH-003, FR-SCH-004                                                                | `@gnthril`    | done   |
| 04  | [Check a filing: claim, verify or return, then resubmit](04-check-a-filing.html) ([picture](04-check-a-filing.png))                      | FR-CHK-001, FR-CHK-002, FR-CHK-003, FR-CHK-004, FR-MON-001                                                    | `@zedric-git` | done   |
| 05  | [Release a batch, from cleared to released](05-release-a-batch.html) ([picture](05-release-a-batch.png))                                 | FR-REL-001, FR-REL-002, FR-REL-003                                                                            | `@dreeyanzz`  | done   |
| 06  | [Settle a school's tuition](06-settle-tuition.html) ([picture](06-settle-tuition.png))                                                   | FR-TUI-001, FR-TUI-002, FR-TUI-003                                                                            | `@Tiamporado` | done   |
| 07  | [Change a benefit, or propose a change](07-change-a-benefit.html) ([picture](07-change-a-benefit.png))                                   | FR-BEN-001, FR-BEN-002, FR-BEN-003                                                                            | `@dreeyanzz`  | done   |
| 08  | [Set up a school and its people, and record a transfer](08-set-up-schools-and-people.html) ([picture](08-set-up-schools-and-people.png)) | FR-ADM-001, FR-ADM-002; §4.1 "Maintain Reference Data"                                                        | `@dbeenutsz`  | done   |
| 09  | [Set up the school portal: branding, grading, thresholds](09-set-up-the-school-portal.html) ([picture](09-set-up-the-school-portal.png)) | FR-ADM-003                                                                                                    | `@Tiamporado` | done   |
| 10  | [Look up who did what to a record](10-look-up-who-did-what.html) ([picture](10-look-up-who-did-what.png))                                | NFR-SEC-003; §4.1 "Inspect Immutable Audit Logs"                                                              | `@zedric-git` | done   |

**When a swimlane is done,** its pull request also adds the screens its steps need to the
[low-fidelity index](../03-low-fidelity/README.md#index), owned by the swimlane's owner.
If another swimlane already listed a screen, add your step numbers to that row instead of
listing it twice.
