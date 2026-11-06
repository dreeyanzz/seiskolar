import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'
import './globals.css'

export const metadata: Metadata = {
  title: 'SEIskolar',
  description: 'For DOST-SEI scholars, their schools and DOST.',
  robots: { index: false, follow: false },
}

/** Matches the phone browser's bar to the DOST console's band. A school's layout overrides it. */
export const viewport: Viewport = { themeColor: '#16365c' }

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
