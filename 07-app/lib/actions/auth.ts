'use server'

/**
 * What the sign-in and activation forms do when submitted. Each one validates on the server
 * and works with or without JavaScript in the browser.
 *
 * Sign-in: FR-IAM-001, swimlane 01 (S01.3 to S01.8).
 * Activation: assumed. The SRS says DOST creates accounts (FR-ADM-001) but not how a new
 * person first sets a password (the SDD's "Still open", item 8). See README.md.
 */
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { identity } from '@/lib/backend'
import { destinationFor } from '@/lib/identity/destination'
import { requestContext } from '@/lib/portal/request'
import {
  activationRequestSchema,
  fieldErrors,
  newPasswordSchema,
  signInSchema,
} from '@/lib/validation/auth'

function text(form: FormData, field: string): string {
  const value = form.get(field)
  return typeof value === 'string' ? value : ''
}

const UNAVAILABLE = "SEIskolar can't be reached right now. Try again in a moment."

/**
 * Moves on to a new page once the session has changed.
 *
 * With JavaScript it hands the address back, and the form opens it as a full page load,
 * rather than redirecting from here. There are two reasons. A full load drops anything the
 * browser still holds from before the session changed. And Next.js fetches a Server Action's
 * redirect target by itself, which loses a school's own address: citu.seiskolar.ph/ turned
 * into citu.seiskolar.ph/s/citu, and every link after it (the browser tests caught this).
 *
 * With JavaScript off there is no form code to do that, so this is an ordinary redirect.
 * Next.js adds the Next-Action header only to the requests its own code sends.
 *
 * The screen may get there first: a changed session makes Next.js render the current page
 * again, and the screens send anyone signed in to their home. That keeps the clean address
 * too, so whichever happens first, the person lands in the same place.
 */
async function moveOnTo(destination: string): Promise<string> {
  if ((await headers()).has('next-action')) return destination
  redirect(destination)
}

/* Sign in ---------------------------------------------------------------------------- */

export interface SignInState {
  /** Counts attempts, so the form can tell a new answer from the last one. */
  attempt: number
  /** What was typed, kept so a failed attempt doesn't lose it. The password never is. */
  email: string
  formError?: string
  errors?: { email?: string; password?: string }
  /** Set once signed in: the page for the form to open. See moveOnTo. */
  destination?: string
}

export async function signInAction(
  previous: SignInState,
  form: FormData,
): Promise<SignInState> {
  const typed = text(form, 'email')
  const attempt = previous.attempt + 1
  const parsed = signInSchema.safeParse({
    email: typed,
    password: text(form, 'password'),
  })
  if (!parsed.success) {
    return { attempt, email: typed, errors: fieldErrors(parsed.error) }
  }

  const result = await identity.signIn(parsed.data.email, parsed.data.password)
  if (!result.ok) {
    return {
      attempt,
      email: typed,
      // S01.4's wording. It says the same whichever one was wrong, on purpose.
      formError:
        result.reason === 'wrong-credentials' ? 'Wrong email or password.' : UNAVAILABLE,
    }
  }

  return {
    attempt,
    email: typed,
    destination: await moveOnTo(await destinationFor(result.claims)),
  }
}

/* Activate an account: ask for a link ------------------------------------------------- */

export interface ActivationRequestState {
  attempt: number
  email: string
  error?: string
  /** Set once the request is accepted. */
  sent?: {
    email: string
    /** Mock only: what the email would have held, for the demo panel to show. */
    demoHref?: string
    demoNote?: string
  }
}

const DEMO_NOTES = {
  'not-registered':
    'No link was made, because no account has this address. A real email would not say so.',
  'already-active':
    'No link was made, because this account already has a password. A real email would not say so.',
} as const

export async function requestActivationAction(
  previous: ActivationRequestState,
  form: FormData,
): Promise<ActivationRequestState> {
  const typed = text(form, 'email')
  const attempt = previous.attempt + 1
  const parsed = activationRequestSchema.safeParse({ email: typed })
  if (!parsed.success) {
    return { attempt, email: typed, error: fieldErrors(parsed.error).email }
  }

  const outbox = await identity.requestActivationLink(parsed.data.email)
  const { base } = await requestContext()
  return {
    attempt,
    email: typed,
    sent: {
      email: parsed.data.email,
      ...(outbox?.kind === 'link'
        ? {
            demoHref: `${base}/activate/set-password?token=${encodeURIComponent(outbox.token)}`,
          }
        : {}),
      ...(outbox?.kind === 'none' ? { demoNote: DEMO_NOTES[outbox.reason] } : {}),
    },
  }
}

/* Activate an account: set the password ----------------------------------------------- */

export interface SetPasswordState {
  attempt: number
  error?: string
  /** The link stopped working between opening the page and submitting it. */
  linkExpired?: boolean
  /** Set once the password is saved: the page for the form to open. See moveOnTo. */
  destination?: string
}

export async function setPasswordAction(
  previous: SetPasswordState,
  form: FormData,
): Promise<SetPasswordState> {
  const attempt = previous.attempt + 1
  const parsed = newPasswordSchema.safeParse({ password: text(form, 'password') })
  if (!parsed.success) {
    return { attempt, error: fieldErrors(parsed.error).password }
  }

  const result = await identity.activate(text(form, 'token'), parsed.data.password)
  if (!result.ok) {
    return result.reason === 'invalid-link'
      ? { attempt, linkExpired: true }
      : { attempt, error: UNAVAILABLE }
  }

  return { attempt, destination: await moveOnTo(await destinationFor(result.claims)) }
}
