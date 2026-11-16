import React from 'react'
import { StoreProvider, useStore } from './context/StoreContext.jsx'
import { ALL_SCREENS } from './data/initialState.js'
import { AppShell } from './components/AppShell.tsx'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import {
  SignInScreen,
  NoAccessScreen,
  NothingFoundScreen,
} from './screens/PublicScreens.tsx'
import {
  ScholarDashboard,
  ScholarRequirement,
  ScholarStatus,
} from './screens/ScholarScreens.tsx'
import {
  CoordinatorHome,
  CoordinatorTerms,
  CoordinatorRequirementNames,
  CoordinatorRemittances,
  CoordinatorPortalSettings,
} from './screens/CoordinatorScreens.tsx'
import {
  RegionalHome,
  RegionalTermSetup,
  RegionalQueue,
  RegionalReview,
  RecordHistory,
} from './screens/RegionalOpsScreens.tsx'
import {
  RegionalReleaseBatch,
  RegionalRemittance,
  RegionalBenefitProposal,
  RegionalSchools,
  RegionalAccounts,
  RegionalTransfer,
} from './screens/RegionalAdminScreens.tsx'
import {
  CentralBatches,
  CentralBatch,
  CentralBenefits,
  CentralProposals,
  CentralThresholds,
} from './screens/CentralScreens.tsx'
import { AdminStaffAccounts, AdminRegions } from './screens/AdminScreens.tsx'

const SCREEN_MAP = {
  'scholar-dashboard': { comp: ScholarDashboard, nav: 'scholar-dashboard' },
  'scholar-requirement': {
    comp: ScholarRequirement,
    nav: 'scholar-dashboard',
  },
  'scholar-status': { comp: ScholarStatus, nav: 'scholar-status' },
  'coordinator-home': { comp: CoordinatorHome, nav: 'coordinator-home' },
  'coordinator-terms': { comp: CoordinatorTerms, nav: 'coordinator-terms' },
  'coordinator-requirement-names': {
    comp: CoordinatorRequirementNames,
    nav: 'coordinator-requirement-names',
  },
  'coordinator-remittances': {
    comp: CoordinatorRemittances,
    nav: 'coordinator-remittances',
  },
  'coordinator-portal-settings': {
    comp: CoordinatorPortalSettings,
    nav: 'coordinator-portal-settings',
  },
  'regional-home': { comp: RegionalHome, nav: 'regional-home' },
  'regional-term-setup': {
    comp: RegionalTermSetup,
    nav: 'regional-term-setup',
  },
  'regional-queue': { comp: RegionalQueue, nav: 'regional-queue' },
  'regional-review': { comp: RegionalReview, nav: 'regional-queue' },
  'record-history': { comp: RecordHistory, nav: 'regional-queue' },
  'regional-release-batch': {
    comp: RegionalReleaseBatch,
    nav: 'regional-release-batch',
  },
  'regional-remittance': {
    comp: RegionalRemittance,
    nav: 'regional-remittance',
  },
  'regional-benefit-proposal': {
    comp: RegionalBenefitProposal,
    nav: 'regional-benefit-proposal',
  },
  'regional-schools': { comp: RegionalSchools, nav: 'regional-schools' },
  'regional-accounts': { comp: RegionalAccounts, nav: 'regional-accounts' },
  'regional-transfer': { comp: RegionalTransfer, nav: 'regional-transfer' },
  'central-batches': { comp: CentralBatches, nav: 'central-batches' },
  'central-batch': { comp: CentralBatch, nav: 'central-batches' },
  'central-benefits': { comp: CentralBenefits, nav: 'central-benefits' },
  'central-proposals': { comp: CentralProposals, nav: 'central-proposals' },
  'central-thresholds': { comp: CentralThresholds, nav: 'central-thresholds' },
  'admin-staff-accounts': {
    comp: AdminStaffAccounts,
    nav: 'admin-staff-accounts',
  },
  'admin-regions': { comp: AdminRegions, nav: 'admin-regions' },
}

function RouterView() {
  const { activeRole, session, theme, route, resetTick } = useStore()
  const screenId = route.screen
  const routeKey = `${resetTick}-${screenId}-${route.params.req || ''}-${route.params.filingId || ''}-${route.params.batchId || ''}-${route.params.tab || ''}`

  let content = null

  if (screenId === 'sign-in') {
    content = <SignInScreen />
  } else if (screenId === 'no-access' || session.roleId === 'unassigned') {
    content = <NoAccessScreen />
  } else if (!activeRole) {
    content = <SignInScreen />
  } else if (screenId === 'nothing-found') {
    content = (
      <AppShell activeNav={activeRole.homeScreen}>
        <NothingFoundScreen />
      </AppShell>
    )
  } else {
    const meta = ALL_SCREENS.find((s) => s.id === screenId)
    const entry = SCREEN_MAP[screenId]
    const allowed =
      meta &&
      entry &&
      (meta.role === 'any' ||
        meta.role === activeRole.id ||
        (screenId === 'record-history' && activeRole.id === 'central'))

    if (!allowed) {
      content = (
        <AppShell activeNav={activeRole.homeScreen}>
          <NothingFoundScreen />
        </AppShell>
      )
    } else {
      const ScreenComp = entry.comp
      content = (
        <AppShell activeNav={entry.nav}>
          <ScreenComp key={routeKey} />
        </AppShell>
      )
    }
  }

  return (
    <>
      {content}
      <Toaster theme={theme} position="bottom-right" />
    </>
  )
}

export default function App() {
  return (
    <TooltipProvider>
      <StoreProvider>
        <RouterView />
      </StoreProvider>
    </TooltipProvider>
  )
}
