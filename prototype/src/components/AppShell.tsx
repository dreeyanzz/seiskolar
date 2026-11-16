import React, { useState } from 'react'
import {
  ArrowLeftRight,
  Award,
  Banknote,
  Building2,
  CalendarDays,
  Check,
  ChevronsUpDown,
  FileCheck2,
  Gift,
  Home,
  Inbox,
  Layers,
  ListChecks,
  LogOut,
  Map as MapIcon,
  Menu,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  RotateCcw,
  Route,
  Search,
  Shield,
  ShieldAlert,
  SlidersHorizontal,
  Sun,
  Tag,
  Target,
  Users,
} from 'lucide-react'
import { cn } from 'cn'
import { useStore } from '../context/StoreContext.jsx'
import { ALL_SCREENS, ROLES } from '../data/initialState.js'
import { Mark } from './Icons.jsx'
import { CommandPalette } from './CommandPalette.tsx'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

const LUCIDE_NAV = {
  home: Home,
  route: Route,
  calendar: CalendarDays,
  tag: Tag,
  banknote: Banknote,
  sliders: SlidersHorizontal,
  inbox: Inbox,
  layers: Layers,
  checklist: ListChecks,
  gift: Gift,
  building: Building2,
  users: Users,
  swap: ArrowLeftRight,
  award: Award,
  filecheck: FileCheck2,
  target: Target,
  shield: Shield,
  map: MapIcon,
}

function initials(name: string) {
  return name
    .split(' ')
    .map((p) => p.charAt(0))
    .join('')
    .slice(0, 2)
}

export function AppShell({
  activeNav,
  children,
}: {
  activeNav: string
  children: React.ReactNode
}) {
  const {
    activeRole,
    data,
    theme,
    toggleTheme,
    route,
    navigate,
    signInAsRole,
    signOut,
    resetDemo,
  } = useStore()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [cmdOpen, setCmdOpen] = useState(false)

  if (!activeRole) return <>{children}</>

  const citu = data.schools.find((s) => s.id === 'citu') || data.schools[0]
  const queueCount = data.filings.filter(
    (f) => f.state === 'submitted' || f.state === 'under_review',
  ).length
  const pendingProposals = data.proposals.filter((p) => p.status === 'pending').length
  const disputedCount = data.remittances.filter(
    (r) => r.status === 'disputed' || r.status === 'sent',
  ).length

  const navBadge = (id: string) => {
    if (id === 'regional-queue' && queueCount > 0) return queueCount
    if (id === 'central-proposals' && pendingProposals > 0) return pendingProposals
    if (id === 'coordinator-remittances' && disputedCount > 0) return disputedCount
    return null
  }

  const currentScreenMeta = ALL_SCREENS.find((s) => s.id === route.screen)
  const rawCrumb = currentScreenMeta?.label.split(': ').pop() || activeRole.what
  const currentCrumb = rawCrumb.charAt(0).toUpperCase() + rawCrumb.slice(1)

  const renderSidebarBody = (isMobile: boolean) => {
    const isSlim = collapsed && !isMobile
    return (
      <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
        {/* Top Portal / Role Switcher */}
        <div
          className={cn(
            'flex h-14 items-center border-b px-3',
            isSlim ? 'justify-center' : 'justify-between',
          )}
        >
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className={cn(
                  'flex w-full items-center gap-2.5 rounded-lg p-1.5 text-left transition-colors hover:bg-sidebar-accent',
                  isSlim && 'justify-center p-1',
                )}
              >
                <span className="size-8 shrink-0">
                  <Mark
                    kind={activeRole.portal === 'school' ? 'school' : 'seiskolar'}
                    primary={citu.primaryColor}
                    accent={citu.accentColor}
                  />
                </span>
                {!isSlim && (
                  <>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold leading-tight">
                        {activeRole.portal === 'school' ? citu.short : 'SEIskolar'}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {activeRole.portal === 'school'
                          ? 'Scholar Portal'
                          : activeRole.office}
                      </p>
                    </div>
                    <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
                  </>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64">
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                Switch Role Workspace
              </DropdownMenuLabel>
              {Object.values(ROLES).map((r) => (
                <DropdownMenuItem
                  key={r.id}
                  onSelect={() => {
                    signInAsRole(r.id)
                    setMobileOpen(false)
                  }}
                >
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="font-medium">{r.what}</span>
                    <span className="truncate text-xs text-muted-foreground">
                      {r.who} · {r.portal === 'school' ? 'School portal' : 'DOST console'}
                    </span>
                  </div>
                  {activeRole.id === r.id && <Check className="size-4" />}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={() => {
                  signInAsRole('unassigned')
                  setMobileOpen(false)
                }}
              >
                <ShieldAlert className="size-4" />
                <span>Unassigned account</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 space-y-1 overflow-y-auto px-2.5 py-3">
          {!isSlim && (
            <p className="px-2.5 pb-1 text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
              {activeRole.what}
            </p>
          )}
          <nav className="space-y-0.5" aria-label="Main">
            {activeRole.nav.map(([id, label, iconName]) => {
              const isActive = id === activeNav
              const IconComp = LUCIDE_NAV[iconName] || Home
              const count = navBadge(id)
              const btn = (
                <button
                  key={id}
                  type="button"
                  aria-current={isActive ? 'page' : undefined}
                  onClick={() => {
                    navigate(id)
                    setMobileOpen(false)
                  }}
                  className={cn(
                    'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-xs'
                      : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                    isSlim && 'justify-center px-0',
                  )}
                >
                  <IconComp className="size-4 shrink-0" />
                  {!isSlim && (
                    <>
                      <span className="flex-1 truncate text-left">{label}</span>
                      {count !== null && (
                        <Badge
                          variant={isActive ? 'secondary' : 'outline'}
                          className="h-5 px-1.5 font-mono text-[11px] tabular-nums"
                        >
                          {count}
                        </Badge>
                      )}
                    </>
                  )}
                </button>
              )

              if (isSlim) {
                return (
                  <Tooltip key={id}>
                    <TooltipTrigger asChild>{btn}</TooltipTrigger>
                    <TooltipContent side="right">
                      {label}
                      {count !== null ? ` (${count})` : ''}
                    </TooltipContent>
                  </Tooltip>
                )
              }
              return btn
            })}
          </nav>
        </div>

        {/* Bottom User Menu */}
        <div className="border-t p-2.5">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className={cn(
                  'flex w-full items-center gap-2.5 rounded-lg p-2 text-left transition-colors hover:bg-sidebar-accent',
                  isSlim && 'justify-center p-1.5',
                )}
              >
                <Avatar className="size-8 border">
                  <AvatarFallback className="bg-muted text-xs font-semibold">
                    {initials(activeRole.who)}
                  </AvatarFallback>
                </Avatar>
                {!isSlim && (
                  <>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium leading-tight">
                        {activeRole.who}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {activeRole.email}
                      </p>
                    </div>
                    <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
                  </>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" side="top" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-0.5">
                  <p className="text-sm font-medium">{activeRole.who}</p>
                  <p className="text-xs text-muted-foreground">{activeRole.what}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={() => {
                  setCmdOpen(true)
                  setMobileOpen(false)
                }}
              >
                <Search className="size-4" />
                <span>Jump to any screen (⌘K)</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => {
                  navigate('nothing-found')
                  setMobileOpen(false)
                }}
              >
                <ShieldAlert className="size-4" />
                <span>Test “Nothing to show”</span>
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={resetDemo}>
                <RotateCcw className="size-4" />
                <span>Reset demo data</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={() => {
                  signOut(activeRole.portal)
                  setMobileOpen(false)
                }}
              >
                <LogOut className="size-4" />
                <span>Sign out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'hidden shrink-0 border-r bg-sidebar transition-[width] duration-200 lg:sticky lg:top-0 lg:block lg:h-screen',
          collapsed ? 'w-16' : 'w-64',
        )}
      >
        {renderSidebarBody(false)}
      </aside>

      {/* Mobile / Tablet Slide-over Sidebar */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-72 p-0">
          <SheetTitle className="sr-only">Navigation menu</SheetTitle>
          {renderSidebarBody(true)}
        </SheetContent>
      </Sheet>

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-3 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/75 lg:px-6">
          <div className="flex min-w-0 items-center gap-2.5">
            <Button
              variant="ghost"
              size="icon-sm"
              className="lg:hidden"
              aria-label="Open navigation menu"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              className="hidden lg:inline-flex"
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              onClick={() => setCollapsed((v) => !v)}
            >
              {collapsed ? (
                <PanelLeftOpen className="size-4" />
              ) : (
                <PanelLeftClose className="size-4" />
              )}
            </Button>

            <div className="h-4 w-px bg-border" />

            <div className="flex min-w-0 items-center gap-2 text-sm">
              <span
                className="inline-block size-2 shrink-0 rounded-full"
                style={{
                  backgroundColor:
                    activeRole.portal === 'school' ? citu.primaryColor : '#16365c',
                }}
              />
              <span className="hidden truncate text-muted-foreground sm:inline">
                {activeRole.portal === 'school'
                  ? `${citu.short} Portal`
                  : activeRole.office}
              </span>
              <span className="hidden text-muted-foreground sm:inline">/</span>
              <span className="truncate font-medium">{currentCrumb}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-2 text-muted-foreground"
              onClick={() => setCmdOpen(true)}
            >
              <Search className="size-3.5" />
              <span className="hidden sm:inline">Search screens & roles…</span>
              <kbd className="pointer-events-none hidden rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px] font-medium text-muted-foreground md:inline-block">
                ⌘K
              </kbd>
            </Button>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Toggle theme"
                  onClick={toggleTheme}
                >
                  {theme === 'dark' ? (
                    <Sun className="size-4" />
                  ) : (
                    <Moon className="size-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                Switch to {theme === 'dark' ? 'Light' : 'Dark'} mode
              </TooltipContent>
            </Tooltip>
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl flex-1 space-y-6 px-4 py-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>

      <CommandPalette open={cmdOpen} onOpenChange={setCmdOpen} />
    </div>
  )
}
