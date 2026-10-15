// Production server: serves the built site from dist/ and the contact API.
// Usage: npm start   (PORT=8080 npm start to change the port)
import { execSync } from 'node:child_process'
import fs from 'node:fs'
import http from 'node:http'
import path from 'node:path'
import { handleContact } from './contact.ts'

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..')
const dist = path.join(root, 'dist')
const port = Number(process.env.PORT) || 4173

for (const file of ['.env', '.env.local']) {
  if (fs.existsSync(path.join(root, file))) process.loadEnvFile(path.join(root, file))
}

if (!fs.existsSync(path.join(dist, 'index.html'))) {
  console.log('No build found, building first…')
  execSync('npm run build', { cwd: root, stdio: 'inherit' })
}

const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.pdf': 'application/pdf',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.woff2': 'font/woff2',
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', 'http://localhost')

  if (url.pathname === '/api/contact') {
    if (req.method !== 'POST') {
      res.writeHead(405, { 'Content-Type': 'application/json' }).end(JSON.stringify({ ok: false, error: 'Method not allowed' }))
      return
    }
    const chunks = []
    for await (const c of req) chunks.push(c)
    let body = {}
    try {
      body = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')
    } catch {
      /* rejected by validation */
    }
    const ip = req.headers['x-forwarded-for']?.toString().split(',')[0]?.trim() ?? req.socket.remoteAddress
    const result = await handleContact(body, { env: process.env, ip })
    res.writeHead(result.status, { 'Content-Type': 'application/json' }).end(JSON.stringify(result.body))
    return
  }

  // Static files, falling back to index.html for client-side routes
  const safe = path.normalize(decodeURIComponent(url.pathname)).replace(/^(\.\.[/\\])+/, '')
  let file = path.join(dist, safe)
  if (!file.startsWith(dist) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(dist, 'index.html')
  const ext = path.extname(file)
  res.writeHead(200, {
    'Content-Type': types[ext] ?? 'application/octet-stream',
    'Cache-Control': file.includes(`${path.sep}assets${path.sep}`) ? 'public, max-age=31536000, immutable' : 'no-cache',
  })
  fs.createReadStream(file).pipe(res)
})

server.listen(port, () => console.log(`Portfolio running at http://localhost:${port}`))
