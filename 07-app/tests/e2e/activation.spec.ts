// The sign-up path: activating an account DOST already made. Assumed; see
// components/screens/activate.tsx. Each device activates a different account, because the
// server remembers an activation until it restarts.
import { expect, test } from '@playwright/test'
import { CITU, CONSOLE, expectSoundScreen, signIn } from './helpers'

const JOURNEYS = {
  phone: {
    start: CITU,
    email: 'ella.ramos@example.test',
    role: 'Scholar',
    home: `${CITU}/`,
  },
  tablet: {
    start: `${CONSOLE}/s/lpc`,
    email: 'mark.villanueva@example.test',
    role: 'School Coordinator',
    home: `${CONSOLE}/s/lpc`,
  },
  desktop: {
    start: CONSOLE,
    email: 'mia.cortez@example.test',
    role: 'Central Office',
    home: `${CONSOLE}/console`,
  },
} as const

test('someone DOST registered activates their account, then can sign in', async ({
  page,
}, testInfo) => {
  const journey = JOURNEYS[testInfo.project.name as keyof typeof JOURNEYS]
  await page.goto(journey.start)
  await page.getByRole('link', { name: 'Activate your account' }).click()
  await expect(page.getByRole('heading', { name: 'Activate your account' })).toBeVisible()
  await expectSoundScreen(page)

  await page.getByLabel('Email').fill(journey.email)
  await page.getByRole('button', { name: 'Send the link' }).click()
  const heading = page.getByRole('heading', { name: 'Check your email' })
  await expect(heading).toBeVisible()
  await expect(heading).toBeFocused()
  await expect(page.getByText(journey.email)).toBeVisible()
  await expectSoundScreen(page)

  await page.getByRole('link', { name: 'Open the link' }).click()
  await expect(page.getByRole('heading', { name: 'Set your password' })).toBeVisible()
  await expect(page.getByText(journey.email)).toBeVisible()
  await expectSoundScreen(page)
  const linkAddress = page.url()

  // Too short: it says so, and the link still works.
  await page.getByLabel('New password', { exact: true }).fill('short')
  await page.getByRole('button', { name: 'Save and sign in' }).click()
  await expect(page.getByText('Use at least 8 characters.')).toBeVisible()
  await expect(page.getByLabel('New password', { exact: true })).toBeFocused()
  await expectSoundScreen(page)

  await page.getByLabel('New password', { exact: true }).fill('a-new-demo-password')
  await page.getByRole('button', { name: 'Save and sign in' }).click()
  await expect(page).toHaveURL(journey.home)
  await expect(page.locator('.facts')).toContainText(journey.role)

  // The link has been used.
  await page.getByRole('button', { name: 'Sign out' }).click()
  await page.goto(linkAddress)
  await expect(
    page.getByRole('heading', { name: 'This link no longer works' }),
  ).toBeVisible()
  await expectSoundScreen(page)

  // The new password works, and the account no longer needs activating.
  await page.goto(journey.start)
  await signIn(page, journey.email, 'a-new-demo-password')
  await expect(page).toHaveURL(journey.home)
})

test('the answer reads the same for an address nobody registered', async ({ page }) => {
  await page.goto(`${CITU}/activate`)
  await page.getByLabel('Email').fill('nobody@example.test')
  await page.getByRole('button', { name: 'Send the link' }).click()

  await expect(page.getByRole('heading', { name: 'Check your email' })).toBeVisible()
  await expect(page.locator('section.card')).toContainText(
    'If DOST has registered nobody@example.test, a link to set your password is on its way.',
  )
  await expect(page.getByRole('link', { name: 'Open the link' })).toBeHidden()
  // Only the panel that exists while the data is mock says why no link came.
  await expect(page.getByText('no account has this address')).toBeVisible()
})

test('an account with a password gets no link', async ({ page }) => {
  await page.goto(`${CITU}/activate`)
  await page.getByLabel('Email').fill('bea.santiago@example.test')
  await page.getByRole('button', { name: 'Send the link' }).click()
  await expect(page.getByText('this account already has a password')).toBeVisible()
})

test('an empty or malformed email says what to fix', async ({ page }) => {
  await page.goto(`${CITU}/activate`)
  await page.getByRole('button', { name: 'Send the link' }).click()
  await expect(page.getByText('Enter your email.')).toBeVisible()
  await expect(page.getByLabel('Email')).toBeFocused()

  await page.getByLabel('Email').fill('ella')
  await page.getByRole('button', { name: 'Send the link' }).click()
  await expect(page.getByText("doesn't look like an email")).toBeVisible()
  await expect(page.getByLabel('Email')).toHaveValue('ella')
  await expectSoundScreen(page)
})

test('a made-up link, or none at all, offers a new one', async ({ page }) => {
  for (const address of ['?token=made-up', '']) {
    await page.goto(`${CITU}/activate/set-password${address}`)
    await expect(
      page.getByRole('heading', { name: 'This link no longer works' }),
    ).toBeVisible()
  }
  await page.getByRole('link', { name: 'Ask for a new link' }).click()
  await expect(page).toHaveURL(`${CITU}/activate`)
})

test('someone signed in skips activation', async ({ page }) => {
  await page.goto(CITU)
  await signIn(page, 'bea.santiago@example.test')
  await expect(page).toHaveURL(`${CITU}/`)
  await page.goto(`${CITU}/activate`)
  await expect(page).toHaveURL(`${CITU}/`)
})
