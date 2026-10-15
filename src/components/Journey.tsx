import { Link } from 'react-router'
import { compareChronological, type TimelineEntry } from '../content/schema'
import { Reveal, useScrollProgress } from './motion'

const kindStyle: Record<TimelineEntry['kind'], string> = {
  activity: 'from-amber-400 to-pink-500',
  design: 'from-pink-400 to-violet-500',
  teaching: 'from-sky-400 to-indigo-500',
  education: 'from-violet-400 to-indigo-500',
  freelance: 'from-emerald-400 to-accent-500',
  work: 'from-accent-400 to-violet-500',
}

const year = (e: TimelineEntry) => (e.start ? e.start.slice(0, 4) : (e.dateLabel ?? ''))

/** The whole career as one compact path, oldest first, linking into the full timeline. */
export function Journey({ entries }: { entries: TimelineEntry[] }) {
  const path = [...entries].sort(compareChronological)
  const [ref, progress] = useScrollProgress<HTMLOListElement>()
  return (
    <ol ref={ref} className="relative">
      <span className="absolute top-3 bottom-3 left-[63px] w-0.5 rounded-full bg-line sm:left-[83px]" aria-hidden />
      <span
        className="absolute top-3 left-[63px] w-0.5 origin-top rounded-full bg-gradient-to-b from-amber-400 via-accent-400 to-violet-500 sm:left-[83px]"
        style={{ height: 'calc(100% - 1.5rem)', transform: `scaleY(${progress})` }}
        aria-hidden
      />
      {path.map((e, i) => (
        <li key={e.slug} className="relative">
          <Reveal delay={Math.min(i, 4) * 50}>
            <Link
              to={`/experience#${e.slug}`}
              viewTransition
              className="group grid grid-cols-[44px_1fr] items-start gap-x-5 rounded-2xl py-3 pr-3 transition-colors hover:bg-card/70 sm:grid-cols-[60px_1fr] sm:gap-x-6"
            >
              <span className="pt-0.5 text-right font-mono text-xs text-muted">{year(e)}</span>
              <span className="relative pl-6">
                <span
                  className={`absolute top-1 -left-[7px] h-3.5 w-3.5 rounded-full border-[3px] border-bg bg-gradient-to-br ${kindStyle[e.kind]} transition-transform duration-300 group-hover:scale-150`}
                  aria-hidden
                />
                <span className="block font-medium text-fg">
                  {e.title}
                  <span className="ml-1 inline-block text-accent-400 opacity-0 transition-all duration-300 group-hover:translate-x-1 group-hover:opacity-100" aria-hidden>
                    →
                  </span>
                </span>
                <span className="block text-sm text-muted">{e.org}</span>
              </span>
            </Link>
          </Reveal>
        </li>
      ))}
    </ol>
  )
}
