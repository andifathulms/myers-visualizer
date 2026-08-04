// Serve ./out under the production basePath, so links and assets are exercised
// exactly as GitHub Pages will serve them. PRD §12.
import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { join, extname, normalize } from 'node:path'

const BASE_PATH = '/myers-visualizer'
const ROOT = join(process.cwd(), 'out')
const PORT = Number(process.env.PORT ?? 4321)

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
}

async function resolveFile(urlPath) {
  const rel = normalize(decodeURIComponent(urlPath)).replace(/^(\.\.[/\\])+/, '')
  const candidates = [join(ROOT, rel), join(ROOT, rel, 'index.html'), join(ROOT, `${rel}.html`)]
  for (const c of candidates) {
    try {
      const s = await stat(c)
      if (s.isFile()) return c
    } catch {
      // try next candidate
    }
  }
  return null
}

export function serve(port = PORT) {
  const server = createServer(handler)
  return new Promise((resolve) => {
    server.listen(port, () => resolve(server))
  })
}

async function handler(req, res) {
  const url = new URL(req.url ?? '/', 'http://localhost')
  if (url.pathname === '/' || url.pathname === '') {
    res.writeHead(302, { location: `${BASE_PATH}/` })
    return res.end()
  }
  if (!url.pathname.startsWith(BASE_PATH)) {
    res.writeHead(404, { 'content-type': 'text/plain' })
    return res.end(`Not under basePath ${BASE_PATH}`)
  }
  const file = await resolveFile(url.pathname.slice(BASE_PATH.length) || '/')
  if (!file) {
    res.writeHead(404, { 'content-type': 'text/plain' })
    return res.end('404')
  }
  const body = await readFile(file)
  res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' })
  res.end(body)
}

// Only listen when run directly; bench-render.mjs imports serve() instead.
if (process.argv[1] && process.argv[1].endsWith('preview.mjs')) {
  await serve()
  console.log(`preview: http://localhost:${PORT}${BASE_PATH}/`)
}

export { BASE_PATH, PORT }
