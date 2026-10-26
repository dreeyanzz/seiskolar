// Draws the exported views (export.mjs) in the team's Figma file, through the bridge: one
// page per deliverable, one section per drawing, one frame per PNG, each frame named as
// its PNG is. Run export.mjs first. See README.md beside this file.
//
//   npm run figma:import                       every exported view
//   npm run figma:import -- --only 02-swimlanes
//   npm run figma:import -- --only scholar-dashboard,sign-in
//   npm run figma:import -- --replace          redraw frames that are already there
//   npm run figma:import -- --from regional-queue.phone   start again from that frame
//   npm run figma:import -- --dry-run          draw into a stand-in for Figma, in Node
//
// --only takes folders, drawings or frame names, separated by commas. Without --replace a
// frame that already exists is left as it is, so an import that stopped half-way can be
// run again, and frames someone has worked on in Figma are not lost by accident.
// --dry-run needs no Figma and no bridge: it runs build.js against mock-figma.mjs, which
// checks every value Figma would refuse, so a broken export is found before it reaches the
// file. The bridge must be ready (`npm run -s figma -- doctor`) for a real import.
//
// Each frame is one `run` of build.js, so one Ctrl+Z in Figma takes back one frame. After
// a failure the import stops; per README.md, read the state back before running again.
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Failure, command, ensureServer } from './client.mjs'
import { EXPORT_DIR, viewsOf } from './export.mjs'
import { runInMock } from './mock-figma.mjs'
import { TEAM_FILE, readOrCreateToken } from './shared.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(HERE, '..', '..')
const BUILD = readFileSync(join(HERE, 'build.js'), 'utf8')

const PAGES = {
  '02-swimlanes': '02 Swimlanes',
  '03-low-fidelity': '03 Low-fidelity',
  '04-high-fidelity': '04 High-fidelity',
}
const DEVICE_ORDER = ['phone', 'tablet', 'desktop']
const PAD = 120 // inside a section, around its frames
const GAP_X = 80 // between frames in a row
const GAP_Y = 160 // between rows (states)
const GAP_SECTIONS = 240

function parseArgs(argv) {
  const flags = { only: [], replace: false, dryRun: false, from: null, timeout: 180 }
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--replace') flags.replace = true
    else if (arg === '--dry-run') flags.dryRun = true
    else if (arg === '--only') flags.only.push(...argv[++i].split(',').filter(Boolean))
    else if (arg === '--from') flags.from = argv[++i]
    else if (arg === '--timeout') flags.timeout = Number(argv[++i])
    else if (arg === '--file') flags.file = argv[++i]
    else throw new Error(`Unknown option ${arg}`)
  }
  return flags
}

// Drawings in the order their folder's README index lists them, so the Figma pages read
// in the same order as the index: sign-in first, then each role's screens.
function indexOrder(folder) {
  const readme = join(ROOT, folder, 'README.md')
  if (!existsSync(readme)) return []
  const order = []
  for (const m of readFileSync(readme, 'utf8').matchAll(/\]\(([a-z0-9-]+)\.html\)/g)) {
    if (!order.includes(m[1])) order.push(m[1])
  }
  return order
}

// Where every frame goes. Worked out from every drawing, not only the ones being
// imported, so a frame lands in the same place however the import is split up.
function layout(exported) {
  const plan = []
  for (const folder of Object.keys(PAGES)) {
    const views = exported.filter((v) => v.folder === folder)
    const order = indexOrder(folder)
    const drawings = [...new Set(views.map((v) => v.drawing))].sort((a, b) => {
      const ia = order.indexOf(a) < 0 ? Infinity : order.indexOf(a)
      const ib = order.indexOf(b) < 0 ? Infinity : order.indexOf(b)
      return ia - ib || a.localeCompare(b)
    })
    let y = 0
    for (const drawing of drawings) {
      // States in the order the drawing lists them (render-states), devices left to right.
      const html = join(ROOT, folder, `${drawing}.html`)
      const frames = existsSync(html) ? viewsOf(html).map((v) => v.frame) : []
      const mine = views
        .filter((v) => v.drawing === drawing)
        .sort((a, b) => {
          const fa = frames.indexOf(a.frame)
          const fb = frames.indexOf(b.frame)
          return (
            fa - fb || DEVICE_ORDER.indexOf(a.device) - DEVICE_ORDER.indexOf(b.device)
          )
        })
      const rows = []
      for (const v of mine) {
        let row = rows.find((r) => r.state === v.state)
        if (!row) rows.push((row = { state: v.state, views: [] }))
        row.views.push(v)
      }
      let rowY = PAD
      let width = 0
      const placed = []
      for (const row of rows) {
        let x = PAD
        for (const v of row.views) {
          placed.push({ view: v, frame: { x, y: rowY } })
          x += v.width + GAP_X
        }
        width = Math.max(width, x - GAP_X + PAD)
        rowY += Math.max(...row.views.map((v) => v.height)) + GAP_Y
      }
      const section = {
        name: `${drawing}.html`,
        x: 0,
        y,
        width,
        height: rowY - GAP_Y + PAD,
      }
      for (const p of placed) plan.push({ ...p, page: PAGES[folder], section })
      y += section.height + GAP_SECTIONS
    }
  }
  return plan
}

function selected(plan, flags) {
  let out = plan
  if (flags.only.length) {
    out = out.filter(({ view }) =>
      flags.only.some((o) => o === view.folder || o === view.drawing || o === view.frame),
    )
  }
  if (flags.from) {
    const at = out.findIndex(({ view }) => view.frame === flags.from)
    if (at < 0) throw new Error(`--from ${flags.from}: no such frame in this import`)
    out = out.slice(at)
  }
  return out
}

function commitOf() {
  try {
    return execFileSync('git', ['rev-parse', '--short', 'HEAD'], { cwd: ROOT })
      .toString()
      .trim()
  } catch {
    return 'unknown'
  }
}

// A first page saying what the file is, drawn by build.js like any other frame.
function readMe(exportedAt) {
  const lines = [
    [32, 700, 'SEIskolar: the current design'],
    [16, 400, 'Team Asph · Software Design, Cebu Institute of Technology – University'],
    [16, 400, ''],
    [16, 600, 'Where this comes from'],
    [
      16,
      400,
      `Drawn from the repository github.com/dreeyanzz/seiskolar, commit ${commitOf()}, exported ${exportedAt.slice(0, 10)}, by tools/figma/import.mjs. The repository is the source of the design: the SRS, the swimlanes, the wireframes and the screens are written and reviewed there. This file is a copy for presenting and inspecting it.`,
    ],
    [16, 400, ''],
    [16, 600, 'What is on each page'],
    [
      16,
      400,
      '02 Swimlanes: the ten workflows, one section each. 03 Low-fidelity: every wireframe. 04 High-fidelity: every finished screen. A screen has one section, with a row per state and a phone, a tablet and a desktop frame in each row.',
    ],
    [16, 400, ''],
    [16, 600, 'Finding a frame'],
    [
      16,
      400,
      'Each frame has the name of the PNG it matches, without .png: scholar-requirement--returned.phone is 04-high-fidelity/scholar-requirement--returned.phone.png in the repository.',
    ],
    [16, 400, ''],
    [16, 600, 'Changing the design'],
    [
      16,
      400,
      'Change the drawing in the repository first, in a pull request, then import it again. A frame changed only here disagrees with the repository the course reviews. Frames are set in Inter, which Figma has built in, so they look the same on every computer.',
    ],
  ]
  const children = []
  let y = 64
  for (const [size, weight, text] of lines) {
    const lineHeight = Math.round(size * 1.5)
    const perLine = Math.floor(1000 / (size * 0.52))
    const count = Math.max(1, Math.ceil(text.length / perLine))
    if (text) {
      children.push({
        type: 'text',
        name: text.slice(0, 40),
        runs: [
          {
            text,
            family: 'Inter',
            weight,
            italic: false,
            size,
            color: { r: 0.09, g: 0.13, b: 0.17, a: 1 },
          },
        ],
        lineHeight,
        align: 'LEFT',
        x: 64,
        y,
        w: 1000,
        h: lineHeight * count,
        autoResize: 'HEIGHT',
      })
    }
    y += lineHeight * count + (size > 20 ? 16 : 4)
  }
  return {
    view: {
      version: 1,
      source: 'tools/figma/import.mjs',
      frame: 'Read me',
      width: 1128,
      height: y + 64,
      background: { r: 1, g: 1, b: 1, a: 1 },
      children,
      images: {},
    },
    page: '00 Read me',
    section: {
      name: 'Read me',
      x: 0,
      y: 0,
      width: 1128 + PAD * 2,
      height: y + 64 + PAD * 2,
    },
    frame: { x: PAD, y: PAD },
  }
}

async function main() {
  const flags = parseArgs(process.argv.slice(2))
  const indexFile = join(EXPORT_DIR, 'index.json')
  if (!existsSync(indexFile)) {
    console.error('Nothing exported yet. Run: npm run figma:export')
    process.exit(1)
  }
  const index = JSON.parse(readFileSync(indexFile, 'utf8'))
  const plan = selected(layout(index.views), flags)
  if (!plan.length) {
    console.error('No exported view matches. Check --only and --from.')
    process.exit(1)
  }

  const jobs = []
  if (!flags.only.length && !flags.from) jobs.push({ readMe: readMe(index.exportedAt) })
  for (const p of plan) jobs.push(p)

  let token = null
  if (!flags.dryRun) {
    token = readOrCreateToken()
    await ensureServer()
  }
  const file = flags.file || TEAM_FILE.match
  let done = 0
  for (const job of jobs) {
    const args = job.readMe
      ? { ...job.readMe, replace: true }
      : {
          view: JSON.parse(readFileSync(join(EXPORT_DIR, job.view.file), 'utf8')),
          page: job.page,
          section: job.section,
          frame: job.frame,
          replace: flags.replace,
        }
    const label = `${args.page} / ${args.section.name} / ${args.view.frame}`
    let result
    try {
      result = flags.dryRun
        ? await runInMock(BUILD, args)
        : await command(token, { file, timeout: flags.timeout }, 'run', {
            code: BUILD,
            args,
          })
    } catch (error) {
      const payload = error instanceof Failure ? error.payload : { error: error.message }
      console.error(`\nStopped at ${label}:`)
      console.error(JSON.stringify(payload, null, 2))
      console.error(
        `\n${done} of ${jobs.length} done. Read the frame back before running again (README.md); then run with --from ${args.view.frame} to go on.`,
      )
      process.exitCode = 1
      return
    }
    done++
    const value = result.value || result
    const what = value.skipped
      ? `skipped (${value.skipped})`
      : JSON.stringify(value.layers || {})
    console.log(`[${done}/${jobs.length}] ${label}: ${what}`)
  }
  console.log(
    `\n${done} frame(s) ${flags.dryRun ? 'drawn in the stand-in (dry run)' : 'sent to Figma'}.`,
  )
}

await main()
