import { watch } from 'node:fs'
import fs from 'node:fs/promises'
import path from 'node:path'
import { loadEnv, type Plugin } from 'vite'
import { handleContact } from './server/contact.ts'

const ALLOWED = ['content/', 'public/media/']

/** Resolves a repo-relative path and refuses anything outside the content and media folders. */
export function resolveCmsPath(root: string, rel: string | null): string {
  if (!rel) throw new Error('Missing path')
  const normalized = path.posix.normalize(rel.replace(/\\/g, '/'))
  if (normalized.startsWith('..') || path.posix.isAbsolute(normalized) || !ALLOWED.some((p) => normalized.startsWith(p))) {
    throw new Error(`Path not allowed: ${rel}`)
  }
  return path.join(root, normalized)
}

/**
 * Dev-only endpoints so the /admin CMS can save straight to disk while running `npm run dev`.
 * In production the CMS commits through the GitHub API instead.
 */
export function cmsDevPlugin(): Plugin {
  let root = process.cwd()
  return {
    name: 'portfolio-cms-dev',
    apply: 'serve',
    configResolved(config) {
      root = config.root
    },
    // Content edits from the CMS would normally trigger Vite's reload and wipe the editor's state.
    // Vite stops watching those folders; a plain fs watcher tells the page instead, and only
    // public pages reload themselves.
    config() {
      return { server: { watch: { ignored: ['**/content/**', '**/public/media/**'] } } }
    },
    configureServer(server) {
      if (process.env.VITEST) return
      let timer: NodeJS.Timeout | undefined
      for (const dir of ['content', 'public/media']) {
        try {
          watch(path.join(root, dir), { recursive: true }, () => {
            clearTimeout(timer)
            timer = setTimeout(() => {
              // Drop cached content modules (and the glob loader) so the next page load reads fresh files
              const graph = server.environments.client.moduleGraph
              for (const mod of graph.idToModuleMap.values()) {
                if (mod.file && (mod.file.includes('/content/') || mod.file.endsWith('/src/content/load.ts'))) graph.invalidateModule(mod)
              }
              server.ws.send({ type: 'custom', event: 'portfolio:content-changed' })
            }, 150)
          })
        } catch {
          /* folder missing */
        }
      }
      server.middlewares.use('/__cms', async (req, res) => {
        try {
          const url = new URL(req.url ?? '/', 'http://localhost')
          const target = resolveCmsPath(root, url.searchParams.get('path'))
          if (req.method === 'GET') {
            const entries = await fs.readdir(target, { withFileTypes: true }).catch(() => [])
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify(entries.filter((e) => e.isFile()).map((e) => e.name)))
            return
          }
          if (req.method === 'DELETE') {
            await fs.rm(target, { force: true })
            res.end('deleted')
            return
          }
          if (req.method === 'PUT') {
            const chunks: Buffer[] = []
            for await (const chunk of req) chunks.push(chunk as Buffer)
            await fs.mkdir(path.dirname(target), { recursive: true })
            await fs.writeFile(target, Buffer.concat(chunks))
            res.end('saved')
            return
          }
          res.statusCode = 405
          res.end('Method not allowed')
        } catch (err) {
          res.statusCode = 400
          res.end((err as Error).message)
        }
      })
      // separate ping route that needs no path
      server.middlewares.use('/__cms-ping', (_req, res) => res.end('ok'))
      // Run the contact endpoint locally with values from .env / .env.local
      const env = loadEnv(server.config.mode, root, '')
      server.middlewares.use('/api/contact', async (req, res) => {
        const chunks: Buffer[] = []
        for await (const chunk of req) chunks.push(chunk as Buffer)
        let body: unknown = {}
        try {
          body = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')
        } catch {
          /* invalid JSON is rejected by validation */
        }
        const result = req.method === 'POST' ? await handleContact(body, { env, ip: req.socket.remoteAddress }) : { status: 405, body: { ok: false, error: 'Method not allowed' } }
        res.statusCode = result.status
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify(result.body))
      })
    },
  }
}
