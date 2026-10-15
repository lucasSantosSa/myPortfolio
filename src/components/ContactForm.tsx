import { useRef, useState, type FormEvent } from 'react'
import { site } from '../content/load'
import { whatsappLink } from '../lib/format'
import { MailIcon, WhatsappIcon } from './Icons'

type State =
  | { kind: 'idle' }
  | { kind: 'sending' }
  | { kind: 'sent'; channels: string[] }
  | { kind: 'error'; message: string; fallback: { name: string; message: string } }

export function ContactForm() {
  const [state, setState] = useState<State>({ kind: 'idle' })
  const startedAt = useRef(Date.now())

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const data = Object.fromEntries(new FormData(form)) as Record<string, string>
    setState({ kind: 'sending' })
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, startedAt: startedAt.current }),
      })
      const body = (await res.json().catch(() => ({}))) as { ok?: boolean; delivered?: { email: boolean; whatsapp: boolean }; error?: string }
      if (!res.ok || !body.ok) throw new Error(body.error ?? 'The message could not be delivered.')
      const channels = [body.delivered?.email && 'email', body.delivered?.whatsapp && 'WhatsApp'].filter(Boolean) as string[]
      form.reset()
      setState({ kind: 'sent', channels })
    } catch (err) {
      setState({ kind: 'error', message: (err as Error).message, fallback: { name: data.name ?? '', message: data.message ?? '' } })
    }
  }

  if (state.kind === 'sent') {
    return (
      <div role="status" className="card p-8 text-center">
        <div className="mx-auto mb-4 grid h-14 w-14 animate-[float_3s_ease-in-out_infinite] place-items-center rounded-full bg-gradient-to-br from-accent-400 to-violet-500 text-2xl text-white">✓</div>
        <p className="text-lg font-semibold text-fg">Thanks, your message is on its way.</p>
        <p className="mt-2 text-muted">
          It reached me by {state.channels.join(' and ')}. I usually reply within a day.
        </p>
        <button type="button" className="btn-ghost mt-4" onClick={() => setState({ kind: 'idle' })}>
          Send another message
        </button>
      </div>
    )
  }

  const fallbackText = state.kind === 'error' ? `Hi Lucas, I'm ${state.fallback.name}. ${state.fallback.message}` : ''

  return (
    <form onSubmit={onSubmit} className="card space-y-5 p-6 sm:p-8" noValidate={false}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="c-name" className="label">
            Name
          </label>
          <input id="c-name" name="name" required maxLength={100} autoComplete="name" className="input" />
        </div>
        <div>
          <label htmlFor="c-email" className="label">
            Email
          </label>
          <input id="c-email" name="email" type="email" required maxLength={200} autoComplete="email" className="input" />
        </div>
      </div>
      <div>
        <label htmlFor="c-phone" className="label">
          Phone or WhatsApp <span className="font-normal text-muted">(optional)</span>
        </label>
        <input id="c-phone" name="phone" type="tel" maxLength={40} autoComplete="tel" className="input" />
      </div>
      <div>
        <label htmlFor="c-message" className="label">
          Message
        </label>
        <textarea id="c-message" name="message" required minLength={10} maxLength={4000} rows={6} className="input" />
      </div>
      {/* Honeypot: hidden from people, filled in by bots */}
      <div className="hidden" aria-hidden>
        <label htmlFor="c-website">Website</label>
        <input id="c-website" name="website" tabIndex={-1} autoComplete="off" />
      </div>

      {state.kind === 'error' && (
        <div role="alert" className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-200">
          <p className="font-medium">{state.message}</p>
          <p className="mt-1">You can still reach me directly, and your message is already filled in:</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <a className="btn-ghost py-1.5" href={whatsappLink(site.contact.whatsapp, fallbackText)} target="_blank" rel="noreferrer">
              <WhatsappIcon width={16} height={16} /> Send on WhatsApp
            </a>
            <a className="btn-ghost py-1.5" href={`mailto:${site.contact.email}?subject=${encodeURIComponent('Hello from your portfolio')}&body=${encodeURIComponent(fallbackText)}`}>
              <MailIcon width={16} height={16} /> Send by email
            </a>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-muted">Your message goes to my email and my WhatsApp.</p>
        <button type="submit" className="btn-primary" disabled={state.kind === 'sending'}>
          {state.kind === 'sending' ? 'Sending…' : 'Send message'}
        </button>
      </div>
    </form>
  )
}
