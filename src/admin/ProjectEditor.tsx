import { useState } from 'react'
import { projectSchema, type Project } from '../content/schema'
import { Field, ListInput, Notice, Select, TextArea, TextInput, zodMessage } from './fields'
import { GithubClient, parseRepoRef } from './github'
import { importRepo, slugify, type RepoFile } from './importRepo'
import { MediaEditor } from './MediaEditor'
import type { ContentStore } from './storage'

export const emptyProject = (): Partial<Project> => ({ status: 'in-progress', category: 'web', featured: false, order: 100, stack: [], media: [], description: '' })

const statuses = [
  { value: 'live', label: 'Live' },
  { value: 'in-progress', label: 'In progress' },
  { value: 'coming-soon', label: 'Coming soon' },
  { value: 'archived', label: 'Archive' },
] as { value: Project['status']; label: string }[]
const categories = [
  { value: 'web', label: 'Web app' },
  { value: 'ai', label: 'AI' },
  { value: 'tools', label: 'Tools & automation' },
  { value: 'systems', label: 'Systems' },
  { value: 'showcase', label: 'Showcase rebuild' },
] as { value: Project['category']; label: string }[]

function safeFileName(name: string) {
  const dot = name.lastIndexOf('.')
  const base = slugify(dot > 0 ? name.slice(0, dot) : name) || 'file'
  const ext = dot > 0 ? name.slice(dot + 1).toLowerCase().replace(/[^a-z0-9]/g, '') : 'bin'
  return `${base}.${ext}`
}

export function ProjectEditor({
  initial,
  originalSlug,
  store,
  github,
  timelineSlugs,
  onSaved,
  onDeleted,
}: {
  initial: Partial<Project>
  originalSlug?: string
  store: ContentStore
  github: GithubClient
  timelineSlugs: string[]
  onSaved: (p: Project) => void
  onDeleted: () => void
}) {
  const [p, setP] = useState<Partial<Project>>(initial)
  const [repoInput, setRepoInput] = useState(initial.github?.fullName ?? (initial.repo ? (parseRepoRef(initial.repo.url) ?? '') : ''))
  const [candidates, setCandidates] = useState<RepoFile[]>([])
  const [picked, setPicked] = useState<Set<string>>(new Set())
  const [msg, setMsg] = useState<{ kind: 'ok' | 'error' | 'info'; text: string } | null>(null)
  const [busy, setBusy] = useState(false)
  const set = <K extends keyof Project>(k: K, v: Project[K] | undefined) => setP((prev) => ({ ...prev, [k]: v }))
  const slug = p.slug || slugify(p.title ?? '')

  async function runImport() {
    const ref = parseRepoRef(repoInput)
    if (!ref) {
      setMsg({ kind: 'error', text: 'Enter a repo as owner/name or a GitHub URL.' })
      return
    }
    setBusy(true)
    setMsg({ kind: 'info', text: `Reading ${ref}…` })
    try {
      const { draft, mediaCandidates, portfolioJsonFound } = await importRepo(github, ref)
      // Imported values fill empty fields; anything already typed wins, except the GitHub snapshot
      setP((prev) => {
        const merged: Partial<Project> = { ...prev }
        for (const [k, v] of Object.entries(draft) as [keyof Project, unknown][]) {
          const cur = prev[k]
          const empty = cur === undefined || cur === '' || (Array.isArray(cur) && cur.length === 0)
          if (empty || k === 'github' || k === 'repo') (merged as Record<string, unknown>)[k] = v
        }
        return merged
      })
      setCandidates(mediaCandidates)
      setPicked(new Set(mediaCandidates.slice(0, 4).map((c) => c.path)))
      setMsg({
        kind: 'ok',
        text: `Imported ${ref}${portfolioJsonFound ? ' (used its portfolio.json)' : ''}. Empty fields were filled in; review them before saving.${
          mediaCandidates.length ? `\nFound ${mediaCandidates.length} images or videos below.` : ''
        }`,
      })
    } catch (err) {
      setMsg({ kind: 'error', text: `Could not read the repo: ${(err as Error).message}. Private repos need a token with read access to them.` })
    } finally {
      setBusy(false)
    }
  }

  async function copyPicked() {
    const ref = p.github?.fullName
    if (!ref || !slug) return
    setBusy(true)
    const added = []
    try {
      for (const c of candidates.filter((c) => picked.has(c.path))) {
        setMsg({ kind: 'info', text: `Copying ${c.path}…` })
        const bytes = await github.blob(ref, c.sha)
        const name = safeFileName(c.path.split('/').pop() ?? 'image')
        await store.writeBinary(`public/media/${slug}/${name}`, bytes, `cms: add ${name} to ${slug}`)
        added.push({ type: /\.(mp4|webm)$/i.test(name) ? ('video' as const) : ('image' as const), src: `/media/${slug}/${name}`, alt: '' })
      }
      set('media', [...(p.media ?? []), ...added])
      setCandidates((cs) => cs.filter((c) => !picked.has(c.path)))
      setPicked(new Set())
      setMsg({ kind: 'ok', text: `Copied ${added.length} file(s) into public/media/${slug}/. Add alt text, then save the project.` })
    } catch (err) {
      setMsg({ kind: 'error', text: (err as Error).message })
    } finally {
      setBusy(false)
    }
  }

  async function upload(file: File) {
    if (!slug) throw new Error('Give the project a title first')
    const name = safeFileName(file.name)
    await store.writeBinary(`public/media/${slug}/${name}`, new Uint8Array(await file.arrayBuffer()), `cms: add ${name} to ${slug}`)
    return `/media/${slug}/${name}`
  }

  async function save() {
    setMsg(null)
    let project: Project
    try {
      project = projectSchema.parse({ ...p, slug, demoUrl: p.demoUrl || undefined, relatedTimeline: p.relatedTimeline || undefined })
    } catch (err) {
      setMsg({ kind: 'error', text: `Fix these before saving:\n${zodMessage(err)}` })
      return
    }
    setBusy(true)
    try {
      await store.writeText(`content/projects/${project.slug}.json`, JSON.stringify(project, null, 2) + '\n', `cms: ${originalSlug ? 'update' : 'add'} project ${project.slug}`)
      if (originalSlug && originalSlug !== project.slug) await store.remove(`content/projects/${originalSlug}.json`, `cms: rename project ${originalSlug} to ${project.slug}`)
      setMsg({ kind: 'ok', text: store.kind === 'github' ? 'Saved and committed. The live site updates after the next deploy (usually a minute or two).' : 'Saved to disk.' })
      onSaved(project)
    } catch (err) {
      setMsg({ kind: 'error', text: (err as Error).message })
    } finally {
      setBusy(false)
    }
  }

  async function remove() {
    if (!originalSlug || !confirm(`Delete the project "${p.title}"? Its media files stay in public/media/${originalSlug}/.`)) return
    setBusy(true)
    try {
      await store.remove(`content/projects/${originalSlug}.json`, `cms: delete project ${originalSlug}`)
      onDeleted()
    } catch (err) {
      setMsg({ kind: 'error', text: (err as Error).message })
      setBusy(false)
    }
  }

  return (
    <div className="space-y-8">
      <section className="card space-y-3 p-5">
        <h3 className="font-semibold">Read from a GitHub repo</h3>
        <p className="text-sm text-zinc-500">
          Fills in the title, summary, description, stack, links and dates from the repo, its README and an optional <code>portfolio.json</code>, and finds
          screenshots in it.
        </p>
        <div className="flex flex-wrap gap-2">
          <div className="min-w-60 flex-1">
            <TextInput id="p-import" value={repoInput} onChange={setRepoInput} placeholder="lucasSantosSa/steward or https://github.com/…" aria-label="Repository" />
          </div>
          <button type="button" className="btn-primary" onClick={runImport} disabled={busy}>
            Read repo
          </button>
        </div>
        {candidates.length > 0 && (
          <div>
            <p className="label">Media found in the repo</p>
            <ul className="grid gap-2 sm:grid-cols-2">
              {candidates.map((c) => (
                <li key={c.path}>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={picked.has(c.path)}
                      onChange={(e) =>
                        setPicked((s) => {
                          const n = new Set(s)
                          if (e.target.checked) n.add(c.path)
                          else n.delete(c.path)
                          return n
                        })
                      }
                    />
                    <span className="truncate font-mono text-xs">{c.path}</span>
                    {c.size ? <span className="text-xs text-zinc-500">{Math.round(c.size / 1024)} KB</span> : null}
                  </label>
                </li>
              ))}
            </ul>
            <button type="button" className="btn-ghost mt-3" onClick={copyPicked} disabled={busy || picked.size === 0}>
              Copy {picked.size} into the portfolio
            </button>
          </div>
        )}
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <Field id="p-title" label="Title">
          <TextInput id="p-title" value={p.title} onChange={(v) => set('title', v)} required />
        </Field>
        <Field id="p-slug" label="URL slug" hint={`Page: /projects/${slug || '…'}`}>
          <TextInput id="p-slug" value={p.slug} onChange={(v) => set('slug', slugify(v))} placeholder={slugify(p.title ?? '')} />
        </Field>
        <div className="sm:col-span-2">
          <Field id="p-summary" label="One-line summary" hint="Shown on the project card.">
            <TextInput id="p-summary" value={p.summary} onChange={(v) => set('summary', v)} maxLength={240} />
          </Field>
        </div>
        <Field id="p-status" label="Status">
          <Select id="p-status" value={p.status ?? 'in-progress'} options={statuses} onChange={(v) => set('status', v)} />
        </Field>
        <Field id="p-category" label="Category">
          <Select id="p-category" value={p.category ?? 'web'} options={categories} onChange={(v) => set('category', v)} />
        </Field>
        <Field id="p-demo" label="Live demo URL">
          <TextInput id="p-demo" type="url" value={p.demoUrl} onChange={(v) => set('demoUrl', v || undefined)} placeholder="https://…" />
        </Field>
        <Field id="p-repo" label="Repository URL">
          <div className="flex gap-2">
            <TextInput
              id="p-repo"
              type="url"
              value={p.repo?.url}
              onChange={(v) => set('repo', v ? { url: v, visibility: p.repo?.visibility ?? 'public' } : undefined)}
              placeholder="https://github.com/…"
            />
            <Select
              id="p-repo-vis"
              value={p.repo?.visibility ?? 'public'}
              options={['public', 'private'] as const}
              onChange={(v) => p.repo && set('repo', { ...p.repo, visibility: v })}
            />
          </div>
        </Field>
        <div className="sm:col-span-2">
          <Field id="p-stack" label="Tech stack" hint="Comma separated.">
            <ListInput id="p-stack" value={p.stack} onChange={(v) => set('stack', v)} placeholder="React, TypeScript, PostgreSQL" />
          </Field>
        </div>
        <Field id="p-start" label="Started (YYYY-MM)">
          <TextInput id="p-start" value={p.period?.start} onChange={(v) => set('period', v ? { start: v, end: p.period?.end } : undefined)} placeholder="2026-04" />
        </Field>
        <Field id="p-end" label="Finished (YYYY-MM, empty if ongoing)">
          <TextInput id="p-end" value={p.period?.end} onChange={(v) => p.period && set('period', { ...p.period, end: v || undefined })} placeholder="" />
        </Field>
        <Field id="p-related" label="Related timeline entry" hint="For showcase rebuilds of client work.">
          <Select id="p-related" value={p.relatedTimeline ?? ''} options={[{ value: '', label: 'None' }, ...timelineSlugs.map((s) => ({ value: s, label: s }))]} onChange={(v) => set('relatedTimeline', v || undefined)} />
        </Field>
        <div className="flex items-end gap-6">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={p.featured ?? false} onChange={(e) => set('featured', e.target.checked)} /> Featured on the home page
          </label>
          <Field id="p-order" label="Sort order">
            <TextInput id="p-order" type="number" value={String(p.order ?? 100)} onChange={(v) => set('order', Number(v) || 0)} className="input w-24" />
          </Field>
        </div>
        <div className="sm:col-span-2">
          <Field id="p-desc" label="Description (Markdown)">
            <TextArea id="p-desc" rows={12} value={p.description} onChange={(v) => set('description', v)} mono />
          </Field>
        </div>
      </section>

      <section className="card space-y-3 p-5">
        <h3 className="font-semibold">Screenshots, recordings and embeds</h3>
        <MediaEditor media={p.media ?? []} onChange={(m) => set('media', m)} onUpload={upload} />
      </section>

      {msg && <Notice kind={msg.kind}>{msg.text}</Notice>}

      <div className="flex flex-wrap justify-between gap-3">
        <button type="button" className="btn-primary" onClick={save} disabled={busy}>
          {busy ? 'Working…' : 'Save project'}
        </button>
        {originalSlug && (
          <button type="button" className="btn-ghost text-red-600" onClick={remove} disabled={busy}>
            Delete project
          </button>
        )}
      </div>
    </div>
  )
}
