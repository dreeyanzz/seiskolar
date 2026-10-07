// Lays out every swimlane and draws its arrows and legend, so no one positions
// anything by hand. _template.html shows how a swimlane is written:
//
//   <main class="swimlane" data-cols="6">
//     <div class="lane" data-lane="1">Scholar</div>
//     <div class="node step" id="S01.1" data-lane="1" data-col="2"><b>S01.1</b> …</div>
//     <ol class="flows">
//       <li data-from="S01.1" data-to="S01.2"></li>
//       <li data-from="S01.2" data-to="S01.3">Yes</li>
//       <li data-from="S01.2" data-to="S01.1" class="back">No</li>
//     </ol>
//   </main>
//
// A flow's text is its label. class="back" draws it dashed and red: the path goes back
// to fix something. An arrow between lanes turns just before its target; add
// data-turn="early" to turn just after its source instead.
;(function () {
  'use strict'

  var SVG = 'http://www.w3.org/2000/svg'

  var LEGEND = [
    ['start', 'Start'],
    ['end', 'End'],
    ['step', 'A step someone takes'],
    ['system', 'Something SEIskolar does by itself'],
    ['decision', 'A decision'],
    ['record', 'Saved by SEIskolar'],
    ['final', 'The status at the end'],
    ['flow', 'What happens next'],
    ['back', 'Back, to fix something'],
  ]

  function layout(sheet) {
    sheet.style.setProperty('--cols', sheet.dataset.cols || 6)
    sheet.querySelectorAll('.lane').forEach(function (lane) {
      lane.style.gridRow = lane.dataset.lane
    })
    sheet.querySelectorAll('.node').forEach(function (node) {
      node.style.gridRow = node.dataset.lane
      node.style.gridColumn = String(Number(node.dataset.col) + 1)
    })
  }

  function boxOf(el, origin) {
    var r = el.getBoundingClientRect()
    return {
      left: r.left - origin.left,
      right: r.right - origin.left,
      top: r.top - origin.top,
      bottom: r.bottom - origin.top,
      cx: (r.left + r.right) / 2 - origin.left,
      cy: (r.top + r.bottom) / 2 - origin.top,
    }
  }

  function svgEl(name, attrs) {
    var el = document.createElementNS(SVG, name)
    Object.keys(attrs).forEach(function (key) {
      el.setAttribute(key, attrs[key])
    })
    return el
  }

  function marker(id, color) {
    var m = svgEl('marker', {
      id: id,
      viewBox: '0 0 10 10',
      refX: '9.5',
      refY: '5',
      markerWidth: '8',
      markerHeight: '8',
      markerUnits: 'userSpaceOnUse',
      orient: 'auto',
    })
    m.appendChild(svgEl('path', { d: 'M0,0 L10,5 L0,10 z', style: 'fill:' + color }))
    return m
  }

  // One path per flow, as a list of points, and where its label goes.
  function route(flow, from, to, a, b, gap, lanes, channels) {
    var ca = Number(from.dataset.col)
    var cb = Number(to.dataset.col)
    var points
    var label
    if (cb > ca) {
      if (Math.abs(a.cy - b.cy) < 1) {
        points = [
          [a.right, a.cy],
          [b.left, b.cy],
        ]
        label = [a.right + 8, a.cy - 8]
      } else {
        var x = flow.dataset.turn === 'early' ? a.right + gap / 2 : b.left - gap / 2
        points = [
          [a.right, a.cy],
          [x, a.cy],
          [x, b.cy],
          [b.left, b.cy],
        ]
        label = x - a.right > 44 ? [a.right + 8, a.cy - 8] : [x + 6, (a.cy + b.cy) / 2]
      }
    } else if (cb === ca) {
      var down = b.cy > a.cy
      points = down
        ? [
            [a.cx, a.bottom],
            [b.cx, b.top],
          ]
        : [
            [a.cx, a.top],
            [b.cx, b.bottom],
          ]
      label = [a.cx + 8, down ? a.bottom + 18 : a.top - 10]
    } else {
      // Backwards: up from the source, along the top of the higher lane, down to the target.
      var la = Number(from.dataset.lane)
      var lb = Number(to.dataset.lane)
      var top = Math.min(lanes[la].top, lanes[lb].top)
      var key = Math.min(la, lb)
      channels[key] = (channels[key] || 0) + 1
      var y = top + 8 + 10 * channels[key]
      points = [
        [a.cx, a.top],
        [a.cx, y],
        [b.cx, y],
        [b.cx, b.top],
      ]
      // Beside the line coming down into the target, in the band kept clear above it.
      label = [b.cx + 7, y + 13]
    }
    return { points: points, label: label }
  }

  function draw(sheet) {
    var old = sheet.querySelector('svg.arrows')
    if (old) old.remove()

    var origin = sheet.getBoundingClientRect()
    var gap = parseFloat(getComputedStyle(sheet).columnGap) || 56
    var svg = svgEl('svg', {
      class: 'arrows',
      width: String(sheet.scrollWidth),
      height: String(sheet.scrollHeight),
    })
    var defs = svgEl('defs', {})
    defs.appendChild(marker('arrow', 'var(--line)'))
    defs.appendChild(marker('arrow-back', 'var(--back)'))
    svg.appendChild(defs)

    var lanes = {}
    sheet.querySelectorAll('.lane').forEach(function (lane) {
      lanes[lane.dataset.lane] = boxOf(lane, origin)
    })
    var channels = {}

    sheet.querySelectorAll('.flows > li').forEach(function (flow) {
      var from = document.getElementById(flow.dataset.from)
      var to = document.getElementById(flow.dataset.to)
      if (!from || !to) {
        console.error('swimlane: a flow names a step that does not exist', flow.outerHTML)
        return
      }
      var back = flow.classList.contains('back')
      var r = route(
        flow,
        from,
        to,
        boxOf(from, origin),
        boxOf(to, origin),
        gap,
        lanes,
        channels,
      )
      svg.appendChild(
        svgEl('path', {
          class: back ? 'back' : '',
          d:
            'M' +
            r.points
              .map(function (p) {
                return p[0] + ',' + p[1]
              })
              .join(' L'),
          'marker-end': 'url(#' + (back ? 'arrow-back' : 'arrow') + ')',
        }),
      )
      var text = flow.textContent.trim()
      if (text) {
        var t = svgEl('text', {
          x: String(r.label[0]),
          y: String(r.label[1]),
          class: back ? 'back' : '',
        })
        t.textContent = text
        svg.appendChild(t)
      }
    })
    sheet.appendChild(svg)
  }

  function legend(page) {
    var footer = page.querySelector('footer.legend')
    if (!footer) {
      footer = document.createElement('footer')
      footer.className = 'legend'
      page.appendChild(footer)
    }
    footer.innerHTML = ''
    LEGEND.forEach(function (entry) {
      var key = document.createElement('span')
      key.className = 'key'
      var shape = document.createElement('i')
      shape.className = 'shape ' + entry[0]
      key.appendChild(shape)
      key.appendChild(document.createTextNode(entry[1]))
      footer.appendChild(key)
    })
    var assumed = document.createElement('span')
    assumed.className = 'key'
    assumed.innerHTML = '<span class="tag">assumed</span> Not stated in the SRS'
    footer.appendChild(assumed)
  }

  function run() {
    document.querySelectorAll('.swimlane').forEach(function (sheet) {
      layout(sheet)
      draw(sheet)
    })
    legend(document.querySelector('.page') || document.body)
  }

  run()
  window.addEventListener('resize', function () {
    document.querySelectorAll('.swimlane').forEach(draw)
  })
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () {
      document.querySelectorAll('.swimlane').forEach(draw)
    })
  }
})()
