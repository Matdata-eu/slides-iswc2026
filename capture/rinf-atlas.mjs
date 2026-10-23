// Records a short looping video of RINF Atlas for the deck.
// Usage: node capture/rinf-atlas.mjs  ->  public/assets/rinf-atlas.webm + rinf-atlas.png
import { chromium } from 'playwright-chromium'
import { mkdirSync, renameSync, rmSync } from 'node:fs'

const out = 'capture/out'
mkdirSync(out, { recursive: true })
const size = { width: 1600, height: 900 }
const base = 'https://rinf-atlas.matdata.eu/#env=prod&map='

const browser = await chromium.launch()
const context = await browser.newContext({ viewport: size, colorScheme: 'light', recordVideo: { dir: out, size } })
const page = await context.newPage()
const wait = ms => page.waitForTimeout(ms)

await page.goto(base + '3.6/50.5/10')
await wait(6000)
// Zoom from Europe into Norway, then down to micro level around Oslo S
for (const view of ['4.6/60.5/10', '7/59.95/10.75', '10/59.912/10.752', '13/59.9105/10.7525', '15/59.9105/10.7535']) {
  await page.evaluate(v => { location.hash = 'env=prod&map=' + v }, view)
  await wait(3500)
}
await page.screenshot({ path: 'public/assets/rinf-atlas.png' })
await wait(1500)

const video = page.video()
await context.close()
await browser.close()
renameSync(await video.path(), 'public/assets/rinf-atlas.webm')
rmSync(out, { recursive: true, force: true })
