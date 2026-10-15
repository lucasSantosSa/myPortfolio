import { Link } from 'react-router'
import type { Project } from '../content/schema'
import { ExternalIcon, GithubIcon } from './Icons'

const statusStyles: Record<Project['status'], { label: string; cls: string }> = {
  live: { label: 'Live', cls: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' },
  'in-progress': { label: 'In progress', cls: 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300' },
  'coming-soon': { label: 'Coming soon', cls: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' },
  archived: { label: 'Archive', cls: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300' },
}

export function StatusBadge({ status }: { status: Project['status'] }) {
  const s = statusStyles[status]
  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${s.cls}`}>{s.label}</span>
}

export function Tags({ items, limit }: { items: string[]; limit?: number }) {
  const shown = limit ? items.slice(0, limit) : items
  const rest = limit ? items.length - shown.length : 0
  return (
    <ul className="flex flex-wrap gap-1.5" aria-label="Technologies">
      {shown.map((t) => (
        <li key={t} className="rounded-md bg-zinc-100 px-2 py-0.5 font-mono text-xs text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
          {t}
        </li>
      ))}
      {rest > 0 && <li className="px-1 text-xs text-zinc-500">+{rest}</li>}
    </ul>
  )
}

export const categoryLabels: Record<Project['category'], string> = {
  web: 'Web apps',
  ai: 'AI',
  tools: 'Tools & automation',
  systems: 'Systems',
  showcase: 'Showcase rebuilds',
}

function Cover({ project }: { project: Project }) {
  const image = project.media.find((m) => m.type === 'image')
  if (image) {
    return <img src={image.src} alt={image.alt || `${project.title} screenshot`} loading="lazy" className="aspect-video w-full rounded-t-2xl object-cover object-top" />
  }
  // Text cover for projects without screenshots yet
  return (
    <div className="relative flex h-32 w-full items-end overflow-hidden rounded-t-2xl bg-gradient-to-br from-accent-700 to-zinc-900 p-5 dark:from-accent-900 dark:to-zinc-950" aria-hidden>
      <span className="absolute -top-2 right-3 font-mono text-[5.5rem] leading-none font-bold text-white/10 select-none">{project.title.slice(0, 2)}</span>
      <span className="relative font-mono text-sm text-accent-100/90">{project.stack.slice(0, 3).join(' · ')}</span>
    </div>
  )
}

export function ProjectCard({ project }: { project: Project }) {
  return (
    <article className="card group relative flex flex-col overflow-hidden transition-shadow hover:shadow-lg">
      <Cover project={project} />
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            <Link to={`/projects/${project.slug}`} className="after:absolute after:inset-0">
              {project.title}
            </Link>
          </h3>
          <StatusBadge status={project.status} />
        </div>
        <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{project.summary}</p>
        <div className="mt-auto flex items-end justify-between gap-3">
          <Tags items={project.stack} limit={4} />
          <div className="relative z-10 flex shrink-0 gap-1">
            {project.repo?.visibility === 'public' && (
              <a href={project.repo.url} target="_blank" rel="noreferrer" className="rounded-lg p-1.5 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100" aria-label={`${project.title} source on GitHub`}>
                <GithubIcon width={18} height={18} />
              </a>
            )}
            {project.demoUrl && (
              <a href={project.demoUrl} target="_blank" rel="noreferrer" className="rounded-lg p-1.5 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100" aria-label={`${project.title} live demo`}>
                <ExternalIcon width={18} height={18} />
              </a>
            )}
          </div>
        </div>
      </div>
    </article>
  )
}
