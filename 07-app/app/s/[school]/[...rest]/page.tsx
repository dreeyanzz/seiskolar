/**
 * Any other address inside a school's portal. Without this, Next.js would show its not-found
 * screen outside the school's layout, without the school's colours.
 */
import { notFound } from 'next/navigation'

export default function UnknownSchoolPage() {
  notFound()
}
