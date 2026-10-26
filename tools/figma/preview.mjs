// Draws exported layer trees (export.mjs) back into a browser, by the same rules build.js
// follows in Figma, and saves a picture of each, so an agent can check an export before
// it goes to Figma, and without Figma: if the preview matches the drawing's PNG, the
// export holds everything the frame needs.
//
//   npm run figma:preview                    every exported view
//   npm run figma:preview -- <frame name>…   only those, e.g. scholar-dashboard.phone
//
// Pictures go to tools/figma/.out/preview/<folder>/<frame>.png. They are set in Inter, as
// the Figma frames are, so they differ from the drawings' PNGs only in the font. Uses the
// same browser as export.mjs (Edge, Chrome, or RENDER_BROWSER).
import { existsSync, mkdirSync, readFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright-core'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(HERE, '..', '..')
const EXPORT_DIR = join(HERE, '.out', 'export')
const PREVIEW_DIR = join(HERE, '.out', 'preview')

const FONT_CSS =
  'https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,100..900;1,100..900&family=Roboto+Mono:ital,wght@0,100..700;1,100..700&display=block'

function rgba(c) {
  return `rgba(${Math.round(c.r * 255)},${Math.round(c.g * 255)},${Math.round(c.b * 255)},${c.a})`
}

function escapeHtml(text) {
  return text.replace(
    /[&<>"]/g,
    (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[ch],
  )
}

const CASE = { UPPER: 'uppercase', LOWER: 'lowercase', TITLE: 'capitalize' }
const DECORATION = { UNDERLINE: 'underline', STRIKETHROUGH: 'line-through' }

function node(n, ox, oy, images) {
  const pos = `position:absolute;left:${n.x - ox}px;top:${n.y - oy}px;`
  if (n.type === 'box') {
    const style = [pos, `width:${n.w}px;height:${n.h}px;box-sizing:border-box;`]
    if (n.fills.length) style.push(`background:${rgba(n.fills[n.fills.length - 1])};`)
    if (n.raster && images[n.raster]) {
      style.push(
        `background-image:url(data:image/png;base64,${images[n.raster]});background-size:100% 100%;`,
      )
    }
    if (n.border && n.border.color) {
      const b = n.border
      const kind = b.dash ? 'dashed' : 'solid'
      style.push(
        `border-style:${kind};border-color:${rgba(b.color)};border-width:${b.top}px ${b.right}px ${b.bottom}px ${b.left}px;`,
      )
    }
    if (n.radius) style.push(`border-radius:${n.radius.map((r) => r + 'px').join(' ')};`)
    if (n.shadows) {
      style.push(
        `box-shadow:${n.shadows
          .map(
            (s) =>
              `${s.inset ? 'inset ' : ''}${s.x}px ${s.y}px ${s.blur}px ${s.spread}px ${rgba(s.color)}`,
          )
          .join(',')};`,
      )
    }
    if (n.outline)
      style.push(
        `outline:${n.outline.width}px solid ${rgba(n.outline.color)};outline-offset:${n.outline.offset}px;`,
      )
    if (n.clip) style.push('overflow:hidden;')
    if (n.opacity !== undefined) style.push(`opacity:${n.opacity};`)
    // Accents are positioned from the box's outer edge, as build.js draws them.
    const accents = ((n.border && n.border.accents) || [])
      .map((a) => {
        const at = {
          top: `left:0;top:0;width:${n.w}px;height:${a.width}px`,
          right: `left:${n.w - a.width}px;top:0;width:${a.width}px;height:${n.h}px`,
          bottom: `left:0;top:${n.h - a.width}px;width:${n.w}px;height:${a.width}px`,
          left: `left:0;top:0;width:${a.width}px;height:${n.h}px`,
        }[a.side]
        const b = n.border
        return `<div style="position:absolute;margin:-${b.top}px 0 0 -${b.left}px;${at};background:${rgba(a.color)}"></div>`
      })
      .join('')
    // Children are positioned from the outer edge too, not from inside the border.
    const bx = n.border && n.border.color ? n.border.left : 0
    const by = n.border && n.border.color ? n.border.top : 0
    const inner = n.children.map((c) => node(c, n.x + bx, n.y + by, images)).join('')
    return `<div title="${escapeHtml(n.name)}" style="${style.join('')}">${accents}${inner}</div>`
  }
  if (n.type === 'text') {
    const style = [
      pos,
      `margin:0;text-align:${n.align.toLowerCase().replace('justified', 'justify')};`,
    ]
    style.push(n.lineHeight ? `line-height:${n.lineHeight}px;` : 'line-height:normal;')
    if (n.autoResize === 'WIDTH_AND_HEIGHT') style.push('white-space:pre;')
    else style.push(`white-space:pre-wrap;width:${n.w}px;`)
    if (n.autoResize === 'NONE') {
      style.push(
        `height:${n.h}px;display:flex;align-items:${n.verticalAlign === 'CENTER' ? 'center' : 'flex-start'};overflow:hidden;`,
      )
    }
    if (n.stroke)
      style.push(
        `-webkit-text-stroke:${n.stroke.weight * 2}px ${rgba(n.stroke.color)};paint-order:stroke fill;`,
      )
    const spans = n.runs
      .map((r) => {
        const s = [
          `font-family:'${r.family}';font-weight:${r.weight};font-size:${r.size}px;`,
          r.italic ? 'font-style:italic;' : '',
          r.color ? `color:${rgba(r.color)};` : '',
          r.decoration ? `text-decoration:${DECORATION[r.decoration]};` : '',
          r.textCase ? `text-transform:${CASE[r.textCase]};` : '',
          r.letterSpacing ? `letter-spacing:${r.letterSpacing}px;` : '',
        ].join('')
        return `<span style="${s}">${escapeHtml(r.text)}</span>`
      })
      .join('')
    const body =
      n.autoResize === 'NONE' ? `<div style="width:100%">${spans}</div>` : spans
    return `<div title="${escapeHtml(n.name)}" style="${style.join('')}">${body}</div>`
  }
  if (n.type === 'svg') {
    return `<div title="${escapeHtml(n.name)}" style="${pos}width:${n.w}px;height:${n.h}px;line-height:0;overflow:visible">${n.svg}</div>`
  }
  if (n.type === 'image') {
    return `<img alt="" style="${pos}width:${n.w}px;height:${n.h}px" src="data:image/png;base64,${images[n.raster] || ''}">`
  }
  return ''
}

export function previewHtml(view) {
  const body = view.children.map((c) => node(c, 0, 0, view.images)).join('')
  return `<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="${FONT_CSS}"><style>html,body{margin:0}body{position:relative;width:${view.width}px;height:${view.height}px;background:${rgba(view.background)};overflow:hidden}svg{overflow:visible}</style></head><body>${body}</body></html>`
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

async function main() {
  const indexFile = join(EXPORT_DIR, 'index.json')
  if (!existsSync(indexFile)) {
    console.error('Nothing exported yet. Run: npm run figma:export')
    process.exit(1)
  }
  const wanted = process.argv.slice(2)
  const views = JSON.parse(readFileSync(indexFile, 'utf8')).views.filter(
    (v) => wanted.length === 0 || wanted.includes(v.frame),
  )
  const browser = await launchBrowser()
  try {
    for (const entry of views) {
      const view = JSON.parse(readFileSync(join(EXPORT_DIR, entry.file), 'utf8'))
      const page = await browser.newPage({
        viewport: { width: view.width, height: view.height },
        deviceScaleFactor: entry.device === 'phone' || !entry.device ? 2 : 1,
      })
      await page.setContent(previewHtml(view), { waitUntil: 'networkidle' })
      await page.evaluate(async () => {
        await document.fonts.ready
      })
      const out = join(PREVIEW_DIR, entry.folder, `${entry.frame}.png`)
      mkdirSync(dirname(out), { recursive: true })
      await page.screenshot({ path: out, fullPage: true })
      await page.close()
      console.log(`${entry.folder}/${entry.frame} -> ${relative(ROOT, out)}`)
    }
  } finally {
    await browser.close()
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main()
}
