/**
 * The icons these screens use: 24 by 24, drawn with a 2 px stroke in the text colour, the
 * same as 04-high-fidelity/_app.js, which alert and logout are copied from. Decorative only,
 * so a button with an icon still needs its own label.
 *
 * Use: <Icon name="alert" />.
 */
import type { ReactNode } from 'react'

const PATHS = {
  alert: (
    <>
      <path d="M12 3.5 2.5 20h19z" />
      <path d="M12 10v4.5M12 17.5v.01" />
    </>
  ),
  logout: <path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 17l5-5-5-5M15 12H3" />,
  eye: (
    <>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  eyeOff: (
    <>
      <path d="M3 3l18 18" />
      <path d="M10.6 5.6c.46-.07.93-.1 1.4-.1 6 0 9.5 6.5 9.5 6.5a17 17 0 0 1-3 3.7" />
      <path d="M6.6 6.7A16.6 16.6 0 0 0 2.5 12S6 18.5 12 18.5c1.9 0 3.6-.6 5-1.5" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
    </>
  ),
  chevronDown: <path d="M6 9l6 6 6-6" />,
} satisfies Record<string, ReactNode>

export function Icon({ name }: { name: keyof typeof PATHS }) {
  return (
    <svg className="icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      {PATHS[name]}
    </svg>
  )
}
