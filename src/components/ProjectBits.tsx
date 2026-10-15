import { Link } from 'react-router'
import type { Project } from '../content/schema'
import { ExternalIcon, GithubIcon } from './Icons'
import { activityFor } from '../content/activity'
import { ActivityStrip, CompletenessMeter } from './Activity'
import { useSpotlight } from './motion'

const statusStyles: Record<Project['status'], { label: string; dot: string }> = {
  live: { label: 'Live', dot: 'bg-emerald-400' },
  'in-progress': { label: 'In progress', dot: 'bg-sky-400' },
  'coming-soon': { label: 'Coming soon', dot: 'bg-amber-400' },
  archived: { label: 'Archive', dot: 'bg-zinc-400' },
}

export function StatusBadge({ status }: { status: Project['status'] }) {
  const s = statusStyles[status]
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-bg/70 px-2.5 py-0.5 text-xs font-medium text-muted backdrop-blur">
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot} ${status === 'live' || status === 'in-progress' ? 'animate-pulse' : ''}`} aria-hidden />
      {s.label}
    </span>
  )
}

export function Tags({ items, limit }: { items: string[]; limit?: number }) {
  const shown = limit ? items.slice(0, limit) : items
  const rest = limit ? items.length - shown.length : 0
  return (
    <ul className="flex flex-wrap gap-1.5" aria-label="Technologies">
      {shown.map((t) => (
        <li key={t} className="chip">
          {t}
        </li>
      ))}
      {rest > 0 && <li className="px-1 py-0.5 font-mono text-[11px] text-muted">+{rest}</li>}
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

/** Deterministic hue pair per project so placeholder covers differ. */
function hues(slug: string) {
  let h = 0
  for (const c of slug) h = (h * 31 + c.charCodeAt(0)) % 360
  return [h, (h + 70) % 360]
}

function Cover({ project, large }: { project: Project; large?: boolean }) {
  const image = project.media.find((m) => m.type === 'image')
  const height = large ? 'h-56 sm:h-72' : 'h-44'
  if (image) {
    return (
      <div className={`overflow-hidden ${height}`}>
        <img src={image.src} alt={image.alt || `${project.title} screenshot`} loading="lazy" className="h-full w-full object-cover object-top transition-transform duration-700 group-hover:scale-105" />
      </div>
    )
  }
  const [a, b] = hues(project.slug)
  return (
    <div className={`relative overflow-hidden ${height}`} aria-hidden>
      <div
        className="absolute inset-0 transition-transform duration-700 group-hover:scale-110"
        style={{ background: `radial-gradient(circle at 20% 20%, hsl(${a} 80% 55% / 0.55), transparent 55%), radial-gradient(circle at 80% 70%, hsl(${b} 80% 55% / 0.45), transparent 55%), var(--bg-soft)` }}
      />
      <div className="grid-bg absolute inset-0 opacity-60" />
      <span className="absolute right-5 bottom-3 font-display text-7xl font-bold tracking-tighter text-fg/10 transition-transform duration-700 group-hover:-translate-y-1 sm:text-8xl">
        {project.title.split(/\s+/).map((w) => w[0]).join('').slice(0, 3)}
      </span>
      <span className="absolute bottom-4 left-5 font-mono text-xs text-fg/70">{project.stack.slice(0, 3).join(' · ')}</span>
    </div>
  )
}

export function ProjectCard({ project, large }: { project: Project; large?: boolean }) {
  const ref = useSpotlight<HTMLElement>()
  const activity = activityFor(project.slug)
  return (
    <article ref={ref} className="spotlight card group relative flex h-full flex-col overflow-hidden transition-transform duration-500 hover:-translate-y-1">
      <div className={`relative ${project.status === 'archived' ? 'grayscale-[0.7] transition-[filter] duration-500 group-hover:grayscale-0' : ''}`}>
        <Cover project={project} large={large} />
        <div className="absolute top-4 left-4">
          <StatusBadge status={project.status} />
        </div>
        <div className="absolute top-3 right-3 rounded-full bg-card/85 p-0.5 backdrop-blur [&:has(>span:not([role]))]:rounded-md [&:has(>span:not([role]))]:px-1.5 [&:has(>span:not([role]))]:py-1">
          <CompletenessMeter project={project} size={large ? 48 : 42} />
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-6">
        <h3 className={`font-semibold tracking-tight ${large ? 'text-2xl' : 'text-xl'}`}>
          <Link to={`/projects/${project.slug}`} viewTransition className="after:absolute after:inset-0 after:z-[2]">
            {project.title}
            <span className="ml-1 inline-block text-accent-400 opacity-0 transition-all duration-300 group-hover:translate-x-1 group-hover:opacity-100" aria-hidden>
              →
            </span>
          </Link>
        </h3>
        <p className="text-sm leading-relaxed text-muted">{project.summary}</p>
        {activity && activity.commits > 0 && (
          <div className="flex items-center gap-3 text-xs text-muted">
            <ActivityStrip activity={activity} />
            <span className="font-mono">
              {activity.commits} {activity.commits === 1 ? 'commit' : 'commits'}
            </span>
          </div>
        )}
        <div className="mt-auto flex items-end justify-between gap-3 pt-2">
          <Tags items={project.stack} limit={large ? 6 : 4} />
          <div className="relative z-[3] flex shrink-0 gap-1">
            {project.repo?.visibility === 'public' && (
              <a href={project.repo.url} target="_blank" rel="noreferrer" className="grid h-8 w-8 place-items-center rounded-full text-muted transition-colors hover:bg-chip hover:text-fg" aria-label={`${project.title} source on GitHub`}>
                <GithubIcon width={16} height={16} />
              </a>
            )}
            {project.demoUrl && (
              <a href={project.demoUrl} target="_blank" rel="noreferrer" className="grid h-8 w-8 place-items-center rounded-full text-muted transition-colors hover:bg-chip hover:text-fg" aria-label={`${project.title} live demo`}>
                <ExternalIcon />
              </a>
            )}
          </div>
        </div>
      </div>
    </article>
  )
}
