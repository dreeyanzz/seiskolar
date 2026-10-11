# SEIskolar

The software design of a system for DOST-SEI undergraduate scholars. Scholars file their
per-term Periodic Report, the DOST Regional Office checks it, and everyone can see what is
still outstanding, where a scholar's stipend is in the release process, and whether their
tuition has been settled with their school.

Software Design, Cebu Institute of Technology – University. Team **Asph**.

## What is here

| #   | Deliverable                                 | Built from                       |
| --- | ------------------------------------------- | -------------------------------- |
| 1   | [SRS](01-srs/SRS.md)                        | The baseline                     |
| 2   | [Swimlanes](02-swimlanes/)                  | The SRS requirements each covers |
| 3   | [Low-fidelity wireframes](03-low-fidelity/) | The swimlane steps each serves   |
| 4   | [High-fidelity screens](04-high-fidelity/)  | The wireframe with the same name |

Each folder's README lists every item, what it is built from, who owns it, and whether it
is done. There is no application code here: each drawing is an HTML file with its PNG
pictures beside it, so you can view it on GitHub or open it in a browser. Every screen is
drawn for a phone, a tablet and a desktop.

Earlier work, including the prototype and the documents the SRS links to, is in the
archived repository [`dreeyanzz/seiskolar-archive`](https://github.com/dreeyanzz/seiskolar-archive).

## Team

| Member                 | GitHub        | Role                             |
| ---------------------- | ------------- | -------------------------------- |
| Adrian Seth Tabotabo   | `@dreeyanzz`  | Project Manager; reviews, merges |
| Genril Theo Soroño     | `@gnthril`    | Member                           |
| Althea Maeve Kinaadman | `@Tiamporado` | Member                           |
| Zedric Camilotes       | `@zedric-git` | Member                           |
| Dorothy Biatriz Capao  | `@dbeenutsz`  | Member                           |

Who owns which swimlane and screen is in each folder's index.

## Getting started

1. **If you have an older `seiskolar` folder, delete it.** Its remote now points at this
   repository, which has a different history.
2. Clone this one: `git clone https://github.com/dreeyanzz/seiskolar.git`
3. Open your AI tool in the folder and say **"Read AGENTS.md and set up my machine."**
4. Then say **"Start my task."** Your agent finds your task, builds it, and stops for you
   to check it before anything is submitted.

## How work moves

- Every item is a task issue, assigned to its owner. Why: each member, and their agent,
  finds their own work with `gh issue list --assignee @me`, and the issue says what the
  work is built from and when it is done.
- Every change is a pull request to `main` with one approval: Adrian approves everyone's,
  and a teammate approves his. Only Adrian merges. Why: a second reader catches mistakes
  before they reach the design the team submits; [`.github/rulesets/`](.github/rulesets/)
  shows how GitHub enforces it.
- `npm run render` turns each drawing into its PNGs: a screen into one per device and
  state. Why: the pictures show on GitHub, so anyone can review a drawing without opening
  a browser.
- [`AGENTS.md`](AGENTS.md) has the rules every member and every AI tool follows. Why:
  this repository is worked on mostly through AI agents, and they read that file first.
