# SEIskolar: guide for AI agents and the people using them

**Read this file first, every session.** It is self-contained, so you can paste it into
a chat tool that cannot see the repository.

## What this repository is

The software design of **SEIskolar**, a system for DOST-SEI undergraduate scholars, made
for the Software Design course at Cebu Institute of Technology – University by team
**Asph**. It holds four deliverables, and each is built only from the one before it:

1. [`01-srs/SRS.md`](01-srs/SRS.md): the Software Requirements Specification, the
   baseline.
2. [`02-swimlanes/`](02-swimlanes/): one swimlane per workflow, built from the SRS.
3. [`03-low-fidelity/`](03-low-fidelity/): one wireframe per screen, built from the
   swimlanes.
4. [`04-high-fidelity/`](04-high-fidelity/): the finished, clickable screens, built from
   the wireframes.

Nothing else belongs here.

## There is no code here

- **Nothing is implemented, and nothing will be.** There is no app, database, API or
  test suite in this repository. Do not look for one, and do not write one.
- **The drawings are HTML on purpose.** Each swimlane, wireframe and screen is an HTML
  file with its PNG pictures beside it: one for a swimlane, and one for each device and
  state of a screen (phone, tablet and desktop). The HTML, and the small shared files that style and lay it
  out (such as `02-swimlanes/_swimlane.js`), make a picture you can open in a browser,
  not the product. The only other code is `scripts/render.mjs`, which takes the pictures.
- **The SRS names things that are not here.** It was written against an earlier
  prototype, so it mentions database functions such as `app.my_scholar_id()`,
  migrations, file paths, test files, ADRs and design documents. None of them exist in
  this repository, and its links to them open the archived repository,
  `dreeyanzz/seiskolar-archive`. Draw what each requirement says, not how the
  prototype did it.

## Read order

1. This file.
2. [`README.md`](README.md): the team, and where each deliverable stands.
3. The README of the folder your task is in: its rules and its index.
4. The SRS sections your task cites, and the item your task is built from.
5. Your task's issue.

## The rules of the chain

- **A swimlane covers SRS requirements,** and names them (`FR-SCH-001` …). Its lanes are
  the people the SRS names. Every step has a number (`S02.3`), so wireframes can cite it.
- **A wireframe serves swimlane steps,** and its row in the index names them.
- **A high-fidelity screen has the same file name as its wireframe,** and shows the same
  content, finished.
- **Start only from something that is done.** If the item your task is built from is not
  marked done in its folder's index, stop and say so.
- **Draw only what the source says.** If you must fill a gap, label it "assumed" in the
  drawing and list it in the pull request. If the gap changes the design, open a
  Question issue instead of guessing.
- **Invented people only:** invented names, `@example.test` addresses, and scholar
  numbers that are plainly fake. Never a real scholar, and never a teammate's name on a
  persona.

## Words to use

Use the SRS's words in every label:

- **Scholar**, **School Coordinator** (a university employee), **DOST Regional Office**
  (whose staff the SRS also calls the checker), **DOST Central Office**, and **System
  administrator**. A "coordinator" is always the school's.
- **Cleared** means every mandatory document for the term is verified. It is not
  **released**, which is Central Office releasing the money.
- A **release batch** is the Regional Office's list of cleared scholars. It is not the
  **award batch**, the year a scholar was awarded.
- Submission states are `not_started`, `submitted`, `under_review`, `verified` and
  `returned`, and the return reasons are the eight in FR-CHK-004.

## Doing a task

When your human says **"Start my task"** or **"Continue my task"**, do this, and stop
only at the 🛑 points:

1. **Find it.** `git switch main && git pull`, then
   `gh issue list --assignee @me --state open`. Take the lowest-numbered task whose
   "Waits for" is done.
2. **Read** the issue, the SRS sections it cites, and the item it is built from. 🛑 If
   that item is not done, tell your human what it waits for and who owns it.
3. **Branch** from a fresh `main`: `<scope>/short-desc`, for example
   `swimlanes/report-filing`.
4. **Build it**, following the folder README. Touch only the files the task names.
5. **Look at it.** Run `npm run render -- <file>`, open every PNG it makes, and compare it with its
   source. Fix and repeat until they agree. Then set its row in the folder's index to
   done.
6. **Explain it.** 🛑 Walk your human through it: what each part shows, which line of the
   source it comes from, and what you assumed. They present this work, so they must be
   able to explain all of it. Wait for their go-ahead.
7. **Open the pull request** from the template, with `Closes #<task>` on the first line
   and the AI assistance section filled in. Ask Adrian to review it; on Adrian's own
   pull requests, ask a teammate. 🛑 Stop until it merges, or your human gives you the
   next task.

**Stop and ask** (your human asks Adrian) when the task or its source is unclear, when
the work would change someone else's files or the SRS, or when the same step has failed
twice.

## Reviewing a pull request

When your human says **"Review PR #N"**:

1. Read the pull request, its task, the SRS sections it cites, and the item it is built
   from. Check out the branch and open every PNG.
2. Check it against the folder README's rules and "The rules of the chain" above.
3. Post the review as a comment: the verdict, what you checked it against, then each
   finding, most serious first, marked **blocking**, **should fix** or **nit**. End
   with `_Review written with <tool>, on <person>'s instruction._`
4. 🛑 **Approve only when your human tells you to**, for that pull request, after they
   have read your review, and never a pull request you opened. Never merge.

## Git and pull requests

- **`main` is protected.** Every change is a pull request that needs one approval:
  Adrian approves teammates' pull requests, and a teammate approves Adrian's. Only
  Adrian merges, and merges are squashed.
- **Branches** are `<scope>/short-desc`, in lowercase words joined by hyphens.
- **Commits and pull request titles** are `type(scope): summary`, with the summary in
  lowercase, for example `feat(swimlanes): add the filing workflow`.
  - Types: `feat` for a new item, `fix` for a correction, `docs` for README text,
    `chore` for configuration, and `style refactor perf test build ci revert`.
  - Scopes: `srs`, `swimlanes`, `low-fi`, `hi-fi`, `repo`.
  - The commit-msg hook checks commits. The `pr-title` check checks the title, the
    branch and the body, because they become the commit on `main`.
- **One concern per pull request,** and every pull request targets `main`. Never base one
  on another pull request's branch: squash merges break it. To catch up, run
  `git merge origin/main` on your branch.
- **The SRS changes only when Adrian says so,** in its own pull request, with a new row
  in its revision history.

## If you are an AI agent

**You may** create branches, commit, push your branch, open pull requests, request
reviews, comment on issues and pull requests, and review pull requests.

**You may never:**

- merge a pull request;
- approve one without your human's instruction for that pull request, or approve one you
  opened;
- push to `main`, or force-push;
- change repository settings or rulesets;
- close an issue unless asked;
- edit the SRS unless your task says to.

If a task seems to need one of these, that is the signal to stop and ask.
`.claude/settings.json` blocks the main commands for Claude Code, but these rules apply
to every tool.

## Setting up a machine

When your human says **"Read AGENTS.md and set up my machine"**, run these in order and
check each result before the next. Stop and ask whenever only a person can do
something, and commit nothing.

1. **An old copy.** If there is an older `seiskolar` folder from before 7 October 2026,
   tell your human to delete it. Its remote now points at this repository, which has a
   different history; the old work is in `dreeyanzz/seiskolar-archive`.
2. **The repository.** `git remote get-url origin` is
   `https://github.com/dreeyanzz/seiskolar.git`.
3. **Who commits.** `git config user.name` and `git config user.email` show your human's
   name and an email verified on their GitHub account
   (<https://github.com/settings/emails>). If not, ask for the right values and set them
   for this repository. Work committed under another identity is not credited to them.
4. **Node 24 or newer.** `node --version`. If it is older or missing, stop and ask
   before installing anything.
5. **Install.** `npm install`. It installs Prettier, the git hooks and the renderer.
6. **Hooks.** `git config core.hooksPath` prints `.husky/_`.
7. **GitHub.** `gh auth status` shows your human signed in. If not, they run
   `gh auth login` themselves.
8. **A browser for pictures.** Microsoft Edge or Google Chrome is installed.
9. **Report back:** what passed, what did not and why, and anything you changed. Then
   tell your human what a wireframe must cite (the swimlane steps it serves), to show
   you read this file.

## Windows: writing commit and pull request text

- Windows PowerShell 5.1 writes files with a byte-order mark (BOM). Never write a commit
  message or pull request body with `Out-File`, `>` or `Set-Content`. Use
  `git commit -m`, a Git Bash heredoc with a quoted delimiter (`<<'EOF'`), or
  `--body-file` with a UTF-8 file that has no BOM.
- Shells rewrite text inside double quotes. In PowerShell the backtick is an escape
  character, in Git Bash backticks run commands, and in both `$word` becomes a variable.
  Pass Markdown in single quotes, a quoted heredoc, or a file.

## AI credit

The person who opens a pull request owns it and must be able to explain every part of
it. Say in its "AI assistance" section which tool helped and with what, and keep the
tool's credit line in the body (for Claude, `Co-Authored-By: Claude <noreply@anthropic.com>`).
Agents add the same line to the commits they write.
