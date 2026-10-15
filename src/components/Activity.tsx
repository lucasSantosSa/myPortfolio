import { useMemo } from 'react'
import type { GithubCalendar, ProjectActivity } from '../content/activity'
import { projectProgress, type Project } from '../content/schema'
import { useInView } from './motion'

const DAY = 86_400_000
const iso = (d: Date) => d.toISOString().slice(0, 10)
const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** Sunday-aligned weeks covering [from, to]. */
function weeksBetween(from: Date, to: Date): Date[][] {
  const start = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate() - from.getUTCDay()))
  const weeks: Date[][] = []
  for (let t = start.getTime(); t <= to.getTime(); t += 7 * DAY) {
    weeks.push(Array.from({ length: 7 }, (_, i) => new Date(t + i * DAY)))
  }
  return weeks
}

function level(count: number, max: number): number {
  if (!count) return 0
  if (max <= 4) return Math.min(4, count)
  return Math.min(4, Math.ceil((count / max) * 4))
}

const levelColor = (l: number) => (l === 0 ? 'var(--chip)' : `rgb(var(--glow-a) / ${[0, 0.35, 0.55, 0.78, 1][l]})`)
// SVG cells use fill, HTML swatches use background
const levelStyle = (l: number) => ({ background: levelColor(l), fill: levelColor(l) })

/** GitHub-style grid of squares, one per day. */
export function ActivityGrid({ days, from, to, cell = 11, label }: { days: Record<string, number>; from: Date; to: Date; cell?: number; label: string }) {
  const [ref, inView] = useInView<HTMLDivElement>({ threshold: 0 })
  const weeks = useMemo(() => weeksBetween(from, to), [from, to])
  const max = Math.max(1, ...Object.values(days))
  const gap = 3
  const monthLabels = weeks
    .map((w, i) => ({ i, d: w[0] }))
    .filter(({ d, i }) => i === 0 || d.getUTCDate() <= 7)
    .map(({ i, d }) => ({ x: i * (cell + gap), text: months[d.getUTCMonth()] }))

  return (
    <div ref={ref} className="overflow-x-auto [scrollbar-width:thin]">
      <svg
        role="img"
        aria-label={label}
        width={weeks.length * (cell + gap)}
        height={7 * (cell + gap) + 16}
        className="block"
      >
        {monthLabels.map((m) => (
          <text key={`${m.x}-${m.text}`} x={m.x} y={10} className="fill-[var(--muted)] font-mono text-[9px]">
            {m.text}
          </text>
        ))}
        {weeks.map((w, wi) =>
          w.map((d, di) => {
            const key = iso(d)
            const count = days[key] ?? 0
            const future = d.getTime() > to.getTime()
            if (future) return null
            return (
              <rect
                key={key}
                x={wi * (cell + gap)}
                y={16 + di * (cell + gap)}
                width={cell}
                height={cell}
                rx={2.5}
                style={{
                  ...levelStyle(level(count, max)),
                  opacity: inView ? 1 : 0,
                  transition: `opacity 0.4s ease ${Math.min(wi * 12, 900)}ms`,
                }}
              >
                <title>{`${count || 'No'} ${count === 1 ? 'contribution' : 'contributions'} on ${key}`}</title>
              </rect>
            )
          }),
        )}
      </svg>
    </div>
  )
}

export function Legend() {
  return (
    <span className="inline-flex items-center gap-1.5 font-mono text-[10px] text-muted" aria-hidden>
      Less
      {[0, 1, 2, 3, 4].map((l) => (
        <span key={l} className="h-2.5 w-2.5 rounded-[3px]" style={levelStyle(l)} />
      ))}
      More
    </span>
  )
}

/** Weekly commit strip for cards: one square per week across the project's life (max ~26). */
export function ActivityStrip({ activity }: { activity: ProjectActivity }) {
  const cells = useMemo(() => {
    if (!activity.first) return []
    const to = new Date(`${activity.last}T00:00:00Z`)
    const from = new Date(Math.min(new Date(`${activity.first}T00:00:00Z`).getTime(), to.getTime() - 15 * 7 * DAY))
    const weeks = weeksBetween(from, to).slice(-26)
    return weeks.map((w) => w.reduce((sum, d) => sum + (activity.days[iso(d)] ?? 0), 0))
  }, [activity])
  const max = Math.max(1, ...cells)
  return (
    <span className="flex items-center gap-[3px]" aria-label={`${activity.commits} commits on ${activity.activeDays} days`} role="img">
      {cells.map((c, i) => (
        <span key={i} className="h-2.5 w-2.5 rounded-[3px]" style={levelStyle(level(c, max))} />
      ))}
    </span>
  )
}

/** Ring showing how complete a project is; archived projects get a stamp instead. */
export function CompletenessMeter({ project, size = 44 }: { project: Project; size?: number }) {
  const [ref, inView] = useInView<HTMLSpanElement>({ threshold: 0 })
  const pct = projectProgress(project)
  if (project.status === 'archived') {
    return (
      <span className="inline-flex -rotate-6 items-center rounded-md border-2 border-current px-2 py-0.5 font-mono text-[10px] font-bold tracking-[0.2em] text-muted uppercase opacity-80">
        Archived
      </span>
    )
  }
  const r = (size - 6) / 2
  const c = 2 * Math.PI * r
  return (
    <span ref={ref} className="relative inline-grid place-items-center" style={{ width: size, height: size }} role="img" aria-label={`${pct}% complete`}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--line)" strokeWidth="4" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgb(var(--glow-a))"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={inView ? c * (1 - pct / 100) : c}
          style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.2,0.7,0.2,1)' }}
        />
      </svg>
      <span className="absolute font-mono text-[10px] font-semibold">{pct}%</span>
    </span>
  )
}

/** The last year of GitHub contributions, public and private. */
export function ContributionCalendar({ calendar }: { calendar: GithubCalendar }) {
  const days = useMemo(() => Object.fromEntries(calendar.days.map((d) => [d.date, d.count])), [calendar])
  const to = new Date(`${calendar.days.at(-1)!.date}T00:00:00Z`)
  const from = new Date(`${calendar.days[0].date}T00:00:00Z`)
  const streak = useMemo(() => {
    let best = 0
    let cur = 0
    for (const d of calendar.days) {
      cur = d.count ? cur + 1 : 0
      best = Math.max(best, cur)
    }
    return best
  }, [calendar])
  const weeklyActive = useMemo(() => {
    const weeks = weeksBetween(from, to)
    return Math.round((weeks.filter((w) => w.some((d) => days[iso(d)])).length / weeks.length) * 100)
  }, [days, from, to])

  return (
    <div className="card p-6 sm:p-8">
      <dl className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { v: calendar.total.toLocaleString('en'), l: 'contributions in the last year' },
          { v: String(calendar.activeDays), l: 'days with commits' },
          { v: `${weeklyActive}%`, l: 'of weeks active' },
          { v: `${streak} days`, l: 'longest streak' },
        ].map((s) => (
          <div key={s.l}>
            <dt className="sr-only">{s.l}</dt>
            <dd className="font-display text-3xl font-semibold tracking-tight">{s.v}</dd>
            <dd className="text-sm text-muted">{s.l}</dd>
          </div>
        ))}
      </dl>
      <ActivityGrid days={days} from={from} to={to} label={`${calendar.total} GitHub contributions in the last year`} />
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
        <span>
          From{' '}
          <a href={`https://github.com/${calendar.user}`} target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:text-fg">
            github.com/{calendar.user}
          </a>
          , including private client work · updated {calendar.syncedAt}
        </span>
        <Legend />
      </div>
    </div>
  )
}

/** Project page: commit grid over the project's life, plus totals. */
export function ProjectActivityPanel({ activity }: { activity: ProjectActivity }) {
  if (!activity.first || !activity.last) return null
  const last = new Date(`${activity.last}T00:00:00Z`)
  const first = new Date(`${activity.first}T00:00:00Z`)
  const from = new Date(Math.min(first.getTime(), last.getTime() - 20 * 7 * DAY))
  return (
    <div className="card p-5 sm:p-6">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-mono text-xs tracking-widest text-muted uppercase">Commit activity</h2>
        <p className="text-sm text-muted">
          <span className="font-semibold text-fg">{activity.commits}</span> commits on <span className="font-semibold text-fg">{activity.activeDays}</span> days
        </p>
      </div>
      <ActivityGrid days={activity.days} from={from} to={last} label={`${activity.commits} commits between ${activity.first} and ${activity.last}`} />
      <div className="mt-3 flex justify-end">
        <Legend />
      </div>
    </div>
  )
}
