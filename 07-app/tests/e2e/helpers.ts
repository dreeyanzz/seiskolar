// What the browser tests share: the addresses, signing in, and the checks every screen must
// pass on every device (03-low-fidelity/README.md, 04-high-fidelity/README.md).
import AxeBuilder from '@axe-core/playwright'
import { expect, type Page } from '@playwright/test'
import { DEMO_PASSWORD } from '@/lib/mock/data'

const PORT = 3100

export const CONSOLE = `http://localhost:${PORT}`
export const CITU = `http://citu.localhost:${PORT}`

export { DEMO_PASSWORD }

export async function signIn(page: Page, email: string, password = DEMO_PASSWORD) {
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password', { exact: true }).fill(password)
  await page.getByRole('button', { name: 'Sign in' }).click()
}

/**
 * Lets entrance animations finish, so nothing is measured half faded in. An animation that
 * is cancelled, because its element went away, rejects its promise; that is fine here too.
 */
async function settle(page: Page) {
  // Next.js streams a page's title in just after the page itself.
  await expect.poll(() => page.title()).not.toBe('')
  await page.evaluate(() =>
    Promise.allSettled(document.getAnimations().map((animation) => animation.finished)),
  )
}

/**
 * The checks every screen owes on every device: nothing scrolls sideways at any width
 * (NFR-ACC-001), no WCAG 2.1 A or AA failure, and every control a full 44 px tap target.
 */
export async function expectSoundScreen(page: Page) {
  await settle(page)

  const widths = await page.evaluate(() => ({
    scroll: document.documentElement.scrollWidth,
    client: document.documentElement.clientWidth,
  }))
  expect(widths.scroll, 'scrolls sideways').toBeLessThanOrEqual(widths.client)

  const accessibility = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze()
  expect(
    accessibility.violations.map((violation) => ({
      rule: violation.id,
      nodes: violation.nodes.map((node) => node.html),
    })),
  ).toEqual([])

  const tooSmall = await page.evaluate(() =>
    [...document.querySelectorAll('a, button, input, summary')]
      .filter((element) => (element as HTMLElement).checkVisibility())
      .map((element) => {
        const box = element.getBoundingClientRect()
        return {
          control: element.textContent?.trim() || element.getAttribute('name') || '',
          width: Math.round(box.width),
          height: Math.round(box.height),
        }
      })
      .filter(({ width, height }) => width < 44 || height < 44),
  )
  expect(tooSmall, 'controls under 44 px').toEqual([])
}
