// Builds the frame around every high-fidelity screen, as _wireframe.js does for the
// wireframes: the top bar, and the navigation, which is a bar of tabs along the bottom of
// a phone, a rail on a tablet and a sidebar on a desktop (_style.css). A screen says who
// is looking and where they are,
//   <body data-role="scholar" data-nav="scholar-dashboard">
// and holds only its own content, in <main class="page">. A screen with
// data-role="public" (sign-in) gets no frame, and takes the school portal's colours unless
// its state is "console".
//
// States: an element with data-state="returned verified" shows only in those states. The
// state comes from ?state=... in the address, or else it is the first one the screen
// lists in <meta name="render-states" content="...">.
//
// It also fills in a few parts so no screen repeats them:
//   <span data-icon="upload"></span>   an icon from the set below
//   <span data-mark="school"></span>   the school's crest, or "seiskolar" for SEIskolar's
//   <div class="doc" data-doc="grades-cut"></div>   a scanned grade report, or "grades"
//   <button data-toast="Saved.">       a short message, for actions that in this
//                                      prototype save nothing
// Nothing here stores anything or talks to a server.
;(function () {
  'use strict'

  // Every person here is invented (AGENTS.md).
  var ROLES = {
    scholar: {
      portal: 'school',
      who: 'Bea Santiago',
      what: 'Scholar',
      nav: [
        ['scholar-dashboard', 'Home', 'home'],
        ['scholar-status', 'Status', 'route'],
      ],
    },
    coordinator: {
      portal: 'school',
      who: 'Ruel Mendoza',
      what: 'School Coordinator',
      nav: [
        ['coordinator-home', 'Home', 'home'],
        ['coordinator-terms', 'Calendar', 'calendar'],
        ['coordinator-requirement-names', 'Requirement names', 'tag'],
        ['coordinator-remittances', 'Tuition', 'banknote'],
        ['coordinator-portal-settings', 'Portal settings', 'sliders'],
      ],
    },
    regional: {
      portal: 'console',
      office: 'DOST-VII Regional Office',
      who: 'Ana Villareal',
      what: 'Regional Office',
      nav: [
        ['regional-home', 'Home', 'home'],
        ['regional-queue', 'Queue', 'inbox'],
        ['regional-release-batch', 'Release batches', 'layers'],
        ['regional-remittance', 'Tuition', 'banknote'],
        ['regional-term-setup', 'Terms', 'checklist'],
        ['regional-benefit-proposal', 'Benefit proposals', 'gift'],
        ['regional-schools', 'Schools', 'building'],
        ['regional-accounts', 'Accounts', 'users'],
        ['regional-transfer', 'Transfers', 'swap'],
      ],
    },
    central: {
      portal: 'console',
      office: 'DOST-SEI Central Office',
      who: 'Paolo Reyes',
      what: 'Central Office',
      nav: [
        ['central-batches', 'Release batches', 'layers'],
        ['central-benefits', 'Benefits', 'award'],
        ['central-proposals', 'Proposals', 'filecheck'],
        ['central-thresholds', 'Thresholds', 'target'],
      ],
    },
    admin: {
      portal: 'console',
      office: 'System administration',
      who: 'Lara Domingo',
      what: 'System administrator',
      nav: [
        ['admin-staff-accounts', 'Staff accounts', 'shield'],
        ['admin-regions', 'Regions', 'map'],
      ],
    },
  }

  var SCHOOL = { name: 'Cebu Institute of Technology – University', short: 'CIT-U' }

  // 24 by 24, drawn with a 2 px stroke in the current text colour.
  var ICONS = {
    home: '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
    route:
      '<circle cx="6" cy="19" r="2"/><circle cx="18" cy="5" r="2"/><path d="M8 19h8.5a3.5 3.5 0 0 0 0-7h-9a3.5 3.5 0 0 1 0-7H16"/>',
    calendar:
      '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    tag: '<path d="M3 12V4a1 1 0 0 1 1-1h8l9 9-9 9z"/><circle cx="7.5" cy="7.5" r="1.5"/>',
    banknote:
      '<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/><path d="M6 9.5v.01M18 14.5v.01"/>',
    sliders:
      '<path d="M4 6h9M17 6h3M4 12h3M11 12h9M4 18h11M19 18h1"/><circle cx="15" cy="6" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="17" cy="18" r="2"/>',
    inbox:
      '<path d="M3 13 6 5h12l3 8v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z"/><path d="M3 13h5l2 3h4l2-3h5"/>',
    layers:
      '<path d="M12 3 2 8l10 5 10-5z"/><path d="m2 13 10 5 10-5M2 17.5l10 5 10-5"/>',
    checklist:
      '<path d="M10 6h10M10 12h10M10 18h10M4 6l1.5 1.5L8 5M4 12l1.5 1.5L8 11M4 18l1.5 1.5L8 17"/>',
    gift: '<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M5 12v8h14v-8M12 8v12M12 8S10.5 3 7.8 4.2C5.5 5.3 7.5 8 12 8zm0 0s1.5-5 4.2-3.8C18.5 5.3 16.5 8 12 8z"/>',
    building:
      '<path d="M4 21V4a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v17M15 9h4a1 1 0 0 1 1 1v11M3 21h18M8 7h3M8 11h3M8 15h3"/>',
    users:
      '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14.2a6.4 6.4 0 0 1 3.5 5.8"/>',
    swap: '<path d="M4 8h15l-4-4M20 16H5l4 4"/>',
    award: '<circle cx="12" cy="9" r="6"/><path d="M8.5 13.9 7 22l5-3 5 3-1.5-8.1"/>',
    filecheck:
      '<path d="M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8z"/><path d="M14 3v5h5M9 14.5l2 2 4-4"/>',
    target:
      '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
    shield:
      '<path d="M12 3 20 6v6c0 5-3.4 8-8 9-4.6-1-8-4-8-9V6z"/><circle cx="12" cy="10" r="2.5"/><path d="M8.5 16.5a4 4 0 0 1 7 0"/>',
    map: '<path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2z"/><path d="M9 4v14M15 6v14"/>',
    more: '<circle cx="5" cy="12" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="19" cy="12" r="1.2"/>',
    logout: '<path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 17l5-5-5-5M15 12H3"/>',
    upload: '<path d="M12 15V4M7 9l5-5 5 5M4 15v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7"/>',
    x: '<path d="M6 6l12 12M18 6 6 18"/>',
    alert: '<path d="M12 3.5 2.5 20h19z"/><path d="M12 10v4.5M12 17.5v.01"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5.5M12 7.8v.01"/>',
    file: '<path d="M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8z"/><path d="M14 3v5h5"/>',
    history: '<path d="M3.5 12a8.5 8.5 0 1 0 2.6-6.1M3 4v4.5h4.5M12 7.5V12l3 2"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    send: '<path d="M21 3 10 14M21 3l-6.5 18-4.5-7-7-4.5z"/>',
    arrowright: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    arrowleft: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
    lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7.5a4 4 0 0 1 8 0V11"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
    undo: '<path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>',
  }

  // SEIskolar's mark, and a stand-in crest for the school: not CIT-U's own seal.
  var MARKS = {
    seiskolar:
      '<svg viewBox="0 0 40 40" aria-hidden="true"><rect width="40" height="40" rx="10" fill="#f2b705"/><path d="M26.5 13.2c-1.5-1.8-3.8-2.8-6.5-2.8-4 0-6.7 2.1-6.7 5.1 0 6.6 13.6 3.9 13.6 10 0 3-2.9 5.1-6.9 5.1-3 0-5.5-1.1-7.2-3.1" fill="none" stroke="#16365c" stroke-width="3.6" stroke-linecap="round"/></svg>',
    school:
      '<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M20 2 35 7v11c0 9.4-6.5 16-15 19C11.5 34 5 27.4 5 18V7z" fill="#f2c200"/><path d="M20 5.2 32 9.3V18c0 7.7-5.2 13.2-12 15.8C13.2 31.2 8 25.7 8 18V9.3z" fill="#800000"/><path d="M12.5 15.5c2.8-1 5.3-.7 7.5 1 2.2-1.7 4.7-2 7.5-1v10c-2.8-1-5.3-.7-7.5 1-2.2-1.7-4.7-2-7.5-1z" fill="#fff"/><path d="M20 16.5v10" stroke="#800000" stroke-width="1.2"/></svg>',
  }

  function el(tag, cls, text) {
    var node = document.createElement(tag)
    if (cls) node.className = cls
    if (text) node.textContent = text
    return node
  }

  function icon(name) {
    var span = el('span')
    span.innerHTML =
      '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
      (ICONS[name] || '') +
      '</svg>'
    return span.firstChild
  }

  function initials(name) {
    return name
      .split(' ')
      .map(function (part) {
        return part.charAt(0)
      })
      .join('')
      .slice(0, 2)
  }

  function topbar(role) {
    var bar = el('header', 'topbar')
    var brand = el('a', 'brand')
    brand.href = role.nav[0][0] + '.html'
    var mark = el('span', 'mark')
    mark.innerHTML = MARKS[role.portal === 'school' ? 'school' : 'seiskolar']
    brand.appendChild(mark)
    var text = el('span', 'brand-text')
    if (role.portal === 'school') {
      // A phone shows the school's short name rather than cutting the long one off.
      var name = el('span', 'brand-name')
      name.appendChild(el('span', 'long', SCHOOL.name))
      name.appendChild(el('span', 'short', SCHOOL.short))
      text.appendChild(name)
      text.appendChild(el('span', 'brand-sub', 'Scholar portal · SEIskolar'))
    } else {
      text.appendChild(el('span', 'brand-name', 'SEIskolar'))
      text.appendChild(el('span', 'brand-sub', role.office))
    }
    brand.appendChild(text)
    bar.appendChild(brand)

    var user = el('div', 'user')
    var who = el('span', 'user-text')
    who.appendChild(el('span', 'user-name', role.who))
    who.appendChild(el('span', 'user-role', role.what))
    user.appendChild(who)
    user.appendChild(el('span', 'avatar', initials(role.who)))
    var out = el('a', 'icon-btn')
    out.href = 'sign-in.html?state=' + (role.portal === 'school' ? 'school' : 'console')
    out.setAttribute('aria-label', 'Sign out')
    out.title = 'Sign out'
    out.appendChild(icon('logout'))
    user.appendChild(out)
    bar.appendChild(user)
    return bar
  }

  function item(entry, active) {
    var link = el('a', 'nav-item')
    link.href = entry[0] + '.html'
    if (entry[0] === active) {
      link.classList.add('active')
      link.setAttribute('aria-current', 'page')
    }
    link.appendChild(icon(entry[2]))
    link.appendChild(el('span', 'nav-label', entry[1]))
    return link
  }

  // On a phone the bar holds five at most: the first four, then More, which opens a
  // sheet of the rest. More stands for the screen you are on when it holds that screen.
  function nav(role, active) {
    var list = el('nav', 'nav')
    list.setAttribute('aria-label', 'Main')
    var crowded = role.nav.length > 5
    var behind = false
    role.nav.forEach(function (entry, index) {
      var link = item(entry, active)
      if (crowded && index >= 4) {
        link.classList.add('overflow')
        if (entry[0] === active) behind = true
      }
      list.appendChild(link)
    })
    if (!crowded) return list

    var more = el('button', behind ? 'nav-item more active' : 'nav-item more')
    more.type = 'button'
    more.setAttribute('aria-expanded', 'false')
    more.appendChild(icon('more'))
    more.appendChild(el('span', 'nav-label', 'More'))
    list.appendChild(more)

    var sheet = el('div', 'more-sheet')
    sheet.hidden = true
    role.nav.slice(4).forEach(function (entry) {
      var link = el('a')
      link.href = entry[0] + '.html'
      if (entry[0] === active) link.setAttribute('aria-current', 'page')
      link.appendChild(icon(entry[2]))
      link.appendChild(el('span', '', entry[1]))
      sheet.appendChild(link)
    })
    more.addEventListener('click', function (event) {
      event.stopPropagation()
      sheet.hidden = !sheet.hidden
      more.setAttribute('aria-expanded', String(!sheet.hidden))
    })
    document.addEventListener('click', function () {
      sheet.hidden = true
      more.setAttribute('aria-expanded', 'false')
    })
    document.body.appendChild(sheet)
    return list
  }

  function frame(role) {
    var page = document.querySelector('main.page')
    var app = el('div', 'app')
    app.appendChild(topbar(role))
    var holder = el('div', 'frame')
    holder.appendChild(nav(role, document.body.dataset.nav))
    if (page) holder.appendChild(page)
    app.appendChild(holder)
    document.body.insertBefore(app, document.body.firstChild)
  }

  function states() {
    var listed = document.querySelector('meta[name="render-states"]')
    var names = listed ? listed.content.split(/\s+/).filter(Boolean) : []
    var asked = new URLSearchParams(location.search).get('state')
    var state = asked || names[0] || ''
    document.body.setAttribute('data-screen-state', state)
    document.querySelectorAll('[data-state]').forEach(function (node) {
      node.hidden = node.getAttribute('data-state').split(/\s+/).indexOf(state) === -1
    })
    return state
  }

  // A scanned Certified True Copy of Grades, with the four lines Bea typed. "grades-cut"
  // has its bottom-right corner cut off, so the last two grades cannot be read.
  function documentPicture(kind) {
    var rows = [
      ['CS 311', '3', '4.50'],
      ['CS 312', '3', '4.20'],
      ['MATH 301', '3', '4.80'],
      ['GE 105', '3', '4.00'],
    ]
    var lines = rows
      .map(function (row, i) {
        var y = 268 + i * 36
        return (
          '<text x="56" y="' +
          y +
          '">' +
          row[0] +
          '</text>' +
          '<rect x="150" y="' +
          (y - 11) +
          '" width="210" height="10" rx="3" fill="#d9dde3"/>' +
          '<text x="420" y="' +
          y +
          '" text-anchor="end">' +
          row[1] +
          '</text>' +
          '<text x="540" y="' +
          y +
          '" text-anchor="end">' +
          row[2] +
          '</text>'
        )
      })
      .join('')
    var cut =
      kind === 'grades-cut'
        ? '<path d="M452 318 600 312V780H280z" fill="#e9ecf0"/><path d="M452 318 280 780" stroke="#b4bcc7" stroke-width="2" stroke-dasharray="6 5"/>'
        : ''
    return (
      '<svg viewBox="0 0 600 780" role="img" aria-label="Scan of a Certified True Copy of Grades' +
      (cut ? ', with its bottom-right corner cut off' : '') +
      '" font-family="Georgia, serif" fill="#2a2f36">' +
      '<rect x="20" y="20" width="560" height="740" fill="#fff" stroke="#d8dde4"/>' +
      '<circle cx="80" cy="80" r="26" fill="none" stroke="#800000" stroke-width="4"/>' +
      '<text x="122" y="74" font-size="15" font-weight="700">Office of the Registrar</text>' +
      '<rect x="122" y="84" width="180" height="8" rx="3" fill="#d9dde3"/>' +
      '<text x="300" y="150" font-size="20" font-weight="700" text-anchor="middle" letter-spacing="1">CERTIFIED TRUE COPY OF GRADES</text>' +
      '<text x="56" y="196" font-size="14">Name: Santiago, Bea</text>' +
      '<text x="330" y="196" font-size="14">BS Computer Science</text>' +
      '<g font-size="12" font-weight="700" fill="#5a6472"><text x="56" y="236">SUBJECT</text><text x="420" y="236" text-anchor="end">UNITS</text><text x="540" y="236" text-anchor="end">GRADE</text></g>' +
      '<path d="M56 244h484" stroke="#2a2f36" stroke-width="1.5"/>' +
      '<g font-size="15">' +
      lines +
      '</g>' +
      '<path d="M56 392h484" stroke="#d8dde4"/>' +
      '<circle cx="250" cy="600" r="46" fill="none" stroke="#c9ced6" stroke-width="3"/>' +
      '<circle cx="250" cy="600" r="36" fill="none" stroke="#dde1e6" stroke-width="2" stroke-dasharray="4 4"/>' +
      '<path d="M66 620c18-26 30 8 46-14s22 12 40-6 20 4 34-8" fill="none" stroke="#1f3b73" stroke-width="2.5" stroke-linecap="round"/>' +
      '<path d="M60 640h150" stroke="#2a2f36"/>' +
      '<text x="60" y="660" font-size="12">University Registrar</text>' +
      cut +
      '</svg>'
    )
  }

  function fill() {
    document.querySelectorAll('[data-icon]').forEach(function (node) {
      node.replaceWith(icon(node.getAttribute('data-icon')))
    })
    document.querySelectorAll('[data-mark]').forEach(function (node) {
      node.innerHTML = MARKS[node.getAttribute('data-mark')] || ''
    })
    document.querySelectorAll('[data-doc]').forEach(function (node) {
      node.innerHTML = documentPicture(node.getAttribute('data-doc'))
    })
  }

  var toastTimer
  function toast(message) {
    var box = document.querySelector('.toast')
    if (!box) {
      box = el('div', 'toast')
      box.setAttribute('role', 'status')
      document.body.appendChild(box)
    }
    box.textContent = ''
    box.appendChild(icon('check'))
    box.appendChild(el('span', '', message))
    box.hidden = false
    clearTimeout(toastTimer)
    toastTimer = setTimeout(function () {
      box.hidden = true
    }, 2600)
  }

  // A table of grade lines works out the weighted average as the scholar types
  // (FR-SCH-003): each grade times its units, added up, divided by all the units, to four
  // places. Each line says whether its grade passes on the school's scale (FR-ADM-003).
  //   <table data-grades data-passing="3.00" data-higher-is-better>, inputs data-units
  //   and data-grade in each line, <span data-passes> in each, and <span data-average>.
  function work(table) {
    var passing = parseFloat(table.getAttribute('data-passing'))
    var higher = table.hasAttribute('data-higher-is-better')
    var units = 0
    var sum = 0
    Array.prototype.forEach.call(table.tBodies[0].rows, function (row) {
      var u = parseFloat(row.querySelector('[data-units]').value)
      var g = parseFloat(row.querySelector('[data-grade]').value)
      var mark = row.querySelector('[data-passes]')
      if (u > 0 && !isNaN(g)) {
        units += u
        sum += u * g
      }
      var passes = higher ? g >= passing : g <= passing
      mark.textContent = isNaN(g) ? 'Not yet' : passes ? 'Yes' : 'No'
      mark.className = isNaN(g) ? 'badge' : passes ? 'badge ok' : 'badge bad'
    })
    var out = document.querySelector('[data-average]')
    if (out) {
      out.textContent = units
        ? (Math.round((sum / units) * 10000) / 10000).toFixed(4) +
          ' · ' +
          units +
          ' units'
        : 'Not yet'
    }
  }

  // Add a subject: a new, empty line at the end, numbered after the last.
  function addLine() {
    var table = document.querySelector('table[data-grades]')
    if (!table) return
    var body = table.tBodies[0]
    var line = body.rows[body.rows.length - 1].cloneNode(true)
    var number = body.rows.length + 1
    line.cells[0].textContent = number
    line.querySelectorAll('input').forEach(function (input) {
      input.value = ''
      input.setAttribute(
        'aria-label',
        input.getAttribute('aria-label').replace(/^Line \d+/, 'Line ' + number),
      )
    })
    body.appendChild(line)
    work(table)
    line.querySelector('input').focus()
  }

  function behave() {
    document.addEventListener('click', function (event) {
      var button = event.target.closest('[data-toast]')
      if (button) toast(button.getAttribute('data-toast'))
      if (event.target.closest('[data-add-line]')) addLine()
      var chip = event.target.closest('.chip')
      if (chip)
        chip.setAttribute(
          'aria-pressed',
          String(chip.getAttribute('aria-pressed') !== 'true'),
        )
    })
    document.addEventListener('input', function (event) {
      var table = event.target.closest('table[data-grades]')
      if (table) work(table)
    })
  }

  var role = ROLES[document.body.dataset.role]
  var state = states()
  if (role) {
    document.body.setAttribute('data-portal', role.portal)
    frame(role)
  } else {
    document.body.setAttribute('data-portal', state === 'console' ? 'console' : 'school')
  }
  fill()
  behave()
})()
