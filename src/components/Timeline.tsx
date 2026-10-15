import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { projectBySlug } from '../content/load'
import type { TimelineEntry } from '../content/schema'
import { formatDuration, formatPeriod } from '../lib/format'
import { Reveal, useScrollProgress } from './motion'
import { Tags } from './ProjectBits'

const kindLabel: Record<TimelineEntry['kind'], string> = {
  work: 'Work',
  freelance: 'Freelance',
  education: 'Education',
  teaching: 'Teaching',
  design: 'Design',
  activity: 'Activity',
}

function Entry({ entry, compact, index }: { entry: TimelineEntry; compact?: boolean; index: number }) {
  const related = entry.relatedProjects.map(projectBySlug).filter((p) => p !== undefined)
  const current = !entry.end
  return (
    <li className="relative pb-12 pl-10 last:pb-0 sm:pl-14">
      <span
        className={`absolute top-1.5 left-[3px] h-[18px] w-[18px] rounded-full border-[3px] border-bg bg-gradient-to-br from-accent-400 to-violet-500 sm:left-[7px] ${current ? 'animate-pulse-ring' : ''}`}
        aria-hidden
      />
      <Reveal delay={Math.min(index, 3) * 60}>
        <div className="group rounded-3xl border border-transparent p-0 transition-colors sm:-m-5 sm:p-5 sm:hover:border-line sm:hover:bg-card/60">
          <p className="font-mono text-xs tracking-wide text-muted">
            {formatPeriod(entry.start, entry.end)} · {formatDuration(entry.start, entry.end)}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
            <h3 className="text-xl font-semibold tracking-tight">{entry.title}</h3>
            {entry.contract && <span className="chip">Contract</span>}
            {entry.kind !== 'work' && <span className="chip border-accent-400/40 text-accent-500 dark:text-accent-300">{kindLabel[entry.kind]}</span>}
          </div>
          <p className="mt-0.5 font-display text-lg text-muted">{entry.org}</p>
          <p className="mt-3 max-w-3xl leading-relaxed text-fg/85">{entry.summary}</p>
          {!compact && entry.highlights.length > 0 && (
            <ul className="mt-4 max-w-3xl space-y-2 text-sm leading-relaxed text-muted">
              {entry.highlights.map((h) => (
                <li key={h} className="flex gap-3">
                  <span className="mt-2 h-1 w-3 shrink-0 rounded-full bg-accent-400/70" aria-hidden />
                  {h}
                </li>
              ))}
            </ul>
          )}
          {!compact && entry.growth && (
            <p className="mt-4 max-w-3xl rounded-2xl border border-line bg-bg-soft px-4 py-3 text-sm text-fg/80">
              <span className="mr-2 font-mono text-xs tracking-widest text-accent-500 uppercase">Growth</span>
              {entry.growth}
            </p>
          )}
          {entry.stack.length > 0 && (
            <div className="mt-4">
              <Tags items={entry.stack} limit={compact ? 5 : undefined} />
            </div>
          )}
          {!compact && related.length > 0 && (
            <p className="mt-4 text-sm text-muted">
              {entry.kind === 'work' ? 'Same pattern, built from scratch: ' : 'Projects: '}
              {related.map((p, i) => (
                <span key={p.slug}>
                  {i > 0 && ', '}
                  <Link to={`/projects/${p.slug}`} viewTransition className="font-medium text-accent-500 underline-offset-4 hover:underline">
                    {p.title} →
                  </Link>
                </span>
              ))}
            </p>
          )}
        </div>
      </Reveal>
    </li>
  )
}

export function Timeline({ entries, compact, filterable }: { entries: TimelineEntry[]; compact?: boolean; filterable?: boolean }) {
  const [tech, setTech] = useState<string | null>(null)
  const [lineRef, progress] = useScrollProgress<HTMLOListElement>()
  const allTech = useMemo(() => {
    const counts = new Map<string, number>()
    entries.forEach((e) => e.stack.forEach((s) => counts.set(s, (counts.get(s) ?? 0) + 1)))
    return [...counts.entries()]
      .filter(([, n]) => n > 1)
      .sort((a, b) => b[1] - a[1])
      .map(([s]) => s)
  }, [entries])
  const shown = tech ? entries.filter((e) => e.stack.includes(tech)) : entries

  return (
    <div>
      {filterable && (
        <div className="mb-12">
          <p id="tech-filter" className="mb-3 font-mono text-xs tracking-widest text-muted uppercase">
            Filter by technology
          </p>
          <div role="group" aria-labelledby="tech-filter" className="flex flex-wrap gap-2">
            {[null, ...allTech].map((t) => (
              <button
                key={t ?? 'all'}
                type="button"
                aria-pressed={tech === t}
                onClick={() => setTech(t)}
                className={`rounded-full border px-3.5 py-1.5 text-sm transition-all duration-300 ${
                  tech === t ? 'scale-105 border-transparent bg-fg text-bg' : 'border-line text-muted hover:border-accent-400/60 hover:text-fg'
                }`}
              >
                {t ?? 'All'}
              </button>
            ))}
          </div>
          <p className="mt-3 text-sm text-muted" aria-live="polite">
            {tech ? `${shown.length} ${shown.length === 1 ? 'entry uses' : 'entries use'} ${tech}` : `${entries.length} entries`}
          </p>
        </div>
      )}
      <ol ref={lineRef} className="relative" key={tech ?? 'all'}>
        {/* track + scroll-driven fill */}
        <span className="absolute top-2 bottom-2 left-[11px] w-0.5 rounded-full bg-line sm:left-[15px]" aria-hidden />
        <span
          className="absolute top-2 left-[11px] w-0.5 origin-top rounded-full bg-gradient-to-b from-accent-400 to-violet-500 sm:left-[15px]"
          style={{ height: 'calc(100% - 1rem)', transform: `scaleY(${progress})` }}
          aria-hidden
        />
        {shown.map((e, i) => (
          <Entry key={e.slug} entry={e} compact={compact} index={i} />
        ))}
      </ol>
    </div>
  )
}
