// Turns every HTML drawing into a layer tree that build.js can draw in Figma as editable
// layers: text as text, boxes as frames with their fills, borders, corners and shadows,
// icons and arrows as vectors. Nothing is uploaded; import.mjs sends the trees to Figma
// through the bridge (README.md beside this file).
//
//   npm run figma:export                       every drawing
//   npm run figma:export -- <file or folder>   only those
//
// It opens each drawing exactly as scripts/render.mjs does, so a Figma frame matches the
// PNG beside its HTML: a swimlane at its render-width, a screen once per device (phone
// 360, tablet 768, desktop 1440) and once per state it lists in render-states. Each view
// is written to tools/figma/.out/export/<folder>/<png name>.json, for example
// 04-high-fidelity/scholar-requirement--returned.phone.json, and the views are listed in
// tools/figma/.out/export/index.json. The frame in Figma has the same name as the PNG,
// without .png, so anyone can find the frame for a picture and the picture for a frame.
//
// Choices that are not obvious:
// - Every text is set in Inter, and monospace text in Roboto Mono, before the page is
//   measured. The drawings ask for the system font (Segoe UI on Windows), which Figma on a
//   Mac or in a browser does not have. Inter and Roboto Mono are built into Figma, so the
//   file looks the same to every teammate and to the course, and because the page is
//   measured in the same fonts, every line breaks where it breaks in Figma.
// - ::before and ::after are turned into real elements first, so the dots on badges, the
//   "assumed" tags and the like have a box to measure.
// - What has no editable Figma equivalent becomes a small picture inside its layer:
//   a background image or gradient, and native controls such as checkboxes and radio
//   buttons. Everything else stays editable.
// - The layers are drawn positioned, not with auto layout, and nothing is a component.
//   Turning repeated parts into components is done by hand in Figma afterwards.
//
// Like render.mjs, it drives Microsoft Edge or Google Chrome through playwright-core, or
// the browser at RENDER_BROWSER. The fonts come from Google Fonts unless Inter and Roboto
// Mono are installed, so the first run needs the internet.
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import { dirname, join, relative, resolve, sep } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { chromium } from 'playwright-core'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(HERE, '..', '..')
export const EXPORT_DIR = join(HERE, '.out', 'export')

// The same folders, devices and defaults as scripts/render.mjs. If one changes there,
// change it here too, or the Figma frames stop matching the PNGs.
const FOLDERS = ['02-swimlanes', '03-low-fidelity', '04-high-fidelity']
const SCREEN_FOLDERS = ['03-low-fidelity', '04-high-fidelity']
const DEVICES = [
  { name: 'phone', width: 360, height: 800 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1440, height: 900 },
]
const DEFAULT_WIDTH = 1440
const DEFAULT_HEIGHT = 800

const FONT_CSS =
  'https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,100..900;1,100..900&family=Roboto+Mono:ital,wght@0,100..700;1,100..700&display=block'

function drawingsIn(path) {
  if (!existsSync(path)) {
    console.error(`not found: ${path}`)
    process.exit(1)
  }
  if (statSync(path).isFile()) return path.endsWith('.html') ? [path] : []
  return readdirSync(path, { withFileTypes: true }).flatMap((entry) => {
    const child = join(path, entry.name)
    if (entry.isDirectory()) return drawingsIn(child)
    // _template.html and the other files starting with _ are not drawings.
    return entry.name.endsWith('.html') && !entry.name.startsWith('_') ? [child] : []
  })
}

function meta(html, name) {
  const found = html.match(
    new RegExp(`<meta\\s+name=["']${name}["']\\s+content=["']([^"']*)["']`, 'i'),
  )
  return found ? found[1] : null
}

function folderOf(file) {
  return resolve(file)
    .split(sep)
    .find((part) => FOLDERS.includes(part))
}

async function launchBrowser() {
  if (process.env.RENDER_BROWSER) {
    return chromium.launch({ executablePath: process.env.RENDER_BROWSER })
  }
  for (const channel of ['msedge', 'chrome']) {
    try {
      return await chromium.launch({ channel })
    } catch {
      // Not installed here; try the next one.
    }
  }
  console.error(
    'No browser found. Install Microsoft Edge or Google Chrome, or set RENDER_BROWSER.',
  )
  process.exit(1)
}

async function settle(page) {
  await page.evaluate(async () => {
    await document.fonts.ready
  })
  await page.evaluate(
    () => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done))),
  )
}

// ---------------------------------------------------------------------------------------
// In the page. These functions run inside the browser, so each one must stand alone.

// Step 1: give every ::before and ::after a real element with the same computed style,
// and mark monospace text so it can be set in Roboto Mono. Runs before the fonts change.
function prepare() {
  const VOID = /^(INPUT|IMG|BR|HR|META|LINK|SELECT|TEXTAREA|SVG|svg)$/
  const found = []
  for (const el of document.body.querySelectorAll('*')) {
    if (VOID.test(el.tagName) || el instanceof SVGElement) continue
    for (const pseudo of ['::before', '::after']) {
      const cs = getComputedStyle(el, pseudo)
      if (!cs.content || cs.content === 'none' || cs.content === 'normal') continue
      if (cs.display === 'none') continue
      // content is a list of quoted strings and attr() calls. Counters and images are
      // not used by the drawings, so they are left out.
      let text = ''
      const tokens = cs.content.match(
        /"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|attr\([^)]*\)/g,
      )
      for (const token of tokens || []) {
        if (token.startsWith('attr('))
          text += el.getAttribute(token.slice(5, -1).trim()) || ''
        else text += token.slice(1, -1).replace(/\\(.)/g, '$1')
      }
      const style = []
      for (let i = 0; i < cs.length; i++) {
        const prop = cs[i]
        if (prop === 'content') continue
        style.push(`${prop}:${cs.getPropertyValue(prop)}`)
      }
      found.push({ el, pseudo, text, style: style.join(';') })
    }
  }
  for (const { el, pseudo, text, style } of found) {
    const span = document.createElement('span')
    span.setAttribute('data-fig-pseudo', pseudo.slice(2))
    span.setAttribute('style', style)
    span.textContent = text
    if (pseudo === '::before') el.insertBefore(span, el.firstChild)
    else el.appendChild(span)
    el.setAttribute('data-fig-pseudo-done', '')
  }
  const off = document.createElement('style')
  off.textContent =
    '[data-fig-pseudo-done]::before,[data-fig-pseudo-done]::after{content:none!important}'
  document.head.appendChild(off)

  for (const el of document.body.querySelectorAll('*')) {
    const family = getComputedStyle(el).fontFamily
    if (/mono|consolas|courier|menlo/i.test(family)) el.setAttribute('data-fig-mono', '')
  }
  return found.length
}

// Step 3: walk the page and return its layer tree. Coordinates are page pixels; build.js
// makes them relative to each layer's parent.
function collect() {
  const RASTER_TAGS = /^(IMG|CANVAS|VIDEO|IFRAME|OBJECT|EMBED|PROGRESS|METER)$/
  const RASTER_INPUTS = /^(checkbox|radio|range|file|color|image)$/
  const TEXT_INPUTS =
    /^(text|email|password|search|number|tel|url|date|time|month|week|datetime-local|)$/
  const warnings = []
  const rasters = []
  let nextId = 0

  function color(value) {
    if (!value) return null
    let m = value.match(/^rgba?\(([^)]+)\)$/)
    if (m) {
      const parts = m[1]
        .split(/[\s,/]+/)
        .filter(Boolean)
        .map(Number)
      const a = parts.length > 3 ? parts[3] : 1
      return { r: parts[0] / 255, g: parts[1] / 255, b: parts[2] / 255, a }
    }
    m = value.match(/^color\(srgb ([^)]+)\)$/)
    if (m) {
      const parts = m[1]
        .split(/[\s/]+/)
        .filter(Boolean)
        .map(Number)
      return { r: parts[0], g: parts[1], b: parts[2], a: parts.length > 3 ? parts[3] : 1 }
    }
    if (value === 'transparent' || value === 'none') return { r: 0, g: 0, b: 0, a: 0 }
    warnings.push(`colour not understood: ${value}`)
    return null
  }

  function visible(c) {
    return c && c.a > 0.001
  }

  function px(value, of) {
    if (!value) return 0
    if (value.endsWith('%')) return (parseFloat(value) / 100) * of
    return parseFloat(value) || 0
  }

  function nameOf(el) {
    if (el.hasAttribute('data-fig-pseudo')) {
      const host = el.parentElement
      return `${nameOf(host)}::${el.getAttribute('data-fig-pseudo')}`
    }
    let name = el.tagName.toLowerCase()
    if (el.id) name += `#${el.id}`
    const classes = [...el.classList].filter((c) => !c.startsWith('fig-'))
    if (classes.length) name += '.' + classes.join('.')
    return name
  }

  // Where a positioned element is painted: CSS paints positioned elements after the
  // others, and a higher z-index above a lower one.
  function layer(cs) {
    if (cs.position === 'static') return 0
    const z = parseInt(cs.zIndex, 10)
    if (Number.isNaN(z) || z === 0) return 1
    return z > 0 ? 1 + z : -1
  }

  function shadows(cs) {
    if (!cs.boxShadow || cs.boxShadow === 'none') return []
    const out = []
    // Split on the commas between shadows, not the ones inside rgb().
    for (const part of cs.boxShadow.split(/,(?![^(]*\))/)) {
      const c = part.match(/(rgba?\([^)]*\)|color\([^)]*\))/)
      const rest = part.replace(c ? c[0] : '', '').trim()
      const inset = /\binset\b/.test(rest)
      const n = rest.replace('inset', '').trim().split(/\s+/).map(parseFloat)
      const col = color(c ? c[0] : 'rgb(0,0,0)')
      if (!visible(col)) continue
      out.push({
        x: n[0] || 0,
        y: n[1] || 0,
        blur: n[2] || 0,
        spread: n[3] || 0,
        color: col,
        inset,
      })
    }
    return out
  }

  function borders(cs) {
    const sides = ['Top', 'Right', 'Bottom', 'Left'].map((side) => ({
      width:
        cs[`border${side}Style`] === 'none' || cs[`border${side}Style`] === 'hidden'
          ? 0
          : parseFloat(cs[`border${side}Width`]) || 0,
      color: color(cs[`border${side}Color`]),
      style: cs[`border${side}Style`],
    }))
    const shown = sides.filter((s) => s.width > 0 && visible(s.color))
    if (shown.length === 0) return null
    const first = shown[0]
    const same = shown.every(
      (s) =>
        s.style === first.style &&
        Math.abs(s.color.r - first.color.r) < 0.01 &&
        Math.abs(s.color.g - first.color.g) < 0.01 &&
        Math.abs(s.color.b - first.color.b) < 0.01 &&
        Math.abs(s.color.a - first.color.a) < 0.01,
    )
    const width = (s) => (s.width > 0 && visible(s.color) ? s.width : 0)
    const dash =
      first.style === 'dashed'
        ? [first.width * 3, first.width * 2]
        : first.style === 'dotted'
          ? [first.width, first.width]
          : null
    if (same) {
      return {
        color: first.color,
        top: width(sides[0]),
        right: width(sides[1]),
        bottom: width(sides[2]),
        left: width(sides[3]),
        dash,
      }
    }
    // Sides of different colours, as a banner's thick coloured left edge: Figma gives a
    // layer one stroke colour, so the commonest colour is the stroke, and each other side
    // is an accent, a strip build.js draws inside the box, clipped to its corners.
    const key = (c) =>
      `${c.r.toFixed(2)},${c.g.toFixed(2)},${c.b.toFixed(2)},${c.a.toFixed(2)}`
    const counts = {}
    for (const s of shown) counts[key(s.color)] = (counts[key(s.color)] || 0) + 1
    const main = shown.find(
      (s) => counts[key(s.color)] === Math.max(...Object.values(counts)),
    )
    const isMain = (s) => width(s) && key(s.color) === key(main.color)
    const names = ['top', 'right', 'bottom', 'left']
    const out = { color: main.color, dash: null, accents: [] }
    sides.forEach((s, i) => {
      out[names[i]] = isMain(s) ? s.width : 0
      if (width(s) && !isMain(s))
        out.accents.push({ side: names[i], width: s.width, color: s.color })
    })
    return out
  }

  function boxOf(el, cs, rect) {
    const node = {
      type: 'box',
      name: nameOf(el),
      x: rect.left,
      y: rect.top,
      w: rect.width,
      h: rect.height,
      fills: [],
      children: [],
    }
    const bg = color(cs.backgroundColor)
    if (visible(bg)) node.fills.push(bg)
    const border = borders(cs)
    if (border) node.border = border
    const radius = [
      cs.borderTopLeftRadius,
      cs.borderTopRightRadius,
      cs.borderBottomRightRadius,
      cs.borderBottomLeftRadius,
    ].map((r) =>
      Math.min(px(r.split(' ')[0], rect.width), rect.width / 2, rect.height / 2),
    )
    if (radius.some((r) => r > 0)) node.radius = radius
    const shadow = shadows(cs)
    if (shadow.length) node.shadows = shadow
    if (cs.overflowX !== 'visible' || cs.overflowY !== 'visible') node.clip = true
    if (border && border.accents && border.accents.length && node.radius) node.clip = true
    const opacity = parseFloat(cs.opacity)
    if (opacity < 1) node.opacity = opacity
    if (cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0) {
      const oc = color(cs.outlineColor)
      if (visible(oc)) {
        node.outline = {
          color: oc,
          width: parseFloat(cs.outlineWidth),
          offset: parseFloat(cs.outlineOffset) || 0,
        }
      }
    }
    if (cs.backgroundImage && cs.backgroundImage !== 'none') {
      const id = String(nextId++)
      el.setAttribute('data-fig-raster', id)
      rasters.push({
        id,
        mode: 'background',
        rect: [rect.left, rect.top, rect.width, rect.height],
      })
      node.raster = id
    }
    return node
  }

  function paints(cs) {
    if (visible(color(cs.backgroundColor))) return true
    if (cs.backgroundImage && cs.backgroundImage !== 'none') return true
    if (borders(cs)) return true
    if (shadows(cs).length) return true
    if (cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0) return true
    return false
  }

  // A run of text takes the font of the element it is in.
  function runStyle(cs, text) {
    const mono = /Roboto Mono/.test(cs.fontFamily)
    const decoration = cs.textDecorationLine || ''
    const run = {
      text,
      family: mono ? 'Roboto Mono' : 'Inter',
      weight: parseInt(cs.fontWeight, 10) || 400,
      italic: cs.fontStyle === 'italic' || cs.fontStyle.startsWith('oblique'),
      size: parseFloat(cs.fontSize),
      color: color(cs.color),
    }
    if (decoration.includes('underline')) run.decoration = 'UNDERLINE'
    else if (decoration.includes('line-through')) run.decoration = 'STRIKETHROUGH'
    if (cs.textTransform === 'uppercase') run.textCase = 'UPPER'
    else if (cs.textTransform === 'lowercase') run.textCase = 'LOWER'
    else if (cs.textTransform === 'capitalize') run.textCase = 'TITLE'
    const spacing = parseFloat(cs.letterSpacing)
    if (spacing) run.letterSpacing = spacing
    return run
  }

  function collapse(text, whiteSpace) {
    if (/^(pre|pre-wrap|break-spaces)$/.test(whiteSpace)) return text
    if (whiteSpace === 'pre-line')
      return text.replace(/[ \t]+/g, ' ').replace(/ ?\n ?/g, '\n')
    return text.replace(/\s+/g, ' ')
  }

  // An element whose text flows with its parent's: an inline element that draws nothing
  // of its own (strong, em, a, code, span), so its words become styled runs in the
  // parent's text layer rather than a layer of their own.
  function flowsInline(el) {
    if (el.tagName === 'BR') return true
    if (el instanceof SVGElement) return false
    if (
      RASTER_TAGS.test(el.tagName) ||
      /^(INPUT|SELECT|TEXTAREA|BUTTON)$/.test(el.tagName)
    )
      return false
    const cs = getComputedStyle(el)
    if (cs.display !== 'inline' || paints(cs)) return false
    for (const child of el.children) if (!flowsInline(child)) return false
    return true
  }

  function lineHeightOf(cs) {
    return cs.lineHeight === 'normal' ? null : parseFloat(cs.lineHeight)
  }

  // Groups client rects into lines: rects whose middles are close share a line.
  function lines(rects) {
    const out = []
    for (const r of rects) {
      const mid = r.top + r.height / 2
      const line = out.find((l) => Math.abs(l.mid - mid) < Math.max(3, r.height / 3))
      if (line) {
        line.left = Math.min(line.left, r.left)
        line.right = Math.max(line.right, r.right)
        line.top = Math.min(line.top, r.top)
        line.bottom = Math.max(line.bottom, r.bottom)
      } else out.push({ mid, left: r.left, right: r.right, top: r.top, bottom: r.bottom })
    }
    return out.sort((a, b) => a.top - b.top)
  }

  function contentBox(el, cs) {
    const r = el.getBoundingClientRect()
    const left = r.left + parseFloat(cs.borderLeftWidth) + parseFloat(cs.paddingLeft)
    const right = r.right - parseFloat(cs.borderRightWidth) - parseFloat(cs.paddingRight)
    const top = r.top + parseFloat(cs.borderTopWidth) + parseFloat(cs.paddingTop)
    const bottom =
      r.bottom - parseFloat(cs.borderBottomWidth) - parseFloat(cs.paddingBottom)
    return { left, top, width: right - left, height: bottom - top }
  }

  const ALIGN = {
    left: 'LEFT',
    start: 'LEFT',
    center: 'CENTER',
    right: 'RIGHT',
    end: 'RIGHT',
    justify: 'JUSTIFIED',
    '-webkit-center': 'CENTER',
  }

  // Turns a segment (text nodes in a row, with their runs) into one text layer, or into
  // one per line when the first line starts part-way across, as text after an inline
  // badge does: one layer could not start there.
  function textLayers(owner, cs, segment, alone) {
    let runs = []
    for (const run of segment.runs) {
      const last = runs[runs.length - 1]
      let text = run.text
      if (last && /[ ]$/.test(last.text) && text.startsWith(' ')) text = text.slice(1)
      if (text) runs.push({ ...run, text })
    }
    while (runs.length && /^[ ]/.test(runs[0].text)) {
      runs[0].text = runs[0].text.replace(/^ +/, '')
      if (!runs[0].text) runs.shift()
    }
    while (runs.length && / $/.test(runs[runs.length - 1].text)) {
      const last = runs[runs.length - 1]
      last.text = last.text.replace(/ +$/, '')
      if (!last.text) runs.pop()
    }
    if (!runs.length) return []

    const range = document.createRange()
    range.setStart(segment.nodes[0], 0)
    const end = segment.nodes[segment.nodes.length - 1]
    range.setEnd(end, end.nodeType === Node.TEXT_NODE ? end.length : 0)
    const rects = [...range.getClientRects()].filter((r) => r.width > 0 && r.height > 0)
    if (!rects.length) return []
    const ls = lines(rects)
    const align = ALIGN[cs.textAlign] || 'LEFT'
    const lh = lineHeightOf(cs)
    const first = ls[0]
    const lift = lh ? (lh - (first.bottom - first.top)) / 2 : 0
    const box = contentBox(owner, cs)
    const left = Math.min(...ls.map((l) => l.left))
    const right = Math.max(...ls.map((l) => l.right))

    const base = {
      type: 'text',
      name: nameOf(owner),
      runs,
      lineHeight: lh,
      align,
      y: first.top - lift,
    }
    if (ls.length === 1) {
      const width = right - left
      if (alone && align !== 'LEFT' && width < box.width - 4) {
        return [
          {
            ...base,
            x: box.left,
            w: box.width,
            h: first.bottom - first.top,
            autoResize: 'HEIGHT',
          },
        ]
      }
      return [
        {
          ...base,
          x: left,
          w: width,
          h: first.bottom - first.top,
          autoResize: 'WIDTH_AND_HEIGHT',
          align: 'LEFT',
        },
      ]
    }
    const startsInside =
      (align === 'LEFT' || align === 'JUSTIFIED') && first.left > left + 1
    if (!startsInside) {
      const x = alone ? box.left : left
      const w = alone ? box.width : right - left
      return [
        {
          ...base,
          x,
          w: w + 1,
          h: ls[ls.length - 1].bottom - first.top + lift * 2,
          autoResize: 'HEIGHT',
        },
      ]
    }
    // One layer per line: find which line each character sits on.
    const perLine = ls.map(() => [])
    let r = 0
    let offset = 0
    for (const node of segment.nodes) {
      if (node.nodeType !== Node.TEXT_NODE) continue
      const run = segment.runOf.get(node)
      for (let i = 0; i < node.length; i++) {
        const cr = document.createRange()
        cr.setStart(node, i)
        cr.setEnd(node, i + 1)
        const box1 = [...cr.getClientRects()].find((b) => b.width > 0)
        if (!box1) continue
        const mid = box1.top + box1.height / 2
        let line = ls.findIndex((l) => mid >= l.top - 1 && mid <= l.bottom + 1)
        if (line < 0) line = r
        r = line
        const list = perLine[line]
        const ch = collapse(node.data[i], run.whiteSpace)
        const lastRun = list[list.length - 1]
        if (lastRun && lastRun.src === run) lastRun.text += ch
        else list.push({ ...run.style, text: ch, src: run })
      }
      offset++
    }
    const out = []
    perLine.forEach((list, i) => {
      const text = list.map((x) => x.text).join('')
      if (!text.trim()) return
      const lineRuns = list.map(({ src, ...rest }) => rest)
      const l = ls[i]
      out.push({
        ...base,
        runs: lineRuns
          .map((x, j) => ({
            ...x,
            text:
              j === 0
                ? x.text.replace(/^\s+/, '')
                : j === lineRuns.length - 1
                  ? x.text.replace(/\s+$/, '')
                  : x.text,
          }))
          .filter((x) => x.text),
        x: l.left,
        y: l.top - lift,
        w: l.right - l.left,
        h: l.bottom - l.top,
        autoResize: 'WIDTH_AND_HEIGHT',
        align: 'LEFT',
      })
    })
    return out
  }

  // The value or placeholder shown in a text field, select or text area.
  function fieldText(el, cs) {
    let text = ''
    let style = cs
    if (el.tagName === 'SELECT') {
      const option = el.options[el.selectedIndex]
      text = option ? option.textContent.trim() : ''
    } else if (el.value) {
      text = el.type === 'password' ? '•'.repeat(el.value.length) : el.value
    } else if (el.placeholder) {
      text = el.placeholder
      style = getComputedStyle(el, '::placeholder')
    }
    if (!text) return null
    const box = contentBox(el, cs)
    const run = runStyle(cs, text)
    run.color = color(style.color) || run.color
    const multi = el.tagName === 'TEXTAREA'
    return {
      type: 'text',
      name: `${nameOf(el)} (text)`,
      runs: [run],
      lineHeight: lineHeightOf(cs),
      align: ALIGN[cs.textAlign] || 'LEFT',
      x: box.left,
      y: box.top,
      w: Math.max(box.width, 1),
      h: Math.max(box.height, 1),
      autoResize: 'NONE',
      verticalAlign: multi ? 'TOP' : 'CENTER',
    }
  }

  // A computed paint value as plain SVG: a colour as hex, with its alpha moved into
  // fill-opacity or stroke-opacity, and lengths without "px". Figma's SVG import reads
  // these surely; rgba() and "6px, 4px" it may not.
  function svgValue(prop, value, copy) {
    if (prop === 'fill' || prop === 'stroke') {
      if (value === 'none' || value.startsWith('url(')) return value
      const c = color(value)
      if (!c || c.a <= 0.001) return 'none'
      if (c.a < 1) {
        const key = `${prop}-opacity`
        const was = parseFloat(copy.getAttribute(key) || '1')
        copy.setAttribute(key, String(+(was * c.a).toFixed(3)))
      }
      const hex = (v) =>
        Math.round(v * 255)
          .toString(16)
          .padStart(2, '0')
      return `#${hex(c.r)}${hex(c.g)}${hex(c.b)}`
    }
    if (prop === 'stroke-width') return String(parseFloat(value))
    if (prop === 'stroke-dasharray') {
      return value === 'none'
        ? 'none'
        : value
            .split(/[\s,]+/)
            .map(parseFloat)
            .join(' ')
    }
    return value
  }

  // An inline SVG, with its computed paint written into it, its markers drawn as plain
  // shapes (Figma's SVG import drops markers), and its <text> taken out to become real
  // text layers.
  function svgOf(el, rect) {
    // Opacities first: a colour with alpha multiplies into the opacity already written.
    const PAINT = [
      'fill-opacity',
      'stroke-opacity',
      'opacity',
      'fill',
      'stroke',
      'stroke-width',
      'stroke-linecap',
      'stroke-linejoin',
      'stroke-dasharray',
      'fill-rule',
    ]
    const texts = []
    const textOf = new Map()
    const clone = el.cloneNode(true)
    const originals = [el, ...el.querySelectorAll('*')]
    const copies = [clone, ...clone.querySelectorAll('*')]
    originals.forEach((orig, i) => {
      const copy = copies[i]
      if (orig.tagName === 'marker' || orig.closest('marker')) return
      const cs = getComputedStyle(orig)
      for (const prop of PAINT) {
        let value = cs.getPropertyValue(prop)
        if (!value) continue
        if (value.includes('currentcolor') || value.includes('currentColor'))
          value = cs.color
        copy.setAttribute(prop, svgValue(prop, value, copy))
      }
      copy.removeAttribute('style')
      copy.removeAttribute('class')
      if (orig.tagName === 'text') {
        const r = orig.getBoundingClientRect()
        const run = runStyle(cs, orig.textContent)
        run.color = color(cs.fill) || run.color
        const halo = parseFloat(cs.strokeWidth)
        const node = {
          type: 'text',
          name: `${nameOf(el)} label`,
          runs: [run],
          lineHeight: null,
          align: 'LEFT',
          x: r.left,
          y: r.top,
          w: r.width,
          h: r.height,
          autoResize: 'WIDTH_AND_HEIGHT',
        }
        const haloColor = color(cs.stroke)
        if (cs.paintOrder.startsWith('stroke') && halo > 0 && visible(haloColor)) {
          node.stroke = { color: haloColor, weight: halo / 2 }
        }
        copy.setAttribute('data-fig-text', String(texts.length))
        textOf.set(orig, texts.length)
        texts.push({ node, rect: r, top: orig.parentNode === el })
      }
      const end = orig.getAttribute && orig.getAttribute('marker-end')
      if (end && orig.getTotalLength) {
        const id = end.match(/#([^)'"]+)/)
        const marker = id && el.querySelector(`marker#${CSS.escape(id[1])}`)
        if (marker) {
          const length = orig.getTotalLength()
          const tip = orig.getPointAtLength(length)
          const back = orig.getPointAtLength(Math.max(0, length - 0.5))
          const angle = (Math.atan2(tip.y - back.y, tip.x - back.x) * 180) / Math.PI
          const vb = (marker.getAttribute('viewBox') || '0 0 10 10')
            .split(/[\s,]+/)
            .map(Number)
          const scale = (parseFloat(marker.getAttribute('markerWidth')) || 3) / vb[2]
          const refX = parseFloat(marker.getAttribute('refX')) || 0
          const refY = parseFloat(marker.getAttribute('refY')) || 0
          const g = document.createElementNS('http://www.w3.org/2000/svg', 'g')
          g.setAttribute(
            'transform',
            `translate(${tip.x} ${tip.y}) rotate(${angle}) scale(${scale}) translate(${-refX} ${-refY})`,
          )
          for (const part of marker.children) {
            const shape = part.cloneNode(true)
            const pcs = getComputedStyle(part)
            shape.setAttribute('fill', svgValue('fill', pcs.fill, shape))
            shape.setAttribute('stroke', svgValue('stroke', pcs.stroke, shape))
            shape.removeAttribute('style')
            g.appendChild(shape)
          }
          copy.parentNode.insertBefore(g, copy.nextSibling)
        }
        copy.removeAttribute('marker-end')
      }
    })
    for (const m of clone.querySelectorAll('marker')) m.remove()
    for (const d of clone.querySelectorAll('defs')) if (!d.children.length) d.remove()
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
    clone.setAttribute('width', String(rect.width))
    clone.setAttribute('height', String(rect.height))
    if (!clone.getAttribute('viewBox')) {
      clone.setAttribute('viewBox', `0 0 ${rect.width} ${rect.height}`)
    }

    // The text layers go above the drawing, unless a filled shape drawn after a text
    // covers it, as the torn corner of a scanned grade report covers its last grades.
    // Then the drawing is cut into pieces around its texts, so the order holds.
    const tops = [...el.children]
    const topOf = (node) => {
      while (node.parentNode !== el) node = node.parentNode
      return tops.indexOf(node)
    }
    const covered = [...textOf.keys()].some((text) => {
      const t = texts[textOf.get(text)]
      return tops.slice(topOf(text) + 1).some((later) => {
        if (later.tagName === 'text' || later.tagName === 'g') return false
        const fill = color(getComputedStyle(later).fill)
        if (!visible(fill)) return false
        const b = later.getBoundingClientRect()
        return (
          b.left < t.rect.right &&
          b.right > t.rect.left &&
          b.top < t.rect.bottom &&
          b.bottom > t.rect.top
        )
      })
    })
    const piece = (children) => {
      const shell = clone.cloneNode(false)
      const defs = clone.querySelector(':scope > defs')
      if (defs) shell.appendChild(defs.cloneNode(true))
      for (const child of children) shell.appendChild(child.cloneNode(true))
      return {
        type: 'svg',
        name: nameOf(el),
        x: rect.left,
        y: rect.top,
        w: rect.width,
        h: rect.height,
        svg: new XMLSerializer().serializeToString(shell),
      }
    }
    const layers = []
    if (covered) {
      // A top-level element holding texts (a text, or a group of them) ends a piece; its
      // texts follow it, and the next piece starts after them.
      let run = []
      for (const child of [...clone.children]) {
        if (child.tagName === 'defs') continue
        const inside = child.hasAttribute('data-fig-text')
          ? [child]
          : [...child.querySelectorAll('[data-fig-text]')]
        if (!inside.length) {
          run.push(child)
          continue
        }
        for (const t of inside) if (t !== child) t.remove()
        if (child.tagName !== 'text') run.push(child)
        if (run.length) layers.push(piece(run))
        run = []
        for (const t of inside)
          layers.push(texts[Number(t.getAttribute('data-fig-text'))].node)
      }
      if (run.length) layers.push(piece(run))
    } else {
      for (const copy of clone.querySelectorAll('[data-fig-text]')) copy.remove()
      layers.push(piece([...clone.children].filter((c) => c.tagName !== 'defs')))
      for (const t of texts) layers.push(t.node)
    }
    return layers
  }

  // Walks one element. `out` is the list its layers go into: its own box's children if
  // it draws a box, or else its parent's (an element that draws nothing adds no layer).
  function walk(el, out, key) {
    const cs = getComputedStyle(el)
    if (cs.display === 'none') return
    const rect = el.getBoundingClientRect()
    const shown = cs.visibility === 'visible'
    const order = key === undefined ? layer(cs) : key

    if (el instanceof SVGElement) {
      if (!shown || rect.width === 0 || rect.height === 0) return
      // An icon can have a background and padding of its own, as the pill behind the
      // active tab's icon: the box gets the paint, the drawing sits in its content box.
      let into = out
      if (paints(cs)) {
        const box = boxOf(el, cs, rect)
        box.order = order
        out.push(box)
        into = box.children
      }
      const inner = contentBox(el, cs)
      for (const piece of svgOf(el, inner))
        into.push({ ...piece, order: into === out ? order : 0 })
      return
    }
    if (
      RASTER_TAGS.test(el.tagName) ||
      (el.tagName === 'INPUT' && RASTER_INPUTS.test(el.type))
    ) {
      if (!shown || rect.width === 0 || rect.height === 0) return
      const id = String(nextId++)
      el.setAttribute('data-fig-raster', id)
      rasters.push({
        id,
        mode: 'element',
        rect: [rect.left, rect.top, rect.width, rect.height],
      })
      out.push({
        type: 'image',
        name: nameOf(el),
        x: rect.left,
        y: rect.top,
        w: rect.width,
        h: rect.height,
        raster: id,
        order,
      })
      return
    }

    const opacity = parseFloat(cs.opacity)
    const clips = cs.overflowX !== 'visible' || cs.overflowY !== 'visible'
    const draws = shown && paints(cs)
    let into = out
    if (rect.width > 0 && rect.height > 0 && (draws || clips || opacity < 1)) {
      const box = boxOf(el, cs, rect)
      if (!shown) {
        box.fills = []
        delete box.border
        delete box.shadows
        delete box.outline
        delete box.raster
      }
      box.order = order
      out.push(box)
      into = box.children
    }

    if (/^(INPUT|SELECT|TEXTAREA)$/.test(el.tagName)) {
      if (shown && (el.tagName !== 'INPUT' || TEXT_INPUTS.test(el.type))) {
        const t = fieldText(el, cs)
        if (t) into.push({ ...t, order: 0 })
      }
      return
    }

    // The element's own text, in segments broken by the children that draw a box.
    const hasText = [...el.childNodes].some(
      (n) => n.nodeType === Node.TEXT_NODE && n.data.trim(),
    )
    let segment = null
    let segments = 0
    const flush = () => {
      if (segment && segment.nodes.length) {
        segments++
        segment.done = true
      }
    }
    const pending = []
    const children = []
    const addText = (node, styleEl) => {
      const scs = getComputedStyle(styleEl)
      if (scs.visibility !== 'visible') return
      if (!segment || segment.done) {
        segment = { runs: [], nodes: [], runOf: new Map() }
        pending.push(segment)
      }
      const text = collapse(node.data, scs.whiteSpace)
      const run = { style: runStyle(scs, ''), whiteSpace: scs.whiteSpace }
      segment.runs.push(runStyle(scs, text))
      segment.nodes.push(node)
      segment.runOf.set(node, run)
    }
    const addInline = (inline) => {
      for (const n of inline.childNodes) {
        if (n.nodeType === Node.TEXT_NODE) addText(n, inline)
        else if (n.nodeType === Node.ELEMENT_NODE) {
          if (n.tagName === 'BR') {
            if (segment && !segment.done)
              segment.runs.push({ ...runStyle(getComputedStyle(inline), '\n') })
          } else addInline(n)
        }
      }
    }
    for (const n of el.childNodes) {
      if (n.nodeType === Node.TEXT_NODE) {
        if (hasText || n.data.trim()) addText(n, el)
      } else if (n.nodeType === Node.ELEMENT_NODE) {
        if (hasText && flowsInline(n)) {
          if (n.tagName === 'BR') {
            if (segment && !segment.done) segment.runs.push(runStyle(cs, '\n'))
          } else addInline(n)
        } else {
          flush()
          children.push(n)
          pending.push(n)
        }
      }
    }
    flush()
    const alone = pending.length === 1 && !(pending[0] instanceof Element)
    for (const item of pending) {
      if (item instanceof Element) walk(item, into)
      else for (const t of textLayers(el, cs, item, alone)) into.push({ ...t, order: 0 })
    }
  }

  function sort(list) {
    list.forEach((node, i) => (node.index = i))
    list.sort((a, b) => a.order - b.order || a.index - b.index)
    for (const node of list) {
      delete node.order
      delete node.index
      if (node.children) sort(node.children)
    }
  }

  const children = []
  for (const el of document.body.children) walk(el, children)
  sort(children)
  const bodyBg = color(getComputedStyle(document.body).backgroundColor)
  const htmlBg = color(getComputedStyle(document.documentElement).backgroundColor)
  return {
    width: document.documentElement.scrollWidth,
    height: document.documentElement.scrollHeight,
    background: visible(bodyBg)
      ? bodyBg
      : visible(htmlBg)
        ? htmlBg
        : { r: 1, g: 1, b: 1, a: 1 },
    children,
    rasters,
    warnings,
  }
}

// Shows one element alone, so a screenshot of its box holds only it: for 'element', the
// whole element; for 'background', only its background image.
function solo({ id, mode }) {
  document.documentElement.setAttribute('data-fig-solo', mode || '')
  for (const el of document.querySelectorAll('[data-fig-solo-on]')) {
    el.removeAttribute('data-fig-solo-on')
  }
  if (!id) {
    document.documentElement.removeAttribute('data-fig-solo')
    return
  }
  document.querySelector(`[data-fig-raster="${id}"]`).setAttribute('data-fig-solo-on', '')
}

const SOLO_CSS = `
html[data-fig-solo], html[data-fig-solo] body { background: transparent !important; }
html[data-fig-solo] * { visibility: hidden !important; }
html[data-fig-solo='element'] [data-fig-solo-on],
html[data-fig-solo='element'] [data-fig-solo-on] * { visibility: visible !important; }
html[data-fig-solo='background'] [data-fig-solo-on] {
  visibility: visible !important;
  background-color: transparent !important;
  border-color: transparent !important;
  box-shadow: none !important;
  outline: none !important;
  color: transparent !important;
}
html[data-fig-solo='background'] [data-fig-solo-on] * { visibility: hidden !important; }
`

// ---------------------------------------------------------------------------------------
// In Node.

async function exportView(browser, file, view) {
  const page = await browser.newPage({
    viewport: { width: view.width, height: view.height },
    deviceScaleFactor: 2,
  })
  const query = view.state ? `?state=${encodeURIComponent(view.state)}` : ''
  await page.goto(pathToFileURL(resolve(file)).href + query, { waitUntil: 'networkidle' })
  await settle(page)
  await page.evaluate(prepare)
  await page.addStyleTag({ url: FONT_CSS }).catch(() => {})
  await page.addStyleTag({
    content:
      "*{font-family:'Inter',sans-serif!important}[data-fig-mono],[data-fig-mono] *{font-family:'Roboto Mono',monospace!important}",
  })
  const fontsOk = await page.evaluate(async () => {
    const wanted = [400, 500, 600, 700].flatMap((w) => [
      `${w} 16px Inter`,
      `italic ${w} 16px Inter`,
      `${w} 16px "Roboto Mono"`,
    ])
    await Promise.all(wanted.map((f) => document.fonts.load(f).catch(() => null)))
    await document.fonts.ready
    return (
      document.fonts.check('400 16px Inter') && document.fonts.check('700 16px Inter')
    )
  })
  if (!fontsOk) {
    throw new Error(
      'Inter could not be loaded. Connect to the internet (it comes from Google Fonts) or install Inter, then run again.',
    )
  }
  // A swimlane routes its arrows around its boxes when it loads, and again on resize
  // (02-swimlanes/_swimlane.js). The boxes changed size with the font, so route again.
  await page.evaluate(() => window.dispatchEvent(new Event('resize')))
  await settle(page)

  // As render.mjs does: a swimlane wider than its width is widened; a screen is made as
  // tall as its page, so a bar fixed to the bottom is drawn at the bottom.
  const full = await page.evaluate(() => ({
    width: document.documentElement.scrollWidth,
    height: document.documentElement.scrollHeight,
  }))
  const warnings = []
  if (view.device && full.width > view.width) {
    warnings.push(
      `scrolls sideways in Inter: ${full.width} px wide on a ${view.width} px ${view.device}`,
    )
  }
  const width = view.device ? view.width : Math.max(view.width, full.width)
  const height = Math.max(view.height, full.height)
  if (width !== view.width || height !== view.height) {
    await page.setViewportSize({ width, height })
    await settle(page)
  }

  const tree = await page.evaluate(collect)
  await page.addStyleTag({ content: SOLO_CSS })
  const images = {}
  for (const job of tree.rasters) {
    await page.evaluate(solo, job)
    const [x, y, w, h] = job.rect
    const png = await page.screenshot({
      clip: { x, y, width: Math.max(w, 1), height: Math.max(h, 1) },
      omitBackground: true,
    })
    images[job.id] = png.toString('base64')
  }
  await page.evaluate(solo, {})
  await page.close()

  return {
    version: 1,
    source: relative(ROOT, file).split(sep).join('/'),
    folder: view.folder,
    drawing: view.drawing,
    state: view.state,
    device: view.device,
    frame: view.frame,
    width,
    height: view.device ? height : Math.max(height, full.height),
    background: tree.background,
    children: tree.children,
    images,
    warnings: [...warnings, ...new Set(tree.warnings)],
  }
}

export function viewsOf(file) {
  const html = readFileSync(file, 'utf8')
  const folder = folderOf(file)
  const drawing = file
    .split(sep)
    .pop()
    .replace(/\.html$/, '')
  if (!SCREEN_FOLDERS.includes(folder)) {
    return [
      {
        folder,
        drawing,
        state: null,
        device: null,
        frame: drawing,
        width: Number(meta(html, 'render-width')) || DEFAULT_WIDTH,
        height: Number(meta(html, 'render-height')) || DEFAULT_HEIGHT,
      },
    ]
  }
  const states = (meta(html, 'render-states') || '').split(/\s+/).filter(Boolean)
  return (states.length ? states : [null]).flatMap((state) =>
    DEVICES.map((device) => ({
      folder,
      drawing,
      state,
      device: device.name,
      frame: `${drawing}${state ? `--${state}` : ''}.${device.name}`,
      width: device.width,
      height: device.height,
    })),
  )
}

async function main() {
  const targets = process.argv.slice(2)
  const files = (
    targets.length
      ? targets
      : FOLDERS.map((f) => join(ROOT, f)).filter((f) => existsSync(f))
  )
    .flatMap(drawingsIn)
    .filter((f) => folderOf(f))
  if (files.length === 0) {
    console.log('No drawings to export.')
    return
  }

  const indexFile = join(EXPORT_DIR, 'index.json')
  const index = existsSync(indexFile)
    ? JSON.parse(readFileSync(indexFile, 'utf8'))
    : { views: [] }
  const browser = await launchBrowser()
  let count = 0
  const warned = []
  try {
    for (const file of files) {
      for (const view of viewsOf(file)) {
        const result = await exportView(browser, file, view)
        const out = join(EXPORT_DIR, view.folder, `${view.frame}.json`)
        mkdirSync(dirname(out), { recursive: true })
        writeFileSync(out, JSON.stringify(result))
        const entry = {
          folder: view.folder,
          drawing: view.drawing,
          state: view.state,
          device: view.device,
          frame: view.frame,
          width: result.width,
          height: result.height,
          file: relative(EXPORT_DIR, out).split(sep).join('/'),
        }
        index.views = index.views.filter(
          (v) => !(v.folder === entry.folder && v.frame === entry.frame),
        )
        index.views.push(entry)
        count++
        for (const w of result.warnings) warned.push(`${view.folder}/${view.frame}: ${w}`)
        console.log(
          `${relative(ROOT, file)}${view.state ? `?state=${view.state}` : ''} ${view.device || ''} -> ${relative(ROOT, out)}`,
        )
      }
    }
  } finally {
    await browser.close()
  }
  index.views.sort((a, b) =>
    `${a.folder}/${a.drawing}`.localeCompare(`${b.folder}/${b.drawing}`),
  )
  index.exportedAt = new Date().toISOString()
  mkdirSync(EXPORT_DIR, { recursive: true })
  writeFileSync(indexFile, JSON.stringify(index, null, 2))
  console.log(`\n${count} view(s) exported to ${relative(ROOT, EXPORT_DIR)}`)
  if (warned.length) {
    console.log(`\n${warned.length} warning(s):`)
    for (const w of warned) console.log(`  ${w}`)
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main()
}
