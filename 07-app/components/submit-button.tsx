'use client'

/**
 * A form's main button. While the form is on its way it shows that it is working and ignores
 * further presses, so a slow phone connection can't send a form twice.
 *
 * It uses aria-disabled rather than disabled, because a disabled button loses keyboard focus
 * and would drop a keyboard or screen reader user back at the top of the page.
 *
 * Use it inside a <form>: <SubmitButton pendingLabel="Signing in…">Sign in</SubmitButton>.
 */
import type { ReactNode, Ref } from 'react'
import { useFormStatus } from 'react-dom'

interface SubmitButtonProps {
  children: ReactNode
  pendingLabel: string
  /** Keeps it looking busy after the form has finished, while the next page loads. */
  moving?: boolean
  ref?: Ref<HTMLButtonElement>
}

export function SubmitButton({ children, pendingLabel, moving, ref }: SubmitButtonProps) {
  const status = useFormStatus()
  const pending = status.pending || moving
  return (
    <>
      <button
        ref={ref}
        className="btn primary block"
        type="submit"
        aria-disabled={pending}
        onClick={(event) => {
          if (pending) event.preventDefault()
        }}
      >
        {pending ? (
          <>
            <span className="spinner" aria-hidden="true" />
            {pendingLabel}
          </>
        ) : (
          children
        )}
      </button>
      <span className="sr-only" role="status">
        {pending ? pendingLabel : ''}
      </span>
    </>
  )
}
