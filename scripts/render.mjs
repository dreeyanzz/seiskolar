// Renders every HTML drawing in 02-swimlanes, 03-low-fidelity and 04-high-fidelity
// to the PNG beside it, so a pull request shows the picture.
//
//   npm run render                       every drawing
//   npm run render -- <file or folder>   only those
//
// It drives a browser already on this machine, Microsoft Edge and then Google
// Chrome, through playwright-core, so nothing is downloaded. To use another
// Chromium-based browser, set RENDER_BROWSER to its executable's path.
//
// A drawing sets its width in its <head>, for example
//   <meta name="render-width" content="390" />
// and the default is 1440. The height is the whole page, taken at 2x.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { chromium } from 'playwright-core'

const FOLDERS = ['02-swimlanes', '03-low-fidelity', '04-high-fidelity']
const DEFAULT_WIDTH = 1440

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

function widthOf(file) {
  const html = readFileSync(file, 'utf8')
  const meta = html.match(/<meta\s+name=["']render-width["']\s+content=["'](\d+)["']/i)
  return meta ? Number(meta[1]) : DEFAULT_WIDTH
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

const targets = process.argv.slice(2)
const files = (targets.length ? targets : FOLDERS.filter((f) => existsSync(f))).flatMap(
  drawingsIn,
)

if (files.length === 0) {
  console.log('No drawings to render.')
  process.exit(0)
}

const browser = await launchBrowser()
try {
  for (const file of files) {
    const page = await browser.newPage({
      viewport: { width: widthOf(file), height: 800 },
      deviceScaleFactor: 2,
    })
    await page.goto(pathToFileURL(resolve(file)).href, { waitUntil: 'networkidle' })
    await page.evaluate(async () => {
      await document.fonts.ready
    })
    const png = file.replace(/\.html$/, '.png')
    await page.screenshot({ path: png, fullPage: true })
    await page.close()
    console.log(`${relative('.', file)} -> ${relative('.', png)}`)
  }
} finally {
  await browser.close()
}
