import React from 'react'
import { CheckCircle2, Circle } from 'lucide-react'
import { cn } from 'cn'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'

const STATUS_MAP = {
  verified: {
    label: 'Verified',
    dot: 'bg-emerald-500',
    cls: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  },
  settled: {
    label: 'Settled',
    dot: 'bg-emerald-500',
    cls: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  },
  released: {
    label: 'Released',
    dot: 'bg-emerald-500',
    cls: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  },
  approved: {
    label: 'Approved',
    dot: 'bg-emerald-500',
    cls: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  },
  ok: {
    label: 'Yes',
    dot: 'bg-emerald-500',
    cls: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  },
  submitted: {
    label: 'Submitted',
    dot: 'bg-amber-500',
    cls: 'border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-400',
  },
  under_review: {
    label: 'Under review',
    dot: 'bg-blue-500',
    cls: 'border-blue-500/25 bg-blue-500/10 text-blue-700 dark:text-blue-400',
  },
  sent: {
    label: 'Sent',
    dot: 'bg-amber-500',
    cls: 'border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-400',
  },
  received: {
    label: 'Received',
    dot: 'bg-blue-500',
    cls: 'border-blue-500/25 bg-blue-500/10 text-blue-700 dark:text-blue-400',
  },
  pending: {
    label: 'Pending review',
    dot: 'bg-amber-500',
    cls: 'border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-400',
  },
  returned: {
    label: 'Returned',
    dot: 'bg-rose-500',
    cls: 'border-rose-500/25 bg-rose-500/10 text-rose-700 dark:text-rose-400',
  },
  disputed: {
    label: 'Disputed',
    dot: 'bg-rose-500',
    cls: 'border-rose-500/25 bg-rose-500/10 text-rose-700 dark:text-rose-400',
  },
  rejected: {
    label: 'Rejected',
    dot: 'bg-rose-500',
    cls: 'border-rose-500/25 bg-rose-500/10 text-rose-700 dark:text-rose-400',
  },
  bad: {
    label: 'No',
    dot: 'bg-rose-500',
    cls: 'border-rose-500/25 bg-rose-500/10 text-rose-700 dark:text-rose-400',
  },
  not_started: {
    label: 'Not started',
    dot: 'bg-zinc-400',
    cls: 'border-border bg-muted text-muted-foreground',
  },
  draft: {
    label: 'Draft',
    dot: 'bg-zinc-400',
    cls: 'border-border bg-muted text-muted-foreground',
  },
  off: {
    label: 'Inactive',
    dot: 'bg-zinc-400',
    cls: 'border-border bg-muted text-muted-foreground',
  },
}

export function StatusBadge({ status, label, className }) {
  const meta = STATUS_MAP[status] || STATUS_MAP.off
  return (
    <Badge
      variant="outline"
      className={cn(
        'gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
        meta.cls,
        className,
      )}
    >
      <span className={cn('size-1.5 shrink-0 rounded-full', meta.dot)} />
      {label || meta.label}
    </Badge>
  )
}

export function PageHeader({ eyebrow, title, description, actions, badge }) {
  return (
    <div className="flex flex-col gap-3 border-b pb-5 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-1">
        {eyebrow && (
          <p className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
            {eyebrow}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-2.5">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            {title}
          </h1>
          {badge}
        </div>
        {description && (
          <p className="text-sm text-muted-foreground sm:text-base">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
      )}
    </div>
  )
}

export function StatCard({ label, value, hint, icon: IconComp }) {
  return (
    <Card className="py-0">
      <CardContent className="flex items-start justify-between p-5">
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <p className="font-mono text-2xl font-semibold tracking-tight tabular-nums sm:text-3xl">
            {value}
          </p>
          {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
        </div>
        {IconComp && (
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border bg-muted/60 text-muted-foreground">
            <IconComp className="size-4" />
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function StepTimeline({ steps }) {
  return (
    <ol className="relative space-y-5 border-l border-border pl-6">
      {steps.map((step, idx) => {
        const isDone = step.status === 'done'
        const isNow = step.status === 'now'
        return (
          <li key={idx} className="relative">
            <span
              className={cn(
                'absolute -left-[33px] top-0.5 flex size-4 items-center justify-center rounded-full bg-background',
                isDone && 'text-emerald-600 dark:text-emerald-400',
                isNow && 'text-primary',
                !isDone && !isNow && 'text-muted-foreground/50',
              )}
            >
              {isDone ? (
                <CheckCircle2 className="size-4 fill-emerald-500/15" />
              ) : isNow ? (
                <span className="flex size-4 items-center justify-center rounded-full border-2 border-primary bg-primary/15">
                  <span className="size-1.5 rounded-full bg-primary" />
                </span>
              ) : (
                <Circle className="size-3.5" />
              )}
            </span>
            <p
              className={cn(
                'text-sm leading-snug',
                isNow
                  ? 'font-semibold text-foreground'
                  : isDone
                    ? 'font-medium text-foreground'
                    : 'text-muted-foreground',
              )}
            >
              {step.title}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">{step.when}</p>
          </li>
        )
      })}
    </ol>
  )
}

export function Breadcrumbs({ items }) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground"
    >
      {items.map((item, idx) => (
        <React.Fragment key={idx}>
          {idx > 0 && <span>/</span>}
          {item.onClick ? (
            <button
              type="button"
              onClick={item.onClick}
              className="font-medium text-foreground/80 underline-offset-4 hover:text-foreground hover:underline"
            >
              {item.label}
            </button>
          ) : (
            <span className="font-medium text-foreground">{item.label}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  )
}
