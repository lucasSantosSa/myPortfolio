import type { VercelRequest, VercelResponse } from '@vercel/node'
import { handleContact } from '../server/contact'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ ok: false, error: 'Method not allowed' })
  }
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
