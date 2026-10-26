# Figma: the current design, copied into Figma

The course needs the design in Figma, as editable layers (Adrian, 26 October 2026). This
folder copies every drawing in this repository into the team's Figma file, and keeps the
earlier Figma file from being mistaken for the current design. **The repository stays the
source of the design.** Figma holds a copy, drawn from it by these tools.

|                         |                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **The current file**    | [SEIskolar – current design (Asph)](https://www.figma.com/design/fsEKjSfF5mPRh5NIwwuign), file key `fsEKjSfF5mPRh5NIwwuign`, in Adrian's Figma team. Made on 26 October 2026 for this copy; empty until the first import                                                                                                                                                                                                  |
| **The earlier file**    | [Asph – SEIskolar](https://www.figma.com/design/0tCTLK1lFT2aJu62UBiUE3/Asph---SEIskolar), file key `0tCTLK1lFT2aJu62UBiUE3`: the first drawings, from 25 September to 5 October 2026 (WBS 4.2 and 4.3). Mapped in the archive's [`docs/FIGMA.md`](https://github.com/dreeyanzz/seiskolar-archive/blob/23cfa313d6a4f25e0d74be4423b557c8bb56e3bf/docs/FIGMA.md). Kept, and labelled as earlier by `label-earlier-design.js` |
| **Access**              | Adrian invites members to the current file with edit access. Keep it private: it holds the whole design                                                                                                                                                                                                                                                                                                                   |
| **How agents reach it** | Through the bridge in this folder, a Figma plugin of the team's own, not through the Figma MCP: on the team's Starter plan the MCP stopped after about fifteen calls on 25 September 2026 (the archive's ADR 0016)                                                                                                                                                                                                        |

## Why it works this way

- **Copied, not redrawn.** 29 screens, in 42 states, on three devices, at two fidelities,
  and 10 swimlanes make 262 frames. Drawing them again by hand would take weeks and would
  drift from the repository at once (risk T2 in
  [`05-risk-matrix-and-gantt`](../../05-risk-matrix-and-gantt/RISK-MATRIX-AND-GANTT.md)).
  So `export.mjs` reads each drawing out of the browser, and `build.js` draws it in Figma.
- **Editable, not pictures.** Text is Figma text, boxes are frames with their fills,
  borders, corners and shadows, icons and arrows are vectors. Only what Figma cannot draw
  as a layer is a picture inside its layer: a background image or gradient (the lined
  placeholders in the wireframes, the arrow on a select), and checkboxes and radio
  buttons.
- **Inter, not the system font.** The drawings ask for Segoe UI, which Figma has only on
  a Windows computer that has it installed. Inter and Roboto Mono are built into Figma, so
  the file looks the same to every member and to the course. The page is measured in
  Inter before it is copied, so every line breaks in Figma where it breaks in the export.
  The frames therefore differ from the PNGs in the font, and in nothing else.
- **Positioned, not auto layout; no components yet.** The layers sit where the browser put
  them. Turning repeated parts of the high-fidelity screens (buttons, badges, cards, the
  navigation) into components is done by hand in Figma afterwards, as its own task.
- **A ring drawn with a shadow's spread clips its box.** The drawings make rings with a
  CSS `box-shadow` spread: the white ring inside a ticked box or radio in the wireframes,
  the halo around a swimlane's final step, the rings around the "now" dot. Figma draws a
  spread only on a frame that clips its content and has a visible fill (Plugin API, type
  `Effect`), and the first import (26 October 2026) drew them without it. So `build.js`
  clips a box with a spread when everything it holds lies inside it; when something
  reaches outside, as the "assumed" tag over a final step's corner, it draws the ring as
  a shape behind the box instead. It also stacks several shadows the other way round,
  because CSS paints the first on top and Figma the last. `--dry-run` refuses a spread
  that Figma would silently leave out.
- **One frame per PNG, with the PNG's name.** Frame `scholar-requirement--returned.phone`
  is `04-high-fidelity/scholar-requirement--returned.phone.png`. So anyone can go from a
  frame to its drawing, its wireframe, its swimlane steps and its SRS requirements.

## What the import makes

| Page               | What it holds                                                                                                                                                       |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `00 Read me`       | One frame saying what the file is, which commit it was drawn from, and that the repository is the source                                                            |
| `02 Swimlanes`     | One section per swimlane, `01-sign-in.html` to `10-look-up-who-did-what.html`, each with its one frame                                                              |
| `03 Low-fidelity`  | One section per wireframe, in the order of [`03-low-fidelity/README.md`](../../03-low-fidelity/README.md): a row per state, phone, tablet and desktop left to right |
| `04 High-fidelity` | The same for the finished screens, in the order of [`04-high-fidelity/README.md`](../../04-high-fidelity/README.md)                                                 |

A section is named after its HTML file. Each frame also carries its source file, state
and device as shared plugin data (namespace `seiskolar`), for any script that needs them.
A new Figma file starts with an empty `Page 1`; delete it after the first import.

## Copying the design into Figma

Do this on a Windows or macOS computer with Figma desktop: the bridge needs the desktop
app (Figma has none for Linux). Run from the repository root.

1. **Export.** `npm run figma:export` opens every drawing in Edge or Chrome, as
   `npm run render` does, and writes its layer tree to `tools/figma/.out/export/`. About
   six minutes for all 262 views. The first run needs the internet: Inter and Roboto Mono
   come from Google Fonts unless they are installed. To export only some drawings, name
   them: `npm run figma:export -- 04-high-fidelity/sign-in.html`.
2. **Check the export.** `npm run figma:preview -- <frame>…` draws the trees back in the
   browser, by the rules `build.js` follows, into `tools/figma/.out/preview/`. Open a few
   beside their PNGs. Then `npm run figma:import -- --dry-run` runs `build.js` for every
   view against [`mock-figma.mjs`](mock-figma.mjs), a stand-in for Figma that refuses what
   Figma would refuse. Both need no Figma.
3. **Connect the bridge.** `npm run -s figma -- doctor` until it says `"ready": true`
   ([`SETUP.md`](SETUP.md), once per computer, a few minutes).
4. **Import.** `npm run figma:import`. One run of `build.js` per frame, so one Ctrl+Z in
   Figma takes back one frame. A frame already in the file is left alone; `--replace`
   redraws it. `--only` takes folders, drawings or frame names (`--only 02-swimlanes`,
   `--only sign-in,no-access`). If it stops, read the frame back before going on
   (["What we learned the hard way"](#what-we-learned-the-hard-way-2026-10-05)), then
   `--from <frame>`.
5. **Look.** For each section, `npm run -s figma -- tree <section id> --depth 1` and
   `npm run -s figma -- screenshot <frame id>`, then open the picture beside the PNG. Fix
   the exporter or the builder, not the frame, when they differ, so the next import is
   right too.
6. **Label the earlier file,** once: open only the earlier file, run SEIskolar Bridge in
   it, and `npm run -s figma -- run tools/figma/label-earlier-design.js --file Asph`. It
   puts a banner above each page saying the design was redrawn, and where the current one
   is. Running it again replaces the banners.

### When a drawing changes

Change the HTML first, in a pull request, as always. After it merges, export that drawing
and import it with `--replace --only <drawing>`. Redrawing a frame throws away whatever was
done to it in Figma, including components; so once component work starts on the
high-fidelity page, re-import only the drawings that changed, and redo their components.
A frame changed only in Figma disagrees with the repository the course reviews.

## The files

| File                                                                                                                           | What it does                                                                                                                       |
| ------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| [`export.mjs`](export.mjs)                                                                                                     | Opens each drawing per device and state, sets it in Inter, turns `::before` and `::after` into elements, and writes its layer tree |
| [`preview.mjs`](preview.mjs)                                                                                                   | Draws exported trees back in the browser, to check an export without Figma                                                         |
| [`build.js`](build.js)                                                                                                         | Runs inside Figma through the bridge: draws one exported view as a frame, in its page and section                                  |
| [`import.mjs`](import.mjs)                                                                                                     | Lays out the pages and sections, and sends each view to `build.js` through the bridge, or to the stand-in with `--dry-run`         |
| [`mock-figma.mjs`](mock-figma.mjs)                                                                                             | The stand-in for Figma's Plugin API that `--dry-run` uses                                                                          |
| [`label-earlier-design.js`](label-earlier-design.js)                                                                           | Runs inside Figma: labels the earlier file's pages as the earlier design                                                           |
| [`cli.mjs`](cli.mjs), [`client.mjs`](client.mjs), [`server.mjs`](server.mjs), [`shared.mjs`](shared.mjs), [`plugin/`](plugin/) | The bridge, below                                                                                                                  |

Everything they write goes to `tools/figma/.out/`, which git ignores.

## The bridge

How an agent reads and edits the Figma file without the Figma MCP. It goes through
Figma's Plugin API, which has no call limit. It was built in the archive on 5 October 2026
([`tools/figma-bridge/`](https://github.com/dreeyanzz/seiskolar-archive/tree/23cfa313d6a4f25e0d74be4423b557c8bb56e3bf/tools/figma-bridge),
ADR 0016) and moved here on 26 October 2026, pointed at the current file, with its HTTP
client split out into `client.mjs` so `import.mjs` can send frames too large for a command
line.

```
 agent ──shell──> cli.mjs ──HTTP──> server.mjs <──long-poll── plugin (ui.html ⇄ code.js)
 import.mjs ─────────────────┘      127.0.0.1:4517            inside Figma desktop
```

- **`plugin/`** is a Figma development plugin, **SEIskolar Bridge**. `code.js` holds the
  Figma API; `ui.html` holds the network. Nobody publishes it; each person imports it once.
- **`server.mjs`** is a relay on your computer. It hands an agent's command to the plugin
  and the plugin's answer back. Loopback only, token required.
- **`cli.mjs`** is what agents call. It starts the server if it is not running.

Node built-ins only: `npm install` adds nothing for the bridge.

### Every session

Open the current file in Figma desktop, run **SEIskolar Bridge** (main menu → Plugins →
Development, or Ctrl + Alt + P / ⌥ + ⌘ + P to rerun it), and **leave its window open**. It
says "Connected" once an agent has started the server. Closing it, or the file, disconnects
the agent. Every command shows in that window as it runs.

### Commands

Output is JSON on stdout; a failure is JSON on stderr and exit code 1. Use `npm run -s`
(silent), or `node tools/figma/cli.mjs`, so npm's banner does not get mixed into the JSON.

```bash
npm run -s figma -- doctor                   # is everything set up? if not, what next (SETUP.md)
npm run -s figma -- status                   # which files have the plugin open
npm run -s figma -- tree                     # pages and their top-level frames
npm run -s figma -- tree 12:34 --depth 4     # one node, four levels down
npm run -s figma -- node 12:34               # every property of one node
npm run -s figma -- selection                # what the person has selected
npm run -s figma -- screenshot 12:34         # writes tools/figma/.out/12-34.png
npm run -s figma -- run script.js            # run JavaScript inside Figma
npm run -s figma -- run --code 'return figma.currentPage.name'
```

Node ids can be written `12:34` or `12-34`, as a Figma URL writes them. If more than one
file has the plugin open, add `--file <part of its name>` (`--file current`, `--file
Asph`). A command waits 60 seconds for Figma; `--timeout <seconds>` changes that.

### Writing with `run`

`run` executes your code as the body of an async function inside the plugin, with the
full [Plugin API](https://www.figma.com/plugin-docs/api/api-reference/). In scope: `figma`,
`args` (from `--args '<json>'`), `log(...)` (lines come back in `logs`, even on error) and
`plain` (turns a node into JSON). Whatever you `return` comes back as `value`.

- **Use the async lookups.** The manifest sets `documentAccess: dynamic-page`, so
  `figma.getNodeById` throws; use `await figma.getNodeByIdAsync(id)`, and
  `await page.loadAsync()` before reading a page.
- **Load a font before changing text:** `await figma.loadFontAsync(node.fontName)`.
- **Each `run` is one undo step.** Do one coherent change per run.
- **The sandbox is not Node.** No `require`, no `fs`, no network but the bridge. Keep the
  syntax conservative: no optional chaining, no nullish coalescing, no object spread.
- **`clone()` puts the copy at the end of the current page,** not beside the original.

### What we learned the hard way (2026-10-05)

From the archive's bridge, and still true:

- **A timeout does not cancel a script.** The agent stops waiting, but the script can
  still finish in Figma later. **After a timeout, read the state back before retrying,**
  and prefer scripts that are safe to run twice. `build.js` is: it skips a frame that is
  already there, unless told to replace it.
- **Scripts have stalled on `await`,** twice on a font load. The plugin window nudges the
  plugin once a second while a command runs, which should prevent it. If Figma stops
  answering even a simple read, ask the person to close and rerun the plugin window.
- **Keep runs small:** one frame per run, as `import.mjs` does.
- **On Windows, npm cuts a multi-line `--code` at the first newline.** Put the code in a
  file, or call `node tools/figma/cli.mjs` directly.
- **Fixed-size frames do not grow.** Adding to an auto-layout frame of fixed height clips
  what you added; set `primaryAxisSizingMode` to `"AUTO"`.

### Security

- The server listens on `127.0.0.1` and `::1` only, and refuses a request whose `Host` is
  not loopback.
- Every route but `/health` needs the token in `~/.seiskolar-figma-bridge/token`. A web
  page can send requests to localhost but cannot read that file. Never commit the token or
  paste it into a chat; hand it over with `npm run -s figma -- token --copy`.
- **Whoever has the token can edit any file you have open with the plugin running.** Close
  the plugin window when no agent should be working.

### Changing the bridge

The port is written in three places: `shared.mjs`, `plugin/manifest.json`
(`devAllowedDomains`) and `plugin/ui.html` (`BRIDGE`). After editing the plugin, close and
rerun it in Figma; after editing the server, run `npm run -s figma -- stop` and any command
restarts it.
