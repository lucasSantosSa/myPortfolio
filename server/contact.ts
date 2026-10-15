import { z } from 'zod'

/** Contact form handling shared by the Vercel function and the dev server. */

export const contactSchema = z.object({
  name: z.string().trim().min(1, 'Please enter your name').max(100),
  email: z.string().trim().email('Please enter a valid email').max(200),
  phone: z.string().trim().max(40).optional().default(''),
  message: z.string().trim().min(10, 'Please write a slightly longer message').max(4000),
  website: z.string().optional().default(''), // honeypot
  startedAt: z.number().optional(),
})

export interface ContactEnv {
  RESEND_API_KEY?: string
  CONTACT_TO_EMAIL?: string
  CONTACT_FROM_EMAIL?: string
  CALLMEBOT_PHONE?: string
  CALLMEBOT_APIKEY?: string
}

export interface ContactResult {
  status: number
  body: { ok: boolean; delivered?: { email: boolean; whatsapp: boolean }; error?: string }
}

const MIN_FILL_MS = 2500
const WINDOW_MS = 10 * 60 * 1000
const MAX_PER_WINDOW = 5
const hits = new Map<string, number[]>()

/** Best-effort limiter; resets whenever the serverless instance is recycled. */
export function rateLimited(key: string, now = Date.now()): boolean {
  const recent = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS)
  recent.push(now)
  hits.set(key, recent)
  return recent.length > MAX_PER_WINDOW
}

const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)

export function whatsappText(m: z.infer<typeof contactSchema>): string {
  const text = `New portfolio message\nFrom: ${m.name} <${m.email}>${m.phone ? `\nPhone: ${m.phone}` : ''}\n\n${m.message}`
  // CallMeBot messages are sent as a URL query, so keep them reasonably short
  return text.length > 1500 ? `${text.slice(0, 1480)}… (full text in email)` : text
}

async function sendEmail(env: ContactEnv, m: z.infer<typeof contactSchema>, fetchFn: typeof fetch): Promise<boolean> {
  if (!env.RESEND_API_KEY || !env.CONTACT_TO_EMAIL) return false
  const res = await fetchFn('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: env.CONTACT_FROM_EMAIL || 'Portfolio <onboarding@resend.dev>',
      to: [env.CONTACT_TO_EMAIL],
      reply_to: m.email,
      subject: `Portfolio message from ${m.name}`,
      text: `${m.message}\n\n— ${m.name} <${m.email}>${m.phone ? ` · ${m.phone}` : ''}`,
      html: `<p>${escapeHtml(m.message).replace(/\n/g, '<br>')}</p><hr><p>${escapeHtml(m.name)} &lt;${escapeHtml(m.email)}&gt;${m.phone ? ` · ${escapeHtml(m.phone)}` : ''}</p>`,
    }),
  })
  return res.ok
}

async function sendWhatsapp(env: ContactEnv, m: z.infer<typeof contactSchema>, fetchFn: typeof fetch): Promise<boolean> {
  if (!env.CALLMEBOT_PHONE || !env.CALLMEBOT_APIKEY) return false
  const url = `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(env.CALLMEBOT_PHONE)}&text=${encodeURIComponent(whatsappText(m))}&apikey=${encodeURIComponent(env.CALLMEBOT_APIKEY)}`
  const res = await fetchFn(url)
  return res.ok
}

export async function handleContact(input: unknown, opts: { env: ContactEnv; ip?: string; fetchFn?: typeof fetch; now?: number }): Promise<ContactResult> {
  const parsed = contactSchema.safeParse(input)
  if (!parsed.success) return { status: 400, body: { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid message' } }
  const m = parsed.data
  const now = opts.now ?? Date.now()

  // Bots: pretend success so they don't retry
  if (m.website || (m.startedAt && now - m.startedAt < MIN_FILL_MS)) return { status: 200, body: { ok: true, delivered: { email: false, whatsapp: false } } }
  if (rateLimited(opts.ip ?? 'unknown', now)) return { status: 429, body: { ok: false, error: 'Too many messages. Please try again later.' } }

  const fetchFn = opts.fetchFn ?? fetch
  const configured = Boolean(opts.env.RESEND_API_KEY && opts.env.CONTACT_TO_EMAIL) || Boolean(opts.env.CALLMEBOT_PHONE && opts.env.CALLMEBOT_APIKEY)
  if (!configured) return { status: 503, body: { ok: false, error: 'The contact form is not set up yet.' } }

  const [email, whatsapp] = await Promise.all([sendEmail(opts.env, m, fetchFn).catch(() => false), sendWhatsapp(opts.env, m, fetchFn).catch(() => false)])
  if (!email && !whatsapp) return { status: 502, body: { ok: false, error: 'The message could not be delivered right now.' } }
  return { status: 200, body: { ok: true, delivered: { email, whatsapp } } }
}
