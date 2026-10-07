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
- **One look for all of them.** Every swimlane uses the shared `_swimlane.css`.

## Index

| #   | Workflow | Covers | Owner | Status |
| --- | -------- | ------ | ----- | ------ |

Empty until the first pull request lists every workflow the SRS needs.
