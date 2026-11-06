/**
 * A problem with one field, shown right under it. The field points to it with
 * aria-describedby, so a screen reader reads it along with the field's label.
 */
import { Icon } from '@/components/icons'

export function FieldError({ id, children }: { id: string; children: string }) {
  return (
    <p className="field-error" id={id}>
      <Icon name="alert" />
      {children}
    </p>
  )
}
