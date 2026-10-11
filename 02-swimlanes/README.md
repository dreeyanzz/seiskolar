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

| #   | Workflow                                                        | Covers                                                                                                        | Owner         | Status |
| --- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | ------------- | ------ |
| 01  | Sign in, and reach only your own screens                        | FR-IAM-001, FR-IAM-002, FR-IAM-003                                                                            | `@gnthril`    | to do  |
| 02  | Set up a term: calendar, requirement names, checklist, deadline | §1.3 (who sets what); §4.1 "Configure Campus Terms" and "Customize Requirement Labels"; FR-SCH-001's deadline | `@dbeenutsz`  | to do  |
| 03  | File a Periodic Report                                          | FR-SCH-001, FR-SCH-002, FR-SCH-003, FR-SCH-004                                                                | `@gnthril`    | to do  |
| 04  | Check a filing: claim, verify or return, then resubmit          | FR-CHK-001, FR-CHK-002, FR-CHK-003, FR-CHK-004, FR-MON-001                                                    | `@zedric-git` | to do  |
| 05  | Release a batch, from cleared to released                       | FR-REL-001, FR-REL-002, FR-REL-003                                                                            | `@dreeyanzz`  | to do  |
| 06  | Settle a school's tuition                                       | FR-TUI-001, FR-TUI-002, FR-TUI-003                                                                            | `@Tiamporado` | to do  |
| 07  | Change a benefit, or propose a change                           | FR-BEN-001, FR-BEN-002, FR-BEN-003                                                                            | `@dreeyanzz`  | to do  |
| 08  | Set up a school and its people, and record a transfer           | FR-ADM-001, FR-ADM-002; §4.1 "Maintain Reference Data"                                                        | `@dbeenutsz`  | to do  |
| 09  | Set up the school portal: branding, grading, thresholds         | FR-ADM-003                                                                                                    | `@Tiamporado` | to do  |
| 10  | Look up who did what to a record                                | NFR-SEC-003; §4.1 "Inspect Immutable Audit Logs"                                                              | `@zedric-git` | to do  |

**When a swimlane is done,** its pull request also adds the screens its steps need to the
[low-fidelity index](../03-low-fidelity/README.md#index), owned by the swimlane's owner.
If another swimlane already listed a screen, add your step numbers to that row instead of
listing it twice.
