import type { VercelRequest, VercelResponse } from '@vercel/node'
import { handleContact } from '../server/contact'

// The site itself is served from GitHub Pages, so the browser calls this function cross-origin.
const DEFAULT_ORIGINS = ['https://lucassantossa.github.io', 'http://localhost:5173', 'http://localhost:4173']

function allowedOrigin(origin: string | undefined): string | null {
  if (!origin) return null
  const extra = (process.env.CONTACT_ALLOWED_ORIGINS ?? '').split(',').map((s) => s.trim()).filter(Boolean)
  if ([...DEFAULT_ORIGINS, ...extra].includes(origin)) return origin
  // the site's own Vercel deployments
  if (/^https:\/\/[a-z0-9-]+\.vercel\.app$/.test(origin)) return origin
  return null
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const origin = allowedOrigin(req.headers.origin)
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin)
    res.setHeader('Vary', 'Origin')
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  }
  if (req.method === 'OPTIONS') return res.status(origin ? 204 : 403).end()
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS')
    return res.status(405).json({ ok: false, error: 'Method not allowed' })
  }
  if (req.headers.origin && !origin) return res.status(403).json({ ok: false, error: 'Origin not allowed' })
  const ip = (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim() ?? req.socket.remoteAddress
  const body = typeof req.body === 'string' ? safeJson(req.body) : req.body
  const result = await handleContact(body, { env: process.env, ip })
  return res.status(result.status).json(result.body)
}

function safeJson(s: string) {
  try {
    return JSON.parse(s)
  } catch {
    return {}
  }
}
