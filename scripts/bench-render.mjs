/**
 * Canvas lattice render benchmark — the M0 gate.
 *
 * "No algorithm work until a 300×300 lattice animates at 60fps." That claim
 * has to be measured in a real browser, so this builds the export, serves it
 * under the production basePath, drives the spike page in headless Chrome and
 * reads the reported numbers back.
 *
 * Honest reading of the result: headless Chrome rasterises canvas in software
 * (SwiftShader), with no GPU compositing. That makes it a *conservative*
 * proxy — a real machine with GPU-accelerated canvas should do no worse. The
 * gate is on draw p95, the CPU time the renderer actually controls; frame
 * interval depends on the host's refresh rate and compositor and is reported
 * but not gated.
 *
 * Exits non-zero if the budget is blown, so CI can enforce it.
 */
import { spawn } from 'node:child_process'
import { stat } from 'node:fs/promises'
import { join } from 'node:path'
import puppeteer from 'puppeteer'
import { serve, BASE_PATH } from './preview.mjs'

const PORT = Number(process.env.PORT ?? 4322)
const URL_PATH = `${BASE_PATH}/bench/`

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

if (!(await exists(join(process.cwd(), 'out', 'bench', 'index.html')))) {
  console.log('bench: no export found, building…')
  await run('pnpm', ['build'])
}

const server = await serve(PORT)
const browser = await puppeteer.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
})

try {
  const page = await browser.newPage()
  await page.setViewport({ width: 1200, height: 1000, deviceScaleFactor: 1 })
  await page.goto(`http://localhost:${PORT}${URL_PATH}`, { waitUntil: 'networkidle0' })

  const result = await page.waitForFunction(() => window.__selisihBench, { timeout: 60_000 })
  const bench = await result.jsonValue()

  // A canvas that never got laid out would report a beautiful zero.
  if (bench.canvasWidth < 400 || bench.canvasHeight < 400) {
    throw new Error(
      `bench canvas is ${bench.canvasWidth}×${bench.canvasHeight}; nothing meaningful was drawn`,
    )
  }

  const line = (label, value) => console.log(`  ${label.padEnd(16)} ${value}`)
  console.log(`\nrender bench — ${bench.size}×${bench.size} lattice, ${bench.frames} frames`)
  line('canvas', `${bench.canvasWidth}×${bench.canvasHeight} px`)
  line('draw mean', `${bench.drawMean.toFixed(2)} ms`)
  line('draw p95', `${bench.drawP95.toFixed(2)} ms`)
  line('frame median', `${bench.frameMedian.toFixed(2)} ms (${bench.fps.toFixed(1)} fps)`)
  line('frame p95', `${bench.frameP95.toFixed(2)} ms`)
  line('budget', `${bench.budgetMs} ms`)
  console.log(`\n  ${bench.pass ? 'PASS' : 'FAIL'} — draw p95 vs the 16.7 ms frame budget`)
  console.log('  (headless software rasterisation; a GPU-accelerated browser should do no worse)\n')

  if (!bench.pass) process.exitCode = 1
} finally {
  await browser.close()
  server.close()
}
