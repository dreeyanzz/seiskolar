'use client'

/**
 * Lists the invented demo accounts under a form, and fills the form with the one you press.
 *
 * Not part of the team's design: it exists only while the data is mock, so a demo doesn't
 * need the README open, and it disappears when lib/backend.ts sets `demo` to null. It starts
 * closed, so the screen looks as designed until someone asks for it.
 */
import { Icon } from '@/components/icons'
import type { DemoAccount, DemoGroup } from '@/lib/identity/gateway'

interface DemoPanelProps {
  title: string
  note: string
  groups: DemoGroup[]
  onPick: (account: DemoAccount) => void
}

export function DemoPanel({ title, note, groups, onPick }: DemoPanelProps) {
  return (
    <details className="demo">
      <summary>
        <span className="demo-title">
          {title}
          <span className="badge info">Mock data</span>
        </span>
        <Icon name="chevronDown" />
      </summary>
      <div className="demo-body">
        <p className="hint">{note}</p>
        {groups.map((group) => (
          <div key={group.label}>
            <h2 className="demo-label">{group.label}</h2>
            <ul className="demo-list">
              {group.accounts.map((account) => (
                <li key={account.email}>
                  <button
                    className="demo-item"
                    type="button"
                    onClick={() => onPick(account)}
                  >
                    <span className="demo-name">{account.name}</span>
                    <span className="small muted">{account.detail}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </details>
  )
}
