// Records short looping videos of the DIM web portal for the deck.
// Opens a visible browser window; sign in once, then the tours run by themselves.
// Usage: node capture/dim-portal.mjs [base-url]
//   -> public/assets/dim-data.webm|png, dim-tools.webm|png, dim-api.png
import { chromium } from 'playwright-chromium'
import { mkdirSync, renameSync, rmSync } from 'node:fs'

const base = process.argv[2] ?? 'https://dim-dev.review.apps.banenor.no'
const out = 'capture/out'
const profile = 'capture/.profile'
const size = { width: 1600, height: 900 }
mkdirSync(out, { recursive: true })

const context = await chromium.launchPersistentContext(profile, {
  headless: false,
  viewport: size,
  colorScheme: 'light',
  recordVideo: { dir: out, size },
})

// Sign in: wait until a protected page renders on the portal itself
const login = context.pages()[0] ?? await context.newPage()
await login.goto(base + '/key-figures')
// The SPA loads first and only then redirects to the identity provider
const redirected = await login.waitForURL(u => !u.href.startsWith(base), { timeout: 20_000 }).then(() => true, () => false)
if (redirected) {
  console.log('Sign in in the browser window...')
  await login.waitForURL(u => u.href.startsWith(base) && !u.pathname.startsWith('/oauth2'), { timeout: 3_600_000 })
}
await login.waitForLoadState('networkidle')
await login.close()

async function tour(name, steps) {
  const page = await context.newPage()
  const wait = ms => page.waitForTimeout(ms)
  for (const [i, step] of steps.entries()) {
    await page.goto(base + step.path)
    await page.waitForLoadState('networkidle').catch(() => {})
    await wait(step.settle ?? 2500)
    if (step.act) { await step.act(page); await wait(4000) }
    if (i === 0) await page.screenshot({ path: `public/assets/${name}.png` })
    for (let s = 0; s < (step.scroll ?? 0); s++) {
      await page.mouse.move(size.width / 2, size.height / 2)
      await page.mouse.wheel(0, 300)
      await wait(700)
    }
    await wait(1500)
  }
  const video = page.video()
  await page.close()
  renameSync(await video.path(), `public/assets/${name}.webm`)
}

await tour('dim-data', [
  { path: '/files', scroll: 3 },
  { path: '/datasets', scroll: 3 },
  { path: '/key-figures', scroll: 4 },
  { path: '/map/tps-mapping', settle: 9000 },
])

await tour('dim-tools', [
  {
    path: '/search',
    settle: 5000,
    scroll: 4,
    // Load the first example query and run it, so the results table shows
    act: async page => {
      await page.selectOption('#search-example', { index: 1 })
      await page.waitForTimeout(3000)
      await page.locator('.submitSection button, sparnatural-submit button, [class*="submit"] button, button[class*="submit"]').first().click({ timeout: 5000 }).catch(() => {})
    },
  },
  { path: '/catalog', scroll: 3 },
])

const api = await context.newPage()
await api.goto(base + '/swagger')
await api.waitForLoadState('networkidle').catch(() => {})
await api.waitForTimeout(3000)
await api.screenshot({ path: 'public/assets/dim-api.png' })
await api.close()

await context.close()
rmSync(out, { recursive: true, force: true })
