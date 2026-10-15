import { useEffect, useRef, useState, type CSSProperties, type ElementType, type ReactNode } from 'react'

export const prefersReducedMotion = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

/** True once the element has scrolled into view (stays true). */
export function useInView<T extends Element>(options: IntersectionObserverInit = { rootMargin: '0px 0px -10% 0px', threshold: 0.1 }) {
  const ref = useRef<T>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (!('IntersectionObserver' in window)) {
      setInView(true)
      return
    }
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setInView(true)
        io.disconnect()
      }
    }, options)
    io.observe(el)
    return () => io.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return [ref, inView] as const
}

/** Fades, lifts and un-blurs its content when scrolled into view. */
export function Reveal({ children, delay = 0, as: Tag = 'div', className = '', style }: { children: ReactNode; delay?: number; as?: ElementType; className?: string; style?: CSSProperties }) {
  const [ref, inView] = useInView<HTMLElement>()
  return (
    <Tag ref={ref} data-visible={inView} className={`reveal ${className}`} style={{ ...style, '--delay': `${delay}ms` } as CSSProperties}>
      {children}
    </Tag>
  )
}

/** Animates the number inside values like "6+ years" from 0 when visible. */
export function CountUp({ value, duration = 1400 }: { value: string; duration?: number }) {
  const match = value.match(/^(\D*)(\d+)(.*)$/)
  const [ref, inView] = useInView<HTMLSpanElement>()
  const target = match ? Number(match[2]) : 0
  const [n, setN] = useState(match && !prefersReducedMotion() ? 0 : target)
  useEffect(() => {
    if (!match || !inView || prefersReducedMotion()) return
    let raf = 0
    const start = performance.now()
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration)
      setN(Math.round(target * (1 - Math.pow(1 - p, 3))))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, target])
  if (!match) return <span>{value}</span>
  return (
    <span ref={ref} aria-label={value}>
      <span aria-hidden>
        {match[1]}
        {n}
        {match[3]}
      </span>
    </span>
  )
}

/** Cycles through words with a slide-up transition. */
export function RotatingWords({ words, interval = 2600 }: { words: string[]; interval?: number }) {
  const [i, setI] = useState(0)
  useEffect(() => {
    if (prefersReducedMotion() || words.length < 2) return
    const id = setInterval(() => setI((x) => (x + 1) % words.length), interval)
    return () => clearInterval(id)
  }, [words.length, interval])
  const prev = (i - 1 + words.length) % words.length
  return (
    <>
      <span className="sr-only">{words.join(', ')}</span>
      <span className="word-swap" aria-hidden>
        {words.map((w, j) => (
          <span key={w} data-state={j === i ? 'in' : j === prev ? 'out' : 'idle'} className="gradient-text sm:whitespace-nowrap">
            {w}
          </span>
        ))}
      </span>
    </>
  )
}

/** Infinite horizontal scroll of items; pauses on hover. */
export function Marquee({ items }: { items: string[] }) {
  const row = (hidden: boolean) => (
    <ul className="flex shrink-0 items-center gap-10 pr-10" aria-hidden={hidden || undefined}>
      {items.map((t) => (
        <li key={t} className="flex items-center gap-10 font-display text-xl font-medium whitespace-nowrap text-muted sm:text-2xl">
          {t}
          <span className="h-1.5 w-1.5 rounded-full bg-accent-400/60" aria-hidden />
        </li>
      ))}
    </ul>
  )
  return (
    <div className="marquee-mask group flex overflow-hidden">
      <div className="flex animate-marquee group-hover:[animation-play-state:paused]">
        {row(false)}
        {row(true)}
      </div>
    </div>
  )
}

/** Sets --mx/--my on the element so .spotlight can follow the cursor. */
export function useSpotlight<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect()
      el.style.setProperty('--mx', `${e.clientX - r.left}px`)
      el.style.setProperty('--my', `${e.clientY - r.top}px`)
    }
    el.addEventListener('pointermove', move)
    return () => el.removeEventListener('pointermove', move)
  }, [])
  return ref
}

/** 0→1 progress of an element scrolling through the viewport's middle. */
export function useScrollProgress<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [p, setP] = useState(0)
  useEffect(() => {
    let raf = 0
    const update = () => {
      raf = 0
      const el = ref.current
      if (!el) return
      const r = el.getBoundingClientRect()
      const mid = window.innerHeight * 0.6
      setP(Math.max(0, Math.min(1, (mid - r.top) / Math.max(1, r.height))))
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      cancelAnimationFrame(raf)
    }
  }, [])
  return [ref, p] as const
}
