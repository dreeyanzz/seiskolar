# Rulesets on `main`

The two JSON files here describe the rulesets that protect `main` on GitHub, in the form
GitHub's API takes. They are kept in the repository so that anyone, person or agent, can
read the rules without admin access to its settings. JSON cannot hold comments, so this
README explains them.

**Editing a file here changes nothing on GitHub.** The rulesets in force are in the
repository's settings, under Rules, and only Adrian changes them. Agents never change
them (AGENTS.md, "If you are an AI agent"). If they change on GitHub, the file here is
updated in a pull request so the two agree.

## [`main-core-integrity.json`](main-core-integrity.json): "main: core integrity"

- Nobody may delete `main`, and nobody may force-push to it. Nobody can bypass this rule,
  not even an admin.
- Why: `main` holds the submitted design, and its history is the record of who did what.
  It must never be rewritten or lost.

## [`main-pull-requests.json`](main-pull-requests.json): "main: pull requests, one approval, checks"

- No one pushes to `main` directly. Every change arrives as a pull request.
- A pull request needs one approval, and every review conversation resolved. A new push
  to it dismisses an earlier approval, so what is approved is what merges.
- The `checks` and `pr-title` workflows must pass (`.github/workflows/`).
- Pull requests merge by squashing only, so each one becomes a single commit on `main`,
  with the pull request's title and body as its message.
- Repository admins may bypass the rule (`bypass_mode: always`), which lets an admin
  merge a pull request that no one else can approve.
- Why: a second reader catches mistakes before they reach the submitted design, the
  checks keep its format and pictures complete, and squashing keeps `main` one readable
  commit per change. AGENTS.md, "Git and pull requests", says the same for people.
