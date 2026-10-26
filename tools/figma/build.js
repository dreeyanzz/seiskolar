// Draws one exported view (export.mjs) in Figma as a frame of editable layers. It runs
// inside Figma through the bridge: import.mjs sends it, with the view and where the frame
// goes, as `args`, one view per run, so each frame is one undo step. To run it by hand:
//
//   npm run -s figma -- run tools/figma/build.js --args '{"view": …, "page": …}'
//
// args: {
//   view:    the exported view (tools/figma/.out/export/<folder>/<frame>.json)
//   page:    the page's name, for example "04 High-fidelity"; made if it is missing
//   section: { name, x, y, width, height }, the section holding one drawing's frames
//   frame:   { x, y }, where the frame goes inside its section
//   replace: true to redraw a frame that already exists; otherwise it is left alone
// }
//
// Runs in Figma's plugin sandbox, not in Node, so the syntax is kept conservative: no
// optional chaining, no nullish coalescing, no object spread (README.md, "Writing with
// run"). `figma`, `args` and `log` are in scope; the value returned comes back to
// import.mjs.

var view = args.view
var images = view.images || {}

// Weights by the words Figma uses in style names, without spaces: Inter says "Semi Bold",
// Roboto Mono says "SemiBold".
var WEIGHTS = {
  thin: 100,
  extralight: 200,
  light: 300,
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
  extrabold: 800,
  black: 900,
}

var available = await figma.listAvailableFontsAsync()
var stylesOf = {}
available.forEach(function (f) {
  var family = f.fontName.family
  if (!stylesOf[family]) stylesOf[family] = []
  stylesOf[family].push(f.fontName.style)
})

function describeStyle(style) {
  var key = style.toLowerCase().replace(/\s+/g, '')
  var italic = key.indexOf('italic') >= 0
  key = key.replace('italic', '')
  return { weight: key === '' ? 400 : WEIGHTS[key] || 400, italic: italic }
}

var chosen = {}
var loaded = {}
// The Figma font closest to a run's family, weight and slant. Inter and Roboto Mono are
// built into Figma; anything else falls back to Inter.
async function fontFor(run) {
  var family = stylesOf[run.family] ? run.family : 'Inter'
  var key = family + '|' + run.weight + '|' + (run.italic ? 'i' : '')
  if (chosen[key]) return chosen[key]
  var best = null
  var bestScore = Infinity
  ;(stylesOf[family] || ['Regular']).forEach(function (style) {
    var d = describeStyle(style)
    var score = Math.abs(d.weight - run.weight) + (d.italic === !!run.italic ? 0 : 1000)
    if (score < bestScore) {
      best = style
      bestScore = score
    }
  })
  var font = { family: family, style: best || 'Regular' }
  var id = font.family + '|' + font.style
  if (!loaded[id]) {
    await figma.loadFontAsync(font)
    loaded[id] = true
  }
  chosen[key] = font
  return font
}

function solid(c) {
  return {
    type: 'SOLID',
    color: { r: c.r, g: c.g, b: c.b },
    opacity: c.a === undefined ? 1 : c.a,
  }
}

function imagePaint(id) {
  var image = figma.createImage(figma.base64Decode(images[id]))
  return { type: 'IMAGE', imageHash: image.hash, scaleMode: 'FILL' }
}

function place(node, n, ox, oy) {
  node.x = n.x - ox
  node.y = n.y - oy
}

function size(node, w, h) {
  node.resize(Math.max(w, 0.01), Math.max(h, 0.01))
}

async function drawBox(n, parent, ox, oy) {
  var frame = figma.createFrame()
  parent.appendChild(frame)
  frame.name = n.name
  size(frame, n.w, n.h)
  place(frame, n, ox, oy)
  var fills = n.fills.map(solid)
  if (n.raster && images[n.raster]) fills.push(imagePaint(n.raster))
  frame.fills = fills
  frame.clipsContent = !!n.clip
  if (n.border && n.border.color) {
    var b = n.border
    frame.strokes = [solid(b.color)]
    frame.strokeAlign = 'INSIDE'
    frame.strokeTopWeight = b.top
    frame.strokeRightWeight = b.right
    frame.strokeBottomWeight = b.bottom
    frame.strokeLeftWeight = b.left
    if (b.dash) frame.dashPattern = b.dash
  }
  if (n.radius) {
    frame.topLeftRadius = n.radius[0]
    frame.topRightRadius = n.radius[1]
    frame.bottomRightRadius = n.radius[2]
    frame.bottomLeftRadius = n.radius[3]
  }
  if (n.shadows) {
    frame.effects = n.shadows.map(function (s) {
      return {
        type: s.inset ? 'INNER_SHADOW' : 'DROP_SHADOW',
        color: { r: s.color.r, g: s.color.g, b: s.color.b, a: s.color.a },
        offset: { x: s.x, y: s.y },
        radius: s.blur,
        spread: s.spread,
        visible: true,
        blendMode: 'NORMAL',
      }
    })
  }
  if (n.opacity !== undefined) frame.opacity = n.opacity
  // A side in another colour than the border, as a banner's thick left edge: a strip
  // inside the box, under its content, cut to its corners because the box clips.
  if (n.border && n.border.accents) {
    n.border.accents.forEach(function (a) {
      var strip = figma.createRectangle()
      frame.appendChild(strip)
      strip.name = 'border-' + a.side
      strip.fills = [solid(a.color)]
      if (a.side === 'left' || a.side === 'right') size(strip, a.width, n.h)
      else size(strip, n.w, a.width)
      strip.x = a.side === 'right' ? n.w - a.width : 0
      strip.y = a.side === 'bottom' ? n.h - a.width : 0
    })
  }
  for (var i = 0; i < n.children.length; i++) {
    await draw(n.children[i], frame, n.x, n.y)
  }
  // An outline is drawn outside the box, so it is a ring beside it, not part of it.
  if (n.outline) {
    var o = n.outline
    var ring = figma.createRectangle()
    parent.appendChild(ring)
    ring.name = n.name + ' (outline)'
    var grow = o.offset + o.width
    size(ring, n.w + grow * 2, n.h + grow * 2)
    ring.x = n.x - ox - grow
    ring.y = n.y - oy - grow
    ring.fills = []
    ring.strokes = [solid(o.color)]
    ring.strokeWeight = o.width
    ring.strokeAlign = 'INSIDE'
    if (n.radius) ring.cornerRadius = Math.max.apply(null, n.radius) + grow
  }
}

var ALIGN = { LEFT: 'LEFT', CENTER: 'CENTER', RIGHT: 'RIGHT', JUSTIFIED: 'JUSTIFIED' }

async function drawText(n, parent, ox, oy) {
  var fonts = []
  for (var i = 0; i < n.runs.length; i++) fonts.push(await fontFor(n.runs[i]))
  var text = figma.createText()
  parent.appendChild(text)
  text.name = n.name
  text.fontName = fonts[0]
  text.characters = n.runs
    .map(function (r) {
      return r.text
    })
    .join('')
  var at = 0
  n.runs.forEach(function (r, j) {
    var end = at + r.text.length
    if (end > at) {
      text.setRangeFontName(at, end, fonts[j])
      text.setRangeFontSize(at, end, r.size)
      if (r.color) text.setRangeFills(at, end, [solid(r.color)])
      if (r.decoration) text.setRangeTextDecoration(at, end, r.decoration)
      if (r.textCase) text.setRangeTextCase(at, end, r.textCase)
      if (r.letterSpacing) {
        text.setRangeLetterSpacing(at, end, { unit: 'PIXELS', value: r.letterSpacing })
      }
    }
    at = end
  })
  text.lineHeight = n.lineHeight
    ? { unit: 'PIXELS', value: n.lineHeight }
    : { unit: 'AUTO' }
  text.textAlignHorizontal = ALIGN[n.align] || 'LEFT'
  if (n.autoResize === 'WIDTH_AND_HEIGHT') {
    text.textAutoResize = 'WIDTH_AND_HEIGHT'
  } else if (n.autoResize === 'HEIGHT') {
    size(text, n.w, n.h)
    text.textAutoResize = 'HEIGHT'
  } else {
    text.textAutoResize = 'NONE'
    size(text, n.w, n.h)
    text.textAlignVertical = n.verticalAlign === 'CENTER' ? 'CENTER' : 'TOP'
  }
  if (n.stroke) {
    text.strokes = [solid(n.stroke.color)]
    text.strokeWeight = n.stroke.weight
    text.strokeAlign = 'OUTSIDE'
  }
  place(text, n, ox, oy)
}

function drawSvg(n, parent, ox, oy) {
  var node = figma.createNodeFromSvg(n.svg)
  parent.appendChild(node)
  node.name = n.name
  node.fills = []
  node.clipsContent = false
  place(node, n, ox, oy)
}

function drawImage(n, parent, ox, oy) {
  var rect = figma.createRectangle()
  parent.appendChild(rect)
  rect.name = n.name
  size(rect, n.w, n.h)
  place(rect, n, ox, oy)
  rect.fills = images[n.raster] ? [imagePaint(n.raster)] : []
}

var counts = { box: 0, text: 0, svg: 0, image: 0 }
async function draw(n, parent, ox, oy) {
  counts[n.type] = (counts[n.type] || 0) + 1
  if (n.type === 'box') return drawBox(n, parent, ox, oy)
  if (n.type === 'text') return drawText(n, parent, ox, oy)
  if (n.type === 'svg') return drawSvg(n, parent, ox, oy)
  if (n.type === 'image') return drawImage(n, parent, ox, oy)
  log('skipped a layer of unknown type ' + n.type)
}

// The page, and the section on it that holds this drawing's frames.
var page = figma.root.children.find(function (p) {
  return p.name === args.page
})
if (!page) {
  page = figma.createPage()
  page.name = args.page
}
await page.loadAsync()

var section = page.children.find(function (c) {
  return c.type === 'SECTION' && c.name === args.section.name
})
if (!section) {
  section = figma.createSection()
  page.appendChild(section)
  section.name = args.section.name
}
section.x = args.section.x
section.y = args.section.y
section.resizeWithoutConstraints(args.section.width, args.section.height)

var existing = section.children.find(function (c) {
  return c.name === view.frame
})
if (existing && !args.replace) {
  return { frame: existing, skipped: 'already there; pass replace to redraw it' }
}
if (existing) existing.remove()

var frame = figma.createFrame()
section.appendChild(frame)
frame.name = view.frame
size(frame, view.width, view.height)
frame.x = args.frame.x
frame.y = args.frame.y
frame.fills = [solid(view.background)]
frame.clipsContent = true
for (var k = 0; k < view.children.length; k++) {
  await draw(view.children[k], frame, 0, 0)
}
// Where the frame came from, for anyone who finds it in Figma (FIGMA.md).
frame.setPluginData('source', view.source)
frame.setSharedPluginData('seiskolar', 'source', view.source)
frame.setSharedPluginData('seiskolar', 'state', view.state || '')
frame.setSharedPluginData('seiskolar', 'device', view.device || '')

return { frame: frame, page: page.name, section: section.name, layers: counts }
