/**
 * What the sign-in and activation forms accept, checked on the server for every submit
 * (SRS §2.1: Server Actions validate their input against Zod schemas).
 *
 * The messages name the problem and how to fix it. S01.4's "Wrong email or password" is not
 * here, because a well-formed email and password can still be wrong.
 */
import { z } from 'zod'

const email = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, 'Enter your email.')
  .pipe(z.email("That doesn't look like an email address. Check it and try again."))

export const signInSchema = z.object({
  email,
  // Never trimmed: a space can be part of a password.
  password: z.string().min(1, 'Enter your password.'),
})

export const activationRequestSchema = z.object({ email })

/** Assumed: the SRS sets no password rule. 72 is the limit of Supabase's password hashing. */
export const PASSWORD_MIN = 8
export const PASSWORD_MAX = 72

export const newPasswordSchema = z.object({
  password: z
    .string()
    .min(PASSWORD_MIN, `Use at least ${PASSWORD_MIN} characters.`)
    .max(PASSWORD_MAX, `Use at most ${PASSWORD_MAX} characters.`),
})

/** Each field's first problem, for showing under that field. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {}
  for (const issue of error.issues) {
    const field = String(issue.path[0] ?? 'form')
    errors[field] ??= issue.message
  }
  return errors
}
