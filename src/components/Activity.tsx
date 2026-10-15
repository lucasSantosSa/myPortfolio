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

/** One square per commit, oldest first; busier days glow brighter. Undated on purpose: it shows how much work went in, not when. */
function commitCells(activity: ProjectActivity, cap: number) {
  const max = Math.max(1, ...Object.values(activity.days))
  const cells: number[] = []
  for (const [, count] of Object.entries(activity.days).sort(([a], [b]) => a.localeCompare(b))) {
    for (let i = 0; i < count; i++) cells.push(level(count, max))
  }
  return { cells: cells.slice(-cap), hidden: Math.max(0, cells.length - cap) }
}

/** Card strip: a row of commit squares. */
export function ActivityStrip({ activity }: { activity: ProjectActivity }) {
  const [ref, inView] = useInView<HTMLSpanElement>({ threshold: 0 })
  const { cells, hidden } = useMemo(() => commitCells(activity, 14), [activity])
  return (
    <span ref={ref} className="flex items-center gap-[3px]" aria-label={`${activity.commits} commits`} role="img">
      {cells.map((l, i) => (
        <span
          key={i}
          className="h-2.5 w-2.5 rounded-[3px]"
          style={{ ...levelStyle(Math.max(1, l)), opacity: inView ? 1 : 0, transform: inView ? 'none' : 'scale(0.4)', transition: `all 0.35s ease ${i * 35}ms` }}
        />
      ))}
      {hidden > 0 && <span className="ml-1 font-mono text-[10px] text-muted">+{hidden}</span>}
    </span>
  )
}

/** Project page: a GitHub-like block where each square is one commit. */
export function CommitBlock({ activity, cell = 12 }: { activity: ProjectActivity; cell?: number }) {
  const [ref, inView] = useInView<HTMLDivElement>({ threshold: 0 })
  const { cells, hidden } = useMemo(() => commitCells(activity, 7 * 30), [activity])
  const rows = 7
  return (
    <div ref={ref}>
      <div className="grid w-max grid-flow-col gap-[3px]" style={{ gridTemplateRows: `repeat(${rows}, ${cell}px)` }} role="img" aria-label={`${activity.commits} commits, one square each`}>
        {cells.map((l, i) => (
          <span
            key={i}
            className="rounded-[3px]"
            style={{ width: cell, height: cell, ...levelStyle(Math.max(1, l)), opacity: inView ? 1 : 0, transform: inView ? 'none' : 'scale(0.3)', transition: `all 0.4s ease ${Math.min(i * 18, 1400)}ms` }}
          />
        ))}
      </div>
      {hidden > 0 && <p className="mt-2 font-mono text-xs text-muted">+{hidden} more</p>}
    </div>
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

/** Project page: commit block plus totals. */
export function ProjectActivityPanel({ activity }: { activity: ProjectActivity }) {
  if (!activity.commits) return null
  return (
    <div className="card p-5 sm:p-6">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-mono text-xs tracking-widest text-muted uppercase">Commit activity</h2>
        <p className="text-sm text-muted">
          <span className="font-semibold text-fg">{activity.commits}</span> {activity.commits === 1 ? 'commit' : 'commits'} ·{' '}
          <span className="font-semibold text-fg">{activity.activeDays}</span> {activity.activeDays === 1 ? 'working session' : 'working sessions'}
        </p>
      </div>
      <div className="overflow-x-auto">
        <CommitBlock activity={activity} />
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
        <span>Each square is one commit; brighter squares came from busier days.</span>
        <Legend />
      </div>
    </div>
  )
}
