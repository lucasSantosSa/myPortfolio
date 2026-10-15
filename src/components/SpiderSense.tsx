import { useEffect, useState } from 'react'
import { prefersReducedMotion } from './motion'

const CODE = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a']

/** Easter egg: the Konami code makes a web swing across the page. */
export function SpiderSense() {
  const [active, setActive] = useState(false)
  useEffect(() => {
    let pos = 0
    const onKey = (e: KeyboardEvent) => {
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key
      pos = key === CODE[pos] ? pos + 1 : key === CODE[0] ? 1 : 0
      if (pos === CODE.length) {
        pos = 0
        setActive(true)
        setTimeout(() => setActive(false), prefersReducedMotion() ? 3000 : 4200)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
  if (!active) return null
  const spokes = Array.from({ length: 12 }, (_, i) => (i * Math.PI) / 6)
  return (
    <div className="pointer-events-none fixed inset-0 z-[70]" aria-live="polite">
      <svg className="absolute -top-4 -right-4 h-[70vmin] w-[70vmin] animate-[detail-in_0.6s_ease-out] text-fg/70" viewBox="-100 -100 200 200" fill="none" stroke="currentColor" strokeWidth="0.6">
        {spokes.map((a) => (
          <line key={a} x1="0" y1="0" x2={Math.cos(a) * 140} y2={Math.sin(a) * 140} />
        ))}
        {[18, 34, 52, 72, 94, 118].map((r) => (
          <polygon key={r} points={spokes.map((a) => `${Math.cos(a) * r},${Math.sin(a) * r}`).join(' ')} />
        ))}
      </svg>
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-[detail-in_0.4s_ease-out] rounded-full border border-red-500/60 bg-card px-5 py-2.5 text-sm font-semibold shadow-xl">
        🕷️ Spider-sense tingling. Your friendly neighborhood engineer is on it.
      </div>
    </div>
  )
}
