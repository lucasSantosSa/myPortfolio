import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { projectBySlug, sidequestsFor } from '../content/load'
import { compareChronological, type TimelineEntry } from '../content/schema'
import { formatDuration, formatPeriod } from '../lib/format'
import { prefersReducedMotion, useInView } from './motion'
import { LogoPlates, PageArt, PageWash, presetHeading, presetLabel, themeStyle, usePageTheme } from './chapterThemes'
import { Tags } from './ProjectBits'
import { ChapterQuests } from './Sidequests'

const kindLabel: Record<TimelineEntry['kind'], string> = {
  work: 'Work',
  freelance: 'Freelance',
  education: 'Education',
  teaching: 'Teaching',
  design: 'Design',
  activity: 'Beginnings',
}

const kindDot: Record<TimelineEntry['kind'], string> = {
  activity: 'from-amber-400 to-pink-500',
  design: 'from-pink-400 to-violet-500',
  teaching: 'from-sky-400 to-indigo-500',
  education: 'from-violet-400 to-indigo-500',
  freelance: 'from-emerald-400 to-accent-500',
  work: 'from-accent-400 to-violet-500',
}

export function entryDates(e: TimelineEntry): string {
  if (!e.start) return e.dateLabel ?? ''
  const dates = `${formatPeriod(e.start, e.end)} · ${formatDuration(e.start, e.end)}`
  return e.dateLabel ? `${e.dateLabel} · ${dates}` : dates
}

const shortDate = (e: TimelineEntry) => (e.start ? `${e.start.slice(0, 4)}${e.end ? (e.end.slice(0, 4) !== e.start.slice(0, 4) ? `–${e.end.slice(2, 4)}` : '') : '–now'}` : (e.dateLabel ?? ''))

/** Full details for one timeline entry. */
export function EntryDetail({ entry }: { entry: TimelineEntry }) {
  const related = entry.relatedProjects.map(projectBySlug).filter((p) => p !== undefined)
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="font-mono text-xs tracking-wide text-muted">{entryDates(entry)}</p>
        <LogoPlates theme={entry.theme} />
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1">
        <h3 className={`text-2xl tracking-tight sm:text-3xl ${presetHeading(entry.theme) || 'font-semibold'}`}>{entry.title}</h3>
        {entry.contract && <span className="chip">Contract</span>}
        <span className="chip border-accent-400/40 text-accent-500 dark:text-accent-300">{kindLabel[entry.kind]}</span>
      </div>
      <p className="mt-1 font-display text-lg text-muted">{entry.org}</p>
      <p className="mt-4 max-w-3xl text-lg leading-relaxed text-fg/85">{entry.summary}</p>
      {entry.highlights.length > 0 && (
        <ul className="mt-5 grid max-w-4xl gap-x-8 gap-y-2.5 text-sm leading-relaxed text-muted md:grid-cols-2">
          {entry.highlights.map((h) => (
            <li key={h} className="flex gap-3">
              <span className="mt-2 h-1 w-3 shrink-0 rounded-full" style={{ background: 'rgb(var(--glow-a))' }} aria-hidden />
              {h}
            </li>
          ))}
        </ul>
      )}
      {entry.growth && (
        <p className="mt-5 max-w-3xl rounded-2xl border border-line bg-bg-soft/80 px-4 py-3 text-sm text-fg/80 backdrop-blur-sm">
          <span className="mr-2 font-mono text-xs tracking-widest uppercase" style={{ color: 'rgb(var(--glow-a))' }}>Growth</span>
          {entry.growth}
        </p>
      )}
      <ChapterQuests quests={sidequestsFor(entry.slug)} />
      <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
        {entry.stack.length > 0 && <Tags items={entry.stack} />}
        {related.length > 0 && (
          <p className="text-sm text-muted">
            {entry.kind === 'work' ? 'Same pattern, built from scratch: ' : 'Projects: '}
            {related.map((p, i) => (
              <span key={p.slug}>
                {i > 0 && ', '}
                <Link to={`/projects/${p.slug}`} viewTransition className="font-medium underline underline-offset-4" style={{ color: 'rgb(var(--glow-a))' }}>
                  {p.title} →
                </Link>
              </span>
            ))}
          </p>
        )}
      </div>
    </div>
  )
}

/**
 * A horizontal, swipeable story line. Oldest on the left.
 * With onSelect it acts as a tab list; otherwise each stop links to /experience#slug.
 */
export function HorizontalTimeline({
  entries,
  selected,
  onSelect,
  dimmed,
}: {
  entries: TimelineEntry[]
  selected?: string
  onSelect?: (slug: string) => void
  dimmed?: (e: TimelineEntry) => boolean
}) {
  const path = useMemo(() => [...entries].sort(compareChronological), [entries])
  const scroller = useRef<HTMLDivElement>(null)
  const [inViewRef, inView] = useInView<HTMLDivElement>({ threshold: 0 })
  const [edges, setEdges] = useState({ start: true, end: false, progress: 0 })
  const navigate = useNavigate()

  const updateEdges = useCallback(() => {
    const el = scroller.current
    if (!el) return
    const max = el.scrollWidth - el.clientWidth
    setEdges({ start: el.scrollLeft < 8, end: el.scrollLeft > max - 8, progress: max > 0 ? el.scrollLeft / max : 1 })
  }, [])

  // Keep the selected stop centred; without a selection the story starts at the beginning
  useEffect(() => {
    const el = scroller.current
    if (!el) return
    const target = selected ? el.querySelector<HTMLElement>(`[data-slug="${selected}"]`) : null
    if (target) el.scrollTo({ left: target.offsetLeft - el.clientWidth / 2 + target.offsetWidth / 2, behavior: prefersReducedMotion() ? 'auto' : 'smooth' })
    updateEdges()
  }, [selected, path, updateEdges])

  const scrollBy = (dir: 1 | -1) => scroller.current?.scrollBy({ left: dir * scroller.current.clientWidth * 0.7, behavior: 'smooth' })

  // Drag to scroll with a mouse (touch already scrolls natively)
  const drag = useRef<{ x: number; left: number; moved: boolean } | null>(null)

  const onKey = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    if (!onSelect) return
    const next = e.key === 'ArrowRight' ? i + 1 : e.key === 'ArrowLeft' ? i - 1 : e.key === 'Home' ? 0 : e.key === 'End' ? path.length - 1 : -1
    if (next < 0 || next >= path.length) return
    e.preventDefault()
    onSelect(path[next].slug)
    scroller.current?.querySelector<HTMLElement>(`[data-slug="${path[next].slug}"] button`)?.focus()
  }

  return (
    <div ref={inViewRef} className="relative">
      <div className="mb-4 flex items-center justify-between gap-4">
        <p className="font-mono text-xs tracking-widest text-muted uppercase">{path.length} chapters · swipe or drag</p>
        <div className="flex gap-2">
          <button type="button" onClick={() => scrollBy(-1)} disabled={edges.start} className="grid h-10 w-10 place-items-center rounded-full border border-line transition-all hover:border-accent-400 disabled:opacity-30" aria-label="Scroll timeline back">
            ←
          </button>
          <button type="button" onClick={() => scrollBy(1)} disabled={edges.end} className="grid h-10 w-10 place-items-center rounded-full border border-line transition-all hover:border-accent-400 disabled:opacity-30" aria-label="Scroll timeline forward">
            →
          </button>
        </div>
      </div>

      <div
        ref={scroller}
        onScroll={updateEdges}
        onPointerDown={(e) => {
          if (e.pointerType !== 'mouse' || !scroller.current) return
          drag.current = { x: e.clientX, left: scroller.current.scrollLeft, moved: false }
        }}
        onPointerMove={(e) => {
          if (!drag.current || !scroller.current) return
          const dx = e.clientX - drag.current.x
          if (Math.abs(dx) > 4) drag.current.moved = true
          scroller.current.scrollLeft = drag.current.left - dx
        }}
        onPointerUp={() => setTimeout(() => (drag.current = null))}
        onPointerLeave={() => (drag.current = null)}
        onClickCapture={(e) => {
          if (drag.current?.moved) {
            e.preventDefault()
            e.stopPropagation()
          }
        }}
        className="marquee-mask -mx-4 cursor-grab snap-x snap-mandatory overflow-x-auto px-4 pb-4 select-none [scrollbar-width:none] active:cursor-grabbing sm:-mx-6 sm:px-6 [&::-webkit-scrollbar]:hidden"
      >
        <ol role={onSelect ? 'tablist' : undefined} aria-label="Career timeline" className="relative flex w-max gap-3 pt-2">
          {/* the line through every stop, drawn in when visible */}
          <span className="absolute top-[3.15rem] right-0 left-0 h-0.5 rounded-full bg-line" aria-hidden />
          <span
            className="absolute top-[3.15rem] right-0 left-0 h-0.5 origin-left rounded-full bg-gradient-to-r from-amber-400 via-accent-400 to-violet-500 transition-transform duration-[1800ms] ease-out"
            style={{ transform: `scaleX(${inView ? 1 : 0})` }}
            aria-hidden
          />
          {path.map((e, i) => {
            const isSel = selected === e.slug
            const dim = dimmed?.(e) ?? false
            const content = (
              <>
                <span className="block h-6 font-mono text-xs text-muted">{shortDate(e)}</span>
                <span className="relative my-3 block h-4">
                  <span
                    style={e.theme ? { background: `linear-gradient(135deg, ${e.theme.primary}, ${e.theme.secondary})` } : undefined}
                    className={`absolute top-0 left-0 h-4 w-4 rounded-full border-[3px] border-bg bg-gradient-to-br ${kindDot[e.kind]} transition-transform duration-300 group-hover:scale-125 ${isSel ? 'scale-150 shadow-[0_0_0_4px_rgb(var(--glow-a)/0.25)]' : ''} ${!e.end && e.start ? 'animate-pulse-ring' : ''}`}
                    aria-hidden
                  />
                </span>
                <span className={`block rounded-2xl border p-4 transition-all duration-300 ${isSel ? 'border-accent-400/70 bg-card shadow-[0_10px_40px_-15px_rgb(var(--glow-a)/0.6)]' : 'border-line bg-card/60 group-hover:-translate-y-1 group-hover:border-accent-400/40'}`}>
                  <span className="flex items-center justify-between gap-2">
                    <span className="block text-[11px] font-semibold tracking-widest uppercase" style={{ color: e.theme?.primary }}>
                      {kindLabel[e.kind]}
                    </span>
                    {e.theme?.logos[0] && (
                      <span className={`inline-flex h-6 items-center rounded-md px-1.5 ${e.theme.logos[0].plate === 'dark' ? 'bg-[#16181d]' : 'bg-white'} ring-1 ring-black/5`}>
                        <img src={e.theme.logos[0].src} alt="" className="h-4 w-auto max-w-16 object-contain" loading="lazy" />
                      </span>
                    )}
                  </span>
                  <span className="mt-1.5 block leading-snug font-semibold text-fg">{e.title}</span>
                  <span className="mt-1 block text-sm leading-snug text-muted">{e.org}</span>
                </span>
              </>
            )
            return (
              <li
                key={e.slug}
                data-slug={e.slug}
                id={onSelect ? e.slug : undefined}
                className={`w-56 shrink-0 snap-center transition-all duration-700 ${dim ? 'opacity-30' : ''}`}
                style={{ transitionDelay: inView ? `${Math.min(i, 8) * 70}ms` : '0ms', opacity: inView ? undefined : 0, transform: inView ? undefined : 'translateY(16px)' }}
              >
                {onSelect ? (
                  <button
                    type="button"
                    role="tab"
                    aria-selected={isSel}
                    aria-controls="timeline-detail"
                    tabIndex={isSel || (!selected && i === 0) ? 0 : -1}
                    onClick={() => onSelect(e.slug)}
                    onKeyDown={(ev) => onKey(ev, i)}
                    className="group block w-full text-left"
                  >
                    {content}
                  </button>
                ) : (
                  <a
                    href={`/experience#${e.slug}`}
                    onClick={(ev) => {
                      ev.preventDefault()
                      if (!drag.current?.moved) navigate(`/experience#${e.slug}`, { viewTransition: true })
                    }}
                    className="group block"
                  >
                    {content}
                  </a>
                )}
              </li>
            )
          })}
        </ol>
      </div>

      <div className="mt-2 h-1 overflow-hidden rounded-full bg-line" aria-hidden>
        <div className="h-full rounded-full transition-[width] duration-200" style={{ width: `${Math.max(8, edges.progress * 100)}%`, background: 'linear-gradient(90deg, rgb(var(--glow-a)), rgb(var(--glow-b)))' }} />
      </div>
    </div>
  )
}

/** Experience page: tech filter, horizontal timeline and the selected chapter's details. */
export function ExperienceExplorer({ entries, initial }: { entries: TimelineEntry[]; initial?: string }) {
  const newest = entries[0]?.slug
  const [selected, setSelected] = useState(initial && entries.some((e) => e.slug === initial) ? initial : newest)
  const [tech, setTech] = useState<string | null>(null)
  useEffect(() => {
    if (initial && entries.some((e) => e.slug === initial)) setSelected(initial)
  }, [initial, entries])

  const allTech = useMemo(() => {
    const counts = new Map<string, number>()
    entries.forEach((e) => e.stack.forEach((s) => counts.set(s, (counts.get(s) ?? 0) + 1)))
    return [...counts.entries()]
      .filter(([, n]) => n > 1)
      .sort((a, b) => b[1] - a[1])
      .map(([s]) => s)
  }, [entries])
  const matches = tech ? entries.filter((e) => e.stack.includes(tech)) : entries
  const chrono = useMemo(() => [...entries].sort(compareChronological), [entries])
  const entry = entries.find((e) => e.slug === selected)
  const idx = chrono.findIndex((e) => e.slug === selected)
  usePageTheme(entry?.theme)
  const name = (e: TimelineEntry) => (e.kind === 'work' || e.kind === 'design' ? e.org : e.title)

  return (
    <div>
      <div className="mb-10">
        <p id="tech-filter" className="mb-3 font-mono text-xs tracking-widest text-muted uppercase">
          Highlight a technology
        </p>
        <div role="group" aria-labelledby="tech-filter" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 [&::-webkit-scrollbar]:hidden">
          {[null, ...allTech].map((t) => (
            <button
              key={t ?? 'all'}
              type="button"
              aria-pressed={tech === t}
              onClick={() => {
                setTech(t)
                const first = t ? [...entries].find((e) => e.stack.includes(t)) : undefined
                if (first) setSelected(first.slug)
              }}
              className={`shrink-0 rounded-full border px-3.5 py-1.5 text-sm transition-all duration-300 ${tech === t ? 'scale-105 border-transparent bg-fg text-bg' : 'border-line text-muted hover:border-accent-400/60 hover:text-fg'}`}
            >
              {t ?? 'All'}
            </button>
          ))}
        </div>
        <p className="mt-3 text-sm text-muted" aria-live="polite">
          {tech ? `${matches.length} ${matches.length === 1 ? 'chapter uses' : 'chapters use'} ${tech}` : 'Pick a chapter to read about it.'}
        </p>
      </div>

      <HorizontalTimeline entries={entries} selected={selected} onSelect={setSelected} dimmed={tech ? (e) => !e.stack.includes(tech) : undefined} />

      {entry && (
        <section
          id="timeline-detail"
          role="tabpanel"
          aria-live="polite"
          aria-label={`${entry.title}, ${entry.org}`}
          style={themeStyle(entry.theme)}
          className="card relative mt-10 overflow-hidden bg-card p-6 text-fg shadow-[0_30px_80px_-40px_rgb(var(--glow-a)/0.7)] transition-[background-color,color,box-shadow] duration-500 sm:p-10"
        >
          <PageWash theme={entry.theme} id={entry.slug} />
          <PageArt theme={entry.theme} id={`art-${entry.slug}`} />
          {entry.theme && (
            <span className="absolute top-4 right-4 z-[1] rounded-full border border-line bg-card/80 px-2.5 py-0.5 font-mono text-[10px] tracking-widest text-muted uppercase backdrop-blur sm:hidden">
              {presetLabel(entry.theme)}
            </span>
          )}
          <div key={entry.slug} className="relative animate-[detail-in_0.5s_cubic-bezier(0.2,0.7,0.2,1)]">
            <EntryDetail entry={entry} />
          </div>
          <div className="relative mt-8 flex justify-between gap-3 border-t border-line pt-6">
            <button type="button" className="btn-ghost" disabled={idx <= 0} onClick={() => setSelected(chrono[idx - 1].slug)}>
              ← {idx > 0 ? name(chrono[idx - 1]) : 'Start'}
            </button>
            <button type="button" className="btn-ghost" disabled={idx >= chrono.length - 1} onClick={() => setSelected(chrono[idx + 1].slug)}>
              {idx < chrono.length - 1 ? name(chrono[idx + 1]) : 'Today'} →
            </button>
          </div>
        </section>
      )}
    </div>
  )
}
