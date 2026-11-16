import React, { useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  History,
  Inbox,
  Maximize2,
  Search,
  Users,
} from 'lucide-react'
import { useStore } from '../context/StoreContext.jsx'
import { RETURN_REASONS } from '../data/initialState.js'
import { GradesDocument } from '../components/GradesDocument.jsx'
import {
  Breadcrumbs,
  PageHeader,
  StatCard,
  StatusBadge,
} from '../components/ui-helpers.tsx'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'

export function RegionalHome() {
  const { data, navigate } = useStore()
  const totalScholars = data.schools.reduce((acc, s) => acc + s.scholarsCount, 0)
  const beaCleared = data.scholars.find((s) => s.id === 's-bea')?.cleared
  const totalCleared =
    data.schools.reduce((acc, s) => acc + s.clearedCount, 0) + (beaCleared ? 1 : 0)
  const activeQueueCount = data.filings.filter(
    (f) => f.state === 'submitted' || f.state === 'under_review',
  ).length

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="DOST-VII · 20 September 2026"
        title="Schools in the region"
        description="Each school's current term: who is cleared, and who is not yet."
        actions={
          <Button onClick={() => navigate('regional-queue')}>Open the queue</Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Scholars this term" value={totalScholars} icon={Users} />
        <StatCard
          label="Cleared"
          value={totalCleared}
          hint={`${totalScholars ? Math.round((totalCleared / totalScholars) * 100) : 0}% of region`}
          icon={CheckCircle2}
        />
        <StatCard
          label="Filings waiting for a check"
          value={33 + activeQueueCount}
          icon={Inbox}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>By school</CardTitle>
          <CardDescription>
            Click a school to open its pending filings in the queue.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>School</TableHead>
                  <TableHead>Term and deadline</TableHead>
                  <TableHead>Cleared</TableHead>
                  <TableHead className="text-right">Outstanding</TableHead>
                  <TableHead className="text-right">Not verified</TableHead>
                  <TableHead className="text-right">Oldest not filed</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.schools.map((school) => {
                  const term = data.terms.find((t) => t.schoolId === school.id)
                  const cleared =
                    school.id === 'citu' && beaCleared
                      ? school.clearedCount + 1
                      : school.clearedCount
                  const outstanding = Math.max(0, school.scholarsCount - cleared)
                  const notVerified =
                    school.id === 'citu' && beaCleared
                      ? Math.max(0, school.notYetVerifiedCount - 1)
                      : school.notYetVerifiedCount
                  const pct = school.scholarsCount
                    ? Math.round((cleared / school.scholarsCount) * 100)
                    : 0
                  return (
                    <TableRow key={school.id}>
                      <TableCell className="font-medium">
                        {school.scholarsCount > 0 ? (
                          <button
                            type="button"
                            className="text-left font-medium text-primary underline-offset-4 hover:underline"
                            onClick={() =>
                              navigate('regional-queue', { school: school.id })
                            }
                          >
                            {school.short}
                          </button>
                        ) : (
                          school.short
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {term
                          ? `${term.name.split(',')[0]} · ${term.deadlineShort}`
                          : 'No term on its calendar yet'}
                      </TableCell>
                      <TableCell>
                        {school.scholarsCount > 0 ? (
                          <div className="flex min-w-[130px] items-center gap-2.5">
                            <Progress value={pct} className="h-1.5 w-16" />
                            <span className="font-mono text-xs tabular-nums">
                              {cleared}/{school.scholarsCount}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            No scholars yet
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-mono tabular-nums">
                        {school.scholarsCount > 0 ? outstanding : '–'}
                      </TableCell>
                      <TableCell className="text-right font-mono tabular-nums">
                        {school.scholarsCount > 0 ? notVerified : '–'}
                      </TableCell>
                      <TableCell className="text-right font-mono tabular-nums">
                        {school.oldestNotFiledDays !== null
                          ? `${school.oldestNotFiledDays} days`
                          : '–'}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export function RegionalTermSetup() {
  const { data, saveTermSetup } = useStore()
  const [schoolId, setSchoolId] = useState('citu')
  const schoolTerms = data.terms.filter((t) => t.schoolId === schoolId)
  const [termId, setTermId] = useState(schoolTerms[0]?.id || '')

  const selectedSchool = data.schools.find((s) => s.id === schoolId)
  const activeTerm = schoolTerms.find((t) => t.id === termId) || schoolTerms[0] || null

  const [checklist, setChecklist] = useState(
    activeTerm?.checklist || {
      reg: { enabled: true, mandatory: true },
      grades: { enabled: true, mandatory: true },
    },
  )
  const [deadline, setDeadline] = useState(activeTerm?.deadline || '')

  useEffect(() => {
    if (activeTerm) {
      setChecklist(
        activeTerm.checklist || {
          reg: { enabled: false, mandatory: true },
          grades: { enabled: false, mandatory: true },
        },
      )
      setDeadline(activeTerm.deadline || '')
    }
  }, [activeTerm?.id])

  const handleSchoolChange = (nextSchoolId: string) => {
    setSchoolId(nextSchoolId)
    const first = data.terms.find((t) => t.schoolId === nextSchoolId)
    setTermId(first?.id || '')
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="DOST-VII"
        title="Terms: checklist and deadline"
        description="Each school adds its own terms. For each one, choose what scholars file, and by when."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {activeTerm ? (
            <Card>
              <CardHeader>
                <CardTitle>
                  {selectedSchool?.short} · {activeTerm.name}
                </CardTitle>
                <CardDescription>
                  {activeTerm.dates} · filing opens {activeTerm.filingOpens} · from{' '}
                  {selectedSchool?.short}'s calendar
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label>The checklist</Label>
                  <div className="divide-y rounded-lg border">
                    {(['reg', 'grades'] as const).map((key) => {
                      const req = data.requirementNames[key]
                      const item = checklist[key] || {
                        enabled: false,
                        mandatory: true,
                      }
                      return (
                        <div
                          className="flex flex-wrap items-center justify-between gap-4 px-4 py-3.5"
                          key={key}
                        >
                          <label className="flex cursor-pointer items-start gap-3">
                            <Checkbox
                              checked={item.enabled}
                              onCheckedChange={(checked) =>
                                setChecklist((prev) => ({
                                  ...prev,
                                  [key]: { ...item, enabled: Boolean(checked) },
                                }))
                              }
                            />
                            <div className="space-y-0.5">
                              <p className="text-sm font-medium">{req.dostName}</p>
                              <p className="text-xs text-muted-foreground">
                                {selectedSchool?.short} calls it {req.schoolName}
                                {key === 'grades'
                                  ? ' · scholars type their grade lines'
                                  : ''}
                              </p>
                            </div>
                          </label>

                          <label className="flex cursor-pointer items-center gap-2 text-sm">
                            <Checkbox
                              disabled={!item.enabled}
                              checked={item.mandatory}
                              onCheckedChange={(checked) =>
                                setChecklist((prev) => ({
                                  ...prev,
                                  [key]: {
                                    ...item,
                                    mandatory: Boolean(checked),
                                  },
                                }))
                              }
                            />
                            Mandatory
                          </label>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="term-setup-deadline">Compliance deadline</Label>
                  <Input
                    id="term-setup-deadline"
                    placeholder="e.g. 30 September 2026 (leave blank for no deadline)"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    In Philippine time. Scholars see a countdown to it.
                  </p>
                </div>

                <Button
                  type="button"
                  onClick={() =>
                    saveTermSetup({
                      termId: activeTerm.id,
                      checklist,
                      deadline: deadline.trim(),
                    })
                  }
                >
                  Save the checklist and deadline
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>No terms on {selectedSchool?.short}'s calendar yet</CardTitle>
                <CardDescription>
                  The school's coordinator adds terms on their Academic calendar screen
                  first.
                </CardDescription>
              </CardHeader>
            </Card>
          )}
        </div>

        <aside>
          <Card>
            <CardHeader>
              <CardTitle>Terms on the calendars</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="term-setup-school">School</Label>
                <Select value={schoolId} onValueChange={handleSchoolChange}>
                  <SelectTrigger id="term-setup-school" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {data.schools.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.short}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                {schoolTerms.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No terms added yet.</p>
                ) : (
                  schoolTerms.map((t) => {
                    const isSet =
                      t.checklist?.reg?.enabled || t.checklist?.grades?.enabled
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setTermId(t.id)}
                        className={`flex w-full items-center justify-between gap-2 rounded-lg border px-3 py-2.5 text-left transition-colors ${
                          activeTerm?.id === t.id
                            ? 'border-primary/40 bg-accent'
                            : 'hover:bg-muted/50'
                        }`}
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{t.name}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            {t.deadline ? `Deadline ${t.deadline}` : t.addedLabel}
                          </p>
                        </div>
                        <StatusBadge
                          status={isSet ? 'verified' : 'off'}
                          label={isSet ? 'Set' : 'No checklist'}
                        />
                      </button>
                    )
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  )
}

export function RegionalQueue() {
  const { data, route, navigate } = useStore()
  const [search, setSearch] = useState('')
  const [schoolFilter, setSchoolFilter] = useState(route.params.school || 'all')
  const [stateFilter, setStateFilter] = useState('active')
  const [reqFilter, setReqFilter] = useState('all')
  const [onlyUnclear, setOnlyUnclear] = useState(true)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return data.filings.filter((f) => {
      if (
        q &&
        !f.scholarName.toLowerCase().includes(q) &&
        !f.scholarNumber.toLowerCase().includes(q)
      ) {
        return false
      }
      if (schoolFilter !== 'all' && f.schoolId !== schoolFilter) return false
      if (reqFilter !== 'all' && f.requirementKey !== reqFilter) return false
      if (onlyUnclear && f.cleared) return false
      if (stateFilter === 'active') {
        return f.state === 'submitted' || f.state === 'under_review'
      }
      if (stateFilter !== 'all' && f.state !== stateFilter) return false
      return true
    })
  }, [data.filings, search, schoolFilter, stateFilter, reqFilter, onlyUnclear])

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="DOST-VII · 20 September 2026"
        title="Queue"
        description="Filings from the region's schools, oldest first."
      />

      <Card>
        <CardHeader className="space-y-4 pb-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1.5">
              <Label htmlFor="q-search">Search scholar</Label>
              <div className="relative">
                <Search className="pointer-events-none absolute top-2.5 left-2.5 size-4 text-muted-foreground" />
                <Input
                  id="q-search"
                  placeholder="Name or ID…"
                  className="pl-8"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="q-school">School</Label>
              <Select value={schoolFilter} onValueChange={setSchoolFilter}>
                <SelectTrigger id="q-school" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All schools</SelectItem>
                  {data.schools.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.short}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="q-state">State</Label>
              <Select value={stateFilter} onValueChange={setStateFilter}>
                <SelectTrigger id="q-state" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Submitted, under review</SelectItem>
                  <SelectItem value="submitted">Submitted only</SelectItem>
                  <SelectItem value="under_review">Under review only</SelectItem>
                  <SelectItem value="returned">Returned</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="all">All states</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="q-req">Requirement</Label>
              <Select value={reqFilter} onValueChange={setReqFilter}>
                <SelectTrigger id="q-req" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All requirements</SelectItem>
                  <SelectItem value="reg">Registration Form</SelectItem>
                  <SelectItem value="grades">Certified Report of Grades</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
              <Checkbox
                checked={onlyUnclear}
                onCheckedChange={(v) => setOnlyUnclear(Boolean(v))}
              />
              Not yet cleared only
            </label>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{filtered.length} filings</span>
              <span aria-hidden="true">·</span>
              <span>Oldest first</span>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {filtered.length === 0 ? (
            <div className="rounded-lg border border-dashed py-12 text-center text-sm text-muted-foreground">
              No filings match the current filters. Try choosing “All states”.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Filed</TableHead>
                    <TableHead>Scholar</TableHead>
                    <TableHead>School</TableHead>
                    <TableHead>Requirement</TableHead>
                    <TableHead>State</TableHead>
                    <TableHead>Deadline</TableHead>
                    <TableHead className="text-right" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((f) => {
                    const dostName = data.requirementNames[f.requirementKey]?.dostName
                    const stateLabel =
                      f.state === 'under_review'
                        ? `Under review: ${f.claimedBy}`
                        : undefined
                    return (
                      <TableRow key={f.id}>
                        <TableCell className="font-mono text-xs whitespace-nowrap text-muted-foreground">
                          {f.filedDate}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <div>
                            <p className="font-medium">{f.scholarName}</p>
                            <p className="font-mono text-xs text-muted-foreground">
                              {f.scholarNumber}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>{f.schoolName}</TableCell>
                        <TableCell>{dostName}</TableCell>
                        <TableCell>
                          <StatusBadge status={f.state} label={stateLabel} />
                        </TableCell>
                        <TableCell className="text-sm whitespace-nowrap text-muted-foreground">
                          {f.deadlineLabel}
                        </TableCell>
                        <TableCell className="text-right whitespace-nowrap">
                          <Button
                            size="sm"
                            variant={f.state === 'submitted' ? 'default' : 'outline'}
                            onClick={() =>
                              navigate('regional-review', { filingId: f.id })
                            }
                          >
                            {f.state === 'submitted' ? 'Claim' : 'View'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export function RegionalReview() {
  const {
    data,
    activeRole,
    route,
    navigate,
    claimFiling,
    releaseClaim,
    verifyFiling,
    returnFiling,
  } = useStore()
  const filing =
    data.filings.find((f) => f.id === route.params.filingId) ||
    data.filings.find((f) => f.id === 'f-bea-grades') ||
    data.filings[0]

  const [returningMode, setReturningMode] = useState(false)
  const [reason, setReason] = useState('Illegible')
  const [remarks, setRemarks] = useState(
    "The bottom-right corner is cut off, so the last two subjects can't be read.",
  )
  const [err, setErr] = useState('')

  const names = data.requirementNames[filing.requirementKey]
  const school = data.schools.find((s) => s.id === filing.schoolId)

  const avgStats = useMemo(() => {
    let units = 0
    let sum = 0
    filing.gradeLines.forEach((l) => {
      const u = parseFloat(l.units)
      const g = parseFloat(l.grade)
      if (!Number.isNaN(u) && !Number.isNaN(g) && u > 0) {
        units += u
        sum += u * g
      }
    })
    return {
      units,
      avg: units > 0 ? (sum / units).toFixed(4) : '–',
    }
  }, [filing.gradeLines])

  const claimedByYou =
    filing.state === 'under_review' &&
    filing.claimedBy === (activeRole?.who || 'Ana Villareal')

  const handleReturnSubmit = () => {
    if (reason === 'Other' && remarks.trim().length < 10) {
      setErr('When choosing “Other”, enter remarks of at least 10 characters.')
      return
    }
    if (!remarks.trim()) {
      setErr('Enter remarks explaining what the scholar must fix.')
      return
    }
    setErr('')
    returnFiling({
      filingId: filing.id,
      reason,
      remarks: remarks.trim(),
    })
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: 'Queue', onClick: () => navigate('regional-queue') },
          { label: filing.scholarName },
        ]}
      />

      <PageHeader
        eyebrow={`${filing.schoolName} · ${filing.term}`}
        title={`${filing.scholarName}: ${names.dostName}`}
        description={`${filing.schoolName} calls it ${names.schoolName} · version ${filing.versions.length}, filed ${filing.filedDate} · ${filing.scholarNumber}`}
        badge={
          <StatusBadge
            status={filing.state}
            label={
              filing.state === 'under_review'
                ? `Under review: ${claimedByYou ? 'claimed by you' : filing.claimedBy}`
                : undefined
            }
          />
        }
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('record-history', { filingId: filing.id })}
          >
            <History className="mr-1.5 size-4" />
            History of this filing
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <CardTitle>The document</CardTitle>
                <CardDescription className="font-mono text-xs">
                  {filing.fileSize} · {filing.fileName}
                </CardDescription>
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Maximize2 className="mr-1.5 size-3.5" />
                    Zoom
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>{filing.fileName}</DialogTitle>
                  </DialogHeader>
                  <div className="overflow-hidden rounded-lg border bg-muted">
                    <GradesDocument
                      kind={filing.docKind}
                      scholarName={filing.scholarName}
                      lines={filing.gradeLines}
                    />
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="overflow-hidden rounded-lg border bg-muted">
              <GradesDocument
                kind={filing.docKind}
                scholarName={filing.scholarName}
                lines={filing.gradeLines}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Opened through a signed link that lasts five minutes.
            </p>
          </CardContent>
        </Card>

        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>What {filing.scholarName.split(' ')[0]} typed</CardTitle>
              <CardDescription>
                {school?.short || filing.schoolName}'s scale:{' '}
                {school?.gradingLowest || '1.00'} to {school?.gradingHighest || '5.00'},{' '}
                {school?.higherIsBetter ? 'higher is better' : 'lower is better'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="overflow-hidden rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">#</TableHead>
                      <TableHead>Subject code</TableHead>
                      <TableHead className="text-right">Units</TableHead>
                      <TableHead className="text-right">Grade</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filing.gradeLines.map((row, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {idx + 1}
                        </TableCell>
                        <TableCell className="font-mono">{row.code}</TableCell>
                        <TableCell className="text-right font-mono tabular-nums">
                          {row.units}
                        </TableCell>
                        <TableCell className="text-right font-mono tabular-nums">
                          {row.grade}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="flex items-center justify-between rounded-lg border bg-muted/40 px-4 py-3 text-sm">
                <span className="font-medium">Weighted average</span>
                <span className="font-mono font-semibold tabular-nums">
                  {avgStats.avg} · {avgStats.units} units
                </span>
              </div>
            </CardContent>
          </Card>

          {filing.state === 'submitted' && (
            <Card>
              <CardHeader>
                <CardTitle>Claim it to decide</CardTitle>
                <CardDescription>
                  Claiming it stops anyone else in the office deciding it at the same
                  time.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  type="button"
                  className="w-full"
                  onClick={() => claimFiling(filing.id)}
                >
                  Claim it
                </Button>
              </CardContent>
            </Card>
          )}

          {filing.state === 'under_review' && !returningMode && (
            <Card>
              <CardHeader>
                <CardTitle>Your decision</CardTitle>
                <CardDescription>
                  {claimedByYou
                    ? 'Compare the document with the typed lines. Verified is final.'
                    : `Claimed by ${filing.claimedBy}. Only the claim holder decides.`}
                </CardDescription>
              </CardHeader>
              {claimedByYou && (
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap gap-2.5">
                    <Button type="button" onClick={() => verifyFiling(filing.id)}>
                      Verify
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() => setReturningMode(true)}
                    >
                      Return it
                    </Button>
                  </div>
                  <button
                    type="button"
                    className="text-xs font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                    onClick={() => releaseClaim(filing.id)}
                  >
                    Release the claim without deciding
                  </button>
                </CardContent>
              )}
            </Card>
          )}

          {filing.state === 'under_review' && returningMode && (
            <Card>
              <CardHeader>
                <CardTitle>Return it to {filing.scholarName.split(' ')[0]}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {err && (
                  <Alert variant="destructive" role="alert">
                    <AlertCircle className="size-4" />
                    <AlertDescription>{err}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label>Reason</Label>
                  <RadioGroup value={reason} onValueChange={setReason}>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {RETURN_REASONS.map((r) => (
                        <label
                          key={r}
                          className="flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-muted/40"
                        >
                          <RadioGroupItem value={r} />
                          {r}
                        </label>
                      ))}
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="review-remarks">Remarks</Label>
                  <Textarea
                    rows={3}
                    id="review-remarks"
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Needed for “Other”: 10 characters or more.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button type="button" onClick={handleReturnSubmit}>
                    Return it
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setErr('')
                      setReturningMode(false)
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {filing.state === 'verified' && (
            <Alert className="border-emerald-500/30 bg-emerald-500/5">
              <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
              <AlertTitle>Verified</AlertTitle>
              <AlertDescription>
                Verified is final and can no longer be changed.
              </AlertDescription>
            </Alert>
          )}

          {filing.state === 'returned' && (
            <Alert variant="destructive">
              <AlertTriangle className="size-4" />
              <AlertTitle>
                Returned: {(filing.returnReason || 'illegible').toLowerCase()}
              </AlertTitle>
              <AlertDescription>
                “{filing.returnRemarks}” Waiting for {filing.scholarName} to file a
                corrected version.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </div>
    </div>
  )
}

export function RecordHistory() {
  const { data, route, navigate } = useStore()
  const filing =
    data.filings.find((f) => f.id === route.params.filingId) ||
    data.filings.find((f) => f.id === 'f-bea-grades') ||
    data.filings[0]
  const names = data.requirementNames[filing.requirementKey]
  const [selectedIdx, setSelectedIdx] = useState(filing.history.length - 1)
  const selectedLine =
    filing.history[selectedIdx] || filing.history[filing.history.length - 1]

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: 'Queue', onClick: () => navigate('regional-queue') },
          {
            label: filing.scholarName,
            onClick: () => navigate('regional-review', { filingId: filing.id }),
          },
          { label: 'History' },
        ]}
      />

      <PageHeader
        eyebrow={`${filing.schoolName} · ${filing.term}`}
        title={`History: ${filing.scholarName}'s ${names.dostName}`}
        description="Every change to this filing, oldest first, written by SEIskolar itself. Select a row to inspect Before and After."
      />

      <Card>
        <CardContent className="pt-6">
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>When</TableHead>
                  <TableHead>Who</TableHead>
                  <TableHead>What</TableHead>
                  <TableHead>State before → after</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filing.history.map((entry, idx) => (
                  <TableRow
                    key={idx}
                    data-state={idx === selectedIdx ? 'selected' : undefined}
                    className="cursor-pointer"
                    onClick={() => setSelectedIdx(idx)}
                  >
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {entry.when}
                    </TableCell>
                    <TableCell className="font-medium">{entry.who}</TableCell>
                    <TableCell>{entry.what}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {entry.stateChange}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {selectedLine && (
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle>One line in full</CardTitle>
              <span className="font-mono text-xs text-muted-foreground">
                {selectedLine.when} · {selectedLine.who}
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="hist-before">Before</Label>
                <Textarea
                  rows={3}
                  readOnly
                  id="hist-before"
                  className="bg-muted font-mono text-xs"
                  value={selectedLine.before}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="hist-after">After</Label>
                <Textarea
                  rows={3}
                  readOnly
                  id="hist-after"
                  className="bg-muted font-mono text-xs"
                  value={selectedLine.after}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
