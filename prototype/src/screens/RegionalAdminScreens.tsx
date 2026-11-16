import React, { useState } from 'react'
import { AlertCircle, AlertTriangle, Plus, Search, Upload } from 'lucide-react'
import { useStore } from '../context/StoreContext.jsx'
import { PageHeader, StatusBadge } from '../components/ui-helpers.tsx'
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'

export function RegionalReleaseBatch() {
  const {
    data,
    startNewBatch,
    updateBatch,
    sendBatchToCentral,
    takeOffBatchScholar,
    addScholarToBatch,
    showToast,
  } = useStore()
  const regionalBatches = data.releaseBatches.filter((b) => b.region === 'DOST-VII')
  const [selectedId, setSelectedId] = useState(regionalBatches[0]?.id || 'VII-2026-014')
  const batch = regionalBatches.find((b) => b.id === selectedId) || regionalBatches[0]

  const [searchText, setSearchText] = useState('')
  const [takingOffId, setTakingOffId] = useState<string | null>(null)
  const [takeOffReason, setTakeOffReason] = useState(
    'Amount still being confirmed with the school.',
  )

  const benefitOptions = [
    'Monthly living allowance',
    'Learning materials and connectivity',
    'Tuition and other school fees',
  ]

  const toggleBenefit = (name: string) => {
    if (!batch || (batch.status !== 'draft' && batch.status !== 'returned')) return
    const has = batch.benefits.includes(name)
    updateBatch(batch.id, {
      benefits: has
        ? batch.benefits.filter((x) => x !== name)
        : [...batch.benefits, name],
    })
  }

  const updateAmount = (scholarId: string, val: string) => {
    updateBatch(batch.id, {
      scholars: batch.scholars.map((s) =>
        s.id === scholarId ? { ...s, amount: val } : s,
      ),
    })
  }

  const clearedCandidates = data.scholars.filter(
    (s) =>
      s.cleared &&
      !batch?.scholars.some((b) => b.id === s.id) &&
      (!searchText.trim() ||
        s.name.toLowerCase().includes(searchText.trim().toLowerCase()) ||
        s.scholarNumber.includes(searchText.trim())),
  )

  const isEditable = batch?.status === 'draft' || batch?.status === 'returned'

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="DOST-VII"
        title="Release batches"
        description="Lists of cleared scholars, sent to Central Office for release."
        actions={
          <Button
            variant="outline"
            onClick={() => {
              const id = startNewBatch()
              setSelectedId(id)
            }}
          >
            <Plus className="mr-1.5 size-4" />
            Start a batch
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          {batch && (
            <>
              {batch.status === 'returned' && (
                <Alert variant="destructive">
                  <AlertTriangle className="size-4" />
                  <AlertTitle>Returned by Central Office</AlertTitle>
                  <AlertDescription>
                    “{batch.returnReason}” Correct the batch, then send it again.
                  </AlertDescription>
                </Alert>
              )}

              <Card>
                <CardHeader>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <CardTitle className="font-mono">Batch {batch.id}</CardTitle>
                      <CardDescription>
                        {batch.term} · {batch.startedMeta}
                      </CardDescription>
                    </div>
                    <StatusBadge
                      status={batch.status}
                      label={
                        batch.status === 'released'
                          ? `Released ${batch.releasedDate}`
                          : undefined
                      }
                    />
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Label>Benefits in this batch</Label>
                  <div className="flex flex-wrap gap-2">
                    {benefitOptions.map((opt) => {
                      const pressed = batch.benefits.includes(opt)
                      return (
                        <Button
                          key={opt}
                          type="button"
                          size="sm"
                          variant={pressed ? 'default' : 'outline'}
                          onClick={() => toggleBenefit(opt)}
                        >
                          {opt}
                        </Button>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle>Scholars and amounts</CardTitle>
                    <span className="font-mono text-xs text-muted-foreground tabular-nums">
                      {batch.totalCount} scholars
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isEditable && (
                    <div className="space-y-2">
                      <Label htmlFor="batch-scholar-search">Add a cleared scholar</Label>
                      <div className="relative">
                        <Search className="pointer-events-none absolute top-2.5 left-2.5 size-4 text-muted-foreground" />
                        <Input
                          id="batch-scholar-search"
                          className="pl-8"
                          placeholder="Search by name or scholar number"
                          value={searchText}
                          onChange={(e) => setSearchText(e.target.value)}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Only scholars with every mandatory document verified for the term
                        can be added.
                      </p>
                      {searchText.trim() && clearedCandidates.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-1">
                          {clearedCandidates.map((cand) => (
                            <Button
                              key={cand.id}
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                addScholarToBatch({
                                  batchId: batch.id,
                                  scholar: cand,
                                })
                                setSearchText('')
                              }}
                            >
                              + Add {cand.name} ({cand.school})
                            </Button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="divide-y rounded-lg border">
                    {batch.scholars.map((s) => (
                      <div key={s.id} className="space-y-3 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-medium">{s.name}</p>
                            <p className="font-mono text-xs text-muted-foreground">
                              {s.school} · {s.scholarNumber}
                            </p>
                          </div>
                          <div className="flex items-center gap-2.5">
                            <Input
                              value={s.amount}
                              disabled={!isEditable}
                              aria-label={`${s.name} amount`}
                              className="h-8 w-28 text-right font-mono text-sm tabular-nums"
                              onChange={(e) => updateAmount(s.id, e.target.value)}
                            />
                            {isEditable && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="text-muted-foreground hover:text-destructive"
                                onClick={() => setTakingOffId(s.id)}
                              >
                                Take off
                              </Button>
                            )}
                          </div>
                        </div>

                        {takingOffId === s.id && (
                          <div className="space-y-2 rounded-lg border bg-muted/40 p-3">
                            <Label>Reason for taking {s.name} off</Label>
                            <Input
                              value={takeOffReason}
                              onChange={(e) => setTakeOffReason(e.target.value)}
                            />
                            <div className="flex gap-2">
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                onClick={() => {
                                  takeOffBatchScholar({
                                    batchId: batch.id,
                                    scholarId: s.id,
                                    reason:
                                      takeOffReason.trim() || 'Moved to a later batch.',
                                  })
                                  setTakingOffId(null)
                                }}
                              >
                                Confirm take off
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setTakingOffId(null)}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Showing {batch.scholars.length} of {batch.totalCount}
                  </p>
                </CardContent>
              </Card>

              {batch.takenOff.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Taken off this batch</CardTitle>
                  </CardHeader>
                  <CardContent className="divide-y p-0">
                    {batch.takenOff.map((t, idx) => (
                      <div
                        className="flex items-center justify-between gap-3 px-6 py-3.5"
                        key={idx}
                      >
                        <div>
                          <p className="text-sm font-medium">{t.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {t.school} · taken off {t.when}: “{t.reason}”
                          </p>
                        </div>
                        <StatusBadge status="off" label="Later batch" />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {isEditable && (
                <div className="flex flex-wrap gap-2.5">
                  <Button
                    type="button"
                    onClick={() =>
                      sendBatchToCentral(batch.id, batch.status === 'returned')
                    }
                  >
                    {batch.status === 'returned'
                      ? 'Send it again'
                      : 'Send to Central Office'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => showToast('The draft is saved.')}
                  >
                    Save the draft
                  </Button>
                </div>
              )}
            </>
          )}
        </div>

        <aside>
          <Card>
            <CardHeader>
              <CardTitle>Batches</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5 p-3 pt-0">
              {regionalBatches.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setSelectedId(b.id)}
                  className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-left transition-colors ${
                    batch?.id === b.id
                      ? 'bg-accent text-accent-foreground'
                      : 'hover:bg-muted/50'
                  }`}
                >
                  <div className="min-w-0">
                    <p className="truncate font-mono text-sm font-medium">{b.id}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {b.benefits.join(', ')}
                    </p>
                  </div>
                  <StatusBadge
                    status={b.status}
                    label={
                      b.status === 'released'
                        ? `Released ${b.releasedDate.split(' ')[0]}`
                        : undefined
                    }
                  />
                </button>
              ))}
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  )
}

export function RegionalRemittance() {
  const { data, recordNewRemittance, resendDisputedRemittance, showToast } = useStore()
  const [mode, setMode] = useState('record')

  const [schoolId, setSchoolId] = useState('citu')
  const [term, setTerm] = useState('1st Semester, AY 2026–2027')
  const [number, setNumber] = useState('LDDAP-ADA 2026-10-0420')
  const [amount, setAmount] = useState('₱920,000')
  const [proofName, setProofName] = useState('')
  const [chosenScholars, setChosenScholars] = useState(['s-bea', 's-jomar', 's-kristine'])

  const activeDisputed =
    mode !== 'record' ? data.remittances.find((r) => r.id === mode) : null
  const [fixNumber, setFixNumber] = useState('LDDAP-ADA 2026-10-0398')
  const [fixAmount, setFixAmount] = useState('₱540,000')

  const selectedSchool = data.schools.find((s) => s.id === schoolId)

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="DOST-VII"
        title="Tuition remittances"
        description="What DOST sends each school for its scholars' tuition, with the proof."
        actions={
          mode !== 'record' ? (
            <Button variant="outline" onClick={() => setMode('record')}>
              Record a new remittance
            </Button>
          ) : null
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          {mode === 'record' && (
            <Card>
              <CardHeader>
                <CardTitle>Record a remittance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="rem-school">School</Label>
                    <Select value={schoolId} onValueChange={setSchoolId}>
                      <SelectTrigger id="rem-school" className="w-full">
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
                    <Label htmlFor="rem-term">Term</Label>
                    <Select value={term} onValueChange={setTerm}>
                      <SelectTrigger id="rem-term" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1st Semester, AY 2026–2027">
                          1st Semester, AY 2026–2027
                        </SelectItem>
                        <SelectItem value="2nd Semester, AY 2026–2027">
                          2nd Semester, AY 2026–2027
                        </SelectItem>
                        <SelectItem value="1st Trimester, AY 2026–2027">
                          1st Trimester, AY 2026–2027
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="rem-num">Check or LDDAP number</Label>
                    <Input
                      id="rem-num"
                      className="font-mono"
                      value={number}
                      onChange={(e) => setNumber(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="rem-amt">Amount</Label>
                    <Input
                      id="rem-amt"
                      className="font-mono tabular-nums"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label>Proof</Label>
                  <label className="flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed bg-muted/30 px-4 py-6 text-center hover:bg-muted/50">
                    <input
                      type="file"
                      hidden
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => setProofName(e.target.files?.[0]?.name || '')}
                    />
                    <Upload className="size-5 text-muted-foreground" />
                    <span className="text-sm font-medium">
                      {proofName || 'Choose the scanned LDDAP-ADA or check'}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Kept in private storage
                    </span>
                  </label>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-muted/30 px-4 py-3">
                  <div className="text-sm">
                    <span className="font-medium">{chosenScholars.length}</span> of{' '}
                    {selectedSchool?.short}'s {selectedSchool?.scholarsCount || 0}{' '}
                    scholars chosen
                  </div>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button type="button" variant="outline" size="sm">
                        Choose scholars
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>
                          Scholars on {selectedSchool?.short} remittance
                        </DialogTitle>
                        <DialogDescription>
                          Select the scholars covered by this LDDAP-ADA.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="max-h-72 space-y-2 overflow-y-auto py-2">
                        {data.scholars
                          .filter((s) => s.schoolId === schoolId)
                          .map((s) => (
                            <label
                              key={s.id}
                              className="flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 text-sm hover:bg-muted/40"
                            >
                              <Checkbox
                                checked={chosenScholars.includes(s.id)}
                                onCheckedChange={() =>
                                  setChosenScholars((prev) =>
                                    prev.includes(s.id)
                                      ? prev.filter((x) => x !== s.id)
                                      : [...prev, s.id],
                                  )
                                }
                              />
                              <span>{s.name}</span>
                              <span className="ml-auto font-mono text-xs text-muted-foreground">
                                {s.scholarNumber}
                              </span>
                            </label>
                          ))}
                      </div>
                      <DialogFooter showCloseButton />
                    </DialogContent>
                  </Dialog>
                </div>

                <Button
                  type="button"
                  onClick={() =>
                    recordNewRemittance({
                      schoolId,
                      term,
                      number,
                      amount,
                      proofLabel: proofName || 'LDDAP-ADA, 2 pages',
                      scholarCount: chosenScholars.length || 12,
                    })
                  }
                >
                  Send to {selectedSchool?.short}
                </Button>
              </CardContent>
            </Card>
          )}

          {activeDisputed && (
            <>
              {activeDisputed.status === 'disputed' && (
                <Alert variant="destructive">
                  <AlertTriangle className="size-4" />
                  <AlertTitle>
                    Disputed by {activeDisputed.schoolName} on{' '}
                    {activeDisputed.disputeDate || '6 Oct'}
                  </AlertTitle>
                  <AlertDescription>
                    “{activeDisputed.disputeReason}” Correct the remittance, then send it
                    again.
                  </AlertDescription>
                </Alert>
              )}

              <Card>
                <CardHeader>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <CardTitle className="font-mono">{activeDisputed.number}</CardTitle>
                    <StatusBadge status={activeDisputed.status} />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label>School</Label>
                      <Input
                        value={activeDisputed.schoolName}
                        readOnly
                        className="bg-muted text-muted-foreground"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Term</Label>
                      <Input
                        value={activeDisputed.term}
                        readOnly
                        className="bg-muted text-muted-foreground"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Check or LDDAP number</Label>
                      <Input
                        className="font-mono"
                        value={fixNumber}
                        onChange={(e) => setFixNumber(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Amount</Label>
                      <Input
                        className="font-mono tabular-nums"
                        value={fixAmount}
                        onChange={(e) => setFixAmount(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border px-4 py-2.5 text-sm">
                    <button
                      type="button"
                      className="font-medium text-primary underline-offset-4 hover:underline"
                      onClick={() =>
                        showToast(
                          `Opened ${activeDisputed.proofLabel} from private storage.`,
                          'info',
                        )
                      }
                    >
                      {activeDisputed.proofLabel}
                    </button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => showToast('Updated proof attached.')}
                    >
                      Replace the proof
                    </Button>
                  </div>
                  {activeDisputed.status === 'disputed' && (
                    <Button
                      type="button"
                      onClick={() =>
                        resendDisputedRemittance({
                          remittanceId: activeDisputed.id,
                          number: fixNumber,
                          amount: fixAmount,
                        })
                      }
                    >
                      Send the corrected remittance
                    </Button>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>

        <aside>
          <Card>
            <CardHeader>
              <CardTitle>Remittances</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5 p-3 pt-0">
              {data.remittances.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => {
                    setMode(r.id)
                    setFixNumber(r.number)
                    setFixAmount(r.amount)
                  }}
                  className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-left transition-colors ${
                    mode === r.id
                      ? 'bg-accent text-accent-foreground'
                      : 'hover:bg-muted/50'
                  }`}
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{r.schoolName}</p>
                    <p className="truncate font-mono text-xs text-muted-foreground">
                      {r.id} · {r.term}
                    </p>
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

export function RegionalBenefitProposal() {
  const { data, submitProposal } = useStore()
  const [kind, setKind] = useState("One scholar's benefits")
  const [target, setTarget] = useState(
    'Joy Pacaña · Mabini State College · 2025-07-00090',
  )
  const [change, setChange] = useState('Remove Monthly living allowance')
  const [reason, setReason] = useState('On an approved leave of absence this semester.')
  const [err, setErr] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!reason.trim()) {
      setErr('A reason is required before sending to Central Office.')
      return
    }
    setErr('')
    submitProposal({ kind, target, change, reason: reason.trim() })
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="DOST-VII"
        title="Benefit proposals"
        description="Ask Central Office to change a benefit, a rule, or one scholar's benefits. Nothing changes until Central Office approves."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Propose a change</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              {err && (
                <Alert variant="destructive" role="alert">
                  <AlertCircle className="size-4" />
                  <AlertDescription>{err}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label>What to change</Label>
                <RadioGroup
                  value={kind}
                  onValueChange={(opt) => {
                    setKind(opt)
                    if (opt.startsWith('A benefit')) {
                      setTarget('Learning materials and connectivity')
                      setChange('Raise ceiling to ₱12,000')
                    } else if (opt.startsWith('A rule')) {
                      setTarget('Award year 2024 · RA 7687')
                      setChange('Include Thesis allowance in 4th year')
                    } else {
                      setTarget('Joy Pacaña · Mabini State College · 2025-07-00090')
                      setChange('Remove Monthly living allowance')
                    }
                  }}
                >
                  {[
                    "One scholar's benefits",
                    'A benefit: its name, ceiling, or how often it is paid',
                    'A rule: which award years and scholarship types get a benefit',
                  ].map((opt) => (
                    <label
                      key={opt}
                      className="flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2.5 text-sm hover:bg-muted/40"
                    >
                      <RadioGroupItem value={opt} />
                      {opt}
                    </label>
                  ))}
                </RadioGroup>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="prop-target">
                  {kind.startsWith('One scholar')
                    ? 'Scholar'
                    : kind.startsWith('A benefit')
                      ? 'Benefit'
                      : 'Rule'}
                </Label>
                <Input
                  id="prop-target"
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="prop-change">Change</Label>
                <Input
                  id="prop-change"
                  value={change}
                  onChange={(e) => setChange(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="prop-reason">Reason</Label>
                <Textarea
                  rows={3}
                  id="prop-reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Needed. Central Office reads it before deciding.
                </p>
              </div>

              <Button type="submit">Send to Central Office</Button>
            </form>
          </CardContent>
        </Card>

        <aside>
          <Card>
            <CardHeader>
              <CardTitle>DOST-VII's proposals</CardTitle>
            </CardHeader>
            <CardContent className="divide-y p-0">
              {data.proposals
                .filter((p) => p.region === 'DOST-VII')
                .map((p) => (
                  <div
                    className="flex items-start justify-between gap-2 px-6 py-3.5"
                    key={p.id}
                  >
                    <div className="min-w-0 space-y-0.5">
                      <p className="text-sm font-medium">{p.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {p.status === 'pending'
                          ? `Sent ${p.sentDate}`
                          : p.status === 'rejected'
                            ? `Rejected ${p.decisionDate}: “${p.decisionReason}”`
                            : `Approved ${p.decisionDate}`}
                      </p>
                    </div>
                    <StatusBadge status={p.status} />
                  </div>
                ))}
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  )
}

export function RegionalSchools() {
  const { data, createSchool, navigate } = useStore()
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [portalAddress, setPortalAddress] = useState('')
  const [err, setErr] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !code.trim() || !portalAddress.trim()) {
      setErr('Fill in name, code, and portal address.')
      return
    }
    setErr('')
    createSchool({
      name: name.trim(),
      short: name.trim(),
      code: code.trim(),
      portalAddress: portalAddress.trim(),
    })
    setName('')
    setCode('')
    setPortalAddress('')
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="DOST-VII"
        title="Schools"
        description="The schools DOST-VII supervises, each with its own portal."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{data.schools.length} schools</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>School</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Portal address</TableHead>
                    <TableHead>Coordinator</TableHead>
                    <TableHead className="text-right">Scholars</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.schools.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.name}</TableCell>
                      <TableCell className="font-mono text-xs">{s.code}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {s.portalAddress}
                      </TableCell>
                      <TableCell>
                        {s.coordinator || (
                          <button
                            type="button"
                            className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                            onClick={() =>
                              navigate('regional-accounts', {
                                tab: 'coordinators',
                              })
                            }
                          >
                            None yet: add one
                          </button>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-mono tabular-nums">
                        {s.scholarsCount}
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
            <CardTitle>Add a school</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              {err && (
                <Alert variant="destructive" role="alert">
                  <AlertCircle className="size-4" />
                  <AlertDescription>{err}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="sch-name">Name</Label>
                <Input
                  placeholder="e.g. Talisay Technological Institute"
                  id="sch-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="sch-code">Code</Label>
                <Input
                  placeholder="e.g. TTI"
                  id="sch-code"
                  className="font-mono uppercase"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="sch-addr">Portal address</Label>
                <Input
                  placeholder="name.seiskolar.example.test"
                  id="sch-addr"
                  className="font-mono text-xs"
                  value={portalAddress}
                  onChange={(e) => setPortalAddress(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Where the school's scholars and coordinator sign in
                </p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="sch-reg">Region</Label>
                <Input
                  id="sch-reg"
                  readOnly
                  className="bg-muted text-muted-foreground"
                  value="DOST-VII: this office's own"
                />
              </div>
              <Button type="submit" className="w-full">
                Create the school
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export function RegionalAccounts() {
  const { data, route, addScholarAccount, addCoordinatorAccount } = useStore()
  const [tab, setTab] = useState(
    route.params.tab === 'coordinators' ? 'coordinators' : 'scholars',
  )
  const [schoolFilter, setSchoolFilter] = useState('all')

  const [schEmail, setSchEmail] = useState('ella.ramos@example.test')
  const [schName, setSchName] = useState('Ella Ramos')
  const [schNum, setSchNum] = useState('2026-07-00112')
  const [schSchool, setSchSchool] = useState('CIT-U')
  const [schAwardYear, setSchAwardYear] = useState('2026')
  const [schYearLevel, setSchYearLevel] = useState('1st year')
  const [schProgramme, setSchProgramme] = useState('BS Civil Engineering')
  const [schType, setSchType] = useState('RA 7687')

  const [coordEmail, setCoordEmail] = useState('mark.villanueva@example.test')
  const [coordName, setCoordName] = useState('Mark Villanueva')
  const [coordSchool, setCoordSchool] = useState('Liloan Polytechnic College')

  const visibleScholars =
    schoolFilter === 'all'
      ? data.scholars
      : data.scholars.filter((s) => s.schoolId === schoolFilter)

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="DOST-VII"
        title="Accounts"
        description="Scholar and coordinator accounts for the region's schools."
      />

      <Tabs value={tab} onValueChange={setTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="scholars">Scholars</TabsTrigger>
          <TabsTrigger value="coordinators">Coordinators</TabsTrigger>
        </TabsList>

        <TabsContent value="scholars">
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <CardTitle>{visibleScholars.length} scholars shown</CardTitle>
                  <Select value={schoolFilter} onValueChange={setSchoolFilter}>
                    <SelectTrigger className="w-48">
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
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Scholar</TableHead>
                        <TableHead>Scholar number</TableHead>
                        <TableHead>School</TableHead>
                        <TableHead>Award year</TableHead>
                        <TableHead>Account</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {visibleScholars.map((s) => (
                        <TableRow key={s.id}>
                          <TableCell className="font-medium">{s.name}</TableCell>
                          <TableCell className="font-mono text-xs">
                            {s.scholarNumber}
                          </TableCell>
                          <TableCell>{s.school}</TableCell>
                          <TableCell className="font-mono text-xs">
                            {s.awardYear}
                          </TableCell>
                          <TableCell>
                            <StatusBadge
                              status={s.signedIn ? 'verified' : 'off'}
                              label={s.signedIn ? 'Signed in' : 'Not signed in yet'}
                            />
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
                <CardTitle>Add a scholar</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3.5">
                <div className="space-y-1.5">
                  <Label htmlFor="acc-sch-email">Applicant's email</Label>
                  <Input
                    type="email"
                    id="acc-sch-email"
                    value={schEmail}
                    onChange={(e) => setSchEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="acc-sch-name">Full name</Label>
                  <Input
                    id="acc-sch-name"
                    value={schName}
                    onChange={(e) => setSchName(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="acc-sch-num">DOST scholar number</Label>
                  <Input
                    id="acc-sch-num"
                    className="font-mono"
                    value={schNum}
                    onChange={(e) => setSchNum(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="acc-sch-school">First school</Label>
                  <Select value={schSchool} onValueChange={setSchSchool}>
                    <SelectTrigger id="acc-sch-school" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {data.schools.map((s) => (
                        <SelectItem key={s.id} value={s.short}>
                          {s.short}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="acc-sch-ay">Award year</Label>
                    <Input
                      id="acc-sch-ay"
                      className="font-mono"
                      value={schAwardYear}
                      onChange={(e) => setSchAwardYear(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="acc-sch-yr">Year level</Label>
                    <Select value={schYearLevel} onValueChange={setSchYearLevel}>
                      <SelectTrigger id="acc-sch-yr" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1st year">1st year</SelectItem>
                        <SelectItem value="2nd year">2nd year</SelectItem>
                        <SelectItem value="3rd year">3rd year</SelectItem>
                        <SelectItem value="4th year">4th year</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="acc-sch-prog">Programme</Label>
                  <Input
                    id="acc-sch-prog"
                    value={schProgramme}
                    onChange={(e) => setSchProgramme(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="acc-sch-type">Scholarship type</Label>
                  <Select value={schType} onValueChange={setSchType}>
                    <SelectTrigger id="acc-sch-type" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="RA 7687">RA 7687</SelectItem>
                      <SelectItem value="Merit">Merit</SelectItem>
                      <SelectItem value="RA 10612">RA 10612</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  type="button"
                  className="w-full"
                  onClick={() =>
                    addScholarAccount({
                      email: schEmail,
                      name: schName,
                      scholarNumber: schNum,
                      school: schSchool,
                      awardYear: schAwardYear,
                      yearLevel: schYearLevel,
                      programme: schProgramme,
                      scholarshipType: schType,
                    })
                  }
                >
                  Create the account
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="coordinators">
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>{data.coordinators.length} coordinators</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Coordinator</TableHead>
                        <TableHead>School</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Account</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.coordinators.map((c, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="font-medium">{c.name}</TableCell>
                          <TableCell>{c.school}</TableCell>
                          <TableCell className="font-mono text-xs text-muted-foreground">
                            {c.email}
                          </TableCell>
                          <TableCell>
                            <StatusBadge
                              status={c.signedIn ? 'verified' : 'off'}
                              label={c.signedIn ? 'Signed in' : 'Not signed in yet'}
                            />
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
                <CardTitle>Add a coordinator</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="acc-coord-email">Email</Label>
                  <Input
                    type="email"
                    id="acc-coord-email"
                    value={coordEmail}
                    onChange={(e) => setCoordEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="acc-coord-name">Full name</Label>
                  <Input
                    id="acc-coord-name"
                    value={coordName}
                    onChange={(e) => setCoordName(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="acc-coord-school">School</Label>
                  <Select value={coordSchool} onValueChange={setCoordSchool}>
                    <SelectTrigger id="acc-coord-school" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {data.schools.map((s) => (
                        <SelectItem key={s.id} value={s.short}>
                          {s.short}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">DOST-VII's schools only</p>
                </div>
                <Button
                  type="button"
                  className="w-full"
                  onClick={() =>
                    addCoordinatorAccount({
                      email: coordEmail,
                      name: coordName,
                      school: coordSchool,
                    })
                  }
                >
                  Create the account
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export function RegionalTransfer() {
  const { data, recordTransfer } = useStore()
  const [scholarId, setScholarId] = useState('s-aira')
  const selectedScholar =
    data.scholars.find((s) => s.id === scholarId) || data.scholars[0]
  const [newSchool, setNewSchool] = useState('Lapu Science College')
  const [date, setDate] = useState('1 October 2026')

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="DOST-VII"
        title="Transfers"
        description="Record a scholar's move to another school."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Record a transfer</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="tr-scholar">Scholar</Label>
              <Select value={scholarId} onValueChange={setScholarId}>
                <SelectTrigger id="tr-scholar" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {data.scholars.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name} · {s.scholarNumber}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between rounded-lg border bg-muted/40 px-4 py-2.5 text-sm">
              <span className="text-muted-foreground">Now at</span>
              <span className="font-medium">{selectedScholar?.school}</span>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="tr-new-school">New school</Label>
              <Select value={newSchool} onValueChange={setNewSchool}>
                <SelectTrigger id="tr-new-school" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {data.schools
                    .filter((s) => s.short !== selectedScholar?.school)
                    .map((s) => (
                      <SelectItem key={s.id} value={s.short}>
                        {s.short}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">DOST-VII's schools only</p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="tr-date">Date of the transfer</Label>
              <Input
                id="tr-date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="tr-recorded">Recorded as</Label>
              <Input
                id="tr-recorded"
                readOnly
                className="bg-muted text-muted-foreground"
                value="An amendment to the scholar's Agreement: transfer of school"
              />
            </div>

            <Button
              type="button"
              onClick={() => recordTransfer({ scholarId, newSchool, date })}
            >
              Record the transfer
            </Button>
          </CardContent>
        </Card>

        <aside>
          <Card>
            <CardHeader>
              <CardTitle>Recent transfers</CardTitle>
            </CardHeader>
            <CardContent className="divide-y p-0">
              {data.transfers.map((t, idx) => (
                <div className="space-y-0.5 px-6 py-3.5" key={idx}>
                  <p className="text-sm font-medium">{t.scholar}</p>
                  <p className="text-xs text-muted-foreground">{t.detail}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  )
}
