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

type Message = z.infer<typeof contactSchema>

/** Every field the visitor filled in, in form order. */
export function messageFields(m: Message, receivedAt = new Date()): { label: string; value: string }[] {
  return [
    { label: 'Name', value: m.name },
    { label: 'Email', value: m.email },
    { label: 'Phone / WhatsApp', value: m.phone || '(not given)' },
    { label: 'Received', value: receivedAt.toISOString().replace('T', ' ').slice(0, 16) + ' UTC' },
  ]
}

export function plainTextMessage(m: Message, receivedAt?: Date): string {
  const fields = messageFields(m, receivedAt).map((f) => `${f.label}: ${f.value}`).join('\n')
  return `New message from your portfolio\n\n${fields}\n\nMessage:\n${m.message}`
}

export function whatsappText(m: Message, receivedAt?: Date): string {
  const text = plainTextMessage(m, receivedAt).replace('New message from your portfolio', '*New portfolio message*')
  // CallMeBot messages are sent as a URL query, so keep them reasonably short
  return text.length > 1500 ? `${text.slice(0, 1480)}… (full text in email)` : text
}

function emailHtml(m: Message, receivedAt?: Date): string {
  const rows = messageFields(m, receivedAt)
    .map((f) => `<tr><td style="padding:6px 16px 6px 0;color:#666;white-space:nowrap;vertical-align:top">${escapeHtml(f.label)}</td><td style="padding:6px 0"><strong>${escapeHtml(f.value)}</strong></td></tr>`)
    .join('')
  return `<div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;font-size:15px;color:#111;max-width:640px">
<h2 style="margin:0 0 12px">New message from your portfolio</h2>
<table style="border-collapse:collapse;margin-bottom:16px">${rows}</table>
<div style="padding:14px 16px;background:#f4f5f7;border-radius:10px;white-space:pre-wrap;line-height:1.5">${escapeHtml(m.message)}</div>
<p style="color:#666;font-size:13px;margin-top:16px">Reply to this email to answer ${escapeHtml(m.name)} directly.</p>
</div>`
}

async function sendEmail(env: ContactEnv, m: Message, fetchFn: typeof fetch): Promise<boolean> {
  if (!env.RESEND_API_KEY || !env.CONTACT_TO_EMAIL) return false
  const receivedAt = new Date()
  const res = await fetchFn('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: env.CONTACT_FROM_EMAIL || 'Portfolio <onboarding@resend.dev>',
      to: [env.CONTACT_TO_EMAIL],
      reply_to: m.email,
      subject: `Portfolio: ${m.name} (${m.email})`,
      text: plainTextMessage(m, receivedAt),
      html: emailHtml(m, receivedAt),
    }),
  })
  if (!res.ok) console.error('Resend failed', res.status, (await res.text().catch(() => '')).slice(0, 300))
  return res.ok
}

/** CallMeBot wants the phone in international format with a leading +. */
export function callmebotPhone(raw: string): string {
  const digits = raw.replace(/[^\d]/g, '')
  return `+${digits}`
}

async function sendWhatsapp(env: ContactEnv, m: Message, fetchFn: typeof fetch): Promise<boolean> {
  if (!env.CALLMEBOT_PHONE || !env.CALLMEBOT_APIKEY) return false
  const url = `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(callmebotPhone(env.CALLMEBOT_PHONE))}&text=${encodeURIComponent(whatsappText(m))}&apikey=${encodeURIComponent(env.CALLMEBOT_APIKEY.trim())}`
  const res = await fetchFn(url)
  // CallMeBot answers 200 even when it refuses, so read the body
  const body = (await res.text().catch(() => '')).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')
  const ok = res.ok && /queued|sent|will be sent/i.test(body) && !/error|invalid|not (allowed|active|registered)/i.test(body)
  if (!ok) console.error('CallMeBot failed', res.status, body.replace(env.CALLMEBOT_APIKEY, '***').slice(0, 300))
  return ok
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
