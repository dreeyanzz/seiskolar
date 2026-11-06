/**
 * Activate your account, step two: the page the emailed link opens. Assumed, like step one;
 * see components/screens/activate.tsx for why it exists and who should confirm it.
 *
 * States: the form while the link works, and "This link no longer works" when it doesn't.
 * Password rules are assumed too (lib/validation/auth.ts): the SRS sets none.
 *
 * Someone signed in is sent home first. That also covers the moment after saving: the new
 * session makes Next.js render this page again, and by then the link has been used, so
 * without this the person would be told their working link had failed.
 */
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { Alone } from '@/components/alone'
import { ExpiredLink } from '@/components/expired-link'
import { SetPasswordForm } from '@/components/set-password-form'
import { identity } from '@/lib/backend'
import { destinationFor } from '@/lib/identity/destination'
import { requestContext } from '@/lib/portal/request'
import type { Portal } from '@/lib/portal/types'
import { PASSWORD_MIN } from '@/lib/validation/auth'

export const setPasswordMetadata: Metadata = {
  title: 'Set your password · SEIskolar',
}

interface SetPasswordScreenProps {
  portal: Portal
  token: string | undefined
}

export async function SetPasswordScreen({ portal, token }: SetPasswordScreenProps) {
  const claims = await identity.getClaims()
  if (claims) redirect(await destinationFor(claims))

  const { base } = await requestContext()
  const activateHref = `${base}/activate`
  const link = token ? await identity.previewActivationLink(token) : null

  return (
    <Alone portal={portal}>
      {token && link ? (
        <SetPasswordForm
          token={token}
          email={link.email}
          activateHref={activateHref}
          passwordHint={`At least ${PASSWORD_MIN} characters.`}
        />
      ) : (
        <ExpiredLink activateHref={activateHref} />
      )}
    </Alone>
  )
}
