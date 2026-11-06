'use client'

/**
 * The sign-in card (FR-IAM-001, S01.3 and S01.4), with the wording of
 * 04-high-fidelity/sign-in.html. See components/screens/sign-in.tsx for where it comes from.
 *
 * The form still works with JavaScript off, because the fields are ordinary uncontrolled
 * inputs posting to a Server Action. After a failed attempt React resets the form: the email
 * returns from `state`, the password stays empty, and focus goes where the person must act.
 */
import Link from 'next/link'
import { useActionState, useEffect, useRef } from 'react'
import { DemoPanel } from '@/components/demo-panel'
import { FieldError } from '@/components/field-error'
import { Icon } from '@/components/icons'
import { PasswordField } from '@/components/password-field'
import { SubmitButton } from '@/components/submit-button'
import { signInAction, type SignInState } from '@/lib/actions/auth'
import type { DemoAccount, DemoGroup } from '@/lib/identity/gateway'

const INITIAL: SignInState = { attempt: 0, email: '' }

interface SignInFormProps {
  activateHref: string
  demoGroups: DemoGroup[] | null
}

export function SignInForm({ activateHref, demoGroups }: SignInFormProps) {
  const [state, action] = useActionState(signInAction, INITIAL)
  const emailRef = useRef<HTMLInputElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)
  const submitRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (state.destination) window.location.assign(state.destination)
    else if (state.errors?.email) emailRef.current?.focus()
    else if (state.attempt > 0) passwordRef.current?.focus()
  }, [state])

  function fill(account: DemoAccount) {
    if (emailRef.current) emailRef.current.value = account.email
    if (passwordRef.current) passwordRef.current.value = account.password ?? ''
    submitRef.current?.focus()
  }

  return (
    <>
      <section className="card stack">
        <h1>Sign in</h1>
        {state.formError ? (
          <p className="error" role="alert">
            <Icon name="alert" />
            {state.formError}
          </p>
        ) : null}
        <form className="stack" action={action} noValidate>
          <div className="field">
            <label className="label" htmlFor="email">
              Email
            </label>
            <input
              ref={emailRef}
              className="input"
              id="email"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              placeholder="name@example.test"
              defaultValue={state.email}
              aria-invalid={state.errors?.email ? true : undefined}
              aria-describedby={state.errors?.email ? 'email-error' : undefined}
            />
            {state.errors?.email ? (
              <FieldError id="email-error">{state.errors.email}</FieldError>
            ) : null}
          </div>
          <PasswordField
            key={state.attempt}
            inputRef={passwordRef}
            label="Password"
            autoComplete="current-password"
            error={state.errors?.password}
          />
          <SubmitButton
            ref={submitRef}
            pendingLabel="Signing in…"
            moving={Boolean(state.destination)}
          >
            Sign in
          </SubmitButton>
        </form>
        <p className="card-foot">
          First time here? <Link href={activateHref}>Activate your account</Link>
        </p>
      </section>

      {demoGroups ? (
        <DemoPanel
          title="Demo accounts"
          note="Every person here is invented. Press one to fill the form, then sign in."
          groups={demoGroups}
          onPick={fill}
        />
      ) : null}
    </>
  )
}
