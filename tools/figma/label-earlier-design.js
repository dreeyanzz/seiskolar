// Labels the earlier Figma file, "Asph – SEIskolar", as the earlier design: a banner above
// what is on each of its pages, saying the design was redrawn and where the current one
// is. Changes nothing else. It closes risk T2 in 05-risk-matrix-and-gantt (design copies
// drift apart), because nobody can mistake the old frames for the current design.
//
// Open only the earlier file in Figma desktop, run SEIskolar Bridge in it, then:
//
//   npm run -s figma -- run tools/figma/label-earlier-design.js --file Asph
//
// Running it again replaces the banners, so it is safe to run twice. Runs in Figma's
// sandbox: conservative syntax, as in build.js.

var NAME = 'Earlier design: see the note'
var CURRENT = 'https://www.figma.com/design/fsEKjSfF5mPRh5NIwwuign'
var REPOSITORY = 'github.com/dreeyanzz/seiskolar'

await figma.loadFontAsync({ family: 'Inter', style: 'Bold' })
await figma.loadFontAsync({ family: 'Inter', style: 'Regular' })

var labelled = []
for (var i = 0; i < figma.root.children.length; i++) {
  var page = figma.root.children[i]
  await page.loadAsync()
  page.children
    .filter(function (c) {
      return c.name === NAME
    })
    .forEach(function (c) {
      c.remove()
    })
  var left = 0
  var top = 0
  if (page.children.length) {
    left = Math.min.apply(
      null,
      page.children.map(function (c) {
        return c.x
      }),
    )
    top = Math.min.apply(
      null,
      page.children.map(function (c) {
        return c.y
      }),
    )
  }

  var banner = figma.createFrame()
  page.appendChild(banner)
  banner.name = NAME
  banner.layoutMode = 'VERTICAL'
  banner.primaryAxisSizingMode = 'AUTO'
  banner.counterAxisSizingMode = 'FIXED'
  banner.resize(1600, 100)
  banner.paddingTop = banner.paddingBottom = 40
  banner.paddingLeft = banner.paddingRight = 48
  banner.itemSpacing = 16
  banner.cornerRadius = 16
  banner.fills = [{ type: 'SOLID', color: { r: 0.99, g: 0.9, b: 0.89 } }]
  banner.strokes = [{ type: 'SOLID', color: { r: 0.61, g: 0.11, b: 0.07 } }]
  banner.strokeWeight = 4

  var title = figma.createText()
  banner.appendChild(title)
  title.fontName = { family: 'Inter', style: 'Bold' }
  title.fontSize = 48
  title.characters = 'Earlier design. Do not present or design from this page.'
  title.fills = [{ type: 'SOLID', color: { r: 0.61, g: 0.11, b: 0.07 } }]

  var body = figma.createText()
  banner.appendChild(body)
  body.fontName = { family: 'Inter', style: 'Regular' }
  body.fontSize = 24
  body.lineHeight = { unit: 'PIXELS', value: 36 }
  body.layoutAlign = 'STRETCH'
  body.textAutoResize = 'HEIGHT'
  body.characters =
    'These frames are the first drawings, from September and early October 2026. On 7 October 2026 the team redrew the whole design from the SRS: ten swimlanes, then every screen as a low-fidelity wireframe and a high-fidelity screen, for phone, tablet and desktop. ' +
    'The current design is in the repository, ' +
    REPOSITORY +
    ', and in the Figma file "SEIskolar – current design (Asph)": ' +
    CURRENT +
    ' . This file is kept as the record of the first drafts (WBS 4.2 and 4.3 in 05-risk-matrix-and-gantt).'
  body.fills = [{ type: 'SOLID', color: { r: 0.09, g: 0.13, b: 0.17 } }]

  banner.x = left
  banner.y = top - banner.height - 120
  labelled.push(page.name)
}

return { labelled: labelled }
