import React, { useEffect } from 'react'
import {
  ArrowRightLeft,
  Monitor,
  Moon,
  RotateCcw,
  ShieldAlert,
  Sun,
  UserCheck,
} from 'lucide-react'
import { useStore } from '../context/StoreContext.jsx'
import { ALL_SCREENS, ROLES } from '../data/initialState.js'
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command'

export function CommandPalette({ open, onOpenChange }) {
  const { activeRole, theme, toggleTheme, signInAsRole, navigate, resetDemo } = useStore()

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        onOpenChange(!open)
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [open, onOpenChange])

  const jumpScreen = (s: (typeof ALL_SCREENS)[number]) => {
    if (s.role === 'public') {
      if (s.id === 'no-access') signInAsRole('unassigned')
      else navigate('sign-in')
    } else if (s.role === 'any') {
      navigate(s.id)
    } else {
      signInAsRole(s.role, { targetScreen: s.id })
    }
    onOpenChange(false)
  }

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="SEIskolar Command Menu"
      description="Jump to any screen, switch roles, or toggle theme."
    >
      <Command>
        <CommandInput placeholder="Type a screen, role, or action..." />
        <CommandList>
          <CommandEmpty>No matching screens or actions found.</CommandEmpty>

          <CommandGroup heading="Switch Role">
            {Object.values(ROLES).map((r) => (
              <CommandItem
                key={r.id}
                value={`role ${r.what} ${r.who}`}
                onSelect={() => {
                  signInAsRole(r.id)
                  onOpenChange(false)
                }}
              >
                <UserCheck className="size-4" />
                <span>
                  {r.what} — {r.who}
                </span>
                {activeRole?.id === r.id && <CommandShortcut>Active</CommandShortcut>}
              </CommandItem>
            ))}
            <CommandItem
              value="role unassigned account not ready"
              onSelect={() => {
                signInAsRole('unassigned')
                onOpenChange(false)
              }}
            >
              <ShieldAlert className="size-4" />
              <span>Unassigned account (Account not ready)</span>
            </CommandItem>
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Jump to Screen (29)">
            {ALL_SCREENS.map((s) => (
              <CommandItem
                key={s.id}
                value={`screen ${s.label} ${s.id} ${s.role}`}
                onSelect={() => jumpScreen(s)}
              >
                <ArrowRightLeft className="size-3.5 text-muted-foreground" />
                <span>{s.label}</span>
                <CommandShortcut className="capitalize">{s.role}</CommandShortcut>
              </CommandItem>
            ))}
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Workspace Actions">
            <CommandItem
              value="toggle dark light theme appearance"
              onSelect={() => {
                toggleTheme()
                onOpenChange(false)
              }}
            >
              {theme === 'dark' ? (
                <Sun className="size-4" />
              ) : (
                <Moon className="size-4" />
              )}
              <span>Switch to {theme === 'dark' ? 'Light' : 'Dark'} mode</span>
            </CommandItem>
            <CommandItem
              value="test nothing to show unauthorized guard"
              onSelect={() => {
                navigate('nothing-found')
                onOpenChange(false)
              }}
            >
              <Monitor className="size-4" />
              <span>Preview “Nothing to show” guard</span>
            </CommandItem>
            <CommandItem
              value="reset demo data restore initial state"
              onSelect={() => {
                resetDemo()
                onOpenChange(false)
              }}
            >
              <RotateCcw className="size-4" />
              <span>Reset demo data</span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    </CommandDialog>
  )
}
