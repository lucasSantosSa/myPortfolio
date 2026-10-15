import { useRef, type PointerEvent, type ReactElement } from 'react'
import { Link } from 'react-router'
import { timelineBySlug } from '../content/load'
import type { Sidequest } from '../content/schema'
import { Reveal } from './motion'

const rarity: Record<Sidequest['rarity'], { label: string; color: string }> = {
  common: { label: 'Common', color: '#9aa1b2' },
  rare: { label: 'Rare', color: '#38bdf8' },
  epic: { label: 'Epic', color: '#a78bfa' },
  legendary: { label: 'Legendary', color: '#fbbf24' },
}

const statusLabel: Record<Sidequest['status'], string> = { ongoing: 'Ongoing', 'in-progress': 'In progress', completed: 'Completed' }

const s = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }

export const questIcons: Record<Sidequest['icon'], ReactElement> = {
  gamepad: (
    <svg viewBox="0 0 24 24" {...s}>
      <path d="M6 9h12a4 4 0 0 1 3.9 4.8l-.8 3.7a2 2 0 0 1-3.5.8L15.5 16h-7l-2.1 2.3a2 2 0 0 1-3.5-.8l-.8-3.7A4 4 0 0 1 6 9z" />
      <path d="M8 11.5v3M6.5 13h3" />
      <circle cx="15.5" cy="12" r=".6" fill="currentColor" />
      <circle cx="17.5" cy="14" r=".6" fill="currentColor" />
    </svg>
  ),
  chip: (
    <svg viewBox="0 0 24 24" {...s}>
      <rect x="6" y="6" width="12" height="12" rx="2" />
      <rect x="9.5" y="9.5" width="5" height="5" rx="1" />
      <path d="M9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4" />
    </svg>
  ),
  guitar: (
    <svg viewBox="0 0 24 24" {...s}>
      <path d="M20.5 3.5l-6 6" />
      <path d="M19 2l3 3" />
      <path d="M13.5 10.5a3.5 3.5 0 0 0-5 0l-.5.5a3 3 0 0 1-2 1 3.5 3.5 0 0 0-2.4 6 3.5 3.5 0 0 0 6-2.4 3 3 0 0 1 1-2l.5-.5a3.5 3.5 0 0 0 0-5" />
      <circle cx="9" cy="15" r="1.2" />
    </svg>
  ),
  drums: (
    <svg viewBox="0 0 24 24" {...s}>
      <ellipse cx="12" cy="11" rx="8" ry="3" />
      <path d="M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6" />
      <path d="M4 12l8 7 8-7M3 3l7 6M21 3l-7 6" />
    </svg>
  ),
  galaxy: (
    <svg viewBox="0 0 24 24" {...s}>
      <circle cx="12" cy="12" r="1.6" fill="currentColor" />
      <path d="M12 12c4-1 6.5 1.5 5.5 4.5S11 20 8 17.5 5.5 9 9.5 6.5 18.5 5 19.5 9" />
      <path d="M12 12c-3 .8-4.2-1.2-3.4-3.2" />
      <path d="M4 4l.01 0M20 20l.01 0M4 19l.01 0" strokeWidth="2.6" />
    </svg>
  ),
  atom: (
    <svg viewBox="0 0 24 24" {...s}>
      <circle cx="12" cy="12" r="1.4" fill="currentColor" />
      <ellipse cx="12" cy="12" rx="10" ry="4" />
      <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(60 12 12)" />
      <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(120 12 12)" />
    </svg>
  ),
  rocket: (
    <svg viewBox="0 0 24 24" {...s}>
      <path d="M12 2c3 2 5 6 5 10l-2 5H9l-2-5c0-4 2-8 5-10z" />
      <circle cx="12" cy="10" r="2" />
      <path d="M9 17l-3 3 1-5M15 17l3 3-1-5M10.5 20.5L12 23l1.5-2.5" />
    </svg>
  ),
  spider: (
    <svg viewBox="0 0 24 24" {...s}>
      <ellipse cx="12" cy="14" rx="2.6" ry="3.6" />
      <circle cx="12" cy="8.6" r="1.8" />
      <path d="M9.6 12.5L5 9.5 3 4M9.4 14.5L4 14l-2 3M9.8 16.5L6 20l-1 3M14.4 12.5L19 9.5 21 4M14.6 14.5L20 14l2 3M14.2 16.5L18 20l1 3" />
    </svg>
  ),
  star: (
    <svg viewBox="0 0 24 24" {...s}>
      <path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z" />
    </svg>
  ),
}

function QuestCard({ quest, index }: { quest: Sidequest; index: number }) {
  const ref = useRef<HTMLElement>(null)
  const r = rarity[quest.rarity]
  const chapter = quest.chapter ? timelineBySlug(quest.chapter) : undefined

  // Subtle 3D tilt toward the cursor
  const tilt = (e: PointerEvent<HTMLElement>) => {
    const el = ref.current
    if (!el || e.pointerType !== 'mouse') return
    const b = el.getBoundingClientRect()
    const x = (e.clientX - b.left) / b.width - 0.5
    const y = (e.clientY - b.top) / b.height - 0.5
    el.style.transform = `perspective(700px) rotateX(${-y * 6}deg) rotateY(${x * 8}deg) translateY(-4px)`
  }

  return (
    <Reveal delay={(index % 4) * 80} className="h-full">
      <article
        ref={ref}
        onPointerMove={tilt}
        onPointerLeave={() => ref.current && (ref.current.style.transform = '')}
        className="group relative flex h-full flex-col overflow-hidden rounded-3xl border bg-card p-5 transition-transform duration-200 ease-out"
        style={{ borderColor: `${r.color}55`, boxShadow: `inset 0 1px 0 ${r.color}22` }}
      >
        <div className="pointer-events-none absolute -top-16 -right-16 h-40 w-40 rounded-full opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-60" style={{ background: r.color }} aria-hidden />
        <div className="relative flex items-start justify-between gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-2xl border transition-transform duration-500 group-hover:rotate-[8deg] group-hover:scale-110" style={{ color: r.color, borderColor: `${r.color}66`, background: `${r.color}14` }}>
            <span className="h-7 w-7">{questIcons[quest.icon]}</span>
          </span>
          <span className="text-right font-mono text-[10px] leading-tight tracking-widest uppercase">
            <span className="block" style={{ color: r.color }}>
              {r.label}
            </span>
            <span className="block text-muted">{statusLabel[quest.status]}</span>
          </span>
        </div>
        <p className="relative mt-4 font-mono text-[10px] tracking-[0.25em] text-muted uppercase">Side quest</p>
        <h3 className="relative mt-1 text-lg font-semibold tracking-tight">{quest.title}</h3>
        <p className="relative mt-2 text-sm leading-relaxed text-muted">{quest.blurb}</p>
        <div className="relative mt-auto pt-4">
          <ul className="flex flex-wrap gap-1.5" aria-label="Skills">
            {quest.tags.map((t) => (
              <li key={t} className="chip">
                +{t}
              </li>
            ))}
          </ul>
          {chapter && (
            <Link to={`/experience#${chapter.slug}`} viewTransition className="mt-3 inline-block font-mono text-[11px] text-muted underline-offset-4 hover:text-fg hover:underline">
              Unlocked in: {chapter.dateLabel ?? chapter.start?.slice(0, 4)} · {chapter.title} →
            </Link>
          )}
        </div>
      </article>
    </Reveal>
  )
}

export function QuestLog({ quests }: { quests: Sidequest[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {quests.map((q, i) => (
        <QuestCard key={q.slug} quest={q} index={i} />
      ))}
    </div>
  )
}

/** Compact badges for the quests tied to one timeline chapter. */
export function ChapterQuests({ quests }: { quests: Sidequest[] }) {
  if (!quests.length) return null
  return (
    <div className="mt-5 flex flex-wrap items-center gap-2">
      <span className="font-mono text-[10px] tracking-widest text-muted uppercase">Side quest unlocked</span>
      {quests.map((q) => (
        <span key={q.slug} className="inline-flex items-center gap-1.5 rounded-full border border-line bg-bg-soft px-2.5 py-1 text-xs" style={{ color: rarity[q.rarity].color }}>
          <span className="h-3.5 w-3.5">{questIcons[q.icon]}</span>
          <span className="text-fg">{q.title}</span>
        </span>
      ))}
    </div>
  )
}
