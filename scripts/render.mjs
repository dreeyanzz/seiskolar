// Renders every HTML drawing in 02-swimlanes, 03-low-fidelity and 04-high-fidelity
// to PNG pictures beside it, so a pull request shows them.
//
//   npm run render                       every drawing
//   npm run render -- <file or folder>   only those
//
// It drives a browser already on this machine, Microsoft Edge and then Google
// Chrome, through playwright-core, so nothing is downloaded. To use another
// Chromium-based browser, set RENDER_BROWSER to its executable's path.
//
// A swimlane becomes one picture, name.png, taken at 2x. It sets its width in its
// <head>, for example <meta name="render-width" content="1600" />, and the default is
// 1440; a wider drawing is widened to fit rather than cut off. Its height is the whole
// page, but never less than its render-height (default 800).
//
// A screen, anything in 03-low-fidelity or 04-high-fidelity, becomes one picture per
// device: name.phone.png (360 wide, at 2x), name.tablet.png (768, 1x) and
// name.desktop.png (1440, 1x), each the whole page. A screen with states lists them,
// <meta name="render-states" content="returned verified" />; each state is opened as
// name.html?state=returned and saved as name--returned.phone.png and so on. A screen
// that scrolls sideways on a device is reported as an error, not widened, because
// nothing may scroll sideways at 360 px (SRS NFR-ACC-001).
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, resolve, sep } from 'node:path'
import { pathToFileURL } from 'node:url'
import { chromium } from 'playwright-core'

const FOLDERS = ['02-swimlanes', '03-low-fidelity', '04-high-fidelity']
const SCREEN_FOLDERS = ['03-low-fidelity', '04-high-fidelity']
const DEVICES = [
  { name: 'phone', width: 360, height: 800, scale: 2 },
  { name: 'tablet', width: 768, height: 1024, scale: 1 },
  { name: 'desktop', width: 1440, height: 900, scale: 1 },
]
const DEFAULT_WIDTH = 1440
const DEFAULT_HEIGHT = 800

function drawingsIn(path) {
  if (!existsSync(path)) {
    console.error(`not found: ${path}`)
    process.exit(1)
  }
  if (statSync(path).isFile()) return path.endsWith('.html') ? [path] : []
  return readdirSync(path, { withFileTypes: true }).flatMap((entry) => {
    const child = join(path, entry.name)
    if (entry.isDirectory()) return drawingsIn(child)
    return entry.name.endsWith('.html') ? [child] : []
  })
}

function meta(html, name) {
  const found = html.match(
    new RegExp(`<meta\\s+name=["']${name}["']\\s+content=["']([^"']*)["']`, 'i'),
  )
  return found ? found[1] : null
}

function isScreen(file) {
  return resolve(file)
    .split(sep)
    .some((part) => SCREEN_FOLDERS.includes(part))
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

// Wait for fonts, then for two frames, so anything the page draws on load is drawn.
async function settle(page) {
  await page.evaluate(async () => {
    await document.fonts.ready
  })
  await page.evaluate(
    () => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done))),
  )
}

async function renderSwimlane(browser, file, html) {
  const size = {
    width: Number(meta(html, 'render-width')) || DEFAULT_WIDTH,
    height: Number(meta(html, 'render-height')) || DEFAULT_HEIGHT,
  }
  const page = await browser.newPage({ viewport: size, deviceScaleFactor: 2 })
  await page.goto(pathToFileURL(resolve(file)).href, { waitUntil: 'networkidle' })
  await settle(page)
  const fullWidth = await page.evaluate(() => document.documentElement.scrollWidth)
  if (fullWidth > size.width) {
    await page.setViewportSize({ width: fullWidth, height: size.height })
    await settle(page)
  }
  const png = file.replace(/\.html$/, '.png')
  await page.screenshot({ path: png, fullPage: true })
  await page.close()
  console.log(`${relative('.', file)} -> ${relative('.', png)}`)
}

async function renderScreen(browser, file, html, problems) {
  const states = (meta(html, 'render-states') || '').split(/\s+/).filter(Boolean)
  const base = file.replace(/\.html$/, '')
  for (const state of states.length ? states : [null]) {
    for (const device of DEVICES) {
      const page = await browser.newPage({
        viewport: { width: device.width, height: device.height },
        deviceScaleFactor: device.scale,
      })
      const query = state ? `?state=${encodeURIComponent(state)}` : ''
      await page.goto(pathToFileURL(resolve(file)).href + query, {
        waitUntil: 'networkidle',
      })
      await settle(page)
      const fullWidth = await page.evaluate(() => document.documentElement.scrollWidth)
      if (fullWidth > device.width) {
        problems.push(
          `${relative('.', file)}${state ? ` (${state})` : ''} scrolls sideways on a ${device.name}: ${fullWidth} px wide`,
        )
      }
      const png = `${base}${state ? `--${state}` : ''}.${device.name}.png`
      await page.screenshot({ path: png, fullPage: true })
      await page.close()
      console.log(`${relative('.', file)}${query} -> ${relative('.', png)}`)
    }
  }
}

const targets = process.argv.slice(2)
const files = (targets.length ? targets : FOLDERS.filter((f) => existsSync(f))).flatMap(
  drawingsIn,
)

if (files.length === 0) {
  console.log('No drawings to render.')
  process.exit(0)
}

const problems = []
const browser = await launchBrowser()
try {
  for (const file of files) {
    const html = readFileSync(file, 'utf8')
    if (isScreen(file)) await renderScreen(browser, file, html, problems)
    else await renderSwimlane(browser, file, html)
  }
} finally {
  await browser.close()
}

if (problems.length) {
  console.error(`\n${problems.length} screen(s) scroll sideways:`)
  for (const problem of problems) console.error(`  ${problem}`)
  process.exit(1)
}
