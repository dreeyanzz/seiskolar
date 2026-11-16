import React, { useMemo, useRef, useState } from 'react'
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Clock,
  FileText,
  Maximize2,
  Plus,
  Trash2,
  Upload,
} from 'lucide-react'
import { useStore } from '../context/StoreContext.jsx'
import { GradesDocument } from '../components/GradesDocument.jsx'
import {
  Breadcrumbs,
  PageHeader,
  StatusBadge,
  StepTimeline,
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export function ScholarDashboard() {
  const { data, navigate } = useStore()
  const beaFilings = data.filings.filter((f) => f.scholarId === 's-bea')
  const term = data.terms.find((t) => t.id === 'citu-2026-1') || data.terms[0]
  const regReq = data.requirementNames.reg
  const gradesReq = data.requirementNames.grades

  const enabledItems = beaFilings.filter((f) => {
    const cfg = term?.checklist?.[f.requirementKey]
    return !cfg || cfg.enabled
  })
  const mandatoryItems = enabledItems.filter(
    (f) => term?.checklist?.[f.requirementKey]?.mandatory ?? f.mandatory,
  )
  const verifiedCount = mandatoryItems.filter((f) => f.state === 'verified').length
  const pct = mandatoryItems.length
    ? Math.round((verifiedCount / mandatoryItems.length) * 100)
    : 0
  const returnedFiling = enabledItems.find((f) => f.state === 'returned')
  const allCleared = mandatoryItems.length > 0 && verifiedCount === mandatoryItems.length

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Periodic Report"
        title={term?.name || '1st Semester, AY 2026–2027'}
        description="RA 7687 · Award batch 2024 · BS Computer Science, 3rd year"
        badge={
          <StatusBadge
            status={allCleared ? 'verified' : 'submitted'}
            label={`${verifiedCount} of ${mandatoryItems.length} cleared`}
          />
        }
      />

      {term?.deadline && (
        <>
          {allCleared ? (
            <Alert className="border-emerald-500/30 bg-emerald-500/5">
              <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
              <AlertTitle>Everything cleared for this term</AlertTitle>
              <AlertDescription>
                All mandatory documents are verified before {term.deadline}. Your name is
                ready for DOST-VII's release list.
              </AlertDescription>
            </Alert>
          ) : returnedFiling ? (
            <Alert className="border-amber-500/35 bg-amber-500/10">
              <Clock className="size-4 text-amber-600 dark:text-amber-400" />
              <AlertTitle>{term.daysLeftText || '9 days left'}</AlertTitle>
              <AlertDescription>
                Your {data.requirementNames[returnedFiling.requirementKey]?.schoolName}{' '}
                came back for correction. Documents not cleared by {term.deadline} are
                checked with a later batch.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert>
              <Clock className="size-4" />
              <AlertTitle>{term.daysLeftText || '9 days left'}</AlertTitle>
              <AlertDescription>
                Your filings are waiting for DOST-VII to check. Documents not cleared by{' '}
                {term.deadline} are checked with a later batch.
              </AlertDescription>
            </Alert>
          )}
        </>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <CardTitle>What to file this term</CardTitle>
                  <CardDescription>
                    Select a requirement to upload a file or inspect reviewer notes.
                  </CardDescription>
                </div>
                <span className="font-mono text-xs text-muted-foreground tabular-nums">
                  {pct}% complete
                </span>
              </div>
              <Progress value={pct} className="mt-2 h-1.5" />
            </CardHeader>
            <CardContent className="divide-y p-0">
              {enabledItems.map((filing) => {
                const names = filing.requirementKey === 'reg' ? regReq : gradesReq
                const isMandatory =
                  term?.checklist?.[filing.requirementKey]?.mandatory ?? filing.mandatory
                const extra =
                  filing.state === 'returned' && filing.returnReason
                    ? `Returned ${filing.returnDateShort || '20 Sep'}: ${filing.returnReason.toLowerCase()}`
                    : filing.state === 'submitted'
                      ? `Filed ${filing.filedDate}`
                      : filing.state === 'under_review'
                        ? `Under review by ${filing.claimedBy}`
                        : null
                return (
                  <button
                    key={filing.id}
                    type="button"
                    onClick={() =>
                      navigate('scholar-requirement', {
                        req: filing.requirementKey,
                      })
                    }
                    className="flex w-full items-center justify-between gap-4 px-6 py-4 text-left transition-colors hover:bg-muted/50"
                  >
                    <div className="min-w-0 flex-1 space-y-1">
                      <p className="text-sm font-medium text-foreground">
                        {names.schoolName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        DOST calls it the {names.dostName} ·{' '}
                        {isMandatory ? 'Mandatory' : 'Optional'}
                        {extra ? ` · ${extra}` : ''}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2.5">
                      <StatusBadge status={filing.state} />
                      <ChevronRight className="size-4 text-muted-foreground" />
                    </div>
                  </button>
                )
              })}
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Where your stipend is</CardTitle>
              <CardDescription>
                Each release you are in, your tuition settlement, and your benefits'
                ceilings.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                className="w-full justify-between"
                onClick={() => navigate('scholar-status')}
              >
                Open Status
                <ArrowRight className="size-4" />
              </Button>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  )
}

export function ScholarRequirement() {
  const { data, route, navigate, submitFiling, showToast } = useStore()
  const reqKey = route.params.req === 'reg' ? 'reg' : 'grades'
  const filing =
    data.filings.find((f) => f.scholarId === 's-bea' && f.requirementKey === reqKey) ||
    data.filings[1]
  const names = data.requirementNames[reqKey]
  const citu = data.schools.find((s) => s.id === 'citu') || data.schools[0]

  const [lines, setLines] = useState(() => filing.gradeLines.map((l) => ({ ...l })))
  const [selectedFile, setSelectedFile] = useState<{
    name: string
    sizeLabel: string
  } | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [formError, setFormError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const lowest = parseFloat(citu.gradingLowest) || 1.0
  const highest = parseFloat(citu.gradingHighest) || 5.0
  const passing = parseFloat(citu.passingGrade) || 3.0
  const higherIsBetter = citu.higherIsBetter
  const threshold = parseFloat(citu.threshold)

  const computed = useMemo(() => {
    let totalUnits = 0
    let weightedSum = 0
    const evaluated = lines.map((line) => {
      const u = parseFloat(line.units)
      const g = parseFloat(line.grade)
      const validUnits = !Number.isNaN(u) && u > 0 && u <= 15
      const minBound = Math.min(lowest, highest)
      const maxBound = Math.max(lowest, highest)
      const validGrade = !Number.isNaN(g) && g >= minBound && g <= maxBound
      if (validUnits && validGrade) {
        totalUnits += u
        weightedSum += u * g
      }
      const passes = validGrade ? (higherIsBetter ? g >= passing : g <= passing) : null
      return { ...line, validUnits, validGrade, passes }
    })
    const avg = totalUnits > 0 ? weightedSum / totalUnits : null
    const meetsThreshold =
      avg !== null && !Number.isNaN(threshold)
        ? higherIsBetter
          ? avg >= threshold
          : avg <= threshold
        : null
    return { evaluated, totalUnits, avg, meetsThreshold }
  }, [lines, lowest, highest, passing, higherIsBetter, threshold])

  const isVerified = filing.state === 'verified'
  const canEdit = !isVerified

  const handleFilePick = (file?: File) => {
    if (!file) return
    const allowed = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/heic',
      'image/webp',
    ]
    const extOk = /\.(pdf|jpe?g|png|heic|webp)$/i.test(file.name)
    if (!allowed.includes(file.type) && !extOk) {
      setFormError(
        'Choose a PDF, JPEG, PNG, HEIC, or WebP scan (other file types are not accepted).',
      )
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setFormError('File exceeds 10 MB. Upload a smaller scan.')
      return
    }
    setFormError('')
    const mb = Math.max(0.1, file.size / (1024 * 1024)).toFixed(1)
    setSelectedFile({
      name: file.name,
      sizeLabel: `${file.name.split('.').pop()?.toUpperCase()} · ${mb} MB`,
    })
  }

  const addLine = () => {
    if (lines.length >= 30) {
      showToast('At most 30 subject lines are allowed.', 'info')
      return
    }
    setLines((prev) => [...prev, { code: '', units: '', grade: '' }])
  }

  const updateLine = (idx: number, field: string, val: string) => {
    setLines((prev) => prev.map((row, i) => (i === idx ? { ...row, [field]: val } : row)))
  }

  const removeLine = (idx: number) => {
    if (lines.length <= 1) return
    setLines((prev) => prev.filter((_, i) => i !== idx))
  }

  const handleSubmitFiling = () => {
    if (reqKey === 'grades') {
      const hasInvalid = computed.evaluated.some(
        (l) => !l.code.trim() || !l.validUnits || !l.validGrade,
      )
      if (hasInvalid) {
        setFormError(
          `Check each subject line: enter a subject code, units between 0 and 15, and a grade within CIT-U's ${citu.gradingLowest} to ${citu.gradingHighest} scale.`,
        )
        return
      }
    }
    setFormError('')
    const chosenName =
      selectedFile?.name ||
      (reqKey === 'grades' ? 'ctc-grades-v2-clear.pdf' : 'study-load-2026-1.pdf')
    const chosenSize = selectedFile?.sizeLabel || 'PDF · 2.1 MB'
    submitFiling({
      filingId: filing.id,
      fileName: chosenName,
      fileSize: chosenSize,
      gradeLines: lines,
    })
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: 'Home', onClick: () => navigate('scholar-dashboard') },
          { label: '1st Semester, AY 2026–2027' },
          { label: names.schoolName },
        ]}
      />

      <PageHeader
        title={names.schoolName}
        description={`DOST calls it the ${names.dostName} · ${filing.mandatory ? 'Mandatory' : 'Optional'}`}
        badge={<StatusBadge status={filing.state} />}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          {filing.state === 'returned' && (
            <Alert variant="destructive">
              <AlertTriangle className="size-4" />
              <AlertTitle>
                Returned on {filing.returnDate || '20 September'}:{' '}
                {(filing.returnReason || 'illegible').toLowerCase()}
              </AlertTitle>
              <AlertDescription>
                “{filing.returnRemarks}” File a corrected copy. Your earlier copy stays on
                record.
              </AlertDescription>
            </Alert>
          )}

          {filing.state === 'submitted' && (
            <Alert>
              <Clock className="size-4" />
              <AlertTitle>Submitted on {filing.filedDate}</AlertTitle>
              <AlertDescription>
                Waiting for DOST-VII to claim and check it. Filing again keeps earlier
                versions on record.
              </AlertDescription>
            </Alert>
          )}

          {filing.state === 'under_review' && (
            <Alert>
              <Clock className="size-4" />
              <AlertTitle>Under review by {filing.claimedBy}</AlertTitle>
              <AlertDescription>
                DOST-VII is currently checking this filing.
              </AlertDescription>
            </Alert>
          )}

          {isVerified && (
            <Alert className="border-emerald-500/30 bg-emerald-500/5">
              <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
              <AlertTitle>Verified on {filing.verifiedDate || '24 September'}</AlertTitle>
              <AlertDescription>
                Nothing more to do for this requirement. It can no longer be changed.
              </AlertDescription>
            </Alert>
          )}

          {formError && (
            <Alert variant="destructive" role="alert">
              <AlertTriangle className="size-4" />
              <AlertTitle>Cannot submit yet</AlertTitle>
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          )}

          {canEdit && (
            <Card>
              <CardHeader>
                <CardTitle>The file</CardTitle>
                <CardDescription>
                  From {citu.short}: {names.instructions}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => fileInputRef.current?.click()}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      fileInputRef.current?.click()
                    }
                  }}
                  onDragOver={(e) => {
                    e.preventDefault()
                    setDragOver(true)
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault()
                    setDragOver(false)
                    handleFilePick(e.dataTransfer.files?.[0])
                  }}
                  className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-8 text-center transition-colors ${
                    dragOver
                      ? 'border-primary bg-primary/5'
                      : 'border-border bg-muted/30 hover:border-muted-foreground/50 hover:bg-muted/50'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    hidden
                    accept=".pdf,.jpg,.jpeg,.png,.heic,.webp"
                    onChange={(e) => handleFilePick(e.target.files?.[0])}
                  />
                  <div className="flex size-11 items-center justify-center rounded-full border bg-background text-muted-foreground shadow-xs">
                    <Upload className="size-5" />
                  </div>
                  <p className="text-sm font-medium">
                    {selectedFile
                      ? `Selected: ${selectedFile.name}`
                      : 'Choose a file or drop a scan here'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {selectedFile
                      ? selectedFile.sizeLabel
                      : 'PDF, JPEG, PNG, HEIC or WebP · up to 10 MB'}
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={(e) => {
                      e.stopPropagation()
                      setFormError('')
                      setSelectedFile({
                        name:
                          reqKey === 'grades'
                            ? 'ctc-grades-v2-clear.pdf'
                            : 'study-load-2026-1.pdf',
                        sizeLabel: 'PDF · 2.1 MB',
                      })
                      showToast('Attached sample clear scan for prototype.')
                    }}
                  >
                    <FileText className="mr-1.5 size-3.5" />
                    Use clear sample scan
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {reqKey === 'grades' && (
            <Card>
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <CardTitle>Your grades, subject by subject</CardTitle>
                    <CardDescription>
                      {citu.short}'s scale: {citu.gradingLowest} to {citu.gradingHighest},{' '}
                      {higherIsBetter ? 'higher is better' : 'lower is better'}
                    </CardDescription>
                  </div>
                  {canEdit && (
                    <Button type="button" variant="outline" size="sm" onClick={addLine}>
                      <Plus className="mr-1 size-3.5" />
                      Add a subject
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="overflow-x-auto rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">#</TableHead>
                        <TableHead>Subject code</TableHead>
                        <TableHead className="w-24 text-right">Units</TableHead>
                        <TableHead className="w-28 text-right">Grade</TableHead>
                        <TableHead className="w-24">Passes?</TableHead>
                        {canEdit && <TableHead className="w-10" />}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {computed.evaluated.map((row, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="font-mono text-xs text-muted-foreground tabular-nums">
                            {idx + 1}
                          </TableCell>
                          <TableCell>
                            {canEdit ? (
                              <Input
                                value={row.code}
                                aria-label={`Line ${idx + 1}, subject code`}
                                className="h-8 min-w-[110px] font-mono text-xs uppercase"
                                onChange={(e) => updateLine(idx, 'code', e.target.value)}
                              />
                            ) : (
                              <span className="font-mono text-sm">{row.code}</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {canEdit ? (
                              <Input
                                inputMode="decimal"
                                value={row.units}
                                aria-label={`Line ${idx + 1}, units`}
                                className="ml-auto h-8 w-20 text-right font-mono text-xs tabular-nums"
                                onChange={(e) => updateLine(idx, 'units', e.target.value)}
                              />
                            ) : (
                              <span className="font-mono text-sm tabular-nums">
                                {row.units}
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {canEdit ? (
                              <Input
                                inputMode="decimal"
                                value={row.grade}
                                aria-label={`Line ${idx + 1}, grade`}
                                className="ml-auto h-8 w-24 text-right font-mono text-xs tabular-nums"
                                onChange={(e) => updateLine(idx, 'grade', e.target.value)}
                              />
                            ) : (
                              <span className="font-mono text-sm tabular-nums">
                                {row.grade}
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            {row.passes === null ? (
                              <StatusBadge status="off" label="Not yet" />
                            ) : row.passes ? (
                              <StatusBadge status="ok" label="Yes" />
                            ) : (
                              <StatusBadge status="bad" label="No" />
                            )}
                          </TableCell>
                          {canEdit && (
                            <TableCell className="text-right">
                              {lines.length > 1 && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon-xs"
                                  aria-label={`Remove line ${idx + 1}`}
                                  onClick={() => removeLine(idx)}
                                >
                                  <Trash2 className="size-3.5 text-muted-foreground" />
                                </Button>
                              )}
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-muted/40 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium">Weighted average</p>
                    <p className="text-xs text-muted-foreground">
                      {citu.threshold
                        ? `Agreement §VII.A threshold: ${citu.threshold} (${
                            computed.meetsThreshold === null
                              ? 'enter grades'
                              : computed.meetsThreshold
                                ? 'meets threshold'
                                : 'below threshold'
                          })`
                        : 'No §VII.A threshold configured yet'}
                    </p>
                  </div>
                  <span className="font-mono text-base font-semibold tabular-nums">
                    {computed.avg !== null
                      ? `${computed.avg.toFixed(4)} · ${computed.totalUnits} units`
                      : 'Not yet'}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {canEdit && (
            <div className="flex flex-wrap items-center gap-3">
              <Button type="button" onClick={handleSubmitFiling}>
                File it
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('scholar-dashboard')}
              >
                Cancel
              </Button>
            </div>
          )}
        </div>

        <aside className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Versions</CardTitle>
              <CardDescription>Every filed copy stays on record.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {filing.versions.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nothing filed yet.</p>
              ) : (
                filing.versions.map((v) => (
                  <div
                    key={v.version}
                    className="flex items-start justify-between gap-3 rounded-lg border p-3"
                  >
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium">Version {v.version}</p>
                      <p className="text-xs text-muted-foreground">{v.summary}</p>
                    </div>
                    <StatusBadge status={v.state} />
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-base">File preview</CardTitle>
                  <CardDescription className="font-mono text-xs">
                    {selectedFile ? selectedFile.sizeLabel : filing.fileSize}
                  </CardDescription>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="icon-xs" title="Expand scan">
                      <Maximize2 className="size-3.5" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>
                        {selectedFile ? selectedFile.name : filing.fileName}
                      </DialogTitle>
                    </DialogHeader>
                    <div className="overflow-hidden rounded-lg border bg-muted">
                      <GradesDocument
                        kind={
                          selectedFile
                            ? reqKey === 'grades'
                              ? 'grades'
                              : 'registration'
                            : filing.docKind
                        }
                        lines={lines}
                      />
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-hidden rounded-lg border bg-muted">
                <GradesDocument
                  kind={
                    selectedFile
                      ? reqKey === 'grades'
                        ? 'grades'
                        : 'registration'
                      : filing.docKind
                  }
                  lines={lines}
                />
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  )
}

export function ScholarStatus() {
  const { data } = useStore()
  const batchCurrent =
    data.releaseBatches.find((b) => b.id === 'VII-2026-014') || data.releaseBatches[0]
  const beaInBatch = batchCurrent?.scholars.find((s) => s.id === 's-bea')
  const remittanceCurrent = data.remittances.find((r) => r.id === '2026-10-0412')
  const beaTuition = remittanceCurrent?.scholars.find((s) => s.id === 's-bea')

  const isSent = ['sent', 'approved', 'released'].includes(batchCurrent?.status)
  const isApproved = ['approved', 'released'].includes(batchCurrent?.status)
  const isReleased = batchCurrent?.status === 'released'

  const batchStatusKey = beaInBatch?.removed
    ? 'off'
    : isReleased
      ? 'released'
      : isApproved
        ? 'approved'
        : isSent
          ? 'sent'
          : batchCurrent?.status === 'returned'
            ? 'returned'
            : 'draft'

  const batchStatusLabel = beaInBatch?.removed
    ? 'Moved to a later batch'
    : isReleased
      ? 'Released'
      : isApproved
        ? 'Approved by Central Office'
        : isSent
          ? 'Sent to Central Office'
          : batchCurrent?.status === 'returned'
            ? 'Returned to Regional Office'
            : 'In Regional Office draft'

  const releaseSteps = [
    { status: 'done', title: 'Documents outstanding', when: 'Until 24 Sep' },
    {
      status: 'done',
      title: 'Cleared',
      when: '24 Sep · every mandatory document verified',
    },
    {
      status: 'done',
      title: "In the Regional Office's list",
      when: '2 Oct · recorded by DOST-VII',
    },
    {
      status: isApproved ? 'done' : isSent ? 'now' : 'todo',
      title: 'Sent to Central Office',
      when: isSent
        ? `${batchCurrent.sentDate || '6 Oct'} · recorded by DOST-VII`
        : 'Not sent yet',
    },
    {
      status: isReleased ? 'done' : isApproved ? 'now' : 'todo',
      title: 'Approved by Central Office',
      when: isApproved
        ? `${batchCurrent.approvedDate || '9 Oct'} · ${batchCurrent.approvedBy}`
        : 'Not recorded yet',
    },
    {
      status: isReleased ? 'done' : 'todo',
      title: 'Released by Central Office',
      when: isReleased
        ? `${batchCurrent.releasedDate} · LandBank credits your account after this`
        : 'Not recorded yet',
    },
  ]

  const tuitionSteps = [
    {
      status: 'done',
      title: 'DOST sent your 1st Semester tuition to CIT-U',
      when: remittanceCurrent?.sentDate || '3 Oct',
    },
    {
      status: beaTuition?.creditedDate ? 'done' : 'todo',
      title: 'CIT-U credited it to your account',
      when: beaTuition?.creditedDate || 'Not credited yet',
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Status"
        title="Where your stipend and tuition are"
        description="Each step shows the date someone recorded it. No step predicts a date."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <CardTitle>Release for {batchCurrent?.term}</CardTitle>
                  <CardDescription>
                    {(batchCurrent?.benefits || []).join('; ')}
                  </CardDescription>
                </div>
                <StatusBadge status={batchStatusKey} label={batchStatusLabel} />
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {beaInBatch?.removed && (
                <Alert>
                  <AlertTitle>Moved to a later batch</AlertTitle>
                  <AlertDescription>
                    {beaInBatch.removeReason} Nothing is forfeited — your allowance stays
                    owed in a later batch.
                  </AlertDescription>
                </Alert>
              )}

              <StepTimeline steps={releaseSteps} />

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Requested by DOST-VII</p>
                  <p className="text-xs text-muted-foreground">
                    As the Regional Office recorded it. SEIskolar works out no amount.
                  </p>
                </div>
                <span className="font-mono text-lg font-semibold tabular-nums">
                  {beaInBatch?.amount || '₱32,000'}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <CardTitle>Release for 2nd Semester, AY 2025–2026</CardTitle>
                  <CardDescription>
                    Monthly living allowance; Learning materials and connectivity
                  </CardDescription>
                </div>
                <StatusBadge status="released" />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Released by Central Office on 14 July 2026. LandBank credits your account
                after this; SEIskolar can't see that step.
              </p>
              <div className="overflow-hidden rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Benefit</TableHead>
                      <TableHead className="text-right">Requested</TableHead>
                      <TableHead className="text-right">Released</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>Monthly living allowance</TableCell>
                      <TableCell className="text-right font-mono tabular-nums">
                        ₱40,000
                      </TableCell>
                      <TableCell className="text-right font-mono tabular-nums">
                        ₱40,000
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Learning materials and connectivity</TableCell>
                      <TableCell className="text-right font-mono tabular-nums">
                        ₱10,000
                      </TableCell>
                      <TableCell className="text-right font-mono tabular-nums">
                        ₱10,000
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Tuition</CardTitle>
              <CardDescription>No amount is shown here.</CardDescription>
            </CardHeader>
            <CardContent>
              <StepTimeline steps={tuitionSteps} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Your benefits</CardTitle>
              <CardDescription>
                Each a ceiling, payable subject to availability of funds (Agreement §VI).
              </CardDescription>
            </CardHeader>
            <CardContent className="divide-y p-0">
              {data.benefits.slice(0, 3).map((b) => (
                <div
                  className="flex items-center justify-between gap-2 px-6 py-3.5"
                  key={b.id}
                >
                  <span className="text-sm font-medium">{b.name}</span>
                  <span className="shrink-0 font-mono text-xs text-muted-foreground tabular-nums">
                    Up to {b.ceiling}{' '}
                    {b.frequency === 'Monthly'
                      ? '/ mo'
                      : b.frequency === 'Each academic year'
                        ? '/ yr'
                        : b.frequency.toLowerCase()}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  )
}
