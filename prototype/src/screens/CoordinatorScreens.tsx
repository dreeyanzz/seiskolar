import React, { useState } from 'react'
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock,
  FileText,
  Palette,
  Users,
} from 'lucide-react'
import { useStore } from '../context/StoreContext.jsx'
import { Mark } from '../components/Icons.jsx'
import { PageHeader, StatCard, StatusBadge } from '../components/ui-helpers.tsx'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
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

export function CoordinatorHome() {
  const { data, navigate } = useStore()
  const citu = data.schools.find((s) => s.id === 'citu') || data.schools[0]
  const term = data.terms.find((t) => t.id === 'citu-2026-1') || data.terms[0]

  const beaCleared = data.scholars.find((s) => s.id === 's-bea')?.cleared
  const clearedCount = citu.clearedCount + (beaCleared ? 1 : 0)
  const totalScholars = citu.scholarsCount
  const outstanding = Math.max(0, totalScholars - clearedCount)
  const unverified = Math.max(0, citu.notYetVerifiedCount - (beaCleared ? 1 : 0))
  const pct = totalScholars ? Math.round((clearedCount / totalScholars) * 100) : 0

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={`${citu.short} · ${term?.name || '1st Semester, AY 2026–2027'}`}
        title="How the school's scholars are doing"
        description={
          term?.deadline
            ? `Deadline ${term.deadline}, set by DOST-VII · ${term.daysLeftText || '9 days left'}`
            : 'No compliance deadline set by DOST-VII yet'
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Scholars this term" value={totalScholars} icon={Users} />
        <StatCard
          label="Cleared"
          value={clearedCount}
          hint={`${pct}% of scholars`}
          icon={CheckCircle2}
        />
        <StatCard label="Still outstanding" value={outstanding} icon={Clock} />
        <StatCard label="Documents not yet verified" value={unverified} icon={FileText} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Cleared so far</CardTitle>
              <span className="font-mono text-sm font-medium tabular-nums">{pct}%</span>
            </div>
            <CardDescription>
              {clearedCount} of {totalScholars} scholars have every mandatory document
              verified.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Progress value={pct} className="h-2" />
            <Separator />
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Oldest document not yet filed</span>
              <span className="font-mono font-medium tabular-nums">
                35 days since filing opened
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>This term</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Term</span>
                <span className="font-medium">
                  {term?.dates || '10 Aug to 12 Dec 2026'}
                </span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Filing opens</span>
                <span className="font-medium">{term?.filingOpens || '17 Aug'}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Deadline</span>
                <span className="font-medium">
                  {term?.deadline ? `${term.deadline} · DOST-VII` : 'Not set yet'}
                </span>
              </div>
            </div>
            <Button
              variant="outline"
              className="w-full justify-between"
              onClick={() => navigate('coordinator-terms')}
            >
              <span className="flex items-center gap-2">
                <CalendarDays className="size-4" />
                Open the calendar
              </span>
              <ArrowRight className="size-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export function CoordinatorTerms() {
  const { data, addTerm, showToast } = useStore()
  const citu = data.schools.find((s) => s.id === 'citu') || data.schools[0]
  const cituTerms = data.terms.filter((t) => t.schoolId === 'citu')

  const [name, setName] = useState('')
  const [type, setType] = useState('Semester')
  const [starts, setStarts] = useState('')
  const [ends, setEnds] = useState('')
  const [filingOpens, setFilingOpens] = useState('')
  const [err, setErr] = useState('')

  const fmtDate = (iso: string) => {
    if (!iso) return ''
    const d = new Date(`${iso}T00:00:00`)
    if (Number.isNaN(d.getTime())) return iso
    return d.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setErr('Enter a term name.')
      return
    }
    setErr('')
    const datesStr =
      starts && ends ? `${fmtDate(starts)} to ${fmtDate(ends)}` : 'Dates to be announced'
    addTerm({
      schoolId: 'citu',
      name: name.trim(),
      type,
      dates: datesStr,
      filingOpens: filingOpens ? fmtDate(filingOpens) : 'Not set',
    })
    setName('')
    setStarts('')
    setEnds('')
    setFilingOpens('')
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={citu.short}
        title="Academic calendar"
        description="The school's terms, and when filing opens in each."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Terms</CardTitle>
            <CardDescription>
              Checklists and deadlines are configured by DOST-VII.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Term</TableHead>
                    <TableHead>Dates</TableHead>
                    <TableHead>Filing opens</TableHead>
                    <TableHead>Deadline</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cituTerms.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="font-medium">{t.name}</TableCell>
                      <TableCell className="text-muted-foreground">{t.dates}</TableCell>
                      <TableCell>{t.filingOpens}</TableCell>
                      <TableCell>
                        {t.deadline ? (
                          <StatusBadge
                            status="verified"
                            label={`${t.deadline} · DOST-VII`}
                          />
                        ) : (
                          <StatusBadge status="off" label="Not set yet" />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Add a term</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSave}>
              {err && (
                <Alert variant="destructive" role="alert">
                  <AlertCircle className="size-4" />
                  <AlertDescription>{err}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="term-name">Name</Label>
                <Input
                  id="term-name"
                  placeholder="e.g. 2nd Semester, AY 2026–2027"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="term-type">Type</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger id="term-type" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Semester">Semester</SelectItem>
                    <SelectItem value="Trimester">Trimester</SelectItem>
                    <SelectItem value="Quarter">Quarter</SelectItem>
                    <SelectItem value="Mid-year">Mid-year</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Semester, trimester, quarter or mid-year
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="term-starts">Starts</Label>
                  <Input
                    type="date"
                    id="term-starts"
                    value={starts}
                    onChange={(e) => setStarts(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="term-ends">Ends</Label>
                  <Input
                    type="date"
                    id="term-ends"
                    value={ends}
                    onChange={(e) => setEnds(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="term-opens">Filing opens</Label>
                <Input
                  type="date"
                  id="term-opens"
                  value={filingOpens}
                  onChange={(e) => setFilingOpens(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="term-deadline-ro">Compliance deadline</Label>
                <Input
                  id="term-deadline-ro"
                  value="Set by DOST-VII for each term"
                  readOnly
                  className="bg-muted text-muted-foreground"
                />
              </div>

              <div className="space-y-2 pt-1">
                <Button type="submit" className="w-full">
                  Save the term
                </Button>
                <button
                  type="button"
                  className="w-full text-center text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                  onClick={() =>
                    showToast(
                      'New terms appear immediately in Regional Office › Terms.',
                      'info',
                    )
                  }
                >
                  Where does this appear next?
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export function CoordinatorRequirementNames() {
  const { data, saveRequirementNames } = useStore()
  const citu = data.schools.find((s) => s.id === 'citu') || data.schools[0]
  const [regName, setRegName] = useState(data.requirementNames.reg.schoolName)
  const [regInst, setRegInst] = useState(data.requirementNames.reg.instructions)
  const [gradesName, setGradesName] = useState(data.requirementNames.grades.schoolName)
  const [gradesInst, setGradesInst] = useState(data.requirementNames.grades.instructions)

  const handleSave = () => {
    saveRequirementNames({
      reg: {
        ...data.requirementNames.reg,
        schoolName: regName.trim() || 'Study Load',
        instructions: regInst.trim(),
      },
      grades: {
        ...data.requirementNames.grades,
        schoolName: gradesName.trim() || 'Certified True Copy of Grades',
        instructions: gradesInst.trim(),
      },
    })
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={citu.short}
        title="Requirement names"
        description="DOST's requirements in the school's own words. Scholars see your name, with DOST's under it."
      />

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardDescription className="font-mono text-xs uppercase">
              DOST: Registration Form
            </CardDescription>
            <CardTitle>{regName || 'Study Load'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="req-reg-name">{citu.short} calls it</Label>
              <Input
                id="req-reg-name"
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="req-reg-inst">Instructions for scholars</Label>
              <Textarea
                rows={3}
                id="req-reg-inst"
                value={regInst}
                onChange={(e) => setRegInst(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription className="font-mono text-xs uppercase">
              DOST: Certified Report of Grades
            </CardDescription>
            <CardTitle>{gradesName || 'Certified True Copy of Grades'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="req-grades-name">{citu.short} calls it</Label>
              <Input
                id="req-grades-name"
                value={gradesName}
                onChange={(e) => setGradesName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="req-grades-inst">Instructions for scholars</Label>
              <Textarea
                rows={3}
                id="req-grades-inst"
                value={gradesInst}
                onChange={(e) => setGradesInst(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div>
        <Button type="button" onClick={handleSave}>
          Save the names
        </Button>
      </div>
    </div>
  )
}

export function CoordinatorRemittances() {
  const {
    data,
    matchRemittance,
    disputeRemittance,
    creditRemittanceScholars,
    showToast,
  } = useStore()
  const cituRemittances = data.remittances.filter((r) => r.schoolId === 'citu')
  const [selectedId, setSelectedId] = useState(cituRemittances[0]?.id || '2026-10-0412')
  const active = cituRemittances.find((r) => r.id === selectedId) || cituRemittances[0]

  const [disputeText, setDisputeText] = useState('')
  const [disputeErr, setDisputeErr] = useState('')
  const [checkedIds, setCheckedIds] = useState(['s-jomar', 's-kristine'])

  const toggleCheck = (id: string) => {
    setCheckedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }

  const uncredited = (active?.scholars || []).filter((s) => !s.creditedDate)
  const selectedReady = checkedIds.filter((id) => uncredited.some((s) => s.id === id))
  const creditPct = active?.scholarCount
    ? Math.round((active.creditedTotalBase / active.scholarCount) * 100)
    : 0

  const handleDispute = () => {
    if (!disputeText.trim()) {
      setDisputeErr("Explain why it doesn't match before disputing.")
      return
    }
    setDisputeErr('')
    disputeRemittance({ remittanceId: active.id, reason: disputeText.trim() })
    setDisputeText('')
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="CIT-U"
        title="Tuition remittances"
        description="What DOST sends the school for its scholars' tuition."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          {active && (
            <>
              <Card>
                <CardHeader>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <CardTitle className="font-mono text-lg">{active.number}</CardTitle>
                      <CardDescription>
                        {active.term} · sent {active.sentDate} by DOST-VII
                      </CardDescription>
                    </div>
                    <StatusBadge status={active.status} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 rounded-lg border bg-muted/40 p-4 sm:grid-cols-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Amount</p>
                      <p className="font-mono text-base font-semibold tabular-nums">
                        {active.amount}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Scholars on list</p>
                      <p className="font-mono text-base font-semibold tabular-nums">
                        {active.scholarCount}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Proof</p>
                      <button
                        type="button"
                        className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                        onClick={() =>
                          showToast(
                            `Opened ${active.proofLabel} from private storage (5-minute signed link).`,
                            'info',
                          )
                        }
                      >
                        {active.proofLabel}
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {active.status === 'disputed' && (
                <Alert variant="destructive">
                  <AlertTriangle className="size-4" />
                  <AlertTitle>Disputed on {active.disputeDate || '8 Oct'}</AlertTitle>
                  <AlertDescription>
                    “{active.disputeReason}” Waiting for DOST-VII to correct and resend
                    the remittance.
                  </AlertDescription>
                </Alert>
              )}

              {active.status === 'settled' && (
                <Alert className="border-emerald-500/30 bg-emerald-500/5">
                  <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
                  <AlertTitle>Settled</AlertTitle>
                  <AlertDescription>
                    All {active.scholarCount} scholars on this remittance have been
                    credited.
                  </AlertDescription>
                </Alert>
              )}

              {active.status === 'sent' && (
                <Card>
                  <CardHeader>
                    <CardTitle>Does it match the school's records?</CardTitle>
                    <CardDescription>
                      Check the amount, the term and every scholar on the list against the
                      school's billing.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {disputeErr && (
                      <Alert variant="destructive" role="alert">
                        <AlertCircle className="size-4" />
                        <AlertDescription>{disputeErr}</AlertDescription>
                      </Alert>
                    )}
                    <div className="space-y-1.5">
                      <Label htmlFor="dispute-reason">
                        Why it doesn't match (needed to dispute)
                      </Label>
                      <Textarea
                        rows={3}
                        placeholder="e.g. Three scholars on our billing are not on the list."
                        id="dispute-reason"
                        value={disputeText}
                        onChange={(e) => setDisputeText(e.target.value)}
                      />
                    </div>
                    <div className="flex flex-wrap gap-2.5">
                      <Button type="button" onClick={() => matchRemittance(active.id)}>
                        It matches
                      </Button>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button type="button" variant="destructive">
                            Dispute it
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Dispute {active.number}?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This pauses crediting and sends your mismatch note back to
                              DOST-VII for correction.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDispute}>
                              Confirm dispute
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardContent>
                </Card>
              )}

              {active.status === 'received' && (
                <Card>
                  <CardHeader>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <CardTitle>Credit scholars' accounts</CardTitle>
                        <CardDescription>
                          {active.creditedTotalBase} of {active.scholarCount} credited
                        </CardDescription>
                      </div>
                      <span className="font-mono text-xs text-muted-foreground tabular-nums">
                        {creditPct}%
                      </span>
                    </div>
                    <Progress value={creditPct} className="mt-2 h-1.5" />
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="divide-y rounded-lg border">
                      {active.scholars.map((s) => {
                        const isDone = Boolean(s.creditedDate)
                        return (
                          <label
                            key={s.id}
                            className="flex cursor-pointer items-center justify-between gap-3 px-4 py-3 hover:bg-muted/40"
                          >
                            <div className="flex items-center gap-3">
                              <Checkbox
                                disabled={isDone}
                                checked={isDone ? false : checkedIds.includes(s.id)}
                                onCheckedChange={() => toggleCheck(s.id)}
                              />
                              <div>
                                <p className="text-sm font-medium">{s.name}</p>
                                <p className="font-mono text-xs text-muted-foreground">
                                  {s.scholarNumber}
                                </p>
                              </div>
                            </div>
                            {isDone ? (
                              <StatusBadge
                                status="verified"
                                label={`Credited ${s.creditedDate}`}
                              />
                            ) : (
                              <StatusBadge status="submitted" label="Not yet" />
                            )}
                          </label>
                        )
                      })}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        disabled={selectedReady.length === 0}
                        onClick={() =>
                          creditRemittanceScholars({
                            remittanceId: active.id,
                            scholarIds: selectedReady,
                            allRemaining: false,
                          })
                        }
                      >
                        Credit the {selectedReady.length} selected
                      </Button>
                      <Button
                        type="button"
                        onClick={() =>
                          creditRemittanceScholars({
                            remittanceId: active.id,
                            scholarIds: [],
                            allRemaining: true,
                          })
                        }
                      >
                        Credit everyone left
                      </Button>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <Label htmlFor="dispute-late">
                        Found a mismatch? (needed to dispute)
                      </Label>
                      {disputeErr && (
                        <p className="text-xs font-medium text-destructive">
                          {disputeErr}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-2 sm:flex-nowrap">
                        <Input
                          id="dispute-late"
                          placeholder="Describe mismatch before disputing"
                          value={disputeText}
                          onChange={(e) => setDisputeText(e.target.value)}
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          onClick={handleDispute}
                        >
                          Dispute it
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>

        <aside>
          <Card>
            <CardHeader>
              <CardTitle>All remittances</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 p-3 pt-0">
              {cituRemittances.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setSelectedId(r.id)}
                  className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-left transition-colors ${
                    active?.id === r.id
                      ? 'bg-accent text-accent-foreground'
                      : 'hover:bg-muted/50'
                  }`}
                >
                  <div className="min-w-0">
                    <p className="truncate font-mono text-sm font-medium">{r.id}</p>
                    <p className="truncate text-xs text-muted-foreground">{r.term}</p>
                  </div>
                  <StatusBadge status={r.status} />
                </button>
              ))}
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  )
}

export function CoordinatorPortalSettings() {
  const { data, savePortalSettings, showToast } = useStore()
  const citu = data.schools.find((s) => s.id === 'citu') || data.schools[0]

  const [primaryColor, setPrimaryColor] = useState(citu.primaryColor)
  const [accentColor, setAccentColor] = useState(citu.accentColor)
  const [gradingLowest, setGradingLowest] = useState(citu.gradingLowest)
  const [gradingHighest, setGradingHighest] = useState(citu.gradingHighest)
  const [higherIsBetter, setHigherIsBetter] = useState(citu.higherIsBetter)
  const [passingGrade, setPassingGrade] = useState(citu.passingGrade)

  const handleSave = () => {
    savePortalSettings('citu', {
      primaryColor: /^#[0-9a-fA-F]{6}$/.test(primaryColor) ? primaryColor : '#800000',
      accentColor: /^#[0-9a-fA-F]{6}$/.test(accentColor) ? accentColor : '#F2C200',
      gradingLowest,
      gradingHighest,
      higherIsBetter,
      passingGrade,
    })
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={citu.short}
        title="Portal settings"
        description="How the school's portal looks to its scholars, and how its grades read."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Palette className="size-4 text-muted-foreground" />
              <CardTitle>Branding</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-center justify-between gap-4 rounded-lg border bg-muted/30 p-3.5">
              <div className="flex items-center gap-3">
                <span className="size-11 shrink-0">
                  <Mark kind="school" primary={primaryColor} accent={accentColor} />
                </span>
                <div>
                  <p className="text-sm font-medium">{citu.short} Crest</p>
                  <p className="text-xs text-muted-foreground">
                    Live preview with chosen colors
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  showToast('Sample school crest stays active in this prototype.', 'info')
                }
              >
                Upload logo
              </Button>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="brand-primary">Primary colour</Label>
              <div className="flex items-center gap-2.5">
                <input
                  type="color"
                  aria-label="Pick primary colour"
                  className="size-9 shrink-0 cursor-pointer rounded-md border bg-transparent p-0.5"
                  value={
                    /^#[0-9a-fA-F]{6}$/.test(primaryColor) ? primaryColor : '#800000'
                  }
                  onChange={(e) => setPrimaryColor(e.target.value.toUpperCase())}
                />
                <Input
                  id="brand-primary"
                  className="font-mono uppercase"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="brand-accent">Secondary colour</Label>
              <div className="flex items-center gap-2.5">
                <input
                  type="color"
                  aria-label="Pick secondary colour"
                  className="size-9 shrink-0 cursor-pointer rounded-md border bg-transparent p-0.5"
                  value={/^#[0-9a-fA-F]{6}$/.test(accentColor) ? accentColor : '#F2C200'}
                  onChange={(e) => setAccentColor(e.target.value.toUpperCase())}
                />
                <Input
                  id="brand-accent"
                  className="font-mono uppercase"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Grading scale</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="grade-low">Lowest grade</Label>
                <Input
                  id="grade-low"
                  className="font-mono tabular-nums"
                  value={gradingLowest}
                  onChange={(e) => setGradingLowest(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="grade-high">Highest grade</Label>
                <Input
                  id="grade-high"
                  className="font-mono tabular-nums"
                  value={gradingHighest}
                  onChange={(e) => setGradingHighest(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Which end is best?</Label>
              <RadioGroup
                value={higherIsBetter ? 'high' : 'low'}
                onValueChange={(v) => setHigherIsBetter(v === 'high')}
              >
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <RadioGroupItem value="high" />
                  The highest grade
                </label>
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <RadioGroupItem value="low" />
                  The lowest grade
                </label>
              </RadioGroup>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="grade-pass">Passing grade</Label>
              <Input
                id="grade-pass"
                className="font-mono tabular-nums"
                value={passingGrade}
                onChange={(e) => setPassingGrade(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="grade-threshold-ro">Agreement §VII.A threshold</Label>
              <Input
                id="grade-threshold-ro"
                readOnly
                className="bg-muted text-muted-foreground"
                value={`${citu.threshold || 'Not set'}, set by DOST-SEI Central Office`}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div>
        <Button type="button" onClick={handleSave}>
          Save the settings
        </Button>
      </div>
    </div>
  )
}
