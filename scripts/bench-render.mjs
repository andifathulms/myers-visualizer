// Canvas lattice render benchmark. The draw cost has to be measured in a real
// browser, so this builds the export and serves the spike page; open the URL
// and read the reported mean / p95 draw time against the 16.7 ms budget.
import { spawn } from 'node:child_process'
import { stat } from 'node:fs/promises'
import { join } from 'node:path'

const BASE_PATH = '/myers-visualizer'
const URL_PATH = `${BASE_PATH}/bench/`

async function exists(p) {
  try {
    await stat(p)
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

console.log(`bench: open http://localhost:${process.env.PORT ?? 4321}${URL_PATH}`)
await import('./preview.mjs')
