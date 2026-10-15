import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { projectBySlug } from '../content/load'
import type { TimelineEntry } from '../content/schema'
import { formatDuration, formatPeriod } from '../lib/format'
import { Tags } from './ProjectBits'

const kindLabel: Record<TimelineEntry['kind'], string> = {
  work: 'Work',
  freelance: 'Freelance',
  education: 'Education',
  teaching: 'Teaching',
  design: 'Design',
  activity: 'Activity',
}

function Entry({ entry, compact }: { entry: TimelineEntry; compact?: boolean }) {
  const related = entry.relatedProjects.map(projectBySlug).filter((p) => p !== undefined)
  return (
    <li className="relative pb-10 pl-8 last:pb-0">
      <span className="absolute top-3 bottom-0 left-[5px] w-px bg-zinc-200 dark:bg-zinc-800 [li:last-child>&]:hidden" aria-hidden />
      <span className="absolute top-1.5 left-0 h-3 w-3 rounded-full border-2 border-accent-600 bg-white dark:bg-zinc-950" aria-hidden />
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          {entry.title} <span className="font-normal text-zinc-500">· {entry.org}</span>
        </h3>
        {entry.contract && <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">Contract</span>}
        {entry.kind !== 'work' && <span className="rounded-full bg-accent-50 px-2 py-0.5 text-xs font-medium text-accent-700 dark:bg-accent-900/40 dark:text-accent-300">{kindLabel[entry.kind]}</span>}
      </div>
      <p className="mt-1 text-sm text-zinc-500">
        {formatPeriod(entry.start, entry.end)} · {formatDuration(entry.start, entry.end)}
        {entry.location ? ` · ${entry.location}` : ''}
      </p>
      <p className="mt-3 leading-relaxed text-zinc-700 dark:text-zinc-300">{entry.summary}</p>
      {!compact && entry.highlights.length > 0 && (
        <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          {entry.highlights.map((h) => (
            <li key={h}>{h}</li>
          ))}
        </ul>
      )}
      {!compact && entry.growth && (
        <p className="mt-3 border-l-2 border-accent-500 pl-3 text-sm text-zinc-600 italic dark:text-zinc-400">{entry.growth}</p>
      )}
      {entry.stack.length > 0 && (
        <div className="mt-3">
          <Tags items={entry.stack} limit={compact ? 6 : undefined} />
        </div>
      )}
      {!compact && related.length > 0 && (
        <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
          {entry.kind === 'work' ? 'A similar pattern, built from scratch: ' : 'Projects: '}
          {related.map((p, i) => (
            <span key={p.slug}>
              {i > 0 && ', '}
              <Link to={`/projects/${p.slug}`} className="font-medium text-accent-700 underline-offset-2 hover:underline dark:text-accent-400">
                {p.title}
              </Link>
            </span>
          ))}
        </p>
      )}
    </li>
  )
}

export function Timeline({ entries, compact, filterable }: { entries: TimelineEntry[]; compact?: boolean; filterable?: boolean }) {
  const [tech, setTech] = useState<string | null>(null)
  const allTech = useMemo(() => {
    const counts = new Map<string, number>()
    entries.forEach((e) => e.stack.forEach((s) => counts.set(s, (counts.get(s) ?? 0) + 1)))
    return [...counts.entries()].filter(([, n]) => n > 1).sort((a, b) => b[1] - a[1]).map(([s]) => s)
  }, [entries])
  const shown = tech ? entries.filter((e) => e.stack.includes(tech)) : entries

  return (
    <div>
      {filterable && (
        <div className="mb-8">
          <p id="tech-filter" className="mb-2 text-sm font-medium text-zinc-600 dark:text-zinc-400">
            Filter by technology
          </p>
          <div role="group" aria-labelledby="tech-filter" className="flex flex-wrap gap-2">
            {[null, ...allTech].map((t) => (
              <button
                key={t ?? 'all'}
                type="button"
                aria-pressed={tech === t}
                onClick={() => setTech(t)}
                className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                  tech === t
                    ? 'border-accent-600 bg-accent-600 text-white dark:border-accent-400 dark:bg-accent-400 dark:text-zinc-950'
                    : 'border-zinc-300 text-zinc-700 hover:border-zinc-400 dark:border-zinc-700 dark:text-zinc-300'
                }`}
              >
                {t ?? 'All'}
              </button>
            ))}
          </div>
          <p className="mt-2 text-sm text-zinc-500" aria-live="polite">
            {tech ? `${shown.length} roles used ${tech}` : `${entries.length} entries`}
          </p>
        </div>
      )}
      <ol className="relative">
        {shown.map((e) => (
          <Entry key={e.slug} entry={e} compact={compact} />
        ))}
      </ol>
    </div>
  )
}
