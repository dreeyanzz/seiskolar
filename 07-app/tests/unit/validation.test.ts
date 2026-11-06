// What the forms accept, and what they say when they don't.
import { describe, expect, it } from 'vitest'
import {
  activationRequestSchema,
  fieldErrors,
  newPasswordSchema,
  PASSWORD_MAX,
  PASSWORD_MIN,
  signInSchema,
} from '@/lib/validation/auth'

function errorsOf(schema: typeof signInSchema, input: unknown) {
  const result = schema.safeParse(input)
  return result.success ? {} : fieldErrors(result.error)
}

describe('signInSchema', () => {
  it('tidies the email, and leaves the password exactly as typed', () => {
    const result = signInSchema.parse({
      email: '  Bea.Santiago@Example.TEST ',
      password: ' a space ',
    })
    expect(result.email).toBe('bea.santiago@example.test')
    expect(result.password).toBe(' a space ')
  })

  it('names each empty field', () => {
    expect(errorsOf(signInSchema, { email: '', password: '' })).toEqual({
      email: 'Enter your email.',
      password: 'Enter your password.',
    })
  })

  it('treats spaces alone as an empty email', () => {
    expect(errorsOf(signInSchema, { email: '   ', password: 'x' }).email).toBe(
      'Enter your email.',
    )
  })

  it('says when an email does not look like one', () => {
    expect(errorsOf(signInSchema, { email: 'bea', password: 'x' }).email).toMatch(
      /doesn't look like an email/,
    )
  })
})

describe('activationRequestSchema', () => {
  it('needs only a valid email', () => {
    expect(activationRequestSchema.parse({ email: 'ELLA@example.test' }).email).toBe(
      'ella@example.test',
    )
    expect(activationRequestSchema.safeParse({ email: '' }).success).toBe(false)
  })
})

describe('newPasswordSchema', () => {
  it('accepts the limits, and refuses one past them', () => {
    const ok = (length: number) =>
      newPasswordSchema.safeParse({ password: 'x'.repeat(length) }).success
    expect(ok(PASSWORD_MIN - 1)).toBe(false)
    expect(ok(PASSWORD_MIN)).toBe(true)
    expect(ok(PASSWORD_MAX)).toBe(true)
    expect(ok(PASSWORD_MAX + 1)).toBe(false)
  })
})
