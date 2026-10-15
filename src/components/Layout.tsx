import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router'
import { site } from '../content/load'
import { whatsappLink } from '../lib/format'
import { GithubIcon, LinkedinIcon, MailIcon, MoonIcon, SunIcon, WhatsappIcon } from './Icons'

function ThemeToggle() {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'))
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    try {
      localStorage.setItem('theme', dark ? 'dark' : 'light')
    } catch {
      /* storage unavailable */
    }
  }, [dark])
  return (
    <button
      type="button"
      onClick={() => setDark((d) => !d)}
      className="grid h-9 w-9 place-items-center rounded-full text-muted transition-colors hover:bg-chip hover:text-fg"
      aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'}
    >
      <span key={String(dark)} className="animate-[spin_0.5s_ease-out]">
        {dark ? <SunIcon width={18} height={18} /> : <MoonIcon width={18} height={18} />}
      </span>
    </button>
  )
}

function ScrollProgress() {
  const [p, setP] = useState(0)
  useEffect(() => {
    let raf = 0
    const onScroll = () => {
      if (raf) return
      raf = requestAnimationFrame(() => {
        raf = 0
        const max = document.documentElement.scrollHeight - window.innerHeight
        setP(max > 0 ? window.scrollY / max : 0)
      })
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  return <div className="fixed inset-x-0 top-0 z-50 h-0.5 origin-left bg-gradient-to-r from-accent-400 to-violet-500" style={{ transform: `scaleX(${p})` }} aria-hidden />
}

const links = [
  { to: '/', label: 'Home', end: true },
  { to: '/experience', label: 'Experience' },
  { to: '/projects', label: 'Projects' },
]

export function Layout() {
  const { pathname, hash } = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    setMenuOpen(false)
    if (hash) {
      // wait a frame so the target section exists after a route change
      requestAnimationFrame(() => document.getElementById(hash.slice(1))?.scrollIntoView())
    } else {
      window.scrollTo(0, 0)
    }
  }, [pathname, hash])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const pill = ({ isActive }: { isActive: boolean }) =>
    `relative rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${isActive ? 'bg-fg text-bg' : 'text-muted hover:text-fg'}`

  return (
    <div className="flex min-h-screen flex-col">
      <ScrollProgress />
      <a href="#main" className="btn-primary sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60]">
        Skip to content
      </a>

      <header className="fixed inset-x-0 top-0 z-40 px-4 pt-3 sm:pt-4">
        <div
          className={`mx-auto flex max-w-6xl items-center justify-between gap-2 rounded-full border px-3 py-2 transition-all duration-500 sm:px-4 ${
            scrolled ? 'border-line bg-card/70 shadow-[0_8px_30px_-12px_rgb(0_0_0/0.25)] backdrop-blur-xl' : 'border-transparent bg-transparent'
          }`}
        >
          <Link to="/" viewTransition className="group flex items-center gap-2.5 pl-1 font-display font-semibold tracking-tight">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-accent-400 to-violet-500 text-xs font-bold text-white transition-transform duration-500 group-hover:rotate-[360deg]">
              LS
            </span>
            <span className="hidden sm:inline">{site.name}</span>
          </Link>

          <nav aria-label="Main" className="hidden items-center gap-1 rounded-full border border-line bg-bg/60 p-1 md:flex">
            {links.map((l) => (
              <NavLink key={l.to} to={l.to} end={l.end} viewTransition className={pill}>
                {l.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-1">
            <ThemeToggle />
            <Link to="/#contact" className="btn-primary hidden px-4 py-2 sm:inline-flex">
              Let's talk
            </Link>
            <button
              type="button"
              className="grid h-9 w-9 place-items-center rounded-full text-fg hover:bg-chip md:hidden"
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              onClick={() => setMenuOpen((o) => !o)}
            >
              <span className="relative block h-3 w-4" aria-hidden>
                <span className={`absolute left-0 h-0.5 w-4 rounded bg-current transition-all duration-300 ${menuOpen ? 'top-1.5 rotate-45' : 'top-0'}`} />
                <span className={`absolute top-1.5 left-0 h-0.5 w-4 rounded bg-current transition-opacity ${menuOpen ? 'opacity-0' : ''}`} />
                <span className={`absolute left-0 h-0.5 w-4 rounded bg-current transition-all duration-300 ${menuOpen ? 'top-1.5 -rotate-45' : 'top-3'}`} />
              </span>
            </button>
          </div>
        </div>

        <nav
          id="mobile-menu"
          aria-label="Mobile"
          className={`mx-auto mt-2 max-w-6xl overflow-hidden rounded-3xl border border-line bg-card/95 backdrop-blur-xl transition-all duration-300 md:hidden ${
            menuOpen ? 'max-h-80 opacity-100' : 'pointer-events-none max-h-0 border-transparent opacity-0'
          }`}
        >
          <ul className="p-2">
            {[...links, { to: '/#contact', label: 'Contact', end: false }].map((l, i) => (
              <li key={l.to} style={{ transitionDelay: `${i * 40}ms` }} className={`transition-all duration-300 ${menuOpen ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0'}`}>
                <Link to={l.to} className="block rounded-2xl px-4 py-3 font-display text-lg font-medium hover:bg-chip" tabIndex={menuOpen ? 0 : -1}>
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      <main id="main" className="flex-1">
        <Outlet />
      </main>

      <footer className="relative overflow-hidden border-t border-line">
        <div className="container-page flex flex-col gap-10 py-14 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              Let's build something <span className="gradient-text">good</span>.
            </p>
            <p className="mt-3 text-sm text-muted">
              © {new Date().getFullYear()} {site.name} · {site.location}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {[
              { href: site.socials.github, label: 'GitHub', icon: <GithubIcon /> },
              { href: site.socials.linkedin, label: 'LinkedIn', icon: <LinkedinIcon /> },
              { href: whatsappLink(site.contact.whatsapp), label: 'WhatsApp', icon: <WhatsappIcon /> },
              { href: `mailto:${site.contact.email}`, label: 'Email', icon: <MailIcon /> },
            ].map((s) => (
              <a
                key={s.label}
                href={s.href}
                target={s.href.startsWith('mailto') ? undefined : '_blank'}
                rel="noreferrer"
                aria-label={s.label}
                className="grid h-11 w-11 place-items-center rounded-full border border-line text-muted transition-all duration-300 hover:-translate-y-1 hover:border-accent-400 hover:text-fg"
              >
                {s.icon}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  )
}
