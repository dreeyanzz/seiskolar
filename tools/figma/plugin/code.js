// SEIskolar Bridge: the plugin's main thread. It holds the Figma API and no
// network; ui.html holds the network and no Figma API. A command arrives from
// the bridge server through the UI, runs here, and its result goes back the
// same way. See ../README.md.
//
// This runs in Figma's sandbox, not in Node or a browser. Keep the syntax
// conservative: no optional chaining, no nullish coalescing, no object spread.

figma.showUI(__html__, { width: 320, height: 280, themeColors: true })

const TOKEN_KEY = 'seiskolar-bridge-token'
const MAX_DEPTH = 8
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor

// Properties `node` reports when the node has them. Anything a script needs
// beyond this, it can read itself with `run`.
const NODE_PROPS = [
  'visible',
  'locked',
  'x',
  'y',
  'width',
  'height',
  'rotation',
  'opacity',
  'blendMode',
  'isMask',
  'fills',
  'strokes',
  'strokeWeight',
  'strokeAlign',
  'dashPattern',
  'cornerRadius',
  'topLeftRadius',
  'topRightRadius',
  'bottomLeftRadius',
  'bottomRightRadius',
  'effects',
  'constraints',
  'clipsContent',
  'layoutMode',
  'layoutWrap',
  'primaryAxisSizingMode',
  'counterAxisSizingMode',
  'primaryAxisAlignItems',
  'counterAxisAlignItems',
  'itemSpacing',
  'counterAxisSpacing',
  'paddingLeft',
  'paddingRight',
  'paddingTop',
  'paddingBottom',
  'layoutAlign',
  'layoutGrow',
  'layoutPositioning',
  'layoutSizingHorizontal',
  'layoutSizingVertical',
  'minWidth',
  'maxWidth',
  'minHeight',
  'maxHeight',
  'characters',
  'fontName',
  'fontSize',
  'fontWeight',
  'lineHeight',
  'letterSpacing',
  'paragraphSpacing',
  'textAlignHorizontal',
  'textAlignVertical',
  'textAutoResize',
  'textCase',
  'textDecoration',
  'fillStyleId',
  'strokeStyleId',
  'effectStyleId',
  'textStyleId',
  'boundVariables',
  'componentProperties',
  'componentPropertyDefinitions',
  'variantProperties',
  'description',
]

function normalizeId(id) {
  // A Figma URL writes node ids as 78-1178; the API wants 78:1178.
  return String(id).trim().replace(/-/g, ':')
}

async function getNode(id) {
  if (id === undefined || id === null || id === '') return figma.root
  const node = await figma.getNodeByIdAsync(normalizeId(id))
  if (!node) throw new Error('No node with id ' + id)
  return node
}

function fileInfo() {
  let fileKey = null
  try {
    fileKey = figma.fileKey || null
  } catch (e) {
    fileKey = null
  }
  return {
    name: figma.root.name,
    fileKey: fileKey,
    editorType: figma.editorType,
    page: { id: figma.currentPage.id, name: figma.currentPage.name },
  }
}

function isNode(value) {
  return (
    typeof value.id === 'string' && typeof value.type === 'string' && 'parent' in value
  )
}

function summary(node) {
  const out = { id: node.id, name: node.name, type: node.type }
  if ('x' in node) {
    out.x = node.x
    out.y = node.y
    out.width = node.width
    out.height = node.height
  }
  if (node.type === 'TEXT') {
    const text = node.characters
    out.characters = text.length > 200 ? text.slice(0, 200) + '…' : text
  }
  if ('visible' in node && !node.visible) out.visible = false
  return out
}

// Turns whatever a script or property returns into something JSON can carry:
// nodes become summaries, figma.mixed becomes "mixed", functions disappear.
function plain(value, depth) {
  if (depth === undefined) depth = 0
  if (value === figma.mixed) return 'mixed'
  if (value === null || value === undefined) return null
  const type = typeof value
  if (type === 'string' || type === 'number' || type === 'boolean') return value
  if (type === 'function') return undefined
  if (type !== 'object') return String(value)
  if (value instanceof Uint8Array) return { bytes: value.length }
  if (depth > MAX_DEPTH) return '…'
  if (Array.isArray(value)) {
    return value.map(function (item) {
      const converted = plain(item, depth + 1)
      return converted === undefined ? null : converted
    })
  }
  if (isNode(value)) return summary(value)
  const out = {}
  Object.keys(value).forEach(function (key) {
    const converted = plain(value[key], depth + 1)
    if (converted !== undefined) out[key] = converted
  })
  return out
}

function tree(node, depth) {
  const out = summary(node)
  if ('children' in node) {
    if (depth > 0) {
      out.children = node.children.map(function (child) {
        return tree(child, depth - 1)
      })
    } else {
      out.childCount = node.children.length
    }
  }
  return out
}

async function describeNode(node) {
  const out = summary(node)
  NODE_PROPS.forEach(function (prop) {
    if (!(prop in node)) return
    try {
      const value = plain(node[prop])
      if (value !== undefined) out[prop] = value
    } catch (e) {
      // Some properties throw on some node types; leave them out.
    }
  })
  if (node.parent) out.parent = summary(node.parent)
  if ('children' in node) out.children = node.children.map(summary)
  if (node.type === 'INSTANCE') {
    try {
      const main = await node.getMainComponentAsync()
      out.mainComponent = main ? summary(main) : null
    } catch (e) {
      out.mainComponent = null
    }
  }
  if (node.type === 'TEXT') {
    try {
      out.textSegments = plain(
        node.getStyledTextSegments(['fontName', 'fontSize', 'fontWeight', 'fills']),
      )
    } catch (e) {
      // Older files can refuse this; the flat properties above still stand.
    }
  }
  return out
}

const handlers = {
  ping: async function () {
    return fileInfo()
  },

  tree: async function (params) {
    const node = await getNode(params.id)
    const depth = typeof params.depth === 'number' ? params.depth : 2
    return { file: fileInfo(), tree: tree(node, depth) }
  },

  node: async function (params) {
    return describeNode(await getNode(params.id))
  },

  selection: async function () {
    return {
      page: { id: figma.currentPage.id, name: figma.currentPage.name },
      selection: figma.currentPage.selection.map(summary),
    }
  },

  screenshot: async function (params) {
    const node = await getNode(params.id)
    if (!('exportAsync' in node)) throw new Error(node.type + ' nodes cannot be exported')
    const format = String(params.format || 'png').toUpperCase()
    if (format === 'SVG') {
      const svg = await node.exportAsync({ format: 'SVG_STRING' })
      return { node: summary(node), svg: svg }
    }
    if (format !== 'PNG' && format !== 'JPG')
      throw new Error('Format must be png, jpg or svg')
    const scale = typeof params.scale === 'number' ? params.scale : 2
    const bytes = await node.exportAsync({
      format: format,
      constraint: { type: 'SCALE', value: scale },
    })
    return {
      node: summary(node),
      base64: figma.base64Encode(bytes),
      width: Math.round(node.width * scale),
      height: Math.round(node.height * scale),
    }
  },

  // The general case: an agent's script, with the full Plugin API. Each run is
  // one undo step, so a person in Figma can take it back with one Ctrl+Z.
  run: async function (params) {
    if (typeof params.code !== 'string') throw new Error('run needs code')
    const logs = []
    const log = function () {
      logs.push(
        Array.prototype.map
          .call(arguments, function (item) {
            return typeof item === 'string' ? item : JSON.stringify(plain(item))
          })
          .join(' '),
      )
    }
    try {
      const fn = new AsyncFunction('figma', 'log', 'args', 'plain', params.code)
      const args = params.args === undefined ? null : params.args
      const value = plain(await fn(figma, log, args, plain))
      figma.commitUndo()
      return { value: value === undefined ? null : value, logs: logs }
    } catch (e) {
      const error = e instanceof Error ? e : new Error(String(e))
      error.logs = logs
      throw error
    }
  },
}

figma.ui.onmessage = async function (msg) {
  if (msg.type === 'save-token') {
    await figma.clientStorage.setAsync(TOKEN_KEY, msg.token)
    figma.notify('Bridge token saved')
    return
  }
  if (msg.type !== 'command') return

  const command = msg.command
  const handler = handlers[command.command]
  try {
    if (!handler) throw new Error('Unknown command: ' + command.command)
    const result = await handler(command.params || {})
    figma.ui.postMessage({ type: 'result', id: command.id, ok: true, result: result })
  } catch (e) {
    figma.ui.postMessage({
      type: 'result',
      id: command.id,
      ok: false,
      error: e && e.message ? String(e.message) : String(e),
      stack: e && e.stack ? String(e.stack) : undefined,
      logs: e && e.logs ? e.logs : undefined,
    })
  }
}

figma.on('currentpagechange', function () {
  figma.ui.postMessage({ type: 'file', file: fileInfo() })
})

async function start() {
  // documentAccess is dynamic-page, so other pages are not loaded until asked
  // for. Load them all: an agent asking for the tree means the whole file.
  await figma.loadAllPagesAsync()
  const token = await figma.clientStorage.getAsync(TOKEN_KEY)
  figma.ui.postMessage({ type: 'init', token: token || '', file: fileInfo() })
}

start()
