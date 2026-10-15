import { useEffect, type CSSProperties, type ReactNode } from 'react'
import type { ChapterTheme } from '../content/schema'

type Preset = ChapterTheme['preset']

/** Converts #rrggbb to "r g b" for use inside rgb(var(--x) / a). */
export function hexToRgb(hex: string): string {
  const n = parseInt(hex.slice(1), 16)
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`
}

interface Surface {
  /** page background */
  bg: string
  card: string
  fg: string
  muted: string
  line: string
  chip: string
  bgSoft: string
  /** whether the palette is dark, so the browser UI (scrollbars, form controls) matches */
  dark: boolean
}

/** Per-preset page palette, heading style and heading font for the whole page. */
const presets: Record<Preset, { surface: Surface; heading: string; font: string; label: string }> = {
  notebook: {
    label: 'Notebook',
    heading: 'font-[Caveat] text-4xl sm:text-5xl font-bold',
    font: "'Caveat', cursive",
    surface: { bg: '#f1ede1', card: '#fbf8ef', fg: '#1f2937', muted: '#5b6472', line: '#d6dde8', chip: '#eef1f6', bgSoft: '#f6f2e7', dark: false },
  },
  print: {
    label: 'Print shop',
    heading: 'font-display uppercase tracking-tight font-bold',
    font: "'Space Grotesk', sans-serif",
    surface: { bg: '#f5f4ef', card: '#ffffff', fg: '#1d1d1b', muted: '#5d5d58', line: '#dcdbd3', chip: '#eeede6', bgSoft: '#efeee8', dark: false },
  },
  chalkboard: {
    label: 'Classroom',
    heading: 'font-[Caveat] text-4xl sm:text-5xl font-bold',
    font: "'Caveat', cursive",
    surface: { bg: '#162e22', card: '#1f3a2c', fg: '#f1f5ec', muted: '#b9c9b5', line: '#3c5a49', chip: '#2a4a39', bgSoft: '#1b3628', dark: true },
  },
  academic: {
    label: 'University',
    heading: "font-['Fraunces'] font-bold",
    font: "'Fraunces', serif",
    surface: { bg: '#efe5d0', card: '#fbf6ea', fg: '#2b2118', muted: '#6b5d4f', line: '#ddcfb5', chip: '#f1e7d4', bgSoft: '#f4ecdb', dark: false },
  },
  blueprint: {
    label: 'Blueprint',
    heading: 'font-mono uppercase tracking-wide font-semibold',
    font: "'JetBrains Mono', monospace",
    surface: { bg: '#072c5a', card: '#0b3a7a', fg: '#eaf4ff', muted: '#a8c4e6', line: '#2a5ea3', chip: '#124a92', bgSoft: '#0a356c', dark: true },
  },
  terminal: {
    label: 'Terminal',
    heading: 'font-mono font-semibold',
    font: "'JetBrains Mono', monospace",
    surface: { bg: '#020503', card: '#070d08', fg: '#d1fadf', muted: '#7fb894', line: '#1d3324', chip: '#102016', bgSoft: '#060b07', dark: true },
  },
  editorial: {
    label: 'Editorial',
    heading: 'font-display uppercase font-bold tracking-tight',
    font: "'Fraunces', serif",
    surface: { bg: '#f3efe6', card: '#fbf9f4', fg: '#141414', muted: '#55524c', line: '#d9d3c6', chip: '#ebe6db', bgSoft: '#f7f4ec', dark: false },
  },
  outdoors: {
    label: 'Outdoors',
    heading: 'font-display font-bold',
    font: "'Space Grotesk', sans-serif",
    surface: { bg: '#0f1c17', card: '#15261f', fg: '#eef4ef', muted: '#a9bbb1', line: '#284036', chip: '#1c3229', bgSoft: '#12221c', dark: true },
  },
  legal: {
    label: 'Legal',
    heading: "font-['Fraunces'] font-semibold",
    font: "'Fraunces', serif",
    surface: { bg: '#e8eef6', card: '#f6f8fb', fg: '#0d1b2a', muted: '#4f5d6e', line: '#d0dae6', chip: '#e2e9f2', bgSoft: '#eef2f7', dark: false },
  },
  harvest: {
    label: 'Harvest',
    heading: 'font-display font-bold',
    font: "'Space Grotesk', sans-serif",
    surface: { bg: '#f8eedb', card: '#fffaf0', fg: '#2d1a0e', muted: '#6e5a48', line: '#ead9ba', chip: '#f4e7cc', bgSoft: '#fbf3e3', dark: false },
  },
  travel: {
    label: 'Travel',
    heading: 'font-display font-bold',
    font: "'Space Grotesk', sans-serif",
    surface: { bg: '#141318', card: '#1d1b22', fg: '#f4f1ee', muted: '#a9a3a0', line: '#2f2c35', chip: '#26232c', bgSoft: '#18171d', dark: true },
  },
}

export const presetHeading = (theme?: ChapterTheme) => (theme ? presets[theme.preset].heading : '')

const surfaceVars = (s: Surface) => ({ '--bg': s.bg, '--card': s.card, '--fg': s.fg, '--muted': s.muted, '--line': s.line, '--chip': s.chip, '--bg-soft': s.bgSoft })

/** Scoped CSS variables for a themed card. */
export function themeStyle(theme?: ChapterTheme): CSSProperties {
  if (!theme) return {}
  const s = presets[theme.preset].surface
  return { '--glow-a': hexToRgb(theme.primary), '--glow-b': hexToRgb(theme.secondary), ...surfaceVars(s), color: s.fg } as CSSProperties
}

const THEMED_VARS = ['--glow-a', '--glow-b', '--bg', '--card', '--fg', '--muted', '--line', '--chip', '--bg-soft', '--chapter-font']

/**
 * Re-themes the whole page (background, text, cards, nav, accents, headings) while mounted.
 * Unmounting, e.g. navigating to another page, restores the site's own light/dark theme.
 */
export function usePageTheme(theme?: ChapterTheme) {
  useEffect(() => {
    const root = document.documentElement
    if (!theme) return
    const p = presets[theme.preset]
    const vars: Record<string, string> = {
      '--glow-a': hexToRgb(theme.primary),
      '--glow-b': hexToRgb(theme.secondary),
      ...surfaceVars(p.surface),
      '--chapter-font': p.font,
    }
    for (const [k, v] of Object.entries(vars)) root.style.setProperty(k, v)
    root.dataset.chapterPreset = theme.preset
    root.style.colorScheme = p.surface.dark ? 'dark' : 'light'
    return () => {
      for (const k of THEMED_VARS) root.style.removeProperty(k)
      delete root.dataset.chapterPreset
      root.style.removeProperty('color-scheme')
    }
  }, [theme])
}

export function LogoPlates({ theme, size = 'md' }: { theme?: ChapterTheme; size?: 'sm' | 'md' }) {
  if (!theme?.logos.length) return null
  return (
    <div className="flex flex-wrap items-center gap-2">
      {theme.logos.map((l) => (
        <span
          key={l.src}
          className={`inline-flex items-center rounded-xl ${size === "sm" ? "h-8 px-2" : "h-16 px-3"} ${l.plate === 'dark' ? 'bg-[#16181d]' : 'bg-white'} shadow-sm ring-1 ring-black/5`}
        >
          <img src={l.src} alt={l.alt} className={`${size === "sm" ? "h-5 max-w-24" : "h-12 max-w-44"} w-auto object-contain`} />
        </span>
      ))}
    </div>
  )
}


/** Decorative art behind a themed card. Purely visual. */
export function ChapterArt({ theme }: { theme?: ChapterTheme }) {
  if (!theme) return null
  const p = theme.primary
  const s = theme.secondary
  const layer = (style: CSSProperties, children?: ReactNode, cls = '') => (
    <div className={`pointer-events-none absolute inset-0 ${cls}`} style={style} aria-hidden>
      {children}
    </div>
  )

  switch (theme.preset) {
    case 'notebook':
      return (
        <>
          {layer({
            backgroundImage: 'linear-gradient(#bcd3f0 1px, transparent 1px), linear-gradient(90deg, #bcd3f0 1px, transparent 1px)',
            backgroundSize: '22px 22px',
            opacity: 0.55,
          })}
          {layer({ left: 56, width: 2, background: '#ef9a9a', right: 'auto' })}
          {layer(
            {},
            <svg className="absolute top-6 right-6 h-28 w-40 opacity-80 sm:right-10" viewBox="0 0 160 112" fill="none">
              {/* doodled pixel invader + code */}
              {[
                [2, 0], [8, 0], [3, 1], [7, 1], [2, 2], [3, 2], [4, 2], [5, 2], [6, 2], [7, 2], [8, 2], [1, 3], [2, 3], [4, 3], [5, 3], [6, 3], [8, 3], [9, 3],
                [0, 4], [1, 4], [2, 4], [3, 4], [4, 4], [5, 4], [6, 4], [7, 4], [8, 4], [9, 4], [10, 4], [0, 5], [2, 5], [8, 5], [10, 5], [3, 6], [4, 6], [6, 6], [7, 6],
              ].map(([x, y]) => (
                <rect key={`${x}-${y}`} x={90 + x * 6} y={10 + y * 6} width="5.4" height="5.4" fill={s} opacity="0.8" />
              ))}
              <text x="0" y="40" fontFamily="Caveat" fontSize="26" fill={p}>
                &lt;html&gt;
              </text>
              <text x="8" y="80" fontFamily="Caveat" fontSize="22" fill="#64748b">
                cout &lt;&lt; "hi";
              </text>
              <path d="M10 92 C 40 104, 90 84, 140 98" stroke={p} strokeWidth="2" strokeLinecap="round" opacity="0.7" />
            </svg>,
          )}
        </>
      )
    case 'print':
      return (
        <>
          {layer({
            backgroundImage: `radial-gradient(${p} 1.6px, transparent 1.8px), radial-gradient(${s} 1.6px, transparent 1.8px)`,
            backgroundSize: '14px 14px, 14px 14px',
            backgroundPosition: '0 0, 7px 7px',
            maskImage: 'radial-gradient(circle at 100% 0%, #000 0%, transparent 55%)',
            opacity: 0.55,
          })}
          {layer({ top: 0, bottom: 'auto', height: 8, background: `linear-gradient(90deg, #00a0e3 0 25%, #e6007e 25% 50%, #ffed00 50% 75%, #1d1d1b 75%)` })}
          {layer(
            {},
            ['top-5 right-5', 'bottom-5 left-5'].map((pos) => (
              <svg key={pos} className={`absolute ${pos} h-10 w-10`} viewBox="0 0 40 40" stroke="currentColor" fill="none" opacity="0.5">
                <circle cx="20" cy="20" r="9" />
                <path d="M20 0v40M0 20h40" />
              </svg>
            )),
          )}
        </>
      )
    case 'chalkboard':
      return (
        <>
          {layer({
            background: 'radial-gradient(ellipse at 20% 10%, rgb(255 255 255 / 0.08), transparent 50%), radial-gradient(ellipse at 80% 90%, rgb(255 255 255 / 0.06), transparent 50%)',
          })}
          {layer({ top: 'auto', height: 14, background: 'linear-gradient(#8b5a2b, #5c3a1a)' })}
          {layer(
            {},
            <svg className="absolute top-4 right-6 h-24 w-56 opacity-25" viewBox="0 0 220 90">
              <text x="0" y="34" fontFamily="Caveat" fontSize="34" fill="#fff">
                Hello, class!
              </text>
              <text x="40" y="76" fontFamily="Caveat" fontSize="28" fill={p}>
                ping 8.8.8.8 ✓
              </text>
            </svg>,
          )}
        </>
      )
    case 'academic':
      return (
        <>
          {layer({ backgroundImage: `linear-gradient(transparent 31px, ${p}22 32px)`, backgroundSize: '100% 32px' })}
          {layer({ left: 18, width: 4, right: 'auto', borderLeft: `1px solid ${p}55`, borderRight: `1px solid ${p}55` })}
          {layer(
            {},
            <svg className="absolute -top-10 -right-10 h-64 w-64 opacity-[0.12]" viewBox="0 0 200 200" fill="none" stroke={p}>
              <circle cx="100" cy="100" r="92" strokeWidth="4" />
              <circle cx="100" cy="100" r="76" strokeWidth="1.5" />
              <path id="arc" d="M100 100 m-64 0 a64 64 0 1 1 128 0 a64 64 0 1 1 -128 0" />
              <text fontFamily="Fraunces" fontSize="15" fill={p} letterSpacing="3">
                <textPath href="#arc">SCIENTIA · LABOR · CURIOSITAS ·</textPath>
              </text>
              <path d="M100 66 l10 22 24 3 -18 16 5 24 -21 -12 -21 12 5 -24 -18 -16 24 -3 z" fill={p} />
            </svg>,
          )}
        </>
      )
    case 'blueprint':
      return (
        <>
          {layer({
            backgroundImage:
              'linear-gradient(rgb(255 255 255 / 0.08) 1px, transparent 1px), linear-gradient(90deg, rgb(255 255 255 / 0.08) 1px, transparent 1px), linear-gradient(rgb(255 255 255 / 0.04) 1px, transparent 1px), linear-gradient(90deg, rgb(255 255 255 / 0.04) 1px, transparent 1px)',
            backgroundSize: '80px 80px, 80px 80px, 16px 16px, 16px 16px',
          })}
          {layer(
            {},
            <svg className="absolute right-4 bottom-4 h-40 w-56 opacity-50" viewBox="0 0 220 160" fill="none" stroke="#eaf4ff" strokeWidth="1.5">
              <path d="M30 80 L110 20 L190 80" />
              <path d="M24 84 L196 84" stroke={s} strokeWidth="3" />
              <path d="M196 84 v40" stroke={s} strokeWidth="3" />
              <rect x="45" y="80" width="130" height="70" />
              <rect x="70" y="105" width="28" height="45" />
              <rect x="120" y="100" width="34" height="24" />
              <path d="M30 150 h160" strokeDasharray="4 4" />
              <text x="80" y="14" fill="#eaf4ff" fontSize="9" fontFamily="JetBrains Mono" stroke="none">
                GUTTER · 32ft
              </text>
            </svg>,
          )}
        </>
      )
    case 'terminal':
      return (
        <>
          {layer({ backgroundImage: 'repeating-linear-gradient(transparent 0 2px, rgb(0 0 0 / 0.25) 2px 3px)' })}
          {layer(
            {},
            <pre className="absolute top-5 right-6 hidden font-mono text-xs leading-5 opacity-30 sm:block" style={{ color: p }}>
              {'$ git push -u origin main\n$ vercel --prod\n✓ deployed ufop.vercel.app\n$ python manage.py runserver'}
            </pre>,
          )}
        </>
      )
    case 'editorial':
      return (
        <>
          {layer({ background: `linear-gradient(115deg, transparent 0 68%, ${p} 68% 74%, transparent 74%)`, opacity: 0.18 })}
          {layer({ backgroundImage: `linear-gradient(90deg, currentColor 1px, transparent 1px)`, backgroundSize: '33.33% 100%', opacity: 0.05 })}
          {layer(
            {},
            <span className="absolute -top-6 right-8 font-['Fraunces'] text-[10rem] leading-none font-bold" style={{ color: p, opacity: 0.15 }}>
              “
            </span>,
          )}
        </>
      )
    case 'outdoors':
      return layer(
        {},
        <svg className="absolute inset-x-0 bottom-0 h-40 w-full" viewBox="0 0 800 160" preserveAspectRatio="none">
          <path d="M0 160 L0 90 L90 40 L170 95 L260 30 L360 100 L460 50 L560 110 L660 45 L800 100 L800 160 Z" fill={s} opacity="0.18" />
          <path d="M0 160 L0 120 L120 80 L230 125 L340 85 L470 130 L600 90 L720 125 L800 105 L800 160 Z" fill={p} opacity="0.14" />
          <path d="M0 150 C 200 140, 420 156, 800 138" stroke="currentColor" strokeOpacity="0.35" strokeWidth="3" fill="none" />
          <path d="M0 150 C 200 140, 420 156, 800 138" stroke="currentColor" strokeOpacity="0.35" strokeWidth="9" strokeDasharray="2 14" fill="none" />
        </svg>,
      )
    case 'legal':
      return (
        <>
          {layer(
            {},
            <svg className="absolute -right-24 -bottom-24 h-96 w-96 opacity-[0.14]" viewBox="0 0 200 200" fill="none" stroke={p}>
              {[90, 72, 54, 36].map((r) => (
                <path key={r} d={`M ${100 - r} 100 A ${r} ${r} 0 1 1 100 ${100 + r}`} strokeWidth={r / 9} strokeLinecap="round" />
              ))}
            </svg>,
          )}
          {layer(
            {},
            <span className="absolute top-2 right-8 font-['Fraunces'] text-8xl" style={{ color: p, opacity: 0.12 }}>
              §
            </span>,
          )}
        </>
      )
    case 'harvest':
      return (
        <>
          {layer({ background: `radial-gradient(circle at 88% 12%, ${s}55, transparent 28%)` })}
          {layer(
            {},
            <svg className="absolute inset-x-0 bottom-0 h-32 w-full" viewBox="0 0 800 130" preserveAspectRatio="none">
              {Array.from({ length: 9 }).map((_, i) => (
                <path key={i} d={`M0 ${130 - i * 11} Q 400 ${100 - i * 14} 800 ${130 - i * 11}`} stroke={i % 2 ? s : p} strokeOpacity="0.3" strokeWidth="2.5" fill="none" />
              ))}
            </svg>,
          )}
          {layer(
            {},
            <svg className="absolute right-10 bottom-6 h-24 w-16 opacity-40" viewBox="0 0 40 80" fill={s}>
              <path d="M20 80 V10" stroke={s} strokeWidth="2" />
              {[12, 22, 32, 42, 52].map((y) => (
                <g key={y}>
                  <ellipse cx="14" cy={y} rx="5" ry="8" transform={`rotate(-30 14 ${y})`} />
                  <ellipse cx="26" cy={y} rx="5" ry="8" transform={`rotate(30 26 ${y})`} />
                </g>
              ))}
            </svg>,
          )}
        </>
      )
    case 'travel':
      return (
        <>
          {layer({ backgroundImage: 'radial-gradient(currentColor 1px, transparent 1.2px)', backgroundSize: '18px 18px', opacity: 0.07 })}
          {layer(
            {},
            <svg className="absolute top-0 right-0 h-56 w-[28rem] max-w-full opacity-60" viewBox="0 0 440 220" fill="none">
              <path d="M20 190 C 120 40, 300 20, 420 70" stroke={p} strokeWidth="2.5" strokeDasharray="2 10" strokeLinecap="round" />
              <path d="M60 210 C 160 120, 260 120, 380 170" stroke={s} strokeWidth="2" strokeDasharray="2 9" strokeLinecap="round" />
              <circle cx="20" cy="190" r="6" fill={p} />
              <circle cx="420" cy="70" r="6" fill={p} />
              <g transform="translate(300 34) rotate(18)" fill={p}>
                <path d="M0 6 L28 0 L34 6 L28 12 Z M10 6 L4 -8 L10 -8 L20 4 Z M10 6 L4 20 L10 20 L20 8 Z" />
              </g>
            </svg>,
          )}
        </>
      )
  }
}

/** The chapter's artwork across the whole viewport, behind the content. */
export function PageArt({ theme, id }: { theme?: ChapterTheme; id?: string }) {
  if (!theme) return null
  return (
    <div key={id} className="pointer-events-none fixed inset-0 -z-10 animate-[detail-in_0.9s_ease-out] overflow-hidden text-fg" aria-hidden>
      <ChapterArt theme={theme} />
    </div>
  )
}

/** Soft full-page wash in the chapter's colors (fades in on change). */
export function PageWash({ theme, id }: { theme?: ChapterTheme; id?: string }) {
  if (!theme) return null
  return (
    <div
      key={id}
      className="pointer-events-none fixed inset-0 -z-10 animate-[detail-in_0.8s_ease-out]"
      style={{
        background: `radial-gradient(60rem 30rem at 85% 10%, ${theme.primary}26, transparent 70%), radial-gradient(50rem 30rem at 0% 90%, ${theme.secondary}22, transparent 70%)`,
      }}
      aria-hidden
    />
  )
}

export const presetLabel = (theme?: ChapterTheme) => (theme ? presets[theme.preset].label : '')
