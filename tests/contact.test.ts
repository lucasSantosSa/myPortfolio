import { describe, expect, it, vi } from 'vitest'
import { callmebotPhone, handleContact, whatsappText } from '../server/contact'

const valid = { name: 'Ada', email: 'ada@example.com', message: 'Hello Lucas, I would like to talk about a role.', startedAt: 0 }
const ok = (url: string | URL | Request) =>
  new Response(String(url).includes('callmebot') ? '<p>Message queued. You will receive it in a few seconds.</p>' : '{"id":"1"}', { status: 200 })
const env = { RESEND_API_KEY: 're_test', CONTACT_TO_EMAIL: 'me@example.com', CALLMEBOT_PHONE: '5531900000000', CALLMEBOT_APIKEY: '123' }
let ipN = 0
const ip = () => `10.0.0.${++ipN}`

describe('handleContact', () => {
  it('sends to email and WhatsApp', async () => {
    const fetchFn = vi.fn(async (url: string | URL | Request) => ok(url))
    const r = await handleContact({ ...valid, phone: '+1 555 0100' }, { env, ip: ip(), fetchFn, now: 10_000 })
    expect(r).toEqual({ status: 200, body: { ok: true, delivered: { email: true, whatsapp: true } } })
    const email = JSON.parse(String((fetchFn.mock.calls.find((c) => String(c[0]).includes('resend')) as unknown[])[1] && ((fetchFn.mock.calls.find((c) => String(c[0]).includes('resend')) as unknown[])[1] as RequestInit).body))
    for (const part of ['Ada', 'ada@example.com', '+1 555 0100', 'talk about a role']) {
      expect(email.text).toContain(part)
      expect(email.html).toContain(part)
    }
    expect(email.reply_to).toBe('ada@example.com')
    const wa = decodeURIComponent(String(fetchFn.mock.calls.find((c) => String(c[0]).includes('callmebot'))![0]))
    for (const part of ['Ada', 'ada@example.com', '+1 555 0100', 'talk about a role']) expect(wa).toContain(part)
    expect(wa).toContain('phone=+5531900000000')
    const urls = fetchFn.mock.calls.map((c) => String((c as unknown[])[0]))
    expect(urls.some((u) => u.startsWith('https://api.resend.com/emails'))).toBe(true)
    expect(urls.some((u) => u.startsWith('https://api.callmebot.com/whatsapp.php') && u.includes('apikey=123'))).toBe(true)
  })

  it('succeeds when only one channel works', async () => {
    const fetchFn = vi.fn(async (url: string | URL | Request) => (String(url).includes('resend') ? new Response('{}', { status: 500 }) : ok(url)))
    const r = await handleContact(valid, { env, ip: ip(), fetchFn, now: 10_000 })
    expect(r.body).toEqual({ ok: true, delivered: { email: false, whatsapp: true } })
  })

  it('treats a CallMeBot refusal as a failure even with HTTP 200', async () => {
    const fetchFn = vi.fn(async (url: string | URL | Request) =>
      String(url).includes('callmebot') ? new Response('<p>APIKey is invalid. You need to get a new one</p>', { status: 200 }) : ok(url),
    )
    const r = await handleContact(valid, { env, ip: ip(), fetchFn, now: 10_000 })
    expect(r.body.delivered).toEqual({ email: true, whatsapp: false })
    expect(r.body.whatsappIssue).toBe('invalid_apikey')
  })

  it('normalizes the CallMeBot phone', () => {
    expect(callmebotPhone('55 (31) 97556-4250')).toBe('+5531975564250')
    expect(callmebotPhone('+5531975564250')).toBe('+5531975564250')
  })

  it('reports 503 when nothing is configured', async () => {
    const r = await handleContact(valid, { env: {}, ip: ip(), now: 10_000 })
    expect(r.status).toBe(503)
  })

  it('rejects invalid input', async () => {
    const r = await handleContact({ ...valid, email: 'nope' }, { env, ip: ip(), now: 10_000 })
    expect(r.status).toBe(400)
  })

  it('silently drops honeypot and too-fast submissions', async () => {
    const fetchFn = vi.fn()
    expect((await handleContact({ ...valid, website: 'spam.com' }, { env, ip: ip(), fetchFn, now: 10_000 })).body.ok).toBe(true)
    expect((await handleContact({ ...valid, startedAt: 9_000 }, { env, ip: ip(), fetchFn, now: 10_000 })).body.ok).toBe(true)
    expect(fetchFn).not.toHaveBeenCalled()
  })

  it('rate limits repeated messages from one address', async () => {
    const fetchFn = vi.fn(async () => new Response('{}'))
    const addr = ip()
    let last
    for (let i = 0; i < 6; i++) last = await handleContact(valid, { env, ip: addr, fetchFn, now: 10_000 + i })
    expect(last!.status).toBe(429)
  })

  it('truncates long WhatsApp texts', () => {
    expect(whatsappText({ ...valid, phone: '', website: '', message: 'x'.repeat(3000) }).length).toBeLessThan(1600)
  })
})
