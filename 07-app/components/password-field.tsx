'use client'

/**
 * A labelled password field with a show and hide button, so a scholar typing on a phone can
 * check what they typed. It never blocks pasting or a password manager (WCAG's accessible
 * authentication), and the browser's own autocomplete hint comes through `autoComplete`.
 *
 * Give it a new `key` after each attempt, which hides the password again.
 */
import { useState, type Ref } from 'react'
import { FieldError } from '@/components/field-error'
import { Icon } from '@/components/icons'

interface PasswordFieldProps {
  label: string
  autoComplete: 'current-password' | 'new-password'
  error?: string
  hint?: string
  inputRef?: Ref<HTMLInputElement>
}

export function PasswordField({
  label,
  autoComplete,
  error,
  hint,
  inputRef,
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false)
  // An error says what the hint says, more urgently, so it takes the hint's place.
  const describedBy = error ? 'password-error' : hint ? 'password-hint' : undefined

  return (
    <div className="field">
      <label className="label" htmlFor="password">
        {label}
      </label>
      <div className="input-wrap">
        <input
          ref={inputRef}
          className="input"
          id="password"
          name="password"
          type={visible ? 'text' : 'password'}
          autoComplete={autoComplete}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
        />
        <button
          className="reveal"
          type="button"
          aria-label="Show password"
          aria-pressed={visible}
          title={visible ? 'Hide password' : 'Show password'}
          onClick={() => setVisible((current) => !current)}
        >
          <Icon name={visible ? 'eyeOff' : 'eye'} />
        </button>
      </div>
      {error ? (
        <FieldError id="password-error">{error}</FieldError>
      ) : hint ? (
        <span className="hint" id="password-hint">
          {hint}
        </span>
      ) : null}
    </div>
  )
}
