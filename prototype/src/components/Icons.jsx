import React from 'react'

// 24x24 stroke icons ported directly from 04-high-fidelity/_app.js
const ICONS = {
  home: <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />,
  route: (
    <>
      <circle cx="6" cy="19" r="2" />
      <circle cx="18" cy="5" r="2" />
      <path d="M8 19h8.5a3.5 3.5 0 0 0 0-7h-9a3.5 3.5 0 0 1 0-7H16" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </>
  ),
  tag: (
    <>
      <path d="M3 12V4a1 1 0 0 1 1-1h8l9 9-9 9z" />
      <circle cx="7.5" cy="7.5" r="1.5" />
    </>
  ),
  banknote: (
    <>
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <circle cx="12" cy="12" r="2.5" />
      <path d="M6 9.5v.01M18 14.5v.01" />
    </>
  ),
  sliders: (
    <>
      <path d="M4 6h9M17 6h3M4 12h3M11 12h9M4 18h11M19 18h1" />
      <circle cx="15" cy="6" r="2" />
      <circle cx="9" cy="12" r="2" />
      <circle cx="17" cy="18" r="2" />
    </>
  ),
  inbox: (
    <>
      <path d="M3 13 6 5h12l3 8v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z" />
      <path d="M3 13h5l2 3h4l2-3h5" />
    </>
  ),
  layers: (
    <>
      <path d="M12 3 2 8l10 5 10-5z" />
      <path d="m2 13 10 5 10-5M2 17.5l10 5 10-5" />
    </>
  ),
  checklist: (
    <path d="M10 6h10M10 12h10M10 18h10M4 6l1.5 1.5L8 5M4 12l1.5 1.5L8 11M4 18l1.5 1.5L8 17" />
  ),
  gift: (
    <>
      <rect x="3" y="8" width="18" height="4" rx="1" />
      <path d="M5 12v8h14v-8M12 8v12M12 8S10.5 3 7.8 4.2C5.5 5.3 7.5 8 12 8zm0 0s1.5-5 4.2-3.8C18.5 5.3 16.5 8 12 8z" />
    </>
  ),
  building: (
    <path d="M4 21V4a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v17M15 9h4a1 1 0 0 1 1 1v11M3 21h18M8 7h3M8 11h3M8 15h3" />
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14.2a6.4 6.4 0 0 1 3.5 5.8" />
    </>
  ),
  swap: <path d="M4 8h15l-4-4M20 16H5l4 4" />,
  award: (
    <>
      <circle cx="12" cy="9" r="6" />
      <path d="M8.5 13.9 7 22l5-3 5 3-1.5-8.1" />
    </>
  ),
  filecheck: (
    <>
      <path d="M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8z" />
      <path d="M14 3v5h5M9 14.5l2 2 4-4" />
    </>
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3 20 6v6c0 5-3.4 8-8 9-4.6-1-8-4-8-9V6z" />
      <circle cx="12" cy="10" r="2.5" />
      <path d="M8.5 16.5a4 4 0 0 1 7 0" />
    </>
  ),
  map: (
    <>
      <path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2z" />
      <path d="M9 4v14M15 6v14" />
    </>
  ),
  more: (
    <>
      <circle cx="5" cy="12" r="1.2" />
      <circle cx="12" cy="12" r="1.2" />
      <circle cx="19" cy="12" r="1.2" />
    </>
  ),
  logout: <path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 17l5-5-5-5M15 12H3" />,
  upload: <path d="M12 15V4M7 9l5-5 5 5M4 15v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4" />,
  check: <path d="M5 12.5l4.5 4.5L19 7" />,
  x: <path d="M6 6l12 12M18 6 6 18" />,
  alert: (
    <>
      <path d="M12 3.5 2.5 20h19z" />
      <path d="M12 10v4.5M12 17.5v.01" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5.5M12 7.8v.01" />
    </>
  ),
  file: (
    <>
      <path d="M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8z" />
      <path d="M14 3v5h5" />
    </>
  ),
  history: (
    <>
      <path d="M3.5 12a8.5 8.5 0 1 0 2.6-6.1M3 4v4.5h4.5M12 7.5V12l3 2" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  trash: (
    <>
      <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" />
    </>
  ),
}

export function Icon({ name, className = 'icon' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      {ICONS[name] || null}
    </svg>
  )
}

export function Mark({ kind, primary = '#800000', accent = '#f2c200' }) {
  if (kind === 'seiskolar') {
    return (
      <svg viewBox="0 0 40 40" aria-hidden="true">
        <rect width="40" height="40" rx="10" fill="#f2b705" />
        <path
          d="M26.5 13.2c-1.5-1.8-3.8-2.8-6.5-2.8-4 0-6.7 2.1-6.7 5.1 0 6.6 13.6 3.9 13.6 10 0 3-2.9 5.1-6.9 5.1-3 0-5.5-1.1-7.2-3.1"
          fill="none"
          stroke="#16365c"
          strokeWidth="3.6"
          strokeLinecap="round"
        />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 40 40" aria-hidden="true">
      <path d="M20 2 35 7v11c0 9.4-6.5 16-15 19C11.5 34 5 27.4 5 18V7z" fill={accent} />
      <path
        d="M20 5.2 32 9.3V18c0 7.7-5.2 13.2-12 15.8C13.2 31.2 8 25.7 8 18V9.3z"
        fill={primary}
      />
      <path
        d="M12.5 15.5c2.8-1 5.3-.7 7.5 1 2.2-1.7 4.7-2 7.5-1v10c-2.8-1-5.3-.7-7.5 1-2.2-1.7-4.7-2-7.5-1z"
        fill="#fff"
      />
      <path d="M20 16.5v10" stroke={primary} strokeWidth="1.2" />
    </svg>
  )
}
