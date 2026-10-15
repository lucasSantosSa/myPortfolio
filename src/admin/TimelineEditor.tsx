import { useState } from 'react'
import { timelineSchema, type TimelineEntry } from '../content/schema'
import { Field, ListInput, Notice, Select, TextArea, TextInput, zodMessage } from './fields'
import { slugify } from './importRepo'
import type { ContentStore } from './storage'

export const emptyEntry = (): Partial<TimelineEntry> => ({ kind: 'work', contract: false, highlights: [], stack: [], relatedProjects: [] })

const kinds = ['work', 'freelance', 'education', 'teaching', 'design', 'activity'] as const

export function TimelineEditor({
  initial,
  originalSlug,
  store,
  projectSlugs,
  onSaved,
  onDeleted,
}: {
  initial: Partial<TimelineEntry>
  originalSlug?: string
  store: ContentStore
  projectSlugs: string[]
  onSaved: (t: TimelineEntry) => void
  onDeleted: () => void
}) {
  const [t, setT] = useState<Partial<TimelineEntry>>(initial)
  const [msg, setMsg] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null)
  const [busy, setBusy] = useState(false)
  const set = <K extends keyof TimelineEntry>(k: K, v: TimelineEntry[K] | undefined) => setT((prev) => ({ ...prev, [k]: v }))
  const slug = t.slug || slugify(t.org ?? '')

  async function save() {
    let entry: TimelineEntry
    try {
      entry = timelineSchema.parse({ ...t, slug, start: t.start || undefined, end: t.end || undefined, dateLabel: t.dateLabel || undefined, growth: t.growth || undefined, location: t.location || undefined })
    } catch (err) {
      setMsg({ kind: 'error', text: `Fix these before saving:\n${zodMessage(err)}` })
      return
    }
    setBusy(true)
    try {
      await store.writeText(`content/timeline/${entry.slug}.json`, JSON.stringify(entry, null, 2) + '\n', `cms: ${originalSlug ? 'update' : 'add'} timeline ${entry.slug}`)
      if (originalSlug && originalSlug !== entry.slug) await store.remove(`content/timeline/${originalSlug}.json`, `cms: rename timeline ${originalSlug} to ${entry.slug}`)
      setMsg({ kind: 'ok', text: store.kind === 'github' ? 'Saved and committed. The live site updates after the next deploy.' : 'Saved to disk.' })
      onSaved(entry)
    } catch (err) {
      setMsg({ kind: 'error', text: (err as Error).message })
    } finally {
      setBusy(false)
    }
  }

  async function remove() {
    if (!originalSlug || !confirm(`Delete "${t.title} · ${t.org}" from the timeline?`)) return
    setBusy(true)
    try {
      await store.remove(`content/timeline/${originalSlug}.json`, `cms: delete timeline ${originalSlug}`)
      onDeleted()
    } catch (err) {
      setMsg({ kind: 'error', text: (err as Error).message })
      setBusy(false)
    }
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2">
        <Field id="t-title" label="Role or activity">
          <TextInput id="t-title" value={t.title} onChange={(v) => set('title', v)} placeholder="Senior Frontend Engineer" />
        </Field>
        <Field id="t-org" label="Organization">
          <TextInput id="t-org" value={t.org} onChange={(v) => set('org', v)} placeholder="Company, school or event" />
        </Field>
        <Field id="t-kind" label="Kind">
          <Select id="t-kind" value={t.kind ?? 'work'} options={kinds} onChange={(v) => set('kind', v)} />
        </Field>
        <Field id="t-slug" label="ID" hint="Used to link projects to this entry.">
          <TextInput id="t-slug" value={t.slug} onChange={(v) => set('slug', slugify(v))} placeholder={slug} />
        </Field>
        <Field id="t-start" label="Start (YYYY-MM)" hint="Can be empty for undated chapters if a date label is set.">
          <TextInput id="t-start" value={t.start} onChange={(v) => set('start', v || undefined)} placeholder="2025-10" />
        </Field>
        <Field id="t-end" label="End (YYYY-MM, empty for present)">
          <TextInput id="t-end" value={t.end} onChange={(v) => set('end', v || undefined)} />
        </Field>
        <Field id="t-datelabel" label="Date label (optional)" hint='Shown instead of or before the dates, e.g. "Age 10".'>
          <TextInput id="t-datelabel" value={t.dateLabel} onChange={(v) => set('dateLabel', v || undefined)} />
        </Field>
        <Field id="t-location" label="Location (optional)">
          <TextInput id="t-location" value={t.location} onChange={(v) => set('location', v)} placeholder="Remote" />
        </Field>
        <label className="flex items-center gap-2 self-end pb-2 text-sm">
          <input type="checkbox" checked={t.contract ?? false} onChange={(e) => set('contract', e.target.checked)} /> Show a "Contract" badge
        </label>
        <div className="sm:col-span-2">
          <Field id="t-summary" label="Summary">
            <TextArea id="t-summary" rows={3} value={t.summary} onChange={(v) => set('summary', v)} />
          </Field>
        </div>
        <div className="sm:col-span-2">
          <Field id="t-highlights" label="Highlights" hint="One per line.">
            <TextArea
              id="t-highlights"
              rows={6}
              value={(t.highlights ?? []).join('\n')}
              onChange={(v) => set('highlights', v.split('\n').map((s) => s.trim()).filter(Boolean))}
            />
          </Field>
        </div>
        <div className="sm:col-span-2">
          <Field id="t-growth" label="Growth (optional)" hint="One sentence on how your role or skills grew.">
            <TextInput id="t-growth" value={t.growth} onChange={(v) => set('growth', v)} />
          </Field>
        </div>
        <div className="sm:col-span-2">
          <Field id="t-stack" label="Tech stack" hint="Comma separated. Powers the timeline's technology filter.">
            <ListInput id="t-stack" value={t.stack} onChange={(v) => set('stack', v)} />
          </Field>
        </div>
        <div className="sm:col-span-2">
          <Field id="t-related" label="Related projects" hint={`Comma separated project slugs. Available: ${projectSlugs.join(', ')}`}>
            <ListInput id="t-related" value={t.relatedProjects} onChange={(v) => set('relatedProjects', v)} />
          </Field>
        </div>
      </section>

      {msg && <Notice kind={msg.kind}>{msg.text}</Notice>}

      <div className="flex flex-wrap justify-between gap-3">
        <button type="button" className="btn-primary" onClick={save} disabled={busy}>
          {busy ? 'Saving…' : 'Save entry'}
        </button>
        {originalSlug && (
          <button type="button" className="btn-ghost text-red-600" onClick={remove} disabled={busy}>
            Delete entry
          </button>
        )}
      </div>
    </div>
  )
}
