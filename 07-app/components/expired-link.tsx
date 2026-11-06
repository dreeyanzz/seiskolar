/**
 * What an activation link shows once it stops working: expired, used, or never real. It does
 * not say which, so a guessed link learns nothing.
 */
import Link from 'next/link'

export function ExpiredLink({ activateHref }: { activateHref: string }) {
  return (
    <section className="card stack">
      <h1>This link no longer works</h1>
      <p>A link lasts one hour and works once. Ask for a new one, and try again.</p>
      <Link className="btn primary block" href={activateHref}>
        Ask for a new link
      </Link>
    </section>
  )
}
