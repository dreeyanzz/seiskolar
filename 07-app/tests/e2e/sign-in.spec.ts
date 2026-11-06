// Swimlane 01, step by step, in a real browser, on a phone, a tablet and a desktop.
import { expect, test } from '@playwright/test'
import { CITU, CONSOLE, DEMO_PASSWORD, expectSoundScreen, signIn } from './helpers'

const band = (page: import('@playwright/test').Page) =>
  page.locator('.alone-band').evaluate((el) => getComputedStyle(el).backgroundColor)

test.describe('S01.1 and S01.2: the address picks the portal', () => {
  test('the DOST console address opens the console, in navy', async ({ page }) => {
    await page.goto(CONSOLE)
    await expect(page).toHaveURL(`${CONSOLE}/sign-in`)
    await expect(page.getByText('DOST console')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible()
    expect(await band(page)).toBe('rgb(22, 54, 92)')
    await expectSoundScreen(page)
  })

  test("a school's subdomain opens its portal, in its colours", async ({ page }) => {
    await page.goto(CITU)
    await expect(page).toHaveURL(`${CITU}/sign-in`)
    await expect(
      page.getByText('Cebu Institute of Technology – University'),
    ).toBeVisible()
    await expect(page.getByText('Scholar portal · SEIskolar')).toBeVisible()
    expect(await band(page)).toBe('rgb(128, 0, 0)')
    await expectSoundScreen(page)
  })

  test('the path form opens the same portal, for addresses with no subdomain', async ({
    page,
  }) => {
    await page.goto(`${CONSOLE}/s/citu/sign-in`)
    await expect(
      page.getByText('Cebu Institute of Technology – University'),
    ).toBeVisible()
    await expect(
      page.getByRole('link', { name: 'Activate your account' }),
    ).toHaveAttribute('href', '/s/citu/activate')
  })

  test('a reserved word is the console, not a school (FR-IAM-002)', async ({ page }) => {
    await page.goto(`http://admin.localhost:3100/sign-in`)
    await expect(page.getByText('DOST console')).toBeVisible()
  })

  test('a school with a light colour stays readable (FR-ADM-003, NFR-ACC-001)', async ({
    page,
  }) => {
    await page.goto(`${CONSOLE}/s/siit/sign-in`)
    await expect(page.getByText('San Isidro Institute of Technology')).toBeVisible()
    await expectSoundScreen(page)
  })

  test("the school's name stays on the band on a very tall screen", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1800 })
    await page.goto(CITU)
    const brand = await page.locator('.alone-brand').boundingBox()
    const band = await page.locator('.alone-band').boundingBox()
    const card = await page.locator('section.card').boundingBox()
    expect(brand!.y + brand!.height).toBeLessThanOrEqual(band!.y + band!.height)
    // The card overlaps the band by the same amount at every height (app/globals.css).
    expect(band!.y + band!.height - card!.y).toBeCloseTo(22, 0)
  })

  test('an address no school has shows nothing, and says nothing about why', async ({
    page,
  }) => {
    const response = await page.goto('http://nosuch.localhost:3100/')
    expect(response?.status()).toBe(404)
    await expect(
      page.getByRole('heading', { name: 'Nothing to show here' }),
    ).toBeVisible()
    await expectSoundScreen(page)
  })
})

test.describe('S01.3 and S01.4: email and password', () => {
  test('a wrong password says so, keeps the email and clears the password', async ({
    page,
  }) => {
    await page.goto(CITU)
    await signIn(page, 'bea.santiago@example.test', 'not-the-password')

    await expect(page.locator('main').getByRole('alert')).toHaveText(
      'Wrong email or password.',
    )
    await expect(page.getByLabel('Email')).toHaveValue('bea.santiago@example.test')
    await expect(page.getByLabel('Password', { exact: true })).toHaveValue('')
    await expect(page.getByLabel('Password', { exact: true })).toBeFocused()
    await expect(page).toHaveURL(`${CITU}/sign-in`)
    await expectSoundScreen(page)
  })

  test('an unknown email gets the very same answer', async ({ page }) => {
    await page.goto(CITU)
    await signIn(page, 'nobody@example.test')
    await expect(page.locator('main').getByRole('alert')).toHaveText(
      'Wrong email or password.',
    )
  })

  test('an account not activated yet gets the same answer too', async ({ page }) => {
    await page.goto(CITU)
    await signIn(page, 'ella.ramos@example.test')
    await expect(page.locator('main').getByRole('alert')).toHaveText(
      'Wrong email or password.',
    )
  })

  test('an empty form points at each field, and focuses the first', async ({ page }) => {
    await page.goto(CITU)
    await page.getByRole('button', { name: 'Sign in' }).click()

    const email = page.getByLabel('Email')
    await expect(page.getByText('Enter your email.')).toBeVisible()
    await expect(page.getByText('Enter your password.')).toBeVisible()
    await expect(email).toHaveAttribute('aria-invalid', 'true')
    await expect(email).toHaveAttribute('aria-describedby', 'email-error')
    await expect(email).toBeFocused()
    await expectSoundScreen(page)
  })

  test('an email that is not one says what to fix', async ({ page }) => {
    await page.goto(CITU)
    await signIn(page, 'bea')
    await expect(page.getByText("doesn't look like an email")).toBeVisible()
  })

  test('the password can be shown and hidden', async ({ page }) => {
    await page.goto(CITU)
    const password = page.getByLabel('Password', { exact: true })
    const toggle = page.getByRole('button', { name: 'Show password' })

    await password.fill('secret')
    await expect(password).toHaveAttribute('type', 'password')
    await toggle.click()
    await expect(password).toHaveAttribute('type', 'text')
    await expect(toggle).toHaveAttribute('aria-pressed', 'true')
    await toggle.click()
    await expect(password).toHaveAttribute('type', 'password')
  })

  test('the keyboard walks the form in order', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'phone', 'A phone has no Tab key.')
    await page.goto(CITU)
    await page.getByLabel('Email').focus()
    await page.keyboard.press('Tab')
    await expect(page.getByLabel('Password', { exact: true })).toBeFocused()
    await page.keyboard.press('Tab')
    await expect(page.getByRole('button', { name: 'Show password' })).toBeFocused()
    await page.keyboard.press('Tab')
    await expect(page.getByRole('button', { name: 'Sign in' })).toBeFocused()
    await page.keyboard.press('Tab')
    await expect(page.getByRole('link', { name: 'Activate your account' })).toBeFocused()
  })

  test('the demo panel fills the form, and starts closed', async ({ page }) => {
    await page.goto(CITU)
    await expect(page.getByRole('button', { name: /Bea Santiago/ })).toBeHidden()
    await page.getByText('Demo accounts').click()
    await page.getByRole('button', { name: /Bea Santiago/ }).click()
    await expect(page.getByLabel('Email')).toHaveValue('bea.santiago@example.test')
    await expect(page.getByLabel('Password', { exact: true })).toHaveValue(DEMO_PASSWORD)
    await expect(page.getByRole('button', { name: 'Sign in' })).toBeFocused()
    await expectSoundScreen(page)
  })
})

test.describe("S01.5 to S01.8: the session, and each role's home", () => {
  test("a scholar lands on their school's home, with their scope", async ({ page }) => {
    await page.goto(CITU)
    await signIn(page, 'bea.santiago@example.test')

    await expect(page).toHaveURL(`${CITU}/`)
    await expect(page.getByRole('heading', { name: "You're signed in" })).toBeVisible()
    const session = page.locator('.facts')
    await expect(session).toContainText('Bea Santiago')
    await expect(session).toContainText('Scholar')
    await expect(session).toContainText('DOST-VII Regional Office')
    await expect(session).toContainText('Cebu Institute of Technology')
    await expectSoundScreen(page)
  })

  test('a school coordinator lands on their school too', async ({ page }) => {
    await page.goto(CITU)
    await signIn(page, 'ruel.mendoza@example.test')
    await expect(page.locator('.facts')).toContainText('School Coordinator')
  })

  for (const [email, role, office] of [
    ['ana.villareal@example.test', 'Regional Office', 'DOST-VII Regional Office'],
    ['paolo.reyes@example.test', 'Central Office', 'DOST-SEI Central Office'],
    ['lara.domingo@example.test', 'System administrator', 'System administration'],
  ] as const) {
    test(`${role} staff land on the DOST console`, async ({ page }) => {
      await page.goto(CONSOLE)
      await signIn(page, email)
      await expect(page).toHaveURL(`${CONSOLE}/console`)
      await expect(page.locator('.facts')).toContainText(role)
      await expect(page.locator('.brand-sub')).toHaveText(office)
      await expectSoundScreen(page)
    })
  }

  test('a scholar who signs in at the console address still reaches their school', async ({
    page,
  }) => {
    await page.goto(CONSOLE)
    await signIn(page, 'bea.santiago@example.test')
    await expect(page).toHaveURL(`${CONSOLE}/s/citu`)
    await expect(page.getByRole('heading', { name: "You're signed in" })).toBeVisible()
  })

  test("DOST staff who sign in at a school's address reach the console", async ({
    page,
  }) => {
    await page.goto(CITU)
    await signIn(page, 'ana.villareal@example.test')
    await expect(page).toHaveURL(`${CITU}/console`)
  })

  for (const email of ['noel.abad@example.test', 'rico.sarmiento@example.test']) {
    test(`${email} signs in with no scope, and sees nothing (S01.6)`, async ({
      page,
    }) => {
      await page.goto(CITU)
      await signIn(page, email)
      await expect(page).toHaveURL(`${CITU}/no-access`)
      await expect(
        page.getByRole('heading', { name: "Your account isn't ready yet" }),
      ).toBeVisible()
      await expect(page.getByText(`Signed in as ${email}`)).toBeVisible()
      await expectSoundScreen(page)

      // Every other address shows nothing either.
      await page.goto(`${CITU}/console`)
      await expect(page).toHaveURL(`${CITU}/no-access`)

      await page.getByRole('button', { name: 'Sign out' }).click()
      await expect(page).toHaveURL(`${CITU}/sign-in`)
    })
  }

  test('signing out ends the session', async ({ page }) => {
    await page.goto(CITU)
    await signIn(page, 'bea.santiago@example.test')
    await expect(page).toHaveURL(`${CITU}/`)

    await page.getByRole('button', { name: 'Sign out' }).click()
    await expect(page).toHaveURL(`${CITU}/sign-in`)
    await page.goto(CITU)
    await expect(page).toHaveURL(`${CITU}/sign-in`)
  })

  test('a post from another site cannot sign someone out', async ({ page }) => {
    // On the console's address, because only browsers can resolve citu.localhost.
    await page.goto(CONSOLE)
    await signIn(page, 'ana.villareal@example.test')
    await expect(page).toHaveURL(`${CONSOLE}/console`)

    const response = await page.request.post(`${CONSOLE}/sign-out`, {
      headers: { origin: 'https://elsewhere.example.test' },
      maxRedirects: 0,
    })
    expect(response.status()).toBe(403)

    await page.goto(`${CONSOLE}/console`)
    await expect(page.getByRole('heading', { name: "You're signed in" })).toBeVisible()
  })

  test('someone already signed in skips the sign-in screen', async ({ page }) => {
    await page.goto(CITU)
    await signIn(page, 'bea.santiago@example.test')
    await expect(page).toHaveURL(`${CITU}/`)
    await page.goto(`${CITU}/sign-in`)
    await expect(page).toHaveURL(`${CITU}/`)
  })

  test('signing in works with JavaScript off', async ({ browser }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'One device is enough for this.')
    const context = await browser.newContext({ javaScriptEnabled: false })
    const page = await context.newPage()

    await page.goto(`${CITU}/sign-in`)
    await signIn(page, 'bea.santiago@example.test', 'not-the-password')
    await expect(page.locator('main').getByRole('alert')).toHaveText(
      'Wrong email or password.',
    )
    await expect(page.getByLabel('Email')).toHaveValue('bea.santiago@example.test')

    await signIn(page, 'bea.santiago@example.test')
    await expect(page.getByRole('heading', { name: "You're signed in" })).toBeVisible()
    await context.close()
  })
})

test.describe('S01.9 to S01.12: nothing outside the scope', () => {
  test("a scholar opening another school's portal gets nothing back", async ({
    page,
  }) => {
    await page.goto(CITU)
    await signIn(page, 'bea.santiago@example.test')
    await expect(page).toHaveURL(`${CITU}/`)

    const response = await page.goto(`${CITU}/s/lsc`)
    expect(response?.status()).toBe(404)
    await expect(
      page.getByRole('heading', { name: 'Nothing to show here' }),
    ).toBeVisible()
    await expect(page.locator('.topbar')).toContainText('Lapu Science College')
    await expect(page.locator('main')).not.toContainText('Marites')
    await expectSoundScreen(page)

    await page.getByRole('link', { name: 'Back to Home' }).click()
    await expect(page.getByRole('heading', { name: "You're signed in" })).toBeVisible()
  })

  test('a scholar opening the DOST console gets nothing back', async ({ page }) => {
    await page.goto(CITU)
    await signIn(page, 'bea.santiago@example.test')
    await expect(page).toHaveURL(`${CITU}/`)

    const response = await page.goto(`${CITU}/console`)
    expect(response?.status()).toBe(404)
    await expect(
      page.getByRole('heading', { name: 'Nothing to show here' }),
    ).toBeVisible()
  })

  test("DOST staff opening a school's portal home get nothing back", async ({ page }) => {
    await page.goto(CONSOLE)
    await signIn(page, 'ana.villareal@example.test')
    await expect(page).toHaveURL(`${CONSOLE}/console`)

    const response = await page.goto(`${CONSOLE}/s/citu`)
    expect(response?.status()).toBe(404)
  })

  test('a record that does not exist looks exactly the same', async ({ page }) => {
    await page.goto(CITU)
    await signIn(page, 'bea.santiago@example.test')
    await expect(page).toHaveURL(`${CITU}/`)

    const response = await page.goto(`${CITU}/records/does-not-exist`)
    expect(response?.status()).toBe(404)
    await expect(
      page.getByRole('heading', { name: 'Nothing to show here' }),
    ).toBeVisible()
  })

  test('signed out, a protected address opens sign-in', async ({ page }) => {
    await page.goto(`${CONSOLE}/console`)
    await expect(page).toHaveURL(`${CONSOLE}/sign-in`)
    await page.goto(`${CONSOLE}/no-access`)
    await expect(page).toHaveURL(`${CONSOLE}/sign-in`)
  })

  test('an edited session cookie counts as no session at all', async ({
    page,
    context,
  }) => {
    await page.goto(CITU)
    await signIn(page, 'bea.santiago@example.test')
    await expect(page).toHaveURL(`${CITU}/`)

    const cookies = await context.cookies()
    const session = cookies.find((cookie) => cookie.name === 'seiskolar-session')!
    expect(session.httpOnly).toBe(true)
    expect(session.sameSite).toBe('Lax')

    const [payload, signature] = session.value.split('.') as [string, string]
    const claims = JSON.parse(Buffer.from(payload, 'base64url').toString())
    const forged = Buffer.from(
      JSON.stringify({ ...claims, user_role: 'admin' }),
    ).toString('base64url')
    await context.addCookies([{ ...session, value: `${forged}.${signature}` }])

    await page.goto(`${CITU}/console`)
    await expect(page).toHaveURL(`${CITU}/sign-in`)
  })
})
