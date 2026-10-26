// Labels the team's Figma file by owner: whose work each swimlane and screen is, so that
// anyone who opens the file, a member or the course, sees it at a glance. Everything it
// writes comes from this repository, as it is on the branch it runs on:
//
// - the members, their full names and GitHub handles, from the Team table in README.md;
// - each swimlane's and screen's owner, from the Owner column of the indexes in
//   02-swimlanes/README.md, 03-low-fidelity/README.md and 04-high-fidelity/README.md.
//
// To change an owner, change the index in a pull request, and after it merges run this
// again: Figma follows the repository, never the other way round. See README.md beside
// this file, "Labelling the file by owner".
//
//   npm run figma:label-owners                 label the team file, through the bridge
//   npm run figma:label-owners -- --dry-run    label a stand-in for Figma twice, in Node
//
// What it makes, the same as the labels first made on 26 October 2026 by a one-off script:
//
// - On 02 Swimlanes, 03 Low-fidelity and 04 High-fidelity, every section (one per
//   swimlane or screen, named after its HTML file, as import.mjs names it) is filled with
//   its owner's light tint, and holds the owner's handle as shared plugin data
//   `seiskolar/owner`, for any script that needs it.
// - 32 px above each section, a tag in the owner's strong colour, in white Inter Semi
//   Bold 56: "Owner: <Full Name> (<@handle>)".
// - 160 px above everything else on each of those pages, a white legend as wide as the
//   widest section, "Who owns what on this page": an introduction, then a row per member
//   with their colour's swatch, their name, and the titles they own on that page.
// - On 00 Read me, 240 px right of the Read me section, a card 2400 px wide, "Who owns
//   what": each member's swimlanes and screens.
//
// Every label carries shared plugin data `seiskolar/label` = "owner", and each run first
// removes every node so marked, anywhere in the file, so a second run replaces the labels
// instead of adding a second set. It renames nothing and moves no section: import.mjs
// finds pages, sections and frames by name, so imports work as before. An import can move
// sections, though (a drawing that gains a state grows, and the sections below it move
// down), so run this again after every import.
//
// The whole labelling is one `run` of labelInFigma below, so one Ctrl+Z in Figma takes it
// all back. --dry-run needs no Figma and no bridge: it labels pages and sections laid out
// as import.mjs lays them out, in mock-figma.mjs, a stand-in that refuses what Figma would
// refuse, twice, and checks that the second run left the same labels as the first, in the
// same places. The bridge must be ready (`npm run -s figma -- doctor`) for a real run.
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Failure, command, ensureServer } from './client.mjs'
import { mockFigma, runInMock } from './mock-figma.mjs'
import { TEAM_FILE, readOrCreateToken } from './shared.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(HERE, '..', '..')

// Each member's colour, as on the labels of 26 October 2026: a light tint for the
// sections they own, and a strong colour for their tags and swatches. White text on each
// strong colour has a contrast of 5.0:1 to 7.1:1, above the 4.5:1 of WCAG AA (SRS
// NFR-ACC-001). A member added to the Team table needs a colour here; until then the
// labelling stops and says so.
const COLOURS = {
  '@gnthril': { colour: 'blue', tint: '#DBEAFE', strong: '#1D4ED8' },
  '@dbeenutsz': { colour: 'green', tint: '#DCFCE7', strong: '#15803D' },
  '@zedric-git': { colour: 'orange', tint: '#FFEDD5', strong: '#C2410C' },
  '@dreeyanzz': { colour: 'purple', tint: '#EDE9FE', strong: '#6D28D9' },
  '@Tiamporado': { colour: 'pink', tint: '#FCE7F3', strong: '#BE185D' },
}

// The pages import.mjs makes (PAGES and readMe() there), each labelled from its index.
const PAGES = [
  { folder: '02-swimlanes', page: '02 Swimlanes' },
  { folder: '03-low-fidelity', page: '03 Low-fidelity' },
  { folder: '04-high-fidelity', page: '04 High-fidelity' },
]
const READ_ME = { page: '00 Read me', section: 'Read me' }

// Between the titles on a legend row. Three spaces on either side keep the titles apart
// at 36 px; the layer's name, which Figma makes from the text, shows only one.
const SEPARATOR = '   ·   '

function parseArgs(argv) {
  const flags = { dryRun: false, timeout: 180 }
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--dry-run') flags.dryRun = true
    else if (arg === '--file') flags.file = argv[++i]
    else if (arg === '--timeout') flags.timeout = Number(argv[++i])
    else throw new Error(`Unknown option ${arg}`)
  }
  return flags
}

// The cells of a Markdown table row: `| a | b |` is ['a', 'b'].
function cells(line) {
  return line
    .trim()
    .replace(/^\||\|$/g, '')
    .split('|')
    .map((cell) => cell.trim())
}

// The rows of the first table in `file` whose header has all of `columns`, each row an
// object keyed by the header's words.
function readTable(file, columns) {
  const lines = readFileSync(join(ROOT, file), 'utf8').split(/\r?\n/)
  const at = lines.findIndex(
    (line) => line.startsWith('|') && columns.every((c) => cells(line).includes(c)),
  )
  if (at < 0) throw new Error(`${file} has no table with the columns ${columns}.`)
  const header = cells(lines[at])
  const rows = []
  // After the header and its |---| line, up to the first line that is not a row.
  for (const line of lines.slice(at + 2)) {
    if (!line.startsWith('|')) break
    const values = cells(line)
    rows.push(Object.fromEntries(header.map((name, i) => [name, values[i] || ''])))
  }
  return rows
}

const unquote = (cell) => cell.replace(/`/g, '').trim()
const sameHandle = (a, b) => a.toLowerCase() === b.toLowerCase() // as GitHub compares them

// '#1D4ED8' as Figma writes a colour: each channel from 0 to 1.
function rgb(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
  return { r, g, b }
}

// The members, in the order of the Team table in README.md, which the legends keep.
function readTeam() {
  const team = readTable('README.md', ['Member', 'GitHub']).map((row) => {
    const handle = unquote(row.GitHub)
    if (!/^@[A-Za-z0-9-]+$/.test(handle)) {
      throw new Error(
        `README.md, Team: ${row.Member}'s GitHub cell, "${row.GitHub}", is not a handle such as \`@dreeyanzz\`.`,
      )
    }
    const found = Object.entries(COLOURS).find(([h]) => sameHandle(h, handle))
    if (!found) {
      throw new Error(
        `README.md, Team: ${row.Member} (${handle}) has no colour. Add one to COLOURS in tools/figma/label-owners.mjs.`,
      )
    }
    const { colour, tint, strong } = found[1]
    return { name: row.Member, handle, colour, tint: rgb(tint), strong: rgb(strong) }
  })
  if (!team.length) throw new Error('README.md: the Team table lists nobody.')
  return team
}

// One item per row of a folder's index: the section it is drawn in (its HTML file's
// name, which import.mjs gives the section), its title, and its owner's handle as the
// Team table writes it. A swimlane's title starts with its number: "01 Sign in, and …".
function readIndex(folder, team) {
  const file = `${folder}/README.md`
  const items = []
  for (const row of readTable(file, ['Owner'])) {
    // The first link to an HTML file in this folder: the Workflow or Screen column, not
    // the Wireframe column of 04, whose links go up to ../03-low-fidelity/.
    const link = Object.values(row)
      .map((cell) => cell.match(/\[([^\]]+)\]\(([a-z0-9-]+\.html)\)/))
      .find(Boolean)
    if (!link) {
      throw new Error(`${file}: an index row links to no drawing: ${Object.values(row)}`)
    }
    const [, text, section] = link
    const handle = unquote(row.Owner)
    if (!handle) throw new Error(`${file}: ${section} has no owner.`)
    const member = team.find((m) => sameHandle(m.handle, handle))
    if (!member) {
      throw new Error(
        `${file}: ${section}'s owner, ${handle}, is not in the Team table of README.md.`,
      )
    }
    if (items.some((item) => item.section === section)) {
      throw new Error(`${file}: ${section} is in the index twice.`)
    }
    const title = row['#'] ? `${row['#']} ${text}` : text
    items.push({ section, title, owner: member.handle })
  }
  return items
}

const NUMBERS = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight']

// How many each member owns, in words: "two swimlanes", "five or six screens", "four to
// eight screens".
function howMany(counts, noun) {
  const word = (n) => NUMBERS[n] || String(n)
  const low = Math.min(...counts)
  const high = Math.max(...counts)
  const amount =
    low === high
      ? word(low)
      : `${word(low)} ${high === low + 1 ? 'or' : 'to'} ${word(high)}`
  return `${amount} ${high === 1 ? noun : `${noun}s`}`
}

// Everything the labels say, worked out from the Team table and the indexes, as
// labelInFigma's `args`. The counts are counted, so the words stay true when an owner
// changes. On 26 October 2026 Adrian divided the work evenly, two swimlanes and five or
// six screens each, whoever did it; while the indexes still divide it that evenly (no
// member more than one swimlane or one screen ahead of another), the labels say so.
function labels() {
  const team = readTeam()
  const index = Object.fromEntries(
    PAGES.map((p) => [p.folder, readIndex(p.folder, team)]),
  )
  const swimlanes = index['02-swimlanes']
  const wireframes = index['03-low-fidelity']
  const screens = index['04-high-fidelity']

  // A screen has one owner at both fidelities, and the legends say so, so a wireframe
  // whose high-fidelity screen has another owner stops the labelling.
  for (const screen of screens) {
    const wireframe = wireframes.find((w) => w.section === screen.section)
    if (wireframe && wireframe.owner !== screen.owner) {
      throw new Error(
        `${screen.section} has two owners: ${wireframe.owner} in 03-low-fidelity/README.md and ${screen.owner} in 04-high-fidelity/README.md. A wireframe and its high-fidelity screen keep one owner; make the two indexes agree first.`,
      )
    }
  }

  const of = (items, member) => items.filter((item) => item.owner === member.handle)
  const swimlaneCounts = team.map((m) => of(swimlanes, m).length)
  const screenCounts = team.map(
    (m) => new Set([...of(wireframes, m), ...of(screens, m)].map((i) => i.section)).size,
  )
  const spread = (counts) => Math.max(...counts) - Math.min(...counts)
  const even = spread(swimlaneCounts) <= 1 && spread(screenCounts) <= 1
  const owns = `every member owns ${howMany(swimlaneCounts, 'swimlane')} and ${howMany(screenCounts, 'screen')}`

  const pageIntro =
    'Each section is tinted in its owner’s colour and tagged above. ' +
    (even
      ? `The work was divided evenly on 26 October 2026, whoever did it: ${owns}`
      : `Each item has one owner, whoever did the work: ${owns}`) +
    ', and a wireframe and its high-fidelity screen have the same owner. The repository is the source: each item’s owner is in its folder’s index (02-swimlanes/README.md, 03-low-fidelity/README.md, 04-high-fidelity/README.md). Change it there first.'
  const readMeIntro =
    (even
      ? 'Team Asph divided the design evenly on 26 October 2026, whoever did the work. '
      : 'Each item of the design has one owner, whoever did the work. ') +
    'On every other page, each section is tinted in its owner’s colour and tagged above. The repository is the source: each item’s owner is in its folder’s index.'

  // On the Read me's card, a member's wireframes and screens are one list while they are
  // the same screens, as they are once every wireframe has its high-fidelity screen.
  const list = (items) => (items.length ? items.map((i) => i.title).join('; ') : 'none')
  const rows = team.map((m) => {
    const lines = [`Swimlanes: ${list(of(swimlanes, m))}.`]
    const low = list(of(wireframes, m))
    const high = list(of(screens, m))
    if (low === high) lines.push(`Screens, low and high fidelity: ${low}.`)
    else lines.push(`Wireframes: ${low}.`, `High-fidelity screens: ${high}.`)
    return { owner: m.handle, text: lines.join('\n') }
  })

  return {
    namespace: 'seiskolar',
    members: team,
    separator: SEPARATOR,
    none: 'None on this page',
    pages: PAGES.map((p) => ({ page: p.page, intro: pageIntro, items: index[p.folder] })),
    readMe: { page: READ_ME.page, section: READ_ME.section, intro: readMeIntro, rows },
  }
}

// Runs inside Figma, as the body of the bridge's `run` (plugin/code.js), or in the
// stand-in with --dry-run. Its source is what is sent, so it uses nothing from this
// module, only `figma` and `args` (what labels() returns), and it keeps to the syntax of
// Figma's sandbox, as build.js does: no optional chaining, no nullish coalescing, no
// object spread (README.md, "Writing with run"). It returns what it did.
async function labelInFigma(figma, args) {
  var NS = args.namespace
  var INK = { r: 0.09, g: 0.13, b: 0.17 } // the Read me's text colour (import.mjs)
  var BORDER = { r: 0.8, g: 0.84, b: 0.88 }
  var WHITE = { r: 1, g: 1, b: 1 }
  var TAG_GAP = 32 // between a tag and the top of its section
  var LEGEND_GAP = 160 // between a legend and the top of everything else on its page
  var CARD_GAP = 240 // between the Read me section and its card
  var CARD_WIDTH = 2400

  var who = {}
  args.members.forEach(function (member) {
    who[member.handle] = member
  })

  function solid(c) {
    return { type: 'SOLID', color: { r: c.r, g: c.g, b: c.b } }
  }

  function pageNamed(name) {
    return figma.root.children.find(function (page) {
      return page.name === name
    })
  }

  // Inter, in a colour. A paragraph (`wrap`) fills its parent's width and wraps; other
  // text is as wide as its words.
  function text(parent, characters, style, size, lineHeight, wrap, color) {
    var node = figma.createText()
    parent.appendChild(node)
    node.fontName = { family: 'Inter', style: style }
    node.fontSize = size
    if (lineHeight) node.lineHeight = { unit: 'PIXELS', value: lineHeight }
    node.characters = characters
    node.fills = [solid(color || INK)]
    if (wrap) {
      node.textAutoResize = 'HEIGHT'
      node.layoutSizingHorizontal = 'FILL'
    } else {
      node.textAutoResize = 'WIDTH_AND_HEIGHT'
    }
    return node
  }

  // An auto-layout frame with no fill, as wide as its parent and as tall as what it
  // holds: a legend's row, or the words beside a row's swatch.
  function stack(parent, direction, spacing) {
    var frame = figma.createFrame()
    parent.appendChild(frame)
    frame.layoutMode = direction
    frame.itemSpacing = spacing
    frame.fills = []
    frame.layoutSizingHorizontal = 'FILL'
    frame.layoutSizingVertical = 'HUG'
    return frame
  }

  // A page's legend, or the Read me's card: white, a title, an introduction, then a row
  // per member, their swatch beside their name and what they own.
  function card(page, width, title, intro, rows) {
    var box = figma.createFrame()
    page.appendChild(box)
    box.name = 'Owners'
    box.setSharedPluginData(NS, 'label', 'owner')
    box.layoutMode = 'VERTICAL'
    box.resize(width, 100)
    box.layoutSizingHorizontal = 'FIXED'
    box.layoutSizingVertical = 'HUG'
    box.itemSpacing = 40
    box.paddingLeft = 64
    box.paddingRight = 64
    box.paddingTop = 56
    box.paddingBottom = 64
    box.cornerRadius = 24
    box.fills = [solid(WHITE)]
    box.strokes = [solid(BORDER)]
    box.strokeWeight = 2
    box.strokeAlign = 'INSIDE'
    // The border takes its room in the layout, so the words start 66 px in, inside it.
    box.strokesIncludedInLayout = true
    text(box, title, 'Bold', 72)
    text(box, intro, 'Regular', 36, 52, true)
    rows.forEach(function (row) {
      var line = stack(box, 'HORIZONTAL', 32)
      var swatch = figma.createRectangle()
      line.appendChild(swatch)
      swatch.resize(56, 56)
      swatch.cornerRadius = 12
      swatch.fills = [solid(row.member.strong)]
      var words = stack(line, 'VERTICAL', 8)
      var heading = row.member.name + ' (' + row.member.handle + '), ' + row.member.colour
      text(words, heading, 'Semi Bold', 44)
      text(words, row.text, 'Regular', 36, 52, true)
    })
    return box
  }

  // The tag above a section: its owner's name and handle, white on their strong colour.
  function tag(page, section, member) {
    var box = figma.createFrame()
    page.appendChild(box)
    box.name = 'Owner: ' + member.name
    box.setSharedPluginData(NS, 'label', 'owner')
    box.layoutMode = 'HORIZONTAL'
    box.layoutSizingHorizontal = 'HUG'
    box.layoutSizingVertical = 'HUG'
    box.paddingLeft = 40
    box.paddingRight = 40
    box.paddingTop = 20
    box.paddingBottom = 20
    box.cornerRadius = 16
    box.fills = [solid(member.strong)]
    var words = 'Owner: ' + member.name + ' (' + member.handle + ')'
    text(box, words, 'Semi Bold', 56, null, false, WHITE)
    box.x = section.x
    box.y = section.y - TAG_GAP - box.height
    return box
  }

  // One page: tint and tag each section its index names, then put the legend above it
  // all. Says which sections the index does not name, and which items have no section.
  function labelPage(page, want) {
    var items = {}
    want.items.forEach(function (item) {
      items[item.section] = item
    })
    var sections = page.children.filter(function (node) {
      return node.type === 'SECTION'
    })
    var done = {
      page: want.page,
      sections: sections.length,
      tagged: 0,
      legend: null,
      unowned: [],
      absent: [],
    }
    var shown = {}
    sections.forEach(function (section) {
      var item = items[section.name]
      if (!item) {
        done.unowned.push(section.name)
        // Tinted by an earlier run, but no longer in the index: back to white, Figma's
        // colour for a new section, so no section shows an owner the repository does not.
        if (section.getSharedPluginData(NS, 'owner')) {
          section.fills = [solid(WHITE)]
          section.setSharedPluginData(NS, 'owner', '')
        }
        return
      }
      var member = who[item.owner]
      section.fills = [solid(member.tint)]
      section.setSharedPluginData(NS, 'owner', member.handle)
      tag(page, section, member)
      done.tagged++
      shown[item.section] = true
    })
    want.items.forEach(function (item) {
      if (!shown[item.section]) done.absent.push(item.section)
    })
    if (!sections.length) return done

    var rows = args.members.map(function (member) {
      var titles = want.items
        .filter(function (item) {
          return item.owner === member.handle && shown[item.section]
        })
        .map(function (item) {
          return item.title
        })
      return {
        member: member,
        text: titles.length ? titles.join(args.separator) : args.none,
      }
    })
    // Measured before the legend is added: the left and top edges of everything else on
    // the page, the tags included.
    var left = Math.min.apply(
      null,
      page.children.map(function (node) {
        return node.x
      }),
    )
    var top = Math.min.apply(
      null,
      page.children.map(function (node) {
        return node.y
      }),
    )
    var widest = Math.max.apply(
      null,
      sections.map(function (section) {
        return section.width
      }),
    )
    var legend = card(page, widest, 'Who owns what on this page', want.intro, rows)
    legend.x = left
    legend.y = top - LEGEND_GAP - legend.height
    done.legend = legend.id
    return done
  }

  await figma.loadFontAsync({ family: 'Inter', style: 'Regular' })
  await figma.loadFontAsync({ family: 'Inter', style: 'Semi Bold' })
  await figma.loadFontAsync({ family: 'Inter', style: 'Bold' })

  // First, every label an earlier run made, on every page, wherever it was moved to, so
  // this run replaces the labels instead of adding a second set.
  var removed = 0
  for (var i = 0; i < figma.root.children.length; i++) {
    var each = figma.root.children[i]
    await each.loadAsync()
    each
      .findAllWithCriteria({ sharedPluginData: { namespace: NS, keys: ['label'] } })
      .forEach(function (node) {
        if (!node.removed && node.getSharedPluginData(NS, 'label') === 'owner') {
          node.remove()
          removed++
        }
      })
  }

  var report = { removed: removed, pages: [], readMe: null }
  for (var j = 0; j < args.pages.length; j++) {
    var page = pageNamed(args.pages[j].page)
    if (page) report.pages.push(labelPage(page, args.pages[j]))
    else report.pages.push({ page: args.pages[j].page, missing: true })
  }

  var readMePage = pageNamed(args.readMe.page)
  var readMe =
    readMePage &&
    readMePage.children.find(function (node) {
      return node.type === 'SECTION' && node.name === args.readMe.section
    })
  if (readMe) {
    var rows = args.readMe.rows.map(function (row) {
      return { member: who[row.owner], text: row.text }
    })
    var box = card(readMePage, CARD_WIDTH, 'Who owns what', args.readMe.intro, rows)
    box.x = readMe.x + readMe.width + CARD_GAP
    box.y = readMe.y
    report.readMe = { page: args.readMe.page, card: box.id }
  } else {
    report.readMe = { page: args.readMe.page, missing: true }
  }
  return report
}

// What a run did, for the person running it. Returns false when a page or the Read me
// section was missing, so the labelling is not complete.
function print(report) {
  let complete = true
  console.log(`Removed ${report.removed} label(s) an earlier run made.`)
  for (const p of report.pages) {
    if (p.missing) {
      console.log(
        `${p.page}: no such page. Import the design first (npm run figma:import).`,
      )
      complete = false
      continue
    }
    const legend = p.legend ? ', and the legend above them' : ''
    console.log(
      `${p.page}: ${p.tagged} of ${p.sections} section(s) tinted and tagged${legend}.`,
    )
    if (p.unowned.length) {
      console.log(
        `  Not in ${p.page}'s index, so untinted and untagged: ${p.unowned.join(', ')}. Figma holds a drawing the repository does not list; find out why before deleting it.`,
      )
    }
    if (p.absent.length) {
      console.log(
        `  In the index but not in Figma, so left off the legend: ${p.absent.join(', ')}. Import them (npm run figma:import -- --only <drawing>), then run this again.`,
      )
    }
  }
  const r = report.readMe
  if (r.missing) {
    console.log(
      `${r.page}: no Read me section, so no card. Run npm run figma:import first.`,
    )
    complete = false
  } else console.log(`${r.page}: the card "Who owns what", beside the Read me section.`)
  return complete
}

// Sections in the stand-in, made as import.mjs makes them: a Read me section on 00 Read
// me, and on each other page one section per index row, named after its HTML file, at
// x 0, stacked 240 px apart. Their sizes are made up, and vary, so that the widest
// section is not the first.
function stage(figma, args) {
  const make = (page, name, y, width, height) => {
    const section = figma.createSection()
    page.appendChild(section)
    section.name = name
    section.x = 0
    section.y = y
    section.resizeWithoutConstraints(width, height)
  }
  const readMe = figma.createPage()
  readMe.name = args.readMe.page
  make(readMe, args.readMe.section, 0, 1368, 940)
  for (const want of args.pages) {
    const page = figma.createPage()
    page.name = want.page
    let y = 0
    want.items.forEach((item, i) => {
      const height = 900 + ((i * 211) % 700)
      make(page, item.section, y, 2200 + ((i * 377) % 1300), height)
      y += height + 240
    })
  }
}

// The labels in the stand-in, checked against what the comment at the top of this file
// says they are; throws at the first that is not. Returns each label's page, name and
// place, to compare one run with the next.
function inspect(figma, args) {
  const NS = args.namespace
  const must = (ok, message) => {
    if (!ok) throw new Error(`Dry run: ${message}`)
  }
  const isLabel = (node) => node.getSharedPluginData(NS, 'label') === 'owner'
  const pageNamed = (name) => figma.root.children.find((page) => page.name === name)
  const placed = []
  for (const page of figma.root.children) {
    for (const node of page.children.filter(isLabel)) {
      placed.push(
        `${page.name}: ${node.name} at ${node.x}, ${node.y}, ${node.width} wide`,
      )
    }
  }
  for (const want of args.pages) {
    const page = pageNamed(want.page)
    const sections = page.children.filter((node) => node.type === 'SECTION')
    const labels = page.children.filter(isLabel)
    const legends = labels.filter((node) => node.name === 'Owners')
    const tags = labels.filter((node) => node.name.startsWith('Owner: '))
    must(legends.length === 1, `${want.page} has ${legends.length} legends, not one`)
    must(
      tags.length === sections.length,
      `${want.page} has ${tags.length} tags for ${sections.length} sections`,
    )
    for (const section of sections) {
      const { owner } = want.items.find((item) => item.section === section.name)
      const member = args.members.find((m) => m.handle === owner)
      must(
        section.getSharedPluginData(NS, 'owner') === owner,
        `${section.name} does not hold ${owner} as its owner`,
      )
      must(
        JSON.stringify(section.fills) ===
          JSON.stringify([{ type: 'SOLID', color: member.tint }]),
        `${section.name} is not tinted ${member.colour}`,
      )
      const above = tags.filter(
        (t) => t.x === section.x && t.y + t.height + 32 === section.y,
      )
      must(
        above.length === 1 && above[0].name === `Owner: ${member.name}`,
        `${section.name} has no one tag "Owner: ${member.name}" 32 px above it`,
      )
    }
    const [legend] = legends
    const others = page.children.filter((node) => node !== legend)
    must(
      legend.y + legend.height + 160 === Math.min(...others.map((node) => node.y)),
      `${want.page}'s legend is not 160 px above everything else on it`,
    )
    must(
      legend.width === Math.max(...sections.map((node) => node.width)),
      `${want.page}'s legend is not as wide as its widest section`,
    )
  }
  const readMePage = pageNamed(args.readMe.page)
  const readMe = readMePage.children.find((node) => node.name === args.readMe.section)
  const cards = readMePage.children.filter(isLabel)
  must(cards.length === 1, `${args.readMe.page} has ${cards.length} cards, not one`)
  must(
    cards[0].x === readMe.x + readMe.width + 240 &&
      cards[0].y === readMe.y &&
      cards[0].width === 2400,
    `the card on ${args.readMe.page} is not 2400 wide, 240 px right of the Read me section`,
  )
  return placed
}

// --dry-run: label the stand-in twice. The second run must remove what the first made
// and draw the same labels again, in the same places: replaced, not duplicated.
async function dryRun(code, args) {
  const mock = mockFigma()
  stage(mock.figma, args)
  await runInMock(code, args, mock)
  const first = inspect(mock.figma, args)
  const again = await runInMock(code, args, mock)
  const second = inspect(mock.figma, args)
  const complete = print(again.value)
  if (again.value.removed !== first.length) {
    throw new Error(
      `Dry run: the second run removed ${again.value.removed} labels, but the first made ${first.length}.`,
    )
  }
  if (JSON.stringify(first) !== JSON.stringify(second)) {
    throw new Error(
      'Dry run: the second run did not leave the labels the first one left.',
    )
  }
  console.log(
    `\nDry run, in the stand-in (mock-figma.mjs), twice: the second run removed the ${first.length} labels the first made and drew the same ${second.length} again, in the same places. Replaced, not duplicated.`,
  )
  if (!complete) process.exitCode = 1
}

async function main() {
  const flags = parseArgs(process.argv.slice(2))
  const args = labels()
  const code = `return await (${labelInFigma})(figma, args)`
  if (flags.dryRun) return dryRun(code, args)

  const token = readOrCreateToken()
  await ensureServer()
  let result
  try {
    result = await command(
      token,
      { file: flags.file || TEAM_FILE.match, timeout: flags.timeout },
      'run',
      { code, args },
    )
  } catch (error) {
    console.error(
      'The labelling stopped. A timeout does not cancel the script in Figma, so read the file back (npm run -s figma -- tree --depth 2) before running it again; running it again is safe, because it replaces the labels.',
    )
    throw error
  }
  const complete = print(result.value)
  console.log(
    '\nCheck it: npm run -s figma -- tree --depth 2 lists, on each labelled page, one "Owners" and one "Owner: …" tag per section.',
  )
  if (!complete) process.exitCode = 1
}

main().catch((error) => {
  const payload = error instanceof Failure ? error.payload : { error: error.message }
  console.error(JSON.stringify(payload, null, 2))
  process.exitCode = 1
})
