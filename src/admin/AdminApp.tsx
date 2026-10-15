import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router'
import siteJson from '../../content/site.json'
import { compareTimeline, projectSchema, siteSchema, timelineSchema, type Project, type TimelineEntry } from '../content/schema'
import { Field, Notice, TextArea, TextInput, zodMessage } from './fields'
import { GithubClient } from './github'
import { emptyProject, ProjectEditor } from './ProjectEditor'
import { GithubStore, LocalStore, localStoreAvailable, type ContentStore } from './storage'
import { emptyEntry, TimelineEditor } from './TimelineEditor'

const TOKEN_KEY = 'cms-github-token'
// Read the raw JSON so content edits don't hot-reload this module and reset the editor
const bundledSite = { cms: siteJson.cms }

type Tab = 'projects' | 'timeline' | 'site'
type Editing<T> = { item: Partial<T>; originalSlug?: string; key: number } | null
let editorKey = 0

function readSession(key: string) {
  try {
    return sessionStorage.getItem(key) ?? ''
  } catch {
    return ''
  }
}

function Connect({ onConnect }: { onConnect: (store: ContentStore, github: GithubClient) => void }) {
  const [token, setToken] = useState(readSession(TOKEN_KEY))
  const [repo, setRepo] = useState(bundledSite.cms.repo)
  const [branch, setBranch] = useState(bundledSite.cms.branch)
  const [localOk, setLocalOk] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    localStoreAvailable().then(setLocalOk)
  }, [])

  async function connectGithub() {
    setBusy(true)
    setError(null)
    try {
      const client = new GithubClient(token.trim())
      await client.user()
      if (!(await client.getFile(repo, 'content/site.json', branch))) throw new Error(`content/site.json not found in ${repo} on branch ${branch}`)
      try {
        sessionStorage.setItem(TOKEN_KEY, token.trim())
      } catch {
        /* session storage unavailable; token stays in memory */
      }
      onConnect(new GithubStore(client, repo, branch), client)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-6 py-16">
      <h1 className="text-3xl font-bold">Portfolio CMS</h1>
      {localOk && (
        <div className="card space-y-3 p-5">
          <h2 className="font-semibold">Edit local files</h2>
          <p className="text-sm text-zinc-500">The dev server is running, so changes can be saved straight into this checkout. Commit them with git afterwards.</p>
          <button type="button" className="btn-primary" onClick={() => onConnect(new LocalStore(), new GithubClient(token.trim() || undefined))}>
            Use local files
          </button>
        </div>
      )}
      <div className="card space-y-4 p-5">
        <h2 className="font-semibold">Edit through GitHub</h2>
        <p className="text-sm text-zinc-500">
          Saving commits the change to the repo, and the hosting provider redeploys the site. Use a fine-grained personal access token limited to the
          portfolio repo with <strong>Contents: read and write</strong>. Add read access to other repos if you want to import from private ones. The token is
          kept only in this browser tab.
        </p>
        <Field id="cms-token" label="GitHub token">
          <TextInput id="cms-token" type="password" value={token} onChange={setToken} autoComplete="off" placeholder="github_pat_…" />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field id="cms-repo" label="Repository">
            <TextInput id="cms-repo" value={repo} onChange={setRepo} />
          </Field>
          <Field id="cms-branch" label="Branch">
            <TextInput id="cms-branch" value={branch} onChange={setBranch} />
          </Field>
        </div>
        {error && <Notice kind="error">{error}</Notice>}
        <button type="button" className="btn-primary" onClick={connectGithub} disabled={busy || !token.trim()}>
          {busy ? 'Connecting…' : 'Connect'}
        </button>
      </div>
      <Link to="/" className="text-sm text-accent-700 hover:underline dark:text-accent-400">
        ← Back to the site
      </Link>
    </div>
  )
}

async function loadAll<T>(store: ContentStore, dir: string, parse: (v: unknown) => T): Promise<{ items: T[]; errors: string[] }> {
  const names = (await store.list(dir)).filter((n) => n.endsWith('.json'))
  const items: T[] = []
  const errors: string[] = []
  await Promise.all(
    names.map(async (n) => {
      try {
        const text = await store.read(`${dir}/${n}`)
        if (text) items.push(parse(JSON.parse(text)))
      } catch (err) {
        errors.push(`${dir}/${n}: ${zodMessage(err)}`)
      }
    }),
  )
  return { items, errors }
}

function SiteSettings({ store }: { store: ContentStore }) {
  const [text, setText] = useState('')
  const [msg, setMsg] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null)
  useEffect(() => {
    store.read('content/site.json').then((t) => setText(t ?? ''))
  }, [store])
  async function save() {
    try {
      const parsed = siteSchema.parse(JSON.parse(text))
      await store.writeText('content/site.json', JSON.stringify(parsed, null, 2) + '\n', 'cms: update site settings')
      setMsg({ kind: 'ok', text: 'Saved.' })
    } catch (err) {
      setMsg({ kind: 'error', text: zodMessage(err) })
    }
  }
  return (
    <div className="space-y-4">
      <p className="text-sm text-zinc-500">Name, tagline, about text, highlights, contact details and social links.</p>
      <TextArea id="site-json" rows={28} value={text} onChange={setText} mono />
      {msg && <Notice kind={msg.kind}>{msg.text}</Notice>}
      <button type="button" className="btn-primary" onClick={save}>
        Save settings
      </button>
    </div>
  )
}

function Workspace({ store, github, onDisconnect }: { store: ContentStore; github: GithubClient; onDisconnect: () => void }) {
  const [tab, setTab] = useState<Tab>('projects')
  const [projects, setProjects] = useState<Project[]>([])
  const [timeline, setTimeline] = useState<TimelineEntry[]>([])
  const [errors, setErrors] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [editProject, setEditProject] = useState<Editing<Project>>(null)
  const [editEntry, setEditEntry] = useState<Editing<TimelineEntry>>(null)

  const reload = useCallback(async () => {
    const [p, t] = await Promise.all([loadAll(store, 'content/projects', (v) => projectSchema.parse(v)), loadAll(store, 'content/timeline', (v) => timelineSchema.parse(v))])
    setProjects(p.items.sort((a, b) => a.order - b.order || a.title.localeCompare(b.title)))
    setTimeline(t.items.sort(compareTimeline))
    setErrors([...p.errors, ...t.errors])
    setLoading(false)
  }, [store])

  useEffect(() => {
    reload()
  }, [reload])

  const tabBtn = (t: Tab, label: string) => (
    <button
      type="button"
      role="tab"
      aria-selected={tab === t}
      onClick={() => {
        setTab(t)
        setEditProject(null)
        setEditEntry(null)
      }}
      className={`rounded-lg px-3 py-2 text-sm font-medium ${tab === t ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900' : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900'}`}
    >
      {label}
    </button>
  )

  return (
    <div className="py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Portfolio CMS</h1>
          <p className="text-sm text-zinc-500">Saving to: {store.label}</p>
        </div>
        <div className="flex gap-2">
          <Link to="/" className="btn-ghost">
            View site
          </Link>
          <button type="button" className="btn-ghost" onClick={onDisconnect}>
            Disconnect
          </button>
        </div>
      </div>

      <div role="tablist" className="mt-6 flex gap-1">
        {tabBtn('projects', `Projects (${projects.length})`)}
        {tabBtn('timeline', `Timeline (${timeline.length})`)}
        {tabBtn('site', 'Site settings')}
      </div>

      {errors.length > 0 && (
        <div className="mt-4">
          <Notice kind="error">{`Some files could not be read:\n${errors.join('\n')}`}</Notice>
        </div>
      )}

      <div className="mt-6">
        {loading && <p className="text-sm text-zinc-500">Loading…</p>}

        {!loading && tab === 'projects' &&
          (editProject ? (
            <div>
              <button type="button" className="mb-4 text-sm text-accent-700 hover:underline dark:text-accent-400" onClick={() => setEditProject(null)}>
                ← All projects
              </button>
              <h2 className="mb-6 text-xl font-semibold">{editProject.originalSlug ? `Edit: ${editProject.item.title}` : 'New project'}</h2>
              <ProjectEditor
                key={editProject.key}
                initial={editProject.item}
                originalSlug={editProject.originalSlug}
                store={store}
                github={github}
                timelineSlugs={timeline.map((t) => t.slug)}
                onSaved={(p) => {
                  setEditProject((cur) => ({ item: p, originalSlug: p.slug, key: cur?.key ?? ++editorKey }))
                  reload()
                }}
                onDeleted={() => {
                  setEditProject(null)
                  reload()
                }}
              />
            </div>
          ) : (
            <div>
              <button type="button" className="btn-primary mb-4" onClick={() => setEditProject({ item: emptyProject(), key: ++editorKey })}>
                Add project
              </button>
              <ul className="divide-y divide-zinc-200 rounded-xl border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
                {projects.map((p) => (
                  <li key={p.slug}>
                    <button type="button" onClick={() => setEditProject({ item: p, originalSlug: p.slug, key: ++editorKey })} className="flex w-full items-center justify-between gap-3 p-4 text-left hover:bg-zinc-50 dark:hover:bg-zinc-900">
                      <span>
                        <span className="font-medium">{p.title}</span>
                        <span className="ml-2 text-sm text-zinc-500">{p.summary.slice(0, 80)}</span>
                      </span>
                      <span className="shrink-0 text-xs text-zinc-500">
                        {p.featured ? '★ ' : ''}
                        {p.status} · {p.media.length} media
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}

        {!loading && tab === 'timeline' &&
          (editEntry ? (
            <div>
              <button type="button" className="mb-4 text-sm text-accent-700 hover:underline dark:text-accent-400" onClick={() => setEditEntry(null)}>
                ← Whole timeline
              </button>
              <h2 className="mb-6 text-xl font-semibold">{editEntry.originalSlug ? `Edit: ${editEntry.item.title} · ${editEntry.item.org}` : 'New timeline entry'}</h2>
              <TimelineEditor
                key={editEntry.key}
                initial={editEntry.item}
                originalSlug={editEntry.originalSlug}
                store={store}
                projectSlugs={projects.map((p) => p.slug)}
                onSaved={(t) => {
                  setEditEntry((cur) => ({ item: t, originalSlug: t.slug, key: cur?.key ?? ++editorKey }))
                  reload()
                }}
                onDeleted={() => {
                  setEditEntry(null)
                  reload()
                }}
              />
            </div>
          ) : (
            <div>
              <button type="button" className="btn-primary mb-4" onClick={() => setEditEntry({ item: emptyEntry(), key: ++editorKey })}>
                Add entry
              </button>
              <ul className="divide-y divide-zinc-200 rounded-xl border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
                {timeline.map((t) => (
                  <li key={t.slug}>
                    <button type="button" onClick={() => setEditEntry({ item: t, originalSlug: t.slug, key: ++editorKey })} className="flex w-full items-center justify-between gap-3 p-4 text-left hover:bg-zinc-50 dark:hover:bg-zinc-900">
                      <span>
                        <span className="font-medium">{t.title}</span> <span className="text-zinc-500">· {t.org}</span>
                      </span>
                      <span className="shrink-0 text-xs text-zinc-500">
                        {t.kind} · {t.dateLabel ?? `${t.start} – ${t.end ?? 'present'}`}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}

        {!loading && tab === 'site' && <SiteSettings store={store} />}
      </div>
    </div>
  )
}

export function AdminApp() {
  const [conn, setConn] = useState<{ store: ContentStore; github: GithubClient } | null>(null)
  useEffect(() => {
    document.title = 'CMS · Portfolio'
    const meta = document.createElement('meta')
    meta.name = 'robots'
    meta.content = 'noindex'
    document.head.appendChild(meta)
    return () => meta.remove()
  }, [])
  return (
    <div className="container-page min-h-screen">
      {conn ? (
        <Workspace
          store={conn.store}
          github={conn.github}
          onDisconnect={() => {
            try {
              sessionStorage.removeItem(TOKEN_KEY)
            } catch {
              /* ignore */
            }
            setConn(null)
          }}
        />
      ) : (
        <Connect onConnect={(store, github) => setConn({ store, github })} />
      )}
    </div>
  )
}
