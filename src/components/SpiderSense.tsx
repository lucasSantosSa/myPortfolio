import { useEffect, useRef, useState } from 'react'
import { prefersReducedMotion } from './motion'

const CODE = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a']
const DURATION = 7000

type Scene = 'quantum' | 'spider' | 'campfire' | 'blackhole'
const scenes: { id: Scene; caption: string }[] = [
  { id: 'quantum', caption: '⚛️ Quantum field excitation: every particle is a ripple in a field.' },
  { id: 'spider', caption: '🕷️ Spider-sense tingling. Your friendly neighborhood engineer is on it.' },
  { id: 'campfire', caption: '🔥 Roast a marshmallow before the sun goes out. You have about 22 minutes.' },
  { id: 'blackhole', caption: '🕳️ Past the event horizon, even light stops sending pull requests.' },
]

/** Runs a full-screen canvas animation until unmounted. draw(ctx, t, w, h) is called every frame. */
function useCanvas(draw: (ctx: CanvasRenderingContext2D, t: number, w: number, h: number) => void) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = ref.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    const resize = () => {
      canvas.width = innerWidth * dpr
      canvas.height = innerHeight * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    window.addEventListener('resize', resize)
    const start = performance.now()
    let raf = 0
    const still = prefersReducedMotion()
    const frame = (now: number) => {
      draw(ctx, still ? 1.5 : (now - start) / 1000, innerWidth, innerHeight)
      if (!still) raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [draw])
  return ref
}

/** A lattice of field values; localized wave packets travel through it and light up the points. */
function QuantumField() {
  const ref = useCanvas((ctx, t, w, h) => {
    ctx.fillStyle = 'rgba(5, 6, 15, 0.9)'
    ctx.fillRect(0, 0, w, h)
    const step = 22
    const packets = [
      { x0: w * 0.1, y0: h * 0.5, vx: 170, vy: 18, k: 0.09 },
      { x0: w * 0.9, y0: h * 0.25, vx: -140, vy: 45, k: 0.12 },
      { x0: w * 0.5, y0: h * 1.0, vx: 30, vy: -120, k: 0.07 },
      { x0: w * 0.3, y0: h * 0.05, vx: 60, vy: 90, k: 0.1 },
      { x0: w * 0.75, y0: h * 0.85, vx: -90, vy: -70, k: 0.08 },
    ]
    for (let y = step / 2; y < h; y += step) {
      for (let x = step / 2; x < w; x += step) {
        let amp = 0.04 * Math.sin(x * 0.02 + t * 1.3) * Math.cos(y * 0.025 - t) // vacuum fluctuation
        for (const p of packets) {
          const cx = p.x0 + p.vx * t
          const cy = p.y0 + p.vy * t
          const d2 = (x - cx) ** 2 + (y - cy) ** 2
          amp += Math.exp(-d2 / 16000) * Math.cos(p.k * Math.hypot(x - cx, y - cy) - t * 6)
        }
        const a = Math.max(-1, Math.min(1, amp))
        const r = 1.2 + Math.abs(a) * 4.5
        ctx.beginPath()
        ctx.fillStyle = a > 0 ? `rgba(45, 212, 191, ${0.15 + a * 0.85})` : `rgba(167, 139, 250, ${0.15 - a * 0.85})`
        ctx.arc(x, y - a * 6, r, 0, Math.PI * 2)
        ctx.fill()
      }
    }
  })
  return <canvas ref={ref} className="absolute inset-0 h-full w-full" />
}

/** Accretion disk, photon ring and a lensed glow around a shadow. */
function BlackHole() {
  const particles = useRef(
    Array.from({ length: 1800 }, () => ({ r: 1.25 + Math.random() * 2.6, a: Math.random() * Math.PI * 2, s: 0.4 + Math.random() * 0.6, z: Math.random() })),
  )
  const ref = useCanvas((ctx, t, w, h) => {
    ctx.fillStyle = 'rgba(2, 2, 6, 0.35)'
    ctx.fillRect(0, 0, w, h)
    const cx = w / 2
    const cy = h / 2
    const R = Math.min(w, h) * 0.11
    // lensed halo
    const halo = ctx.createRadialGradient(cx, cy, R * 0.9, cx, cy, R * 3.2)
    halo.addColorStop(0, 'rgba(255, 170, 80, 0.35)')
    halo.addColorStop(0.4, 'rgba(255, 110, 40, 0.10)')
    halo.addColorStop(1, 'rgba(0, 0, 0, 0)')
    ctx.fillStyle = halo
    ctx.fillRect(0, 0, w, h)
    // disk: tilted ellipse, inner particles orbit faster (Keplerian-ish)
    for (const p of particles.current) {
      const ang = p.a + (t * p.s * 1.6) / Math.pow(p.r, 1.5)
      const x = cx + Math.cos(ang) * p.r * R * 1.4
      const y = cy + Math.sin(ang) * p.r * R * 0.32
      const behind = Math.sin(ang) < 0
      const doppler = 0.55 + 0.45 * Math.cos(ang) // approaching side brighter
      ctx.fillStyle = `rgba(255, ${150 + p.z * 90}, ${60 + p.z * 60}, ${(behind ? 0.35 : 0.9) * doppler})`
      ctx.fillRect(x, y, 2, 2)
      if (behind && p.r < 2.2) {
        // light from the far side bent over the top of the shadow
        const ly = cy - Math.abs(Math.cos(ang)) * R * 0.2 - R * 1.05
        ctx.fillStyle = `rgba(255, 190, 120, ${0.25 * doppler})`
        ctx.fillRect(cx + Math.cos(ang) * R * 1.15, ly, 1.4, 1.4)
      }
    }
    // photon ring and shadow
    ctx.beginPath()
    ctx.arc(cx, cy, R * 1.04, 0, Math.PI * 2)
    ctx.strokeStyle = 'rgba(255, 210, 160, 0.9)'
    ctx.lineWidth = 2
    ctx.stroke()
    ctx.beginPath()
    ctx.arc(cx, cy, R, 0, Math.PI * 2)
    ctx.fillStyle = '#000'
    ctx.fill()
  })
  return <canvas ref={ref} className="absolute inset-0 h-full w-full" />
}

function SpiderWeb() {
  const spokes = Array.from({ length: 12 }, (_, i) => (i * Math.PI) / 6)
  return (
    <svg className="absolute -top-4 -right-4 h-[70vmin] w-[70vmin] animate-[detail-in_0.6s_ease-out] text-fg/70" viewBox="-100 -100 200 200" fill="none" stroke="currentColor" strokeWidth="0.6">
      {spokes.map((a) => (
        <line key={a} x1="0" y1="0" x2={Math.cos(a) * 140} y2={Math.sin(a) * 140} />
      ))}
      {[18, 34, 52, 72, 94, 118].map((r) => (
        <polygon key={r} points={spokes.map((a) => `${Math.cos(a) * r},${Math.sin(a) * r}`).join(' ')} />
      ))}
      <g transform="translate(0 62)">
        <line x1="0" y1="-62" x2="0" y2="-8" />
        <ellipse cx="0" cy="0" rx="4" ry="5.5" fill="currentColor" />
        <circle cx="0" cy="-7" r="2.8" fill="currentColor" />
      </g>
    </svg>
  )
}

/** An original campfire-under-the-stars homage: a tiny planet, a ship, a marshmallow and a sun that's running out of time. */
function Campfire() {
  const stars = useRef(Array.from({ length: 120 }, () => ({ x: Math.random() * 100, y: Math.random() * 60, r: Math.random() * 0.25 + 0.05, d: Math.random() * 4 })))
  return (
    <div className="absolute inset-0 animate-[detail-in_0.8s_ease-out] bg-[radial-gradient(ellipse_at_50%_120%,#24345e_0%,#0b1025_45%,#04050c_100%)]">
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMax slice">
        {stars.current.map((s, i) => (
          <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#fff" opacity="0.8">
            <animate attributeName="opacity" values="0.2;1;0.2" dur={`${2 + s.d}s`} repeatCount="indefinite" />
          </circle>
        ))}
        {/* the sun, slowly swelling */}
        <circle cx="82" cy="40" r="3" fill="#ffb347">
          <animate attributeName="r" values="3;4.2;3" dur="7s" repeatCount="indefinite" />
          <animate attributeName="fill" values="#ffd27a;#ff6a3d;#ffd27a" dur="7s" repeatCount="indefinite" />
        </circle>
        {/* a small moon orbiting */}
        <g>
          <animateTransform attributeName="transform" type="rotate" from="0 50 88" to="360 50 88" dur="12s" repeatCount="indefinite" />
          <circle cx="50" cy="62" r="1.4" fill="#9fb6d9" />
        </g>
        {/* the planet you are standing on */}
        <circle cx="50" cy="112" r="34" fill="#1b2a1f" />
        <path d="M30 82 q4 -6 8 0 q4 -7 9 0" stroke="#2f4a33" strokeWidth="0.8" fill="none" />
        {/* tiny ship */}
        <g transform="translate(66 74) rotate(-12)">
          <rect x="-3" y="-1.6" width="6" height="3.2" rx="1.2" fill="#c9c2b4" />
          <circle cx="1.2" cy="0" r="0.9" fill="#7fb7d6" />
          <path d="M-3 1.6 l-1.4 2 M3 1.6 l1.4 2" stroke="#c9c2b4" strokeWidth="0.5" />
        </g>
        {/* campfire */}
        <g transform="translate(44 80)">
          <path d="M-3 2 L3 0.5 M-3 0.5 L3 2" stroke="#6b4423" strokeWidth="0.9" />
          <path d="M0 1 C-2 -1 -1 -3 0 -5 C1 -3 2 -1 0 1 Z" fill="#ff7b2e">
            <animate attributeName="d" values="M0 1 C-2 -1 -1 -3 0 -5 C1 -3 2 -1 0 1 Z;M0 1 C-2.2 -1.4 -0.6 -3.4 0.4 -5.6 C1.2 -3 2 -1.2 0 1 Z;M0 1 C-2 -1 -1 -3 0 -5 C1 -3 2 -1 0 1 Z" dur="0.6s" repeatCount="indefinite" />
          </path>
          <path d="M0 1 C-1 0 -0.5 -1.6 0 -2.8 C0.5 -1.6 1 0 0 1 Z" fill="#ffd166" />
          {/* marshmallow on a stick */}
          <path d="M8 -1 L1.6 -3.6" stroke="#8a6a46" strokeWidth="0.4" />
          <rect x="0.4" y="-4.6" width="1.6" height="1.2" rx="0.4" fill="#f6efe0" />
        </g>
      </svg>
    </div>
  )
}

/** Easter egg: each Konami code entry plays the next of my favorite things. */
export function SpiderSense() {
  const [active, setActive] = useState<number | null>(null)
  const next = useRef(0)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    let pos = 0
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActive(null)
        return
      }
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key
      pos = key === CODE[pos] ? pos + 1 : key === CODE[0] ? 1 : 0
      if (pos === CODE.length) {
        pos = 0
        const i = next.current
        next.current = (i + 1) % scenes.length
        setActive(i)
        clearTimeout(timer.current)
        timer.current = setTimeout(() => setActive(null), DURATION)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      clearTimeout(timer.current)
    }
  }, [])

  if (active === null) return null
  const scene = scenes[active]
  const fullscreen = scene.id !== 'spider'
  return (
    <div className={`fixed inset-0 z-[70] ${fullscreen ? 'cursor-pointer' : 'pointer-events-none'}`} onClick={() => setActive(null)} aria-live="polite">
      {(scene.id === 'quantum' || scene.id === 'blackhole') && <div className="absolute inset-0 animate-[detail-in_0.5s_ease-out] bg-black" />}
      {scene.id === 'quantum' && <QuantumField />}
      {scene.id === 'spider' && <SpiderWeb />}
      {scene.id === 'campfire' && <Campfire />}
      {scene.id === 'blackhole' && <BlackHole />}
      <div className="absolute bottom-8 left-1/2 w-max max-w-[90vw] -translate-x-1/2 animate-[detail-in_0.4s_ease-out] rounded-full border border-white/20 bg-black/70 px-5 py-2.5 text-center text-sm font-semibold text-white shadow-xl backdrop-blur">
        {scene.caption}
        <span className="ml-2 font-mono text-[10px] font-normal text-white/60">
          {active + 1}/{scenes.length}
        </span>
      </div>
    </div>
  )
}
