// A stand-in for Figma's Plugin API, for `npm run figma:import -- --dry-run`. It runs
// build.js in Node, as the bridge's plugin would (plugin/code.js, the `run` command), and
// throws where Figma would refuse a value: a size of zero, a position that is not a
// number, a colour outside 0 to 1, text set before its font is loaded, an unknown enum.
// It draws nothing; it proves that build.js and an export agree before the real file is
// touched. It knows only the parts of the API build.js uses.
//
// It also throws where Figma takes a value and silently does not draw it: a shadow's
// spread on a frame that does not clip its content or has no visible fill (checkSpread).

const ENUMS = {
  textAutoResize: ['NONE', 'WIDTH_AND_HEIGHT', 'HEIGHT', 'TRUNCATE'],
  textAlignHorizontal: ['LEFT', 'CENTER', 'RIGHT', 'JUSTIFIED'],
  textAlignVertical: ['TOP', 'CENTER', 'BOTTOM'],
  strokeAlign: ['INSIDE', 'OUTSIDE', 'CENTER'],
}
const NUMBERS = [
  'x',
  'y',
  'opacity',
  'strokeWeight',
  'strokeTopWeight',
  'strokeRightWeight',
  'strokeBottomWeight',
  'strokeLeftWeight',
  'cornerRadius',
  'topLeftRadius',
  'topRightRadius',
  'bottomRightRadius',
  'bottomLeftRadius',
]
const FONTS = ['Inter', 'Roboto Mono'].flatMap((family) =>
  [
    'Thin',
    'Extra Light',
    'Light',
    'Regular',
    'Medium',
    'Semi Bold',
    'Bold',
    'Extra Bold',
    'Black',
  ]
    .flatMap((w) => [w, w === 'Regular' ? 'Italic' : `${w} Italic`])
    .map((style) => ({
      fontName: { family, style },
    })),
)

function check(ok, message) {
  if (!ok) throw new Error(message)
}

function finite(value, what) {
  check(
    typeof value === 'number' && Number.isFinite(value),
    `${what} must be a number, got ${value}`,
  )
}

function unit(value, what) {
  finite(value, what)
  check(value >= 0 && value <= 1, `${what} must be between 0 and 1, got ${value}`)
}

function checkPaints(paints, what) {
  check(Array.isArray(paints), `${what} must be an array`)
  for (const p of paints) {
    if (p.type === 'SOLID') {
      unit(p.color.r, `${what} r`)
      unit(p.color.g, `${what} g`)
      unit(p.color.b, `${what} b`)
      if (p.opacity !== undefined) unit(p.opacity, `${what} opacity`)
    } else if (p.type === 'IMAGE') {
      check(
        typeof p.imageHash === 'string' && p.imageHash,
        `${what}: image without a hash`,
      )
    } else throw new Error(`${what}: unknown paint ${p.type}`)
  }
}

// Figma draws a shadow's spread only on a frame that clips its content and has a visible
// fill (Plugin API, type Effect). On any other frame it keeps the value and draws the
// shadow without its spread, with no error, so the first import (26 October 2026) lost
// the rings the drawings make with a spread, such as the white ring in a ticked radio.
// The stand-in refuses it instead, whichever of the three is set last.
function checkSpread(node) {
  const spread = (node.effects || []).some((e) => e.spread)
  if (!spread || node.type !== 'FRAME') return
  const visible = (node.fills || []).some(
    (p) => p.visible !== false && (p.opacity === undefined || p.opacity > 0),
  )
  check(
    node.clipsContent === true && visible,
    `${node.name}: Figma draws a shadow's spread only on a frame that clips its content and has a visible fill`,
  )
}

let nextId = 1

function makeNode(type, state) {
  const node = {
    id: `${nextId}:${nextId++}`,
    type,
    name: type,
    parent: null,
    width: 100,
    height: 100,
    removed: false,
    data: {},
  }
  if (['PAGE', 'FRAME', 'SECTION', 'DOCUMENT'].includes(type)) node.children = []
  node.appendChild = (child) => {
    check(node.children, `${type} cannot hold children`)
    check(!node.removed && !child.removed, 'appendChild on a removed node')
    if (child.parent)
      child.parent.children.splice(child.parent.children.indexOf(child), 1)
    child.parent = node
    node.children.push(child)
  }
  node.insertChild = (index, child) => {
    check(node.children, `${type} cannot hold children`)
    check(!node.removed && !child.removed, 'insertChild on a removed node')
    if (child.parent)
      child.parent.children.splice(child.parent.children.indexOf(child), 1)
    check(
      Number.isInteger(index) && index >= 0 && index <= node.children.length,
      `insertChild at ${index} of ${node.children.length}`,
    )
    child.parent = node
    node.children.splice(index, 0, child)
  }
  node.remove = () => {
    if (node.parent) node.parent.children.splice(node.parent.children.indexOf(node), 1)
    node.removed = true
  }
  node.resize = (w, h) => {
    finite(w, 'width')
    finite(h, 'height')
    check(w >= 0.01 && h >= 0.01, `resize(${w}, ${h}): a size must be at least 0.01`)
    node.width = w
    node.height = h
  }
  node.resizeWithoutConstraints = node.resize
  node.setPluginData = (k, v) => (node.data[k] = String(v))
  node.setSharedPluginData = (ns, k, v) => (node.data[`${ns}.${k}`] = String(v))
  node.loadAsync = async () => {}
  if (type === 'TEXT') {
    node.fontName = { family: 'Inter', style: 'Regular' }
    node.characters = ''
    const range = (start, end) => {
      check(
        Number.isInteger(start) && Number.isInteger(end),
        'range ends must be integers',
      )
      check(
        start >= 0 && end <= node.characters.length && start < end,
        `bad range ${start}..${end} of ${node.characters.length}`,
      )
    }
    node.setRangeFontName = (s, e, font) => {
      range(s, e)
      check(
        state.loaded.has(`${font.family}|${font.style}`),
        `font ${font.family} ${font.style} not loaded`,
      )
    }
    node.setRangeFontSize = (s, e, size) => {
      range(s, e)
      finite(size, 'font size')
      check(size >= 1, `font size ${size}`)
    }
    node.setRangeFills = (s, e, fills) => {
      range(s, e)
      checkPaints(fills, 'text fill')
    }
    node.setRangeTextDecoration = (s, e, d) => {
      range(s, e)
      check(['NONE', 'UNDERLINE', 'STRIKETHROUGH'].includes(d), `text decoration ${d}`)
    }
    node.setRangeTextCase = (s, e, c) => {
      range(s, e)
      check(['ORIGINAL', 'UPPER', 'LOWER', 'TITLE'].includes(c), `text case ${c}`)
    }
    node.setRangeLetterSpacing = (s, e, l) => {
      range(s, e)
      finite(l.value, 'letter spacing')
    }
  }
  return new Proxy(node, {
    set(target, prop, value) {
      check(!target.removed, `set ${String(prop)} on a removed node`)
      if (NUMBERS.includes(prop)) finite(value, prop)
      if (prop === 'opacity') unit(value, 'opacity')
      if (ENUMS[prop]) check(ENUMS[prop].includes(value), `${prop} cannot be ${value}`)
      if (prop === 'fills' || prop === 'strokes') checkPaints(value, prop)
      if (prop === 'dashPattern') value.forEach((d) => finite(d, 'dash'))
      if (prop === 'name') check(typeof value === 'string', 'a name must be a string')
      if (prop === 'fontName') {
        check(
          state.loaded.has(`${value.family}|${value.style}`),
          `font ${value.family} ${value.style} not loaded`,
        )
      }
      if (prop === 'characters') {
        const f = target.fontName
        check(
          state.loaded.has(`${f.family}|${f.style}`),
          `characters set before ${f.family} ${f.style} was loaded`,
        )
        check(typeof value === 'string', 'characters must be a string')
      }
      if (prop === 'lineHeight' && value.unit === 'PIXELS')
        finite(value.value, 'line height')
      if (prop === 'effects') {
        for (const e of value) {
          finite(e.radius, 'shadow blur')
          finite(e.offset.x, 'shadow x')
          finite(e.offset.y, 'shadow y')
          unit(e.color.a, 'shadow alpha')
        }
      }
      target[prop] = value
      if (prop === 'effects' || prop === 'clipsContent' || prop === 'fills')
        checkSpread(target)
      return true
    },
  })
}

function summary(value) {
  if (value && typeof value === 'object' && value.type && value.id) {
    return { id: value.id, name: value.name, type: value.type }
  }
  if (Array.isArray(value)) return value.map(summary)
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, summary(v)]))
  }
  return value
}

export function mockFigma() {
  const state = { loaded: new Set(), nodes: 0 }
  const root = makeNode('DOCUMENT', state)
  const firstPage = makeNode('PAGE', state)
  root.appendChild(firstPage)
  const count = (type) => {
    state.nodes++
    return makeNode(type, state)
  }
  const figma = {
    root,
    currentPage: firstPage,
    listAvailableFontsAsync: async () => FONTS,
    loadFontAsync: async (font) => {
      check(
        FONTS.some(
          (f) => f.fontName.family === font.family && f.fontName.style === font.style,
        ),
        `no font ${font.family} ${font.style}`,
      )
      state.loaded.add(`${font.family}|${font.style}`)
    },
    base64Decode: (b64) => {
      check(typeof b64 === 'string' && b64.length > 0, 'base64Decode of nothing')
      return Buffer.from(b64, 'base64')
    },
    createImage: (bytes) => {
      check(
        bytes.length > 8 && bytes[0] === 0x89 && bytes[1] === 0x50,
        'createImage: not a PNG',
      )
      return { hash: `img${bytes.length}` }
    },
    createPage: () => {
      const page = count('PAGE')
      root.appendChild(page)
      return page
    },
    createSection: () => count('SECTION'),
    createFrame: () => count('FRAME'),
    createRectangle: () => count('RECTANGLE'),
    createText: () => count('TEXT'),
    createNodeFromSvg: (svg) => {
      check(
        typeof svg === 'string' && /^<svg[\s>]/.test(svg),
        'createNodeFromSvg: not an <svg>',
      )
      check(
        /width="[\d.]+"/.test(svg) && /height="[\d.]+"/.test(svg),
        'an SVG needs a width and height in pixels',
      )
      check(!/currentColor/i.test(svg), 'an SVG still says currentColor')
      return count('FRAME')
    },
  }
  return { figma, state }
}

const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor

// Runs build.js (or any `run` script) as the plugin would, and returns what the plugin
// would send back.
export async function runInMock(code, args, figmaState) {
  const { figma, state } = figmaState || mockFigma()
  const logs = []
  const log = (...items) => logs.push(items.map(String).join(' '))
  const fn = new AsyncFunction('figma', 'log', 'args', 'plain', code)
  const value = await fn(figma, log, JSON.parse(JSON.stringify(args)), summary)
  return { value: summary(value), logs, nodes: state.nodes }
}
