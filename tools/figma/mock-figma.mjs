// A stand-in for Figma's Plugin API, for the `--dry-run` of `npm run figma:import` and
// `npm run figma:label-owners`. It runs build.js or label-owners.mjs's script in Node, as
// the bridge's plugin would (plugin/code.js, the `run` command), and throws where Figma
// would refuse a value: a size of zero, a position that is not a number, a colour outside
// 0 to 1, text set before its font is loaded, an unknown enum, a layer set to hug that
// has no auto layout, or one set to fill a parent that has none. It draws nothing; it
// proves that a script and its data agree before the real file is touched. It knows only
// the parts of the API those two scripts use.

const ENUMS = {
  textAutoResize: ['NONE', 'WIDTH_AND_HEIGHT', 'HEIGHT', 'TRUNCATE'],
  textAlignHorizontal: ['LEFT', 'CENTER', 'RIGHT', 'JUSTIFIED'],
  textAlignVertical: ['TOP', 'CENTER', 'BOTTOM'],
  strokeAlign: ['INSIDE', 'OUTSIDE', 'CENTER'],
  layoutMode: ['NONE', 'HORIZONTAL', 'VERTICAL', 'GRID'],
  layoutSizingHorizontal: ['FIXED', 'HUG', 'FILL'],
  layoutSizingVertical: ['FIXED', 'HUG', 'FILL'],
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
  'itemSpacing',
  'paddingLeft',
  'paddingRight',
  'paddingTop',
  'paddingBottom',
  'fontSize',
]
// Text properties that change how the text is laid out, which Figma refuses to set until
// the text's font is loaded.
const NEEDS_FONT = ['characters', 'fontSize', 'lineHeight']
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

let nextId = 1

// Shared plugin data is kept per namespace, and Figma asks for a namespace of at least
// three letters, digits, underscores or full stops.
function checkNamespace(namespace) {
  check(
    typeof namespace === 'string' && /^[A-Za-z0-9_.]{3,}$/.test(namespace),
    `shared plugin data namespace "${namespace}" is not at least 3 letters or digits`,
  )
}

// Does `node` match a findAllWithCriteria search? `types` lists node types;
// `sharedPluginData` matches a node that has data under its namespace, under any of its
// `keys` if it names some.
function matches(node, criteria) {
  if (criteria.types && !criteria.types.includes(node.type)) return false
  const shared = criteria.sharedPluginData
  if (shared) {
    checkNamespace(shared.namespace)
    const keys = node.getSharedPluginDataKeys(shared.namespace)
    if (!keys.length) return false
    if (shared.keys && !shared.keys.some((k) => keys.includes(k))) return false
  }
  return true
}

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
  // A new layer starts at 0, 0, as in Figma. Pages and the document have no position.
  if (!['PAGE', 'DOCUMENT'].includes(type)) Object.assign(node, { x: 0, y: 0 })
  if (['PAGE', 'FRAME', 'SECTION', 'DOCUMENT'].includes(type)) node.children = []
  node.appendChild = (child) => {
    check(node.children, `${type} cannot hold children`)
    check(!node.removed && !child.removed, 'appendChild on a removed node')
    if (child.parent)
      child.parent.children.splice(child.parent.children.indexOf(child), 1)
    child.parent = node
    node.children.push(child)
  }
  // A parent holds its children's proxies, not this raw object, so find this node by id:
  // indexOf(node) would be -1, and splice(-1, 1) would remove the parent's last child.
  node.remove = () => {
    if (node.parent) {
      const siblings = node.parent.children
      siblings.splice(
        siblings.findIndex((c) => c.id === node.id),
        1,
      )
    }
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
  // As in Figma, storing an empty string deletes the key, and a missing key reads as ''.
  node.setSharedPluginData = (ns, k, v) => {
    checkNamespace(ns)
    if (String(v) === '') delete node.data[`${ns}.${k}`]
    else node.data[`${ns}.${k}`] = String(v)
  }
  node.getSharedPluginData = (ns, k) => {
    checkNamespace(ns)
    return node.data[`${ns}.${k}`] || ''
  }
  node.getSharedPluginDataKeys = (ns) => {
    checkNamespace(ns)
    return Object.keys(node.data)
      .filter((key) => key.startsWith(`${ns}.`))
      .map((key) => key.slice(ns.length + 1))
  }
  // Every node below this one (not this one) that matches, as Figma's findAllWithCriteria.
  if (node.children) {
    node.findAllWithCriteria = (criteria) => {
      check(
        criteria && typeof criteria === 'object',
        'findAllWithCriteria needs criteria',
      )
      const found = []
      const walk = (parent) => {
        for (const child of parent.children || []) {
          if (matches(child, criteria)) found.push(child)
          walk(child)
        }
      }
      walk(node)
      return found
    }
  }
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
      if (target.type === 'TEXT' && NEEDS_FONT.includes(prop)) {
        const f = target.fontName
        check(
          state.loaded.has(`${f.family}|${f.style}`),
          `${prop} set before ${f.family} ${f.style} was loaded`,
        )
      }
      if (prop === 'characters') {
        check(typeof value === 'string', 'characters must be a string')
      }
      if (prop === 'fontSize') check(value >= 1, `font size ${value}`)
      // Figma lets a layer hug its content only if it has auto layout (or is text), and
      // fill its parent only if the parent has auto layout. Set FILL after appendChild.
      if (prop === 'layoutSizingHorizontal' || prop === 'layoutSizingVertical') {
        const auto = (n) => Boolean(n && n.layoutMode && n.layoutMode !== 'NONE')
        if (value === 'HUG') {
          check(
            target.type === 'TEXT' || auto(target),
            `${prop} HUG on a ${target.type} without auto layout`,
          )
        }
        if (value === 'FILL') {
          check(auto(target.parent), `${prop} FILL in a parent without auto layout`)
        }
      }
      if (prop === 'strokesIncludedInLayout') {
        check(typeof value === 'boolean', 'strokesIncludedInLayout must be true or false')
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
  // A new Figma file has one empty page, "Page 1" (README.md, "What the import makes").
  const firstPage = makeNode('PAGE', state)
  firstPage.name = 'Page 1'
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
