import React, { useState } from 'react'
import { AlertCircle, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { useStore } from '../context/StoreContext.jsx'
import { Breadcrumbs, PageHeader, StatusBadge } from '../components/ui-helpers.tsx'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
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
import { Separator } from '@/components/ui/separator'
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

export function CentralBatches() {
  const { data, navigate } = useStore()
  const [regionFilter, setRegionFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  const visibleBatches = data.releaseBatches.filter((b) => {
    if (b.status === 'draft') return false
    if (regionFilter !== 'all' && b.region !== regionFilter) return false
    if (statusFilter !== 'all' && b.status !== statusFilter) return false
    return true
  })

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="DOST-SEI Central Office"
        title="Release batches"
        description="What the Regional Offices send for release."
      />

      <Card>
        <CardHeader className="pb-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:max-w-lg">
            <div className="space-y-1.5">
              <Label htmlFor="cb-region">Region</Label>
              <Select value={regionFilter} onValueChange={setRegionFilter}>
                <SelectTrigger id="cb-region" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All regions</SelectItem>
                  <SelectItem value="DOST-VII">DOST-VII</SelectItem>
                  <SelectItem value="DOST-VI">DOST-VI</SelectItem>
                  <SelectItem value="DOST-X">DOST-X</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cb-status">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger id="cb-status" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="returned">Returned</SelectItem>
                  <SelectItem value="released">Released</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Batch</TableHead>
                  <TableHead>Region</TableHead>
                  <TableHead>Benefits</TableHead>
                  <TableHead className="text-right">Scholars</TableHead>
                  <TableHead>Sent</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleBatches.map((b) => {
                  const statusLabel =
                    b.status === 'approved'
                      ? `Approved ${b.approvedDate}`
                      : b.status === 'released'
                        ? `Released ${b.releasedDate}`
                        : undefined
                  const actionLabel =
                    b.status === 'sent'
                      ? 'Review'
                      : b.status === 'approved'
                        ? 'Record the release'
                        : 'View'
                  return (
                    <TableRow key={b.id}>
                      <TableCell className="font-mono font-medium">{b.id}</TableCell>
                      <TableCell>{b.region}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {b.benefits.length > 1
                          ? `${b.benefits.length} benefits`
                          : b.benefits[0]}
                      </TableCell>
                      <TableCell className="text-right font-mono tabular-nums">
                        {b.totalCount}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {b.sentDate || '–'}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={b.status} label={statusLabel} />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant={
                            b.status === 'sent' || b.status === 'approved'
                              ? 'default'
                              : 'outline'
                          }
                          onClick={() => navigate('central-batch', { batchId: b.id })}
                        >
                          {actionLabel}
                        </Button>
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

export function CentralBatch() {
  const {
    data,
    route,
    navigate,
    removeBatchScholarCentral,
    approveBatchCentral,
    returnBatchCentral,
    releaseBatchCentral,
  } = useStore()
  const batch =
    data.releaseBatches.find((b) => b.id === route.params.batchId) ||
    data.releaseBatches.find((b) => b.status === 'sent') ||
    data.releaseBatches[0]

  const [removingId, setRemovingId] = useState<string | null>(null)
  const [removeReason, setRemoveReason] = useState(
    'The amount covers five months; this batch covers four.',
  )
  const [returnReason, setReturnReason] = useState('')
  const [releaseDate, setReleaseDate] = useState('14 October 2026')
  const [err, setErr] = useState('')

  if (!batch) return null

  const badgeLabel =
    batch.status === 'sent'
      ? 'Sent to Central Office'
      : batch.status === 'released'
        ? `Released ${batch.releasedDate}`
        : undefined

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          {
            label: 'Release batches',
            onClick: () => navigate('central-batches'),
          },
          { label: batch.id },
        ]}
      />

      <PageHeader
        eyebrow={`${batch.region} · ${batch.term}`}
        title={`Batch ${batch.id}`}
        description={`${batch.benefits.join('; ')} · ${batch.totalCount} scholars · ${batch.startedMeta}`}
        badge={<StatusBadge status={batch.status} label={badgeLabel} />}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <CardTitle>Scholars and amounts</CardTitle>
              <span className="text-xs text-muted-foreground">
                As {batch.region} recorded them
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="divide-y rounded-lg border">
              {batch.scholars.map((s) => (
                <div key={s.id} className="space-y-3 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium">{s.name}</p>
                      <p className="font-mono text-xs text-muted-foreground">
                        {s.school} · {s.removed ? s.removeReason : s.scholarNumber}
                      </p>
                    </div>
                    {s.removed ? (
                      <StatusBadge status="off" label="Removed" />
                    ) : (
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-sm font-semibold tabular-nums">
                          {s.amount}
                        </span>
                        {batch.status === 'sent' && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-muted-foreground hover:text-destructive"
                            onClick={() => setRemovingId(s.id)}
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                    )}
                  </div>

                  {removingId === s.id && batch.status === 'sent' && (
                    <div className="space-y-2 rounded-lg border bg-muted/40 p-3">
                      <Label>Why remove this scholar? (needed)</Label>
                      <Input
                        value={removeReason}
                        onChange={(e) => setRemoveReason(e.target.value)}
                      />
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            if (!removeReason.trim()) return
                            removeBatchScholarCentral({
                              batchId: batch.id,
                              scholarId: s.id,
                              reason: removeReason.trim(),
                            })
                            setRemovingId(null)
                          }}
                        >
                          Remove from the batch
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setRemovingId(null)}
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
              Showing {batch.scholars.length} of {batch.totalCount} · SEIskolar adds
              nothing up.
            </p>
          </CardContent>
        </Card>

        <aside className="space-y-4">
          {batch.status === 'sent' && (
            <Card>
              <CardHeader>
                <CardTitle>Your decision</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {err && (
                  <Alert variant="destructive" role="alert">
                    <AlertCircle className="size-4" />
                    <AlertDescription>{err}</AlertDescription>
                  </Alert>
                )}
                <Button
                  type="button"
                  className="w-full"
                  onClick={() => {
                    setErr('')
                    approveBatchCentral(batch.id)
                  }}
                >
                  Approve the batch
                </Button>
                <Separator />
                <div className="space-y-1.5">
                  <Label htmlFor="cb-return-reason">
                    Why return it? (needed to return)
                  </Label>
                  <Textarea
                    rows={3}
                    placeholder="e.g. The amounts for two scholars don't match…"
                    id="cb-return-reason"
                    value={returnReason}
                    onChange={(e) => setReturnReason(e.target.value)}
                  />
                </div>
                <Button
                  variant="destructive"
                  type="button"
                  className="w-full"
                  onClick={() => {
                    if (!returnReason.trim()) {
                      setErr('Enter a reason before returning the batch.')
                      return
                    }
                    setErr('')
                    returnBatchCentral({
                      batchId: batch.id,
                      reason: returnReason.trim(),
                    })
                  }}
                >
                  Return it to {batch.region}
                </Button>
              </CardContent>
            </Card>
          )}

          {batch.status === 'approved' && (
            <Card>
              <CardHeader>
                <CardTitle>Approved {batch.approvedDate || '9 Oct'}</CardTitle>
                <CardDescription>By {batch.approvedBy || 'Paolo Reyes'}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="cb-rel-date">Funds released on</Label>
                  <Input
                    id="cb-rel-date"
                    value={releaseDate}
                    onChange={(e) => setReleaseDate(e.target.value)}
                  />
                </div>
                <Button
                  type="button"
                  className="w-full"
                  onClick={() =>
                    releaseBatchCentral({
                      batchId: batch.id,
                      releasedDate: releaseDate,
                    })
                  }
                >
                  Record the release
                </Button>
                <p className="text-xs text-muted-foreground">
                  Record it once the funds are released.
                </p>
              </CardContent>
            </Card>
          )}

          {batch.status === 'released' && (
            <Alert className="border-emerald-500/30 bg-emerald-500/5">
              <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
              <AlertTitle>Released on {batch.releasedDate}</AlertTitle>
              <AlertDescription>
                LandBank credits scholars' accounts after this; SEIskolar cannot see that
                step.
              </AlertDescription>
            </Alert>
          )}

          {batch.status === 'returned' && (
            <Alert variant="destructive">
              <AlertTriangle className="size-4" />
              <AlertTitle>Returned to {batch.region}</AlertTitle>
              <AlertDescription>“{batch.returnReason}”</AlertDescription>
            </Alert>
          )}
        </aside>
      </div>
    </div>
  )
}

export function CentralBenefits() {
  const { data, saveBenefit, addBenefitRule, changeScholarBenefit } = useStore()
  const [tab, setTab] = useState('benefits')

  const [selectedBenefit, setSelectedBenefit] = useState(
    'Learning materials and connectivity',
  )
  const [ceiling, setCeiling] = useState('₱10,000')
  const [frequency, setFrequency] = useState('Each academic year')
  const [benReason, setBenReason] = useState('')

  const [awardYear, setAwardYear] = useState('2024')
  const [schType, setSchType] = useState('RA 7687')
  const [ruleBenefit, setRuleBenefit] = useState('Thesis allowance')
  const [condition, setCondition] = useState('In a year level or term')
  const [detail, setDetail] = useState('Final year')
  const [ruleReason, setRuleReason] = useState('')

  const [schAction, setSchAction] = useState('add')
  const [schBenefit, setSchBenefit] = useState('Transportation allowance')
  const [schReason, setSchReason] = useState('')
  const [err, setErr] = useState('')

  const handleSaveBenefit = () => {
    if (!benReason.trim()) {
      setErr('Enter a reason; it is kept with the change.')
      return
    }
    setErr('')
    saveBenefit({
      benefitName: selectedBenefit,
      ceiling,
      frequency,
    })
    setBenReason('')
  }

  const handleSaveRule = () => {
    if (!ruleReason.trim()) {
      setErr('Enter a reason; it is kept with the change.')
      return
    }
    setErr('')
    addBenefitRule({
      awardYear,
      scholarshipType: schType,
      benefitName: ruleBenefit,
      detail,
    })
    setRuleReason('')
  }

  const handleSaveScholar = () => {
    if (!schReason.trim()) {
      setErr('Enter a reason; it is kept with the change.')
      return
    }
    setErr('')
    changeScholarBenefit({
      mode: schAction,
      benefitName: schBenefit,
      reason: schReason.trim(),
    })
    setSchReason('')
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="DOST-SEI Central Office"
        title="Benefits"
        description="What scholars receive, and who receives it. Your changes take effect at once."
      />

      <Tabs
        value={tab}
        onValueChange={(v) => {
          setErr('')
          setTab(v)
        }}
        className="space-y-4"
      >
        <TabsList>
          <TabsTrigger value="benefits">The benefits</TabsTrigger>
          <TabsTrigger value="rules">Rules</TabsTrigger>
          <TabsTrigger value="scholar">One scholar</TabsTrigger>
        </TabsList>

        {err && (
          <Alert variant="destructive" role="alert">
            <AlertCircle className="size-4" />
            <AlertDescription>{err}</AlertDescription>
          </Alert>
        )}

        <TabsContent value="benefits">
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>{data.benefits.length} benefits</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Benefit</TableHead>
                        <TableHead className="text-right">Ceiling</TableHead>
                        <TableHead>How often</TableHead>
                        <TableHead>Basis</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.benefits.map((b) => (
                        <TableRow key={b.id}>
                          <TableCell className="font-medium">{b.name}</TableCell>
                          <TableCell className="text-right font-mono tabular-nums">
                            {b.ceiling}
                          </TableCell>
                          <TableCell>{b.frequency}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {b.basis}
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
                <CardTitle>Change a benefit</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="ben-sel">Benefit</Label>
                  <Select
                    value={selectedBenefit}
                    onValueChange={(val) => {
                      setSelectedBenefit(val)
                      const found = data.benefits.find((b) => b.name === val)
                      if (found) {
                        setCeiling(found.ceiling)
                        setFrequency(found.frequency)
                      }
                    }}
                  >
                    <SelectTrigger id="ben-sel" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {data.benefits.map((b) => (
                        <SelectItem key={b.id} value={b.name}>
                          {b.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ben-ceil">Ceiling</Label>
                  <Input
                    id="ben-ceil"
                    className="font-mono tabular-nums"
                    value={ceiling}
                    onChange={(e) => setCeiling(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ben-freq">How often</Label>
                  <Select value={frequency} onValueChange={setFrequency}>
                    <SelectTrigger id="ben-freq" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Monthly">Monthly</SelectItem>
                      <SelectItem value="Each term">Each term</SelectItem>
                      <SelectItem value="Each academic year">
                        Each academic year
                      </SelectItem>
                      <SelectItem value="Once">Once</SelectItem>
                      <SelectItem value="On an event: the thesis">
                        On an event: the thesis
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ben-reason">Reason</Label>
                  <Textarea
                    rows={3}
                    placeholder="Needed. It is kept with the change."
                    id="ben-reason"
                    value={benReason}
                    onChange={(e) => setBenReason(e.target.value)}
                  />
                </div>
                <Button type="button" className="w-full" onClick={handleSaveBenefit}>
                  Save the change
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="rules">
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Rules</CardTitle>
              </CardHeader>
              <CardContent className="divide-y p-0">
                {data.benefitRules.map((r) => (
                  <div className="space-y-1 px-6 py-4" key={r.id}>
                    <p className="text-sm font-medium">{r.title}</p>
                    <p className="text-xs text-muted-foreground">{r.summary}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Change a rule</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="rule-ay">Award year</Label>
                    <Input
                      id="rule-ay"
                      className="font-mono"
                      value={awardYear}
                      onChange={(e) => setAwardYear(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="rule-type">Scholarship type</Label>
                    <Select value={schType} onValueChange={setSchType}>
                      <SelectTrigger id="rule-type" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="RA 7687">RA 7687</SelectItem>
                        <SelectItem value="Merit">Merit</SelectItem>
                        <SelectItem value="RA 10612">RA 10612</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="rule-ben">Benefit</Label>
                  <Select value={ruleBenefit} onValueChange={setRuleBenefit}>
                    <SelectTrigger id="rule-ben" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {data.benefits.map((b) => (
                        <SelectItem key={b.id} value={b.name}>
                          {b.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Only when (optional)</Label>
                  <RadioGroup value={condition} onValueChange={setCondition}>
                    {[
                      'In a year level or term',
                      'Studying outside the home province or region',
                      'The programme requires it',
                    ].map((opt) => (
                      <label
                        className="flex cursor-pointer items-center gap-2 text-sm"
                        key={opt}
                      >
                        <RadioGroupItem value={opt} />
                        {opt}
                      </label>
                    ))}
                  </RadioGroup>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="rule-det">Which year level or term</Label>
                  <Input
                    id="rule-det"
                    value={detail}
                    onChange={(e) => setDetail(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="rule-reason">Reason</Label>
                  <Textarea
                    rows={3}
                    placeholder="Needed. It is kept with the change."
                    id="rule-reason"
                    value={ruleReason}
                    onChange={(e) => setRuleReason(e.target.value)}
                  />
                </div>
                <Button type="button" className="w-full" onClick={handleSaveRule}>
                  Save the rule
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="scholar">
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>{data.scholarBenefits.scholarName}</CardTitle>
                <CardDescription className="font-mono text-xs">
                  {data.scholarBenefits.meta}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">From the rule</h3>
                  <div className="divide-y rounded-lg border">
                    {data.scholarBenefits.fromRule.map((n) => (
                      <div className="px-4 py-2.5 text-sm" key={n}>
                        {n}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Added for this scholar</h3>
                  <div className="divide-y rounded-lg border">
                    {data.scholarBenefits.overrides.map((ov) => (
                      <div className="space-y-0.5 px-4 py-3" key={ov.id}>
                        <p className="text-sm font-medium">{ov.name}</p>
                        <p className="text-xs text-muted-foreground">{ov.note}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Change this scholar's benefits</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Change</Label>
                  <RadioGroup value={schAction} onValueChange={setSchAction}>
                    <label className="flex cursor-pointer items-center gap-2 text-sm">
                      <RadioGroupItem value="add" />
                      Add a benefit
                    </label>
                    <label className="flex cursor-pointer items-center gap-2 text-sm">
                      <RadioGroupItem value="remove" />
                      Remove a benefit
                    </label>
                  </RadioGroup>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="sch-ben-pick">Benefit</Label>
                  <Select value={schBenefit} onValueChange={setSchBenefit}>
                    <SelectTrigger id="sch-ben-pick" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {data.benefits.map((b) => (
                        <SelectItem key={b.id} value={b.name}>
                          {b.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="sch-ben-reason">Reason</Label>
                  <Textarea
                    rows={3}
                    placeholder="Needed. It is kept with the change."
                    id="sch-ben-reason"
                    value={schReason}
                    onChange={(e) => setSchReason(e.target.value)}
                  />
                </div>
                <Button type="button" className="w-full" onClick={handleSaveScholar}>
                  Save the change
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export function CentralProposals() {
  const { data, approveProposal, rejectProposal } = useStore()
  const [selectedId, setSelectedId] = useState(
    data.proposals.find((p) => p.status === 'pending')?.id || data.proposals[0]?.id,
  )
  const proposal = data.proposals.find((p) => p.id === selectedId) || data.proposals[0]
  const [rejectReason, setRejectReason] = useState('')
  const [err, setErr] = useState('')

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="DOST-SEI Central Office"
        title="Proposals"
        description="Changes the Regional Offices ask for. None takes effect until you approve it."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {proposal && (
            <Card>
              <CardHeader>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <CardTitle>{proposal.title}</CardTitle>
                    <CardDescription>
                      Proposed by {proposal.proposedBy}, on {proposal.sentDate}
                    </CardDescription>
                  </div>
                  <StatusBadge status={proposal.status} />
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="divide-y rounded-lg border text-sm">
                  <div className="flex items-center justify-between gap-4 px-4 py-3">
                    <span className="text-muted-foreground">Target</span>
                    <span className="text-right font-medium">{proposal.target}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4 px-4 py-3">
                    <span className="text-muted-foreground">Change</span>
                    <span className="text-right font-medium">{proposal.change}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4 px-4 py-3">
                    <span className="text-muted-foreground">Reason</span>
                    <span className="text-right">“{proposal.reason}”</span>
                  </div>
                </div>

                {proposal.status === 'pending' && (
                  <div className="space-y-4">
                    {err && (
                      <Alert variant="destructive" role="alert">
                        <AlertCircle className="size-4" />
                        <AlertDescription>{err}</AlertDescription>
                      </Alert>
                    )}
                    <Button
                      type="button"
                      onClick={() => {
                        setErr('')
                        approveProposal(proposal.id)
                      }}
                    >
                      Approve
                    </Button>
                    <Separator />
                    <div className="space-y-1.5">
                      <Label htmlFor="prop-rej-reason">
                        Why reject it? (needed to reject)
                      </Label>
                      <Textarea
                        rows={3}
                        placeholder="The Regional Office sees this."
                        id="prop-rej-reason"
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                      />
                    </div>
                    <Button
                      variant="destructive"
                      type="button"
                      onClick={() => {
                        if (!rejectReason.trim()) {
                          setErr('Enter a reason before rejecting.')
                          return
                        }
                        setErr('')
                        rejectProposal({
                          proposalId: proposal.id,
                          reason: rejectReason.trim(),
                        })
                        setRejectReason('')
                      }}
                    >
                      Reject
                    </Button>
                  </div>
                )}

                {proposal.status === 'rejected' && (
                  <Alert variant="destructive">
                    <AlertTitle>Rejected {proposal.decisionDate}</AlertTitle>
                    <AlertDescription>“{proposal.decisionReason}”</AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <aside>
          <Card>
            <CardHeader>
              <CardTitle>Proposals</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5 p-3 pt-0">
              {data.proposals.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    setErr('')
                    setSelectedId(p.id)
                  }}
                  className={`flex w-full items-start justify-between gap-2 rounded-lg px-3 py-2.5 text-left transition-colors ${
                    proposal?.id === p.id
                      ? 'bg-accent text-accent-foreground'
                      : 'hover:bg-muted/50'
                  }`}
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{p.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.region} · {p.sentDate}
                    </p>
                  </div>
                  <StatusBadge status={p.status} />
                </button>
              ))}
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  )
}

export function CentralThresholds() {
  const { data, saveThresholds } = useStore()
  const [regionFilter, setRegionFilter] = useState('DOST-VII')
  const [drafts, setDrafts] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {}
    data.schools.forEach((s) => {
      map[s.id] = s.threshold || ''
    })
    return map
  })

  const schools = data.schools.filter((s) => s.region === regionFilter)

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="DOST-SEI Central Office"
        title="Thresholds"
        description="The Agreement §VII.A threshold for each school, in that school's own grading scale."
      />

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle>{regionFilter}'s schools</CardTitle>
            <Select value={regionFilter} onValueChange={setRegionFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DOST-VII">DOST-VII</SelectItem>
                <SelectItem value="DOST-VI">DOST-VI</SelectItem>
                <SelectItem value="DOST-X">DOST-X</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {schools.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No schools loaded for this region yet.
            </p>
          ) : (
            <>
              <div className="overflow-x-auto rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>School</TableHead>
                      <TableHead>Grading scale</TableHead>
                      <TableHead>Passing</TableHead>
                      <TableHead>§VII.A threshold</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {schools.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell className="font-medium">{s.short}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {s.gradingLowest} to {s.gradingHighest},{' '}
                          {s.higherIsBetter ? 'higher is better' : 'lower is better'}
                        </TableCell>
                        <TableCell className="font-mono tabular-nums">
                          {s.passingGrade}
                        </TableCell>
                        <TableCell>
                          <Input
                            placeholder="Not set"
                            aria-label={`${s.short} threshold`}
                            className="h-8 w-28 font-mono tabular-nums"
                            value={drafts[s.id] ?? ''}
                            onChange={(e) =>
                              setDrafts((prev) => ({
                                ...prev,
                                [s.id]: e.target.value,
                              }))
                            }
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <Button type="button" onClick={() => saveThresholds(drafts)}>
                Save the thresholds
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
