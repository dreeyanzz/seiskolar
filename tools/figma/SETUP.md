# Setting up the Figma bridge: the agent's runbook

> Moved here from the archive's `tools/figma-bridge/SETUP.md` on 26 October 2026, and
> changed for this repository: the bridge lives in `tools/figma/`, and the team file is now
> [SEIskolar – current design (Asph)](https://www.figma.com/design/fsEKjSfF5mPRh5NIwwuign),
> which the import fills (README.md, "Copying the design into Figma").

**This document is written for you, the AI agent.** A member of team Asph has
asked you to set up Figma on their machine, or to do something in Figma that
needs the bridge. They should not have to read anything. You run the checks, you
do every step you can do yourself, and for the few steps only a person can do,
you tell them exactly what to click, one step at a time, and confirm it worked
before moving on.

Read [`README.md`](README.md) in this folder for what the bridge is and how you
use it once it works. Read [ADR 0016 in the archive](https://github.com/dreeyanzz/seiskolar-archive/blob/23cfa313d6a4f25e0d74be4423b557c8bb56e3bf/docs/adr/0016-agents-reach-figma-through-our-own-plugin.md)
for why it exists. This file is only about getting a machine from nothing to
working, and keeping it working.

---

## 1. When to use this runbook

Start it, without being asked twice, when:

- A member asks you to set up Figma, the Figma bridge, the Figma plugin, or "the
  thing that lets you edit Figma", in any wording.
- A member gives you a task that needs Figma: import the design, check a frame
  against its PNG, label the earlier file, anything in [`README.md`](README.md).
  Run `doctor` first; if it does not say `"ready": true`, set it up before you
  start the task.
- A bridge command fails with "No Figma file has the SEIskolar Bridge plugin
  running", "wrong token", or a timeout. Run `doctor` and follow its `nextStep`.

**Be proactive.** Do not answer "I can't access Figma" or reach for the Figma MCP.
The Figma MCP is not how this team reaches Figma: on our Starter plan it stops
after about fifteen calls. If the bridge is not ready, say so in one sentence and
offer to set it up: _"The Figma bridge isn't connected on this machine yet. It
takes about three minutes and you'll only need to click a few things in Figma.
Want me to walk you through it?"_ Then do it.

## 2. Ground rules

1. **You do the work; the person clicks.** Run every command yourself. Ask the
   person only for what you cannot do: installing Figma desktop, signing in,
   clicking inside Figma, pasting the token into the plugin window.
2. **One step at a time.** Give one instruction, wait for the person to say it is
   done, verify it with `doctor` or `status`, then give the next. A wall of ten
   instructions gets skipped halfway.
3. **Plain words.** The person may never have used a development plugin. Say "the
   small window called SEIskolar Bridge", not "the plugin UI iframe". Name menus
   exactly as Figma shows them.
4. **Never show the token in the chat.** Use `npm run -s figma -- token --copy`,
   which puts it on the clipboard and prints nothing secret. Do not run `token`
   without `--copy` in a chat; do not read the token file out loud. If someone
   pastes the token into the chat anyway, finish the setup, then offer to rotate
   it (§7).
5. **Do not download or install software for them.** Point them to Figma's own
   download page; they run the installer. Do not install anything with `npm`,
   `brew`, `winget` or similar for this; the bridge needs nothing but Node.
6. **Verify, then claim** (AGENTS.md, "Look at it"). The setup is done when `doctor`
   reports `"ready": true` **and** you have read something real from the team
   file and looked at a screenshot of it. Not before.
7. **Do not change the team file to test.** Every test in this runbook only
   reads. People are working in that file.

## 3. The two commands that drive setup

Run them from the repository root.

```bash
npm run -s figma -- doctor
```

`doctor` checks every step of the setup in order, starts the bridge server if it
is not running, and prints a JSON report:

```json
{
  "ready": false,
  "nextStep": "Tell the person: open the team file (...) in Figma desktop. ...",
  "manifest": "C:\\...\\seiskolar\\tools\\figma\\plugin\\manifest.json",
  "teamFile": "https://www.figma.com/design/fsEKjSfF5mPRh5NIwwuign",
  "checks": [
    { "id": "node", "ok": true, "detail": "Node 24.11.0" },
    { "id": "token", "ok": true, "detail": "Token file: ..." },
    { "id": "server", "ok": true, "detail": "Listening at http://127.0.0.1:4517" },
    { "id": "figma-desktop", "ok": true, "detail": "Installed at ..." },
    {
      "id": "plugin",
      "ok": false,
      "detail": "No Figma file has the SEIskolar Bridge plugin open",
      "fix": "Tell the person: ..."
    }
  ]
}
```

- `ready` is `true` only when every check passed and Figma answered a round trip.
- `nextStep` is the `fix` of the first failing check: what you do, and what you
  tell the person. Follow it, then run `doctor` again. Repeat until `ready`.
- `ok` is `true`, `false`, or `null` (could not tell; not a blocker on its own).
- `manifest` is the absolute path to give the person when they import the plugin.
- The exit code is `0` when ready and `1` when not, so a non-zero exit here is a
  report, not a crash. The JSON is on stdout either way.

```bash
npm run -s figma -- token --copy
```

Puts the token on the person's clipboard and prints `{ "ok": true, "copied": true
}`. On Windows it uses `clip`, on macOS `pbcopy`, on Linux `wl-copy`, `xclip` or
`xsel`. If none exists it fails with a hint: ask the person to run
`npm run -s figma -- token` in their own terminal and copy it from there.

The checks, in the order `doctor` runs them:

| `id`            | What it proves                                                       | Who fixes it                                             |
| --------------- | -------------------------------------------------------------------- | -------------------------------------------------------- |
| `node`          | Node 20 or later runs the bridge                                     | The person installs Node; you run `nvm use`              |
| `token`         | The token file exists (doctor creates it on first run)               | Nobody; it always passes                                 |
| `server`        | The bridge server is listening on `127.0.0.1:4517`                   | You: read the log                                        |
| `figma-desktop` | Figma desktop is installed (or is already running the plugin)        | The person installs it                                   |
| `plugin`        | The SEIskolar Bridge plugin is open in some file and holds the token | The person imports and runs it; you copy the token       |
| `team-file`     | One of those files is the team file (its name says "current design") | The person opens the team file and runs the plugin there |
| `round-trip`    | Figma actually answered a command                                    | The person reopens the plugin window                     |

`team-file` and `round-trip` only appear once the step before them passes.

## 4. The setup, step by step

Before step 1, tell the person what is about to happen, briefly:

> I'll set up the Figma bridge so I can read and edit our Figma file directly.
> I'll run the checks; you'll need to do about four things in Figma desktop. It
> takes a few minutes.

### Step 1 — Run `doctor` and read it

```bash
npm run -s figma -- doctor
```

If `ready` is already `true`, skip to [§5](#5-verify-and-report). Otherwise go to
the step for the first failing check. If `doctor` cannot run at all (Node missing,
wrong directory), start at step 2.

### Step 2 — The repository and Node

**You do:**

```bash
git remote -v          # should show dreeyanzz/seiskolar
node --version         # v24 or later
git branch --show-current
```

- Not in the repository: find the clone, or ask the person where it is. Do not
  clone a fresh copy without asking.
- Node older than 24 (this repository needs 24, AGENTS.md; the bridge alone
  would run on 20): `nvm install && nvm use` (the version is in `.nvmrc`). If
  `nvm` is missing, tell the person to install Node 24 from nodejs.org and stop
  here until they have.
- `npm install` is not needed for the bridge (it uses Node's built-ins only), but
  run it if the repository has never been set up: it installs the formatter and
  the hooks every member needs (AGENTS.md, "Setting up a machine").
- **The bridge files must exist.** If `tools/figma/` is missing, the person's
  clone is out of date, or the bridge has not been merged yet. Run `git fetch`
  and check `main`; if it is only on a pull request's branch,
  tell the person and ask before switching branches.

### Step 3 — Figma desktop

`doctor` reports `figma-desktop`. Figma's browser version **cannot** run
development plugins, so the desktop app is required.

**If it is not installed, tell the person:**

> Please install Figma desktop from https://www.figma.com/downloads/ and open it.
> Sign in with the Figma account that has access to our team file. Tell me when
> you're signed in.

**Also confirm they can edit the team file.** Plugins that change a file need
edit access. Ask:

> Open this link in Figma desktop: https://www.figma.com/design/fsEKjSfF5mPRh5NIwwuign
> Does it open, and can you select and move things? (Don't move anything. Just
> check that you could.)

If the file does not open or is view-only, Adrian has to invite them with edit
access. That is a stop: tell them to ask Adrian, and pause the setup.

Notes:

- On Windows, `doctor` looks for `%LOCALAPPDATA%\Figma\Figma.exe`; on macOS, for
  `/Applications/Figma.app`. An unusual install location shows `ok: false` even
  though Figma is there. If the person says Figma desktop is installed, believe
  them and carry on; the `plugin` check is the real proof.
- On Linux, `figma-desktop` is `null`: Figma has no official desktop app there.
  Tell the person the bridge needs a Windows or macOS machine for Figma work.

### Step 4 — Import the plugin (once per computer)

The plugin is not published; each computer imports it from the repository once.
Get the absolute path from the `manifest` field of the `doctor` report, then tell
the person, with that path filled in:

> In Figma desktop, with any design file open (our team file is fine):
>
> 1. Open the main menu: click the Figma logo at the top left.
> 2. Go to **Plugins → Development → Import plugin from manifest…**
> 3. In the file picker, choose this file:
>    `C:\...\seiskolar\tools\figma\plugin\manifest.json`
>
> Tip: you can paste that path into the file picker's address or file-name box.
> Tell me when it's imported.

If they cannot find the menu, offer the other routes:

- **Quick actions:** press **Ctrl + /** (Windows) or **⌘ + /** (macOS), type
  `Import plugin from manifest`, press Enter.
- **Right-click** an empty spot on the canvas → **Plugins → Development →
  Import plugin from manifest…**

If Figma refuses the manifest, ask for the exact message. The usual causes are a
path to the wrong file (it must be `manifest.json` inside `plugin/`) or a clone
whose `plugin/` folder is incomplete (`git status` will show it).

Importing is remembered by Figma desktop on that computer. They will not do it
again unless they reinstall Figma, remove the plugin, or move the repository
folder (the import remembers the path; if the folder moves, import again).

### Step 5 — Open the team file and run the plugin

Tell the person:

> Now open our team file in Figma desktop:
> https://www.figma.com/design/fsEKjSfF5mPRh5NIwwuign
>
> Then run the plugin: main menu → **Plugins → Development → SEIskolar Bridge**.
> A small window called **SEIskolar Bridge** opens. Leave it open. It will say it
> needs a token; that's the next step.

Other routes to run it: Quick actions (**Ctrl + /** or **⌘ + /**) and type
`SEIskolar Bridge`; or, after the first time, **Run last plugin** with
**Ctrl + Alt + P** (Windows) or **⌥ + ⌘ + P** (macOS).

### Step 6 — Hand over the token

**You do:**

```bash
npm run -s figma -- token --copy
```

**Then tell the person:**

> I've copied the bridge token to your clipboard. In the SEIskolar Bridge window,
> click the box that says "Paste the bridge token", paste (Ctrl + V or ⌘ + V), and
> press **Save**.

Figma stores the token on that computer, so this is once per machine, not once
per session. The window should switch to **"Connected. Agents can read and edit
this file."** within a couple of seconds.

If the person already pasted it and the window says **"The bridge refused this
token"**, run `token --copy` again and have them paste and Save again. Something
else was on the clipboard, or the token changed.

### Step 7 — Run `doctor` again

```bash
npm run -s figma -- doctor
```

Repeat "follow `nextStep`, run `doctor`" until `"ready": true`. Then verify.

## 5. Verify and report

`ready` means the pipe works. Now prove it on the real file, without changing it:

```bash
npm run -s figma -- tree --depth 3
npm run -s figma -- screenshot <a frame id from the tree> --scale 1
```

- `tree` shows the pages. Before the first import the file has one empty page,
  `Page 1`, and there is nothing to screenshot: say so, and the setup is done.
  After it, the pages are `00 Read me`, `02 Swimlanes`, `03 Low-fidelity` and
  `04 High-fidelity` (README.md, "What the import makes"). If they differ,
  mention it; do not fix it now.
- `screenshot` writes `tools/figma/.out/<id>.png`. **Open the image and look at
  it** beside the PNG with the frame's name (for a frame `01-sign-in`,
  `02-swimlanes/01-sign-in.png`). They should differ only in the font.

Then report to the person, briefly, in this shape:

> The Figma bridge is set up. I read the team file and (if it had frames) exported
> one to check it. From now on, whenever you want me to work in Figma:
> open the team file in Figma desktop and run **SEIskolar Bridge** (Ctrl + Alt + P
> reruns it). Keep its window open while I work; every command I run shows up
> in it.

If anything was skipped or failed, say so plainly instead.

## 6. Every session after setup

Setup happens once. Each working session needs only:

1. The person opens the team file in Figma desktop.
2. The person runs **SEIskolar Bridge** and leaves the window open.
3. You run `npm run -s figma -- doctor` (or `status`) before your first Figma
   command. If it is not ready, give the one instruction `nextStep` names.

The server starts itself on your first command and keeps running in the
background; the plugin reconnects to it on its own within two seconds, including
after a restart. You never need to ask the person to start the server.

**Tell the person when you are done**, so they can close the plugin window. An
open plugin window means any agent on that computer can edit the file.

## 7. Maintenance

**Rotate the token** (after it was shown in a chat or a screen share, or if in
doubt):

```bash
npm run -s figma -- stop
```

Then delete the token file (`doctor` prints its path; it is
`~/.seiskolar-figma-bridge/token`), run `npm run -s figma -- doctor` to create a
new one, run `token --copy`, and have the person paste it into the plugin window
and Save.

**After the bridge code changes** (a pull request touched `tools/figma/`):

- Server or CLI changed: `npm run -s figma -- stop`; the next command starts the
  new version.
- Plugin changed (`plugin/`): tell the person to close the SEIskolar Bridge
  window and run it again. No re-import is needed unless `manifest.json` changed
  in a way Figma rejects; then import again (step 4).

**Remove the bridge from a computer:**

1. Stop the server: `npm run -s figma -- stop`.
2. The person removes the plugin: main menu → **Plugins → Development → Manage
   plugins in development**, then remove SEIskolar Bridge.
3. Delete `~/.seiskolar-figma-bridge/` (the token and the log). Ask before
   deleting; it is outside the repository.

## 8. Troubleshooting

Start with `doctor`; its `nextStep` covers the common cases. For the rest:

| What you see                                                    | What it means                                             | What to do                                                                                                                                                                                                                              |
| --------------------------------------------------------------- | --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| The plugin window says **"Paste the bridge token to connect."** | No token saved in Figma on this computer                  | Step 6                                                                                                                                                                                                                                  |
| The plugin window says **"The bridge refused this token."**     | The saved token is not the one in the token file          | Step 6 again                                                                                                                                                                                                                            |
| The plugin window says **"Bridge not running."**                | No server yet                                             | Run any command (`doctor`); the window reconnects within 2 seconds                                                                                                                                                                      |
| **Plugins → Development** has no **SEIskolar Bridge**           | Not imported on this computer, or removed                 | Step 4                                                                                                                                                                                                                                  |
| **Plugins** menu is greyed out, or the plugin will not run      | Probably view-only access to the file                     | Check edit access (step 3); if it is view-only, Adrian has to invite them as an editor                                                                                                                                                  |
| `More than one Figma file has the plugin open`                  | The plugin runs in two files                              | Add `--file SEIskolar` to your commands, or ask the person to close the other window                                                                                                                                                    |
| `Figma did not answer within 60s`                               | The window was closed, Figma is busy, or a script stalled | **Do not just rerun it**: the script may still finish. Read the state back first (README, "What we learned the hard way"). If even a read times out, ask the person to bring Figma to the front, then close and rerun the plugin window |
| `Port 4517 is taken` in `~/.seiskolar-figma-bridge/bridge.log`  | Another program, or an old bridge, holds the port         | `npm run -s figma -- stop`. If still taken, find the program (`netstat -ano \| findstr 4517` on Windows, `lsof -i :4517` on macOS) and ask first                                                                                        |
| `Could not start the bridge server`                             | The server crashed on start                               | Read `~/.seiskolar-figma-bridge/bridge.log`                                                                                                                                                                                             |
| `figma-desktop: false` but Figma is installed                   | Installed somewhere `doctor` does not look                | Carry on; the `plugin` check is what matters                                                                                                                                                                                            |
| `No node with id …`                                             | The id is wrong, or the node was deleted                  | `tree` to find the current id; the frame may have been redrawn                                                                                                                                                                          |
| An error from inside `run`                                      | Your script failed in Figma                               | Read `error` and `logs`. Common: a font not loaded, a sync API used where the async one is required (README, "Writing with `run`")                                                                                                      |
| Something odd in the plugin itself                              | A bug in `code.js` or `ui.html`                           | Ask the person to open **Plugins → Development → Show/Hide console** in Figma and read you the red lines                                                                                                                                |

If you hit something this table does not cover and it took real effort to solve,
add a row here in the same pull request as whatever you were doing, so the next
agent does not have to solve it again (AGENTS.md, "Write everything in full").
