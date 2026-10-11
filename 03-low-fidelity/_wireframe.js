// Builds the frame around every wireframe, so no screen repeats it: the top bar, and
// the navigation, which is a bottom bar on a phone, a rail on a tablet and a sidebar
// on a desktop (_wireframe.css). A screen says who is looking and where they are,
//   <body data-role="scholar" data-nav="scholar-dashboard">
// and holds only its own content, in <main class="page">. A screen with
// data-role="public" (sign-in) gets no frame.
//
// States: an element with data-state="returned verified" shows only in those states.
// The state comes from ?state=... in the address, or else it is the first one the
// screen lists in <meta name="render-states" content="...">.
;(function () {
  'use strict'

  // Every person here is invented (AGENTS.md).
  var ROLES = {
    scholar: {
      portal: 'school',
      who: 'Bea Santiago',
      what: 'Scholar',
      nav: [
        ['scholar-dashboard', 'Home'],
        ['scholar-status', 'Status'],
      ],
    },
    coordinator: {
      portal: 'school',
      who: 'Ruel Mendoza',
      what: 'School Coordinator',
      nav: [
        ['coordinator-home', 'Home'],
        ['coordinator-terms', 'Calendar'],
        ['coordinator-requirement-names', 'Requirement names'],
        ['coordinator-remittances', 'Tuition'],
        ['coordinator-portal-settings', 'Portal settings'],
      ],
    },
    regional: {
      portal: 'console',
      office: 'DOST-VII Regional Office',
      who: 'Ana Villareal',
      what: 'Regional Office',
      nav: [
        ['regional-home', 'Home'],
        ['regional-queue', 'Queue'],
        ['regional-release-batch', 'Release batches'],
        ['regional-remittance', 'Tuition'],
        ['regional-term-setup', 'Terms'],
        ['regional-benefit-proposal', 'Benefit proposals'],
        ['regional-schools', 'Schools'],
        ['regional-accounts', 'Accounts'],
        ['regional-transfer', 'Transfers'],
      ],
    },
    central: {
      portal: 'console',
      office: 'DOST-SEI Central Office',
      who: 'Paolo Reyes',
      what: 'Central Office',
      nav: [
        ['central-batches', 'Release batches'],
        ['central-benefits', 'Benefits'],
        ['central-proposals', 'Proposals'],
        ['central-thresholds', 'Thresholds'],
      ],
    },
    admin: {
      portal: 'console',
      office: 'System administration',
      who: 'Lara Domingo',
      what: 'System administrator',
      nav: [
        ['admin-staff-accounts', 'Staff accounts'],
        ['admin-regions', 'Regions'],
      ],
    },
  }

  var SCHOOL = { name: 'Cebu Institute of Technology – University', short: 'CIT-U' }

  function el(tag, cls, text) {
    var node = document.createElement(tag)
    if (cls) node.className = cls
    if (text) node.textContent = text
    return node
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
    var brand = el('div', 'brand')
    brand.appendChild(el('span', 'mark'))
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
    bar.appendChild(user)
    return bar
  }

  // On a phone the bar holds five at most: the first four, then More.
  function nav(role, active) {
    var list = el('nav', 'nav')
    list.setAttribute('aria-label', 'Main')
    var crowded = role.nav.length > 5
    var hidden = false
    role.nav.forEach(function (entry, index) {
      var item = el('a', 'nav-item')
      item.href = entry[0] + '.html'
      if (entry[0] === active) {
        item.classList.add('active')
        item.setAttribute('aria-current', 'page')
        hidden = crowded && index >= 4
      }
      if (crowded && index >= 4) item.classList.add('overflow')
      item.appendChild(el('span', 'nav-icon'))
      item.appendChild(el('span', 'nav-label', entry[1]))
      list.appendChild(item)
    })
    if (crowded) {
      // More stands for the screen you are on when that screen is one of those it holds.
      var more = el('a', hidden ? 'nav-item more active' : 'nav-item more')
      more.href = '#'
      more.appendChild(el('span', 'nav-icon'))
      more.appendChild(el('span', 'nav-label', 'More'))
      list.appendChild(more)
    }
    return list
  }

  function frame() {
    var body = document.body
    var role = ROLES[body.dataset.role]
    if (!role) return
    var page = document.querySelector('main.page')
    var app = el('div', 'app')
    app.appendChild(topbar(role))
    var frame = el('div', 'frame')
    frame.appendChild(nav(role, body.dataset.nav))
    if (page) frame.appendChild(page)
    app.appendChild(frame)
    body.insertBefore(app, body.firstChild)
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
  }

  frame()
  states()
})()
