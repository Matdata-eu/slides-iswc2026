// Records short looping videos of the DIM web portal for the deck.
// Opens a visible browser window; sign in once, then the tours run by themselves.
// Usage: node capture/dim-portal.mjs [base-url] [--only=dim-data,dim-tps,dim-tools,dim-api]
//   -> public/assets/dim-data.webm|png, dim-tps.webm|png, dim-tools.webm|png, dim-api.png
import { chromium } from 'playwright-chromium'
import { mkdirSync, renameSync, rmSync } from 'node:fs'

const args = process.argv.slice(2)
const base = args.find(a => !a.startsWith('--')) ?? 'https://dim-dev.review.apps.banenor.no'
const only = args.find(a => a.startsWith('--only='))?.slice(7).split(',')
const wanted = name => !only || only.includes(name)
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

// Playwright videos have no mouse pointer, so draw one
await context.addInitScript(() => {
  addEventListener('DOMContentLoaded', () => {
    const dot = document.createElement('div')
    dot.style.cssText = 'position:fixed;z-index:99999;width:18px;height:18px;margin:-9px 0 0 -9px;border-radius:50%;' +
      'background:rgba(255,140,0,.45);border:2px solid #ff8c00;pointer-events:none;left:-50px;top:-50px;transition:transform .1s'
    document.body.appendChild(dot)
    addEventListener('mousemove', e => { dot.style.left = e.clientX + 'px'; dot.style.top = e.clientY + 'px' }, true)
    addEventListener('mousedown', () => { dot.style.transform = 'scale(.6)' }, true)
    addEventListener('mouseup', () => { dot.style.transform = '' }, true)
  })
})

// Pixels (viewport coordinates) where a map canvas draws a mapped netelement
async function mappedPixels(page, section) {
  return page.evaluate(sel => {
    const frame = document.querySelector(`${sel} [role=application]`)
    const box = frame.getBoundingClientRect()
    const hits = []
    for (const canvas of frame.querySelectorAll('canvas')) {
      const r = canvas.getBoundingClientRect()
      const sx = canvas.width / r.width, sy = canvas.height / r.height
      let data
      try { data = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data } catch { continue }
      for (let y = 4; y < canvas.height - 4; y += 3) {
        for (let x = 4; x < canvas.width - 4; x += 3) {
          const i = (y * canvas.width + x) * 4
          // edge colour for mapped netelements: #2f6b2f
          if (Math.abs(data[i] - 47) < 30 && Math.abs(data[i + 1] - 107) < 30 && Math.abs(data[i + 2] - 47) < 30 && data[i + 3] > 200) {
            hits.push([r.left + x / sx, r.top + y / sy])
          }
        }
      }
    }
    return { hits, box: { x: box.left, y: box.top, w: box.width, h: box.height } }
  }, section)
}

// Points spread at least `gap` px apart, nearest to `target` first
function spread(hits, target, gap, n) {
  const sorted = [...hits].sort((a, b) => Math.hypot(a[0] - target[0], a[1] - target[1]) - Math.hypot(b[0] - target[0], b[1] - target[1]))
  const out = []
  for (const p of sorted) {
    if (out.every(q => Math.hypot(p[0] - q[0], p[1] - q[1]) >= gap)) out.push(p)
    if (out.length === n) break
  }
  return out
}

async function glide(page, [x, y], pause = 1200) {
  await page.mouse.move(x, y, { steps: 25 })
  await page.waitForTimeout(pause)
}

// TPS mapping: zoom in on Oslo, select a netelement, hover others so the linked maps show
async function tpsMapping(page) {
  const dim = 'section[aria-labelledby=tps-mapping-dim]'
  const tps = 'section[aria-labelledby=tps-mapping-tps]'
  await page.evaluate(sel => {
    const top = document.querySelector(sel).getBoundingClientRect().top + scrollY - 140
    scrollTo({ top, behavior: 'smooth' })
  }, dim)
  await page.waitForTimeout(2000)

  // Zoom towards the Oslo area by double-clicking empty map next to a netelement there
  let { hits, box } = await mappedPixels(page, dim)
  const oslo = [box.x + box.w * 0.42, box.y + box.h * 0.88]
  const [anchor] = spread(hits, oslo, 1, 1)
  const empty = (h, p) => h.every(q => Math.hypot(p[0] - q[0], p[1] - q[1]) > 10)
  for (let z = 0; z < 4; z++) {
    ({ hits } = await mappedPixels(page, dim))
    const near = spread(hits, anchor, 1, 1)[0] ?? anchor
    const spot = [[0, 16], [16, 0], [0, -16], [-16, 0], [20, 20]].map(([dx, dy]) => [near[0] + dx, near[1] + dy]).find(p => empty(hits, p)) ?? near
    await glide(page, spot, 400)
    await page.mouse.dblclick(spot[0], spot[1])
    await page.waitForTimeout(1500)
  }
  await page.waitForTimeout(1500)

  // Double-click a netelement near the centre: both maps zoom to its mapping
  ;({ hits, box } = await mappedPixels(page, dim))
  const [first] = spread(hits, [box.x + box.w / 2, box.y + box.h / 2], 1, 1)
  await glide(page, first, 800)
  await page.mouse.dblclick(first[0], first[1])
  await page.waitForTimeout(3500)

  // Hover different netelements: each one's counterpart lights up in the TPS schematic
  const tooltip = sel => page.evaluate(q => {
    const el = document.querySelector(`${q} [role=tooltip]`)
    return el && !el.hidden ? el.querySelector('strong')?.textContent ?? null : null
  }, sel)
  async function hoverDistinct(sel, count) {
    const { hits: h, box: b } = await mappedPixels(page, sel)
    const seen = new Set()
    let last = null
    for (const p of spread(h, [b.x + b.w / 2, b.y + b.h / 2], 45, 30)) {
      await page.mouse.move(p[0], p[1], { steps: 20 })
      await page.waitForTimeout(250)
      const id = await tooltip(sel)
      if (!id || seen.has(id)) continue
      seen.add(id)
      last = p
      await page.waitForTimeout(1800)
      if (seen.size === count) break
    }
    return last
  }
  const picked = await hoverDistinct(dim, 3)

  // Select the last one: it stays highlighted in both maps
  if (picked) {
    await page.mouse.click(picked[0], picked[1])
    await page.waitForTimeout(2500)
  }

  // And the other way round: hover in the TPS schematic
  await hoverDistinct(tps, 2)
  await page.waitForTimeout(1000)
}

async function tour(name, steps) {
  if (!wanted(name)) return
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
])

await tour('dim-tps', [
  { path: '/map/tps-mapping', settle: 9000, act: tpsMapping },
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

if (wanted('dim-api')) {
const api = await context.newPage()
await api.goto(base + '/swagger')
await api.waitForLoadState('networkidle').catch(() => {})
await api.waitForTimeout(3000)
await api.screenshot({ path: 'public/assets/dim-api.png' })
await api.close()
}

await context.close()
rmSync(out, { recursive: true, force: true })
