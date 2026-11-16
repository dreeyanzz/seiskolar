import React, { createContext, useContext, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { ALL_SCREENS, ROLES, createInitialState } from '../data/initialState.js'

const STORAGE_KEY = 'seiskolar-proto-v1'
const SESSION_KEY = 'seiskolar-proto-session-v1'
const THEME_KEY = 'seiskolar-proto-theme-v1'

const StoreContext = createContext(null)

function getContrastText(hex) {
  const clean = (hex || '#800000').replace('#', '')
  if (!/^[0-9a-fA-F]{6}$/.test(clean)) return '#ffffff'
  const num = parseInt(clean, 16)
  const r = (num >> 16) & 255
  const g = (num >> 8) & 255
  const b = num & 255
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.62 ? '#09090b' : '#ffffff'
}

function parseHash() {
  const raw = window.location.hash.replace(/^#\/?/, '')
  if (!raw) return { screen: 'sign-in', params: {} }
  const [path, query] = raw.split('?')
  const params = {}
  if (query) {
    new URLSearchParams(query).forEach((v, k) => {
      params[k] = v
    })
  }
  const known = ALL_SCREENS.some((s) => s.id === path)
  return { screen: known ? path : 'nothing-found', params }
}

function buildHash(screen, params = {}) {
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== null && v !== '',
  )
  if (!entries.length) return `#/${screen}`
  const qs = new URLSearchParams(entries).toString()
  return `#/${screen}?${qs}`
}

function loadSavedData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed && parsed.schools && parsed.filings) return parsed
    }
  } catch {
    // fallback to initial seed
  }
  return createInitialState()
}

function loadSavedSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    // ignore
  }
  return {
    roleId: null,
    portalPreview: 'school',
    who: '',
    email: '',
  }
}

function loadSavedTheme() {
  try {
    const saved = localStorage.getItem(THEME_KEY)
    if (saved === 'dark' || saved === 'light') return saved
  } catch {
    // ignore
  }
  return 'light'
}

export function StoreProvider({ children }) {
  const [data, setData] = useState(loadSavedData)
  const [session, setSession] = useState(loadSavedSession)
  const [theme, setTheme] = useState(loadSavedTheme)
  const [route, setRoute] = useState(parseHash)
  const [resetTick, setResetTick] = useState(0)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch {
      // ignore
    }
  }, [data])

  useEffect(() => {
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify(session))
    } catch {
      // ignore
    }
  }, [session])

  useEffect(() => {
    try {
      localStorage.setItem(THEME_KEY, theme)
    } catch {
      // ignore
    }
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  useEffect(() => {
    const onHashChange = () => setRoute(parseHash())
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  const citu = data.schools.find((s) => s.id === 'citu') || data.schools[0]
  const activeRole =
    session.roleId && ROLES[session.roleId] ? ROLES[session.roleId] : null
  const isSchoolPortal =
    route.screen === 'sign-in'
      ? (route.params.portal || session.portalPreview) !== 'console'
      : route.screen === 'no-access'
        ? true
        : activeRole
          ? activeRole.portal === 'school'
          : true

  useEffect(() => {
    const root = document.documentElement
    document.body.setAttribute('data-portal', isSchoolPortal ? 'school' : 'console')

    if (theme === 'dark') {
      root.style.removeProperty('--primary')
      root.style.removeProperty('--primary-foreground')
      if (isSchoolPortal && citu) {
        root.style.setProperty('--brand-accent', citu.primaryColor || '#800000')
      } else {
        root.style.setProperty('--brand-accent', '#f2b705')
      }
      return
    }

    if (isSchoolPortal && citu) {
      const primary = /^#[0-9a-fA-F]{6}$/.test(citu.primaryColor)
        ? citu.primaryColor
        : '#800000'
      const accent = /^#[0-9a-fA-F]{6}$/.test(citu.accentColor)
        ? citu.accentColor
        : '#F2C200'
      root.style.setProperty('--primary', primary)
      root.style.setProperty('--primary-foreground', getContrastText(primary))
      root.style.setProperty('--brand-accent', accent)
    } else {
      root.style.setProperty('--primary', '#16365c')
      root.style.setProperty('--primary-foreground', '#ffffff')
      root.style.setProperty('--brand-accent', '#f2b705')
    }
  }, [isSchoolPortal, citu, theme])

  const showToast = (msg, kind = 'success') => {
    if (kind === 'info') toast.info(msg)
    else toast.success(msg)
  }

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))
  }

  const navigate = (screen, params = {}) => {
    const nextHash = buildHash(screen, params)
    if (window.location.hash !== nextHash) {
      window.location.hash = nextHash
    } else {
      setRoute({ screen, params })
    }
    window.scrollTo({ top: 0, behavior: 'auto' })
  }

  const signInAsRole = (roleId, extra = {}) => {
    if (roleId === 'unassigned') {
      setSession({
        roleId: 'unassigned',
        portalPreview: 'school',
        who: extra.who || 'New Account',
        email: extra.email || 'bea.santiago@example.test',
      })
      navigate('no-access')
      return
    }
    const role = ROLES[roleId]
    if (!role) return
    setSession({
      roleId: role.id,
      portalPreview: role.portal,
      who: role.who,
      email: role.email,
    })
    navigate(extra.targetScreen || role.homeScreen, extra.targetParams || {})
  }

  const signOut = (portal = activeRole?.portal || 'school') => {
    setSession({
      roleId: null,
      portalPreview: portal,
      who: '',
      email: '',
    })
    navigate('sign-in', { portal })
  }

  const setPortalPreview = (portal) => {
    setSession((prev) => ({ ...prev, portalPreview: portal }))
    navigate('sign-in', { portal })
  }

  const resetDemo = () => {
    const fresh = createInitialState()
    setData(fresh)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh))
    setResetTick((n) => n + 1)
    showToast('Demo data reset to initial state.')
  }

  // ---- Scholar actions ----
  const submitFiling = ({ filingId, fileName, fileSize, gradeLines }) => {
    const nowLabel = '20 Sep, 15:40'
    setData((prev) => ({
      ...prev,
      filings: prev.filings.map((f) => {
        if (f.id !== filingId) return f
        const nextVer = f.versions.length + 1
        const prevLabel =
          f.state === 'returned'
            ? 'Returned'
            : f.state === 'not_started'
              ? 'Not started'
              : 'Submitted'
        return {
          ...f,
          state: 'submitted',
          claimedBy: '',
          filedDate: '20 Sep',
          fileName: fileName || f.fileName,
          fileSize: fileSize || f.fileSize,
          docKind: f.requirementKey === 'grades' ? 'grades' : 'registration',
          gradeLines: gradeLines || f.gradeLines,
          versions: [
            ...f.versions,
            {
              version: nextVer,
              state: 'submitted',
              summary: 'Filed 20 Sep · Waiting for DOST-VII',
              fileName: fileName || f.fileName,
            },
          ],
          history: [
            ...f.history,
            {
              when: nowLabel,
              who: `${f.scholarName} · Scholar`,
              what: `Filed version ${nextVer}`,
              stateChange: `${prevLabel} → Submitted`,
              before: `State: ${f.state} · version: ${f.versions.length}`,
              after: `State: submitted · version: ${nextVer} · file: ${fileName || f.fileName}`,
            },
          ],
        }
      }),
    }))
    showToast('Filed. It is submitted, and waits for DOST-VII to check it.')
  }

  // ---- Regional checker actions ----
  const claimFiling = (filingId) => {
    const reviewer = activeRole?.who || 'Ana Villareal'
    setData((prev) => ({
      ...prev,
      filings: prev.filings.map((f) => {
        if (f.id !== filingId) return f
        return {
          ...f,
          state: 'under_review',
          claimedBy: reviewer,
          history: [
            ...f.history,
            {
              when: '20 Sep, 16:02',
              who: `${reviewer} · Regional Office`,
              what: 'Claimed it',
              stateChange: 'Submitted → Under review',
              before: 'State: submitted · claimed by: no one',
              after: `State: under_review · claimed by: ${reviewer}`,
            },
          ],
        }
      }),
    }))
    showToast('Claimed. No one else can decide this filing while you hold it.')
  }

  const releaseClaim = (filingId) => {
    const reviewer = activeRole?.who || 'Ana Villareal'
    setData((prev) => ({
      ...prev,
      filings: prev.filings.map((f) => {
        if (f.id !== filingId) return f
        return {
          ...f,
          state: 'submitted',
          claimedBy: '',
          history: [
            ...f.history,
            {
              when: '20 Sep, 16:05',
              who: `${reviewer} · Regional Office`,
              what: 'Released the claim',
              stateChange: 'Under review → Submitted',
              before: `State: under_review · claimed by: ${f.claimedBy || reviewer}`,
              after: 'State: submitted · claimed by: no one',
            },
          ],
        }
      }),
    }))
    showToast('Claim released. The filing is back in the queue.')
    navigate('regional-queue')
  }

  const verifyFiling = (filingId) => {
    const reviewer = activeRole?.who || 'Ana Villareal'
    setData((prev) => {
      const target = prev.filings.find((f) => f.id === filingId)
      const nextFilings = prev.filings.map((f) => {
        if (f.id !== filingId) return f
        const nextVersions = f.versions.map((v, idx) =>
          idx === f.versions.length - 1
            ? {
                ...v,
                state: 'verified',
                summary: `Filed ${f.filedDate} · Verified 20 Sep`,
              }
            : v,
        )
        return {
          ...f,
          state: 'verified',
          claimedBy: '',
          verifiedDate: '20 September',
          versions: nextVersions,
          history: [
            ...f.history,
            {
              when: '20 Sep, 16:12',
              who: `${reviewer} · Regional Office`,
              what: 'Verified it',
              stateChange: 'Under review → Verified',
              before: `State: under_review · claimed by: ${reviewer}`,
              after: 'State: verified · claimed by: no one',
            },
          ],
        }
      })

      let nextScholars = prev.scholars
      if (target) {
        const scholarFilings = nextFilings.filter(
          (f) => f.scholarId === target.scholarId && f.mandatory,
        )
        const allVerified =
          scholarFilings.length > 0 && scholarFilings.every((f) => f.state === 'verified')
        if (allVerified) {
          nextScholars = prev.scholars.map((s) =>
            s.id === target.scholarId ? { ...s, cleared: true } : s,
          )
        }
      }
      return { ...prev, filings: nextFilings, scholars: nextScholars }
    })
    showToast('Verified. This filing is now final.')
    navigate('regional-queue')
  }

  const returnFiling = ({ filingId, reason, remarks }) => {
    const reviewer = activeRole?.who || 'Ana Villareal'
    setData((prev) => ({
      ...prev,
      filings: prev.filings.map((f) => {
        if (f.id !== filingId) return f
        const nextVersions = f.versions.map((v, idx) =>
          idx === f.versions.length - 1
            ? {
                ...v,
                state: 'returned',
                summary: `Filed ${f.filedDate} · Returned 20 Sep: ${reason.toLowerCase()}`,
              }
            : v,
        )
        return {
          ...f,
          state: 'returned',
          claimedBy: '',
          returnReason: reason,
          returnRemarks: remarks,
          returnDate: '20 September',
          returnDateShort: '20 Sep',
          versions: nextVersions,
          history: [
            ...f.history,
            {
              when: '20 Sep, 16:15',
              who: `${reviewer} · Regional Office`,
              what: `Returned it: ${reason.toLowerCase()}`,
              stateChange: 'Under review → Returned',
              before: `State: under_review · claimed by: ${reviewer}`,
              after: `State: returned · claimed by: no one · reason: ${reason.toLowerCase()}`,
            },
          ],
        }
      }),
    }))
    showToast('Returned. The scholar sees the reason and can file a new version.')
    navigate('regional-queue')
  }

  // ---- Coordinator actions ----
  const addTerm = ({ schoolId = 'citu', name, type, dates, filingOpens }) => {
    const id = `${schoolId}-${Date.now()}`
    setData((prev) => ({
      ...prev,
      terms: [
        ...prev.terms,
        {
          id,
          schoolId,
          name,
          type,
          dates,
          filingOpens: filingOpens || 'Not set',
          addedLabel: 'Added by CIT-U today',
          deadline: '',
          deadlineShort: 'Not set yet',
          daysLeftText: '',
          checklist: {
            reg: { enabled: false, mandatory: true },
            grades: { enabled: false, mandatory: true },
          },
        },
      ],
    }))
    showToast('The term is saved to the calendar.')
  }

  const saveRequirementNames = (updatedNames) => {
    setData((prev) => ({
      ...prev,
      requirementNames: updatedNames,
    }))
    showToast("Saved. CIT-U's scholars see these names.")
  }

  const savePortalSettings = (schoolId, updates) => {
    setData((prev) => ({
      ...prev,
      schools: prev.schools.map((s) => (s.id === schoolId ? { ...s, ...updates } : s)),
    }))
    showToast('Saved. Scholars see the portal in these colours.')
  }

  const matchRemittance = (remittanceId) => {
    setData((prev) => ({
      ...prev,
      remittances: prev.remittances.map((r) =>
        r.id === remittanceId ? { ...r, status: 'received', disputeReason: '' } : r,
      ),
    }))
    showToast('Matched. You can now credit scholars on this remittance.')
  }

  const disputeRemittance = ({ remittanceId, reason }) => {
    setData((prev) => ({
      ...prev,
      remittances: prev.remittances.map((r) =>
        r.id === remittanceId
          ? {
              ...r,
              status: 'disputed',
              disputeDate: '8 Oct',
              disputeReason: reason,
            }
          : r,
      ),
    }))
    showToast('Disputed. DOST-VII sees your reason and corrects the remittance.')
  }

  const creditRemittanceScholars = ({ remittanceId, scholarIds, allRemaining }) => {
    setData((prev) => ({
      ...prev,
      remittances: prev.remittances.map((r) => {
        if (r.id !== remittanceId) return r
        const nextScholars = r.scholars.map((s) => {
          if (s.creditedDate) return s
          if (allRemaining || scholarIds.includes(s.id)) {
            return { ...s, creditedDate: '9 Oct' }
          }
          return s
        })
        const newlyCredited = nextScholars.filter(
          (s, i) => s.creditedDate && !r.scholars[i].creditedDate,
        ).length
        const nextTotal = allRemaining
          ? r.scholarCount
          : Math.min(r.scholarCount, r.creditedTotalBase + newlyCredited)
        const settled = allRemaining || nextTotal >= r.scholarCount
        return {
          ...r,
          scholars: nextScholars,
          creditedTotalBase: nextTotal,
          status: settled ? 'settled' : 'received',
        }
      }),
    }))
    if (allRemaining) {
      showToast('Everyone on the list is credited. The remittance is settled.')
    } else {
      showToast(`Credited ${scholarIds.length} selected scholar(s).`)
    }
  }

  // ---- Regional setup, batches, remittances, proposals, schools, accounts, transfers ----
  const saveTermSetup = ({ termId, checklist, deadline }) => {
    setData((prev) => ({
      ...prev,
      terms: prev.terms.map((t) =>
        t.id === termId
          ? {
              ...t,
              checklist,
              deadline,
              deadlineShort: deadline ? deadline : 'no deadline set',
              daysLeftText: deadline ? '9 days left' : '',
            }
          : t,
      ),
    }))
    showToast('Saved. Scholars see the checklist, with the countdown.')
  }

  const startNewBatch = () => {
    const nextNum = 15 + data.releaseBatches.length
    const newId = `VII-2026-0${nextNum}`
    setData((prev) => ({
      ...prev,
      releaseBatches: [
        {
          id: newId,
          region: 'DOST-VII',
          term: '1st Semester, AY 2026–2027',
          startedMeta: `started today by ${activeRole?.who || 'Ana Villareal'}`,
          sentDate: '',
          approvedDate: '',
          approvedBy: '',
          releasedDate: '',
          status: 'draft',
          totalCount: 1,
          benefits: ['Monthly living allowance'],
          returnReason: '',
          scholars: [
            {
              id: 's-jomar',
              name: 'Jomar Dela Cruz',
              school: 'CIT-U',
              scholarNumber: '2024-07-00002',
              amount: '₱32,000',
              removed: false,
              removeReason: '',
            },
          ],
          takenOff: [],
        },
        ...prev.releaseBatches,
      ],
    }))
    showToast(`Started draft ${newId}.`)
    return newId
  }

  const updateBatch = (batchId, updater) => {
    setData((prev) => ({
      ...prev,
      releaseBatches: prev.releaseBatches.map((b) =>
        b.id === batchId
          ? typeof updater === 'function'
            ? updater(b)
            : { ...b, ...updater }
          : b,
      ),
    }))
  }

  const sendBatchToCentral = (batchId, isResend = false) => {
    updateBatch(batchId, (b) => ({
      ...b,
      status: 'sent',
      sentDate: '8 Oct',
      returnReason: '',
    }))
    showToast(isResend ? 'Sent to Central Office again.' : 'Sent to Central Office.')
  }

  const takeOffBatchScholar = ({ batchId, scholarId, reason }) => {
    updateBatch(batchId, (b) => {
      const target = b.scholars.find((s) => s.id === scholarId)
      if (!target) return b
      return {
        ...b,
        totalCount: Math.max(0, b.totalCount - 1),
        scholars: b.scholars.filter((s) => s.id !== scholarId),
        takenOff: [
          ...b.takenOff,
          { name: target.name, school: target.school, when: 'Today', reason },
        ],
      }
    })
    showToast(
      'Taken off this batch. The scholar moves to a later batch, and loses nothing.',
    )
  }

  const addScholarToBatch = ({ batchId, scholar }) => {
    updateBatch(batchId, (b) => {
      if (b.scholars.some((s) => s.id === scholar.id)) return b
      return {
        ...b,
        totalCount: b.totalCount + 1,
        scholars: [
          ...b.scholars,
          {
            id: scholar.id,
            name: scholar.name,
            school: scholar.school,
            scholarNumber: scholar.scholarNumber,
            amount: '₱32,000',
            removed: false,
            removeReason: '',
          },
        ],
      }
    })
    showToast(`Added ${scholar.name} to batch.`)
  }

  const recordNewRemittance = ({
    schoolId,
    term,
    number,
    amount,
    proofLabel,
    scholarCount,
  }) => {
    const school = data.schools.find((s) => s.id === schoolId)
    const id = number.replace(/[^0-9-]/g, '') || `rem-${Date.now()}`
    setData((prev) => ({
      ...prev,
      remittances: [
        {
          id,
          number,
          schoolId,
          schoolName: school ? school.short : schoolId,
          term,
          sentDate: 'Today',
          amount,
          scholarCount: scholarCount || 12,
          proofLabel: proofLabel || 'LDDAP-ADA, 2 pages',
          status: 'sent',
          disputeReason: '',
          scholars: [
            {
              id: 's-jomar',
              name: 'Jomar Dela Cruz',
              scholarNumber: '2024-07-00002',
              creditedDate: '',
            },
            {
              id: 's-kristine',
              name: 'Kristine Uy',
              scholarNumber: '2024-07-00003',
              creditedDate: '',
            },
          ],
          creditedTotalBase: 0,
        },
        ...prev.remittances,
      ],
    }))
    showToast(
      `Sent to ${school ? school.short : 'school'}. Its coordinator checks it against the school's records.`,
    )
  }

  const resendDisputedRemittance = ({ remittanceId, number, amount, proofLabel }) => {
    setData((prev) => ({
      ...prev,
      remittances: prev.remittances.map((r) =>
        r.id === remittanceId
          ? {
              ...r,
              number,
              amount,
              proofLabel: proofLabel || r.proofLabel,
              status: 'sent',
              disputeReason: '',
            }
          : r,
      ),
    }))
    showToast('Corrected remittance sent back to the school.')
  }

  const submitProposal = ({ kind, target, change, reason }) => {
    const id = `p-${Date.now()}`
    setData((prev) => ({
      ...prev,
      proposals: [
        {
          id,
          title: `${target.split('·')[0].trim()}: ${change}`,
          region: 'DOST-VII',
          proposedBy: `${activeRole?.who || 'Ana Villareal'}, DOST-VII`,
          sentDate: 'Today',
          kind,
          target,
          change,
          reason,
          status: 'pending',
          decisionReason: '',
          decisionDate: '',
        },
        ...prev.proposals,
      ],
    }))
    showToast('Sent. Nothing changes until Central Office approves it.')
  }

  const createSchool = ({ name, short, code, portalAddress }) => {
    const id = code.toLowerCase().replace(/[^a-z0-9]/g, '') || `sch-${Date.now()}`
    setData((prev) => ({
      ...prev,
      schools: [
        ...prev.schools,
        {
          id,
          name,
          short: short || name,
          code: code.toUpperCase(),
          region: 'DOST-VII',
          portalAddress,
          coordinator: '',
          scholarsCount: 0,
          clearedCount: 0,
          notYetVerifiedCount: 0,
          oldestNotFiledDays: null,
          primaryColor: '#16365c',
          accentColor: '#f2b705',
          gradingLowest: '1.00',
          gradingHighest: '5.00',
          higherIsBetter: true,
          passingGrade: '3.00',
          threshold: '',
        },
      ],
    }))
    showToast('The school is created in DOST-VII.')
  }

  const addScholarAccount = (form) => {
    const school = data.schools.find(
      (s) => s.short === form.school || s.id === form.school,
    )
    setData((prev) => ({
      ...prev,
      scholars: [
        {
          id: `s-${Date.now()}`,
          name: form.name,
          email: form.email,
          scholarNumber: form.scholarNumber,
          schoolId: school ? school.id : 'citu',
          school: school ? school.short : form.school,
          awardYear: form.awardYear,
          yearLevel: form.yearLevel,
          programme: form.programme,
          scholarshipType: form.scholarshipType,
          signedIn: false,
          cleared: false,
        },
        ...prev.scholars,
      ],
    }))
    showToast('The account is created. Its owner can sign in now.')
  }

  const addCoordinatorAccount = ({ email, name, school }) => {
    setData((prev) => ({
      ...prev,
      coordinators: [...prev.coordinators, { email, name, school, signedIn: false }],
      schools: prev.schools.map((s) =>
        s.short === school || s.name === school ? { ...s, coordinator: name } : s,
      ),
    }))
    showToast('The account is created. Its owner can sign in now.')
  }

  const recordTransfer = ({ scholarId, newSchool, date }) => {
    setData((prev) => {
      const target = prev.scholars.find((s) => s.id === scholarId)
      const oldSchool = target ? target.school : 'Mabini State College'
      const newSch = prev.schools.find(
        (s) => s.short === newSchool || s.name === newSchool,
      )
      return {
        ...prev,
        scholars: prev.scholars.map((s) =>
          s.id === scholarId
            ? {
                ...s,
                school: newSch ? newSch.short : newSchool,
                schoolId: newSch ? newSch.id : s.schoolId,
              }
            : s,
        ),
        transfers: [
          {
            scholar: target ? target.name : 'Scholar',
            detail: `${oldSchool} to ${newSch ? newSch.short : newSchool} · ${date}`,
          },
          ...prev.transfers,
        ],
      }
    })
    showToast('Recorded. The scholar files at the new school from the next term.')
  }

  // ---- Central Office actions ----
  const removeBatchScholarCentral = ({ batchId, scholarId, reason }) => {
    const reviewer = activeRole?.who || 'Paolo Reyes'
    updateBatch(batchId, (b) => ({
      ...b,
      scholars: b.scholars.map((s) =>
        s.id === scholarId
          ? {
              ...s,
              removed: true,
              removeReason: `removed today by ${reviewer}: “${reason}”`,
            }
          : s,
      ),
    }))
    showToast('Removed. The scholar sees why, and moves to a later batch.')
  }

  const approveBatchCentral = (batchId) => {
    const reviewer = activeRole?.who || 'Paolo Reyes'
    updateBatch(batchId, (b) => ({
      ...b,
      status: 'approved',
      approvedDate: '9 Oct',
      approvedBy: reviewer,
    }))
    showToast('Batch approved. Record the release once funds go out.')
  }

  const returnBatchCentral = ({ batchId, reason }) => {
    updateBatch(batchId, (b) => ({
      ...b,
      status: 'returned',
      returnReason: reason,
    }))
    showToast('Returned to DOST-VII, with your reason.')
    navigate('central-batches')
  }

  const releaseBatchCentral = ({ batchId, releasedDate }) => {
    updateBatch(batchId, (b) => ({
      ...b,
      status: 'released',
      releasedDate: releasedDate || '14 October 2026',
    }))
    showToast(`The release is recorded: ${releasedDate || '14 October 2026'}.`)
  }

  const saveBenefit = ({ benefitName, ceiling, frequency }) => {
    setData((prev) => ({
      ...prev,
      benefits: prev.benefits.map((b) =>
        b.name === benefitName ? { ...b, ceiling, frequency } : b,
      ),
    }))
    showToast('Saved, with your reason. It takes effect at once.')
  }

  const addBenefitRule = ({ awardYear, scholarshipType, benefitName, detail }) => {
    setData((prev) => ({
      ...prev,
      benefitRules: [
        {
          id: `r-${Date.now()}`,
          title: `Award year ${awardYear} · ${scholarshipType}`,
          summary: `${benefitName}: ${detail || 'Applied to matching scholars'}`,
        },
        ...prev.benefitRules,
      ],
    }))
    showToast('Saved. Scholars who match the rule get the benefit.')
  }

  const changeScholarBenefit = ({ mode, benefitName, reason }) => {
    const reviewer = activeRole?.who || 'Paolo Reyes'
    setData((prev) => {
      const current = prev.scholarBenefits
      if (mode === 'add') {
        return {
          ...prev,
          scholarBenefits: {
            ...current,
            overrides: [
              ...current.overrides,
              {
                id: `ov-${Date.now()}`,
                name: benefitName,
                note: `Today, ${reviewer}: “${reason}”`,
              },
            ],
          },
        }
      }
      return {
        ...prev,
        scholarBenefits: {
          ...current,
          fromRule: current.fromRule.filter((n) => n !== benefitName),
          overrides: current.overrides.filter((o) => o.name !== benefitName),
        },
      }
    })
    showToast('Saved, with your reason. It takes effect at once.')
  }

  const approveProposal = (proposalId) => {
    setData((prev) => ({
      ...prev,
      proposals: prev.proposals.map((p) =>
        p.id === proposalId ? { ...p, status: 'approved', decisionDate: 'Today' } : p,
      ),
    }))
    showToast('Approved. The change takes effect now.')
  }

  const rejectProposal = ({ proposalId, reason }) => {
    setData((prev) => ({
      ...prev,
      proposals: prev.proposals.map((p) =>
        p.id === proposalId
          ? {
              ...p,
              status: 'rejected',
              decisionReason: reason,
              decisionDate: 'Today',
            }
          : p,
      ),
    }))
    showToast('Rejected. DOST-VII sees your reason.')
  }

  const saveThresholds = (thresholdsById) => {
    setData((prev) => ({
      ...prev,
      schools: prev.schools.map((s) =>
        thresholdsById[s.id] !== undefined
          ? { ...s, threshold: thresholdsById[s.id] }
          : s,
      ),
    }))
    showToast("Saved. Scholars see whether their term's average meets it.")
  }

  // ---- Admin actions ----
  const createStaffAccount = ({ email, name, role, region }) => {
    setData((prev) => ({
      ...prev,
      staffAccounts: [
        ...prev.staffAccounts,
        {
          email,
          name,
          role,
          region: role === 'Central Office' ? 'Every region' : region,
          signedIn: false,
        },
      ],
    }))
    showToast('The staff account is created.')
  }

  const createRegion = ({ code, name, office, address, runBy, inUseFrom, until }) => {
    setData((prev) => ({
      ...prev,
      regions: [
        ...prev.regions,
        {
          code: code.toUpperCase(),
          name,
          office,
          address,
          runBy,
          inUseFrom,
          until,
          inUse: true,
        },
      ],
    }))
    showToast('The region is saved.')
  }

  return (
    <StoreContext.Provider
      value={{
        data,
        session,
        activeRole,
        theme,
        toggleTheme,
        route,
        resetTick,
        showToast,
        navigate,
        signInAsRole,
        signOut,
        setPortalPreview,
        resetDemo,
        submitFiling,
        claimFiling,
        releaseClaim,
        verifyFiling,
        returnFiling,
        addTerm,
        saveRequirementNames,
        savePortalSettings,
        matchRemittance,
        disputeRemittance,
        creditRemittanceScholars,
        saveTermSetup,
        startNewBatch,
        updateBatch,
        sendBatchToCentral,
        takeOffBatchScholar,
        addScholarToBatch,
        recordNewRemittance,
        resendDisputedRemittance,
        submitProposal,
        createSchool,
        addScholarAccount,
        addCoordinatorAccount,
        recordTransfer,
        removeBatchScholarCentral,
        approveBatchCentral,
        returnBatchCentral,
        releaseBatchCentral,
        saveBenefit,
        addBenefitRule,
        changeScholarBenefit,
        approveProposal,
        rejectProposal,
        saveThresholds,
        createStaffAccount,
        createRegion,
      }}
    >
      {children}
    </StoreContext.Provider>
  )
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used inside StoreProvider')
  return ctx
}
