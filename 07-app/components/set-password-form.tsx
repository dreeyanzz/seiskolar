'use client'

/**
 * Activating an account, step two: set the password. See components/screens/set-password.tsx.
 *
 * Opening the page doesn't use the link up; only saving does. Email security scanners open
 * links on their own, and they would otherwise spend it before the person ever saw it.
 *
 * The hidden username field is there for password managers, so they save the new password
 * against the right email.
 */
import { useActionState, useEffect, useRef } from 'react'
import { ExpiredLink } from '@/components/expired-link'
import { PasswordField } from '@/components/password-field'
import { SubmitButton } from '@/components/submit-button'
import { setPasswordAction, type SetPasswordState } from '@/lib/actions/auth'

const INITIAL: SetPasswordState = { attempt: 0 }

interface SetPasswordFormProps {
  token: string
  email: string
  activateHref: string
  /** Passed in, so the validation library stays out of what a phone has to download. */
  passwordHint: string
}

export function SetPasswordForm({
  token,
  email,
  activateHref,
  passwordHint,
}: SetPasswordFormProps) {
  const [state, action] = useActionState(setPasswordAction, INITIAL)
  const passwordRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (state.destination) window.location.assign(state.destination)
    else if (state.attempt > 0) passwordRef.current?.focus()
  }, [state])

  if (state.linkExpired) return <ExpiredLink activateHref={activateHref} />

  return (
    <section className="card stack">
      <h1>Set your password</h1>
      <p>
        For <strong>{email}</strong>.
      </p>
      <form className="stack" action={action} noValidate>
        <input type="hidden" name="token" value={token} />
        <input
          type="text"
          name="username"
          autoComplete="username"
          value={email}
          readOnly
          hidden
        />
        <PasswordField
          key={state.attempt}
          inputRef={passwordRef}
          label="New password"
          autoComplete="new-password"
          hint={passwordHint}
          error={state.error}
        />
        <SubmitButton pendingLabel="Saving…" moving={Boolean(state.destination)}>
          Save and sign in
        </SubmitButton>
      </form>
    </section>
  )
}
