/**
 * Browser smoke test against the built static export.
 *
 * The jsdom suite covers the wiring, but two shipped code paths cannot run
 * there at all:
 *
 *   - the worker. jsdom has no Worker, so those tests only ever exercised
 *     useDiff's synchronous fallback. The worker path had never executed
 *     anywhere until this script.
 *   - the painting. A canvas in jsdom is a stub, so "the lattice renders" was
 *     asserted by counting draw calls, never by looking at pixels.
 *
 * This runs the real export, under the production basePath, in real Chrome.
 */
import { spawn } from 'node:child_process'
import { stat } from 'node:fs/promises'
import { join } from 'node:path'
import puppeteer from 'puppeteer'
import { serve, BASE_PATH } from './preview.mjs'

/**
 * Point at the deployed site with SMOKE_URL to check the real thing:
 *   SMOKE_URL=https://andifathulms.github.io/myers-visualizer pnpm test:browser
 * Otherwise the local export is built and served.
 */
const REMOTE = process.env.SMOKE_URL
const PORT = Number(process.env.PORT ?? 4323)
const base = REMOTE ?? `http://localhost:${PORT}${BASE_PATH}`
// Asset URLs in the markup are absolute paths that already carry the basePath.
const origin = new URL(base).origin

async function exists(path) {
  try {
    await stat(path)
    return true
  } catch {
    return false
  }
}

function run(cmd, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: 'inherit', shell: process.platform === 'win32' })
    child.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} exited ${code}`))))
  })
}

const checks = []
function check(name, ok, detail = '') {
  checks.push({ name, ok, detail })
  console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${name}${detail === '' ? '' : ` — ${detail}`}`)
}

if (REMOTE === undefined && !(await exists(join(process.cwd(), 'out', 'en', 'graf', 'index.html')))) {
  console.log('smoke: no export found, building…')
  await run('pnpm', ['build'])
}

const server = REMOTE === undefined ? await serve(PORT) : null
const browser = await puppeteer.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
})

try {
  const page = await browser.newPage()
  await page.setViewport({ width: 1400, height: 1100, deviceScaleFactor: 1 })

  const consoleErrors = []
  page.on('pageerror', (error) => consoleErrors.push(String(error)))
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text())
  })

  const requested = []
  const notFound = []
  page.on('request', (request) => requested.push(request.url()))
  page.on('response', (response) => {
    if (response.status() >= 400) notFound.push(`${response.status()} ${response.url()}`)
  })

  console.log(`\nsmoke — ${REMOTE ?? 'built export'} in real Chrome\n`)

  await page.goto(`${base}/en/graf/`, { waitUntil: 'networkidle0' })
  await page.waitForSelector('canvas[role="img"]')

  // The diff ran and rendered.
  await page.waitForFunction(() => document.body.textContent?.includes('@@ '), { timeout: 15_000 })
  check('diff output renders', true)

  // The worker actually ran, rather than the synchronous fallback. Its chunk
  // is a separate request, so its absence would mean the fallback carried the
  // page and the worker had still never executed.
  const workerRequest = requested.find((url) => /_next\/static\/chunks\/\d+\.[a-f0-9]+\.js$/.test(url))
  check(
    'search runs in a worker, not the fallback',
    workerRequest !== undefined,
    workerRequest === undefined ? 'no worker chunk requested' : workerRequest.split('/').pop(),
  )

  const workerAlive = await page.evaluate(() => typeof Worker !== 'undefined')
  check('Worker is available in this browser', workerAlive)

  // The canvas actually painted: count non-background pixels.
  const painted = await page.evaluate(() => {
    const canvas = document.querySelector('canvas')
    if (canvas === null) return { total: 0, ink: 0 }
    const ctx = canvas.getContext('2d')
    if (ctx === null) return { total: 0, ink: 0 }
    const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height)
    let ink = 0
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] > 8) ink++
    }
    return { total: data.length / 4, ink }
  })
  check(
    'lattice paints real pixels',
    painted.ink > 500,
    `${painted.ink} of ${painted.total} px inked`,
  )

  // Stepping changes what is on screen.
  const signature = async () =>
    page.evaluate(() => {
      const canvas = document.querySelector('canvas')
      const ctx = canvas?.getContext('2d')
      if (!canvas || !ctx) return ''
      const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height)
      let sum = 0
      for (let i = 0; i < data.length; i += 64) sum += data[i] + data[i + 3]
      return String(sum)
    })

  const before = await signature()
  await page.evaluate(() => {
    const step = document.querySelector('button[title="Step"]')
    for (let i = 0; i < 12; i++) step?.click()
  })
  await new Promise((resolve) => setTimeout(resolve, 300))
  const after = await signature()
  check('stepping repaints the lattice', before !== after)

  // The end of the timeline draws the path.
  await page.evaluate(() => document.querySelector('button[title="End"]')?.click())
  await new Promise((resolve) => setTimeout(resolve, 300))
  const atEnd = await signature()
  check('seeking to the end repaints', atEnd !== after)

  // The other pages load and render.
  await page.goto(`${base}/en/banding/`, { waitUntil: 'networkidle0' })
  await page.waitForFunction(() => document.body.textContent?.includes('Histogram'), {
    timeout: 15_000,
  })
  check('comparison page renders every algorithm', true)

  await page.goto(`${base}/en/contoh/`, { waitUntil: 'networkidle0' })
  // trailingSlash puts the hash after the slash: /en/graf/#p=…
  const presetLinks = await page.$$eval(
    'a[href*="graf/#p="]',
    (links) => links.length,
  )
  check('preset library links into the graph', presetLinks >= 8, `${presetLinks} presets`)

  // A shared preset link opens on that preset.
  await page.goto(`${base}/en/graf/#p=worst-case`, { waitUntil: 'networkidle0' })
  await page.waitForFunction(() => document.body.textContent?.includes('left 0'), { timeout: 15_000 })
  check('a shared preset link restores its input', true)

  /**
   * PRD §11: the UI never blocks, including on the worst case. This is the
   * pathological corner at the input cap — 300 × 300 with nothing in common,
   * so D = N + M = 600 and the O(D²) recording is at its largest. The search
   * runs in a worker precisely so that the main thread stays free, and rAF
   * latency is what proves it did.
   */
  const worstA = Array.from({ length: 300 }, (_, i) => `left ${i}`).join('\n')
  const worstB = Array.from({ length: 300 }, (_, i) => `right ${i}`).join('\n')
  const worstHash = `#a=${encodeURIComponent(encodeURIComponent(worstA))}&b=${encodeURIComponent(
    encodeURIComponent(worstB),
  )}&g=line`
  await page.goto(`${base}/en/graf/${worstHash}`, { waitUntil: 'networkidle0' })

  const latencies = []
  for (let i = 0; i < 8; i++) {
    const t0 = Date.now()
    await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => resolve(0))))
    latencies.push(Date.now() - t0)
    await new Promise((resolve) => setTimeout(resolve, 120))
  }
  const worstLatency = Math.max(...latencies)
  check(
    'worst case at the cap never blocks the main thread',
    worstLatency < 250,
    `max rAF latency ${worstLatency} ms`,
  )

  await page.waitForFunction(() => document.body.textContent?.includes('@@ '), { timeout: 60_000 })
  // The whole stats panel, not just its <dl>: D is now set above the list,
  // at a size that matches how much it matters. Located by its heading —
  // the section is deliberately unnamed, because naming it made a region
  // landmark that just repeated the heading.
  const worstStats = await page.evaluate(() => {
    const heading = [...document.querySelectorAll('h3')].find(
      (h) => h.textContent?.trim() === 'Stats',
    )
    return heading?.closest('section')?.innerText ?? ''
  })
  check(
    'worst case reports D = 600 and the O(D²) recording',
    worstStats.includes('600') && worstStats.includes('362404'),
    worstStats.replace(/\n/g, ' ').slice(0, 90),
  )

  /**
   * PRD §11: fully offline after first load. Browser HTTP caching alone does
   * not give this — a reload with no network fails without a worker. So the
   * check is the real one: load, let the worker install, cut the network, and
   * reload.
   */
  await page.goto(`${base}/en/graf/`, { waitUntil: 'networkidle0' })
  const registered = await page.evaluate(async () => {
    if (!('serviceWorker' in navigator)) return false
    const registration = await navigator.serviceWorker.ready
    return registration.active !== null
  })
  check('service worker installs', registered)

  // Give the precache a moment to finish before pulling the plug.
  await page.evaluate(() => new Promise((resolve) => setTimeout(resolve, 1500)))

  await page.setOfflineMode(true)
  try {
    await page.reload({ waitUntil: 'domcontentloaded' })
    await page.waitForFunction(() => document.body.textContent?.includes('@@ '), {
      timeout: 20_000,
    })
    const offlinePixels = await page.evaluate(() => {
      const canvas = document.querySelector('canvas')
      const ctx = canvas?.getContext('2d')
      if (!canvas || !ctx) return 0
      const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height)
      let ink = 0
      for (let i = 0; i < data.length; i += 4) if (data[i + 3] > 8) ink++
      return ink
    })
    // Not just an offline shell: the search ran and the lattice drew, with no
    // network at all.
    check('works fully offline after first load', offlinePixels > 500, `${offlinePixels} px inked`)
  } catch (error) {
    check('works fully offline after first load', false, String(error).slice(0, 80))
  } finally {
    await page.setOfflineMode(false)
  }

  /**
   * The brand assets, fetched the way a browser or a crawler fetches them —
   * by the URL in the markup. Every one of these fails silently when the
   * basePath is wrong: no install prompt, a blank tab icon, an empty social
   * card. Nothing on screen ever says so.
   */
  const declared = await page.evaluate(() => ({
    manifest: document.querySelector('link[rel="manifest"]')?.getAttribute('href') ?? '',
    icon: document.querySelector('link[rel="icon"]')?.getAttribute('href') ?? '',
    // Every declared icon, because one of them is the Safari fallback: Safari
    // does not support SVG favicons, so an SVG on its own leaves the tab
    // showing whatever /favicon.ico the *domain* serves — on Pages, GitHub's.
    icons: [...document.querySelectorAll('link[rel="icon"]')].map((l) => ({
      href: l.getAttribute('href') ?? '',
      type: l.getAttribute('type') ?? '',
    })),
    apple: document.querySelector('link[rel="apple-touch-icon"]')?.getAttribute('href') ?? '',
    og: document.querySelector('meta[property="og:image"]')?.getAttribute('content') ?? '',
  }))

  // og:image is an absolute production URL, which does not exist yet when the
  // run is against a local export. Only the path is under test, so every URL
  // is resolved against whichever origin is actually being smoked.
  const resolves = async (url) => {
    if (url === '') return false
    const { pathname, search } = new URL(url, origin)
    const target = `${origin}${pathname}${search}`
    const response = await page.evaluate(async (href) => {
      const result = await fetch(href, { method: 'GET' })
      return { ok: result.ok, type: result.headers.get('content-type') ?? '' }
    }, target)
    return response.ok
  }

  check('the favicon and apple touch icon resolve', (await resolves(declared.icon)) && (await resolves(declared.apple)), `${declared.icon} · ${declared.apple}`)

  let everyIconResolves = declared.icons.length > 0
  for (const icon of declared.icons) if (!(await resolves(icon.href))) everyIconResolves = false
  check('the tab icon has a raster fallback for Safari',
    declared.icons.some((i) => i.type === 'image/svg+xml') &&
      declared.icons.some((i) => i.type === 'image/png') &&
      everyIconResolves,
    declared.icons.map((i) => i.type).join(' + '))

  const manifestOk = await resolves(declared.manifest)
  let iconsOk = false
  if (manifestOk) {
    const icons = await page.evaluate(async (href) => {
      const body = await (await fetch(href)).json()
      const results = await Promise.all(
        body.icons.map(async (icon) => (await fetch(icon.src)).ok),
      )
      return { count: body.icons.length, ok: results.every(Boolean) }
    }, `${origin}${new URL(declared.manifest, origin).pathname}`)
    iconsOk = icons.ok && icons.count >= 3
  }
  check('the manifest and its icons resolve', manifestOk && iconsOk, declared.manifest)

  check('the social card image resolves', await resolves(declared.og), declared.og)

  check('every request resolves', notFound.length === 0, notFound.join(', '))
  check('no console errors or uncaught exceptions', consoleErrors.length === 0, consoleErrors[0] ?? '')

  /**
   * Discoverability, read out of the shipped bytes rather than the component
   * tree. Every page used to emit the site's one title, the site's one
   * description and an og:url pointing at the root, with `<html lang="en">` on
   * the Indonesian pages — corrected only after hydration, which no crawler
   * and no screen reader waits for.
   */
  const head = async (path) => {
    await page.goto(`${base}${path}`, { waitUntil: 'domcontentloaded' })
    return page.evaluate(() => ({
      lang: document.documentElement.lang,
      title: document.title,
      description: document.querySelector('meta[name="description"]')?.content ?? '',
      canonical: document.querySelector('link[rel="canonical"]')?.href ?? '',
      ogUrl: document.querySelector('meta[property="og:url"]')?.content ?? '',
      alternates: [...document.querySelectorAll('link[rel="alternate"][hreflang]')].map(
        (l) => `${l.getAttribute('hreflang')}=${l.getAttribute('href')}`,
      ),
      ld: document.querySelector('script[type="application/ld+json"]')?.textContent ?? '',
    }))
  }

  const enHome = await head('/en/')
  const idHome = await head('/id/')
  const enGraf = await head('/en/graf/')

  check('the Indonesian pages declare Indonesian', idHome.lang === 'id' && enHome.lang === 'en',
    `en=${enHome.lang} id=${idHome.lang}`)
  check('each route has its own title', enGraf.title !== enHome.title, enGraf.title)
  check('each locale has its own description', enHome.description !== idHome.description,
    idHome.description.slice(0, 48))
  check('each page canonicalises to itself',
    enGraf.canonical.endsWith('/en/graf/') && idHome.canonical.endsWith('/id/'), enGraf.canonical)
  check('og:url points at the page, not the site root',
    enGraf.ogUrl.endsWith('/en/graf/'), enGraf.ogUrl)
  check('hreflang covers both locales and a default',
    enGraf.alternates.length === 3 && enGraf.alternates.some((a) => a.startsWith('x-default=')),
    enGraf.alternates.join(' '))
  check('the home page carries valid structured data',
    (() => { try { return JSON.parse(enHome.ld)['@type'] === 'WebApplication' } catch { return false } })(),
    enHome.ld.slice(0, 40))

  const robots = await fetch(`${base}/robots.txt`).then((r) => (r.ok ? r.text() : ''))
  check('robots.txt points at the sitemap', robots.includes('Sitemap:'), robots.split('\n')[0])
  const sitemap = await fetch(`${base}/sitemap.xml`).then((r) => (r.ok ? r.text() : ''))
  const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1])
  check('the sitemap lists every route in every locale', locs.length === 8, `${locs.length} URLs`)
  check('the sitemap omits the benchmark harness', !sitemap.includes('/bench'), '')

  const failed = checks.filter((entry) => !entry.ok)
  console.log(`\n  ${checks.length - failed.length}/${checks.length} passed\n`)
  if (failed.length > 0) process.exitCode = 1
} finally {
  await browser.close()
  server?.close()
}
