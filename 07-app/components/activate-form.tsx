'use client'

/**
 * Activating an account, step one: ask for a link. See components/screens/activate.tsx.
 *
 * The "Check your email" answer reads the same whether or not the address is registered, so
 * nobody can use this form to find out who has an account. Focus moves to the new heading
 * when it appears, so a screen reader announces the change.
 */
import Link from 'next/link'
import { useActionState, useEffect, useRef } from 'react'
import { DemoPanel } from '@/components/demo-panel'
import { FieldError } from '@/components/field-error'
import { SubmitButton } from '@/components/submit-button'
import { requestActivationAction, type ActivationRequestState } from '@/lib/actions/auth'
import type { DemoAccount, DemoGroup } from '@/lib/identity/gateway'

const INITIAL: ActivationRequestState = { attempt: 0, email: '' }

interface ActivateFormProps {
  signInHref: string
  /** Who to ask when no email arrives: FR-ADM-001 says who makes each kind of account. */
  contact: string
  demoGroups: DemoGroup[] | null
}

export function ActivateForm({ signInHref, contact, demoGroups }: ActivateFormProps) {
  const [state, action] = useActionState(requestActivationAction, INITIAL)
  const emailRef = useRef<HTMLInputElement>(null)
  const sentHeadingRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    if (state.attempt === 0) return
    if (state.sent) sentHeadingRef.current?.focus()
    else emailRef.current?.focus()
  }, [state])

  if (state.sent) {
    return (
      <>
        <section className="card stack">
          <h1 ref={sentHeadingRef} tabIndex={-1}>
            Check your email
          </h1>
          <p>
            If DOST has registered <strong>{state.sent.email}</strong>, a link to set your
            password is on its way. It lasts one hour.
          </p>
          <p className="muted">
            Nothing after a few minutes? Check your spam folder, or ask {contact}.
          </p>
          <p className="card-foot">
            <Link href={signInHref}>Back to sign in</Link>
          </p>
        </section>

        {state.sent.demoHref || state.sent.demoNote ? (
          <aside className="demo">
            <div className="demo-body demo-open">
              <p className="demo-title">
                <strong>No email is sent</strong>
                <span className="badge info">Mock data</span>
              </p>
              {state.sent.demoHref ? (
                <>
                  <p className="hint">This is the link the email would have held.</p>
                  <Link className="btn block" href={state.sent.demoHref}>
                    Open the link
                  </Link>
                </>
              ) : (
                <p className="hint">{state.sent.demoNote}</p>
              )}
            </div>
          </aside>
        ) : null}
      </>
    )
  }

  function fill(account: DemoAccount) {
    if (emailRef.current) {
      emailRef.current.value = account.email
      emailRef.current.focus()
    }
  }

  return (
    <>
      <section className="card stack">
        <h1>Activate your account</h1>
        <p>
          DOST registers your email when it makes your account. Enter that address, and
          we&apos;ll send you a link to set your password.
        </p>
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
              aria-invalid={state.error ? true : undefined}
              aria-describedby={state.error ? 'email-error' : undefined}
            />
            {state.error ? <FieldError id="email-error">{state.error}</FieldError> : null}
          </div>
          <SubmitButton pendingLabel="Sending…">Send the link</SubmitButton>
        </form>
        <p className="card-foot">
          Already activated? <Link href={signInHref}>Sign in</Link>
        </p>
      </section>

      {demoGroups ? (
        <DemoPanel
          title="Demo accounts"
          note="Assumed: the SRS says DOST makes accounts (FR-ADM-001), but not how a new person first sets a password. Press one to fill the form."
          groups={demoGroups}
          onPick={fill}
        />
      ) : null}
    </>
  )
}
