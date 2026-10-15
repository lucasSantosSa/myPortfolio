import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router'
import { site } from '../content/load'
import { GithubIcon, LinkedinIcon, MailIcon, MoonIcon, SunIcon, WhatsappIcon } from './Icons'
import { whatsappLink } from '../lib/format'

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
      className="rounded-lg p-2 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900"
      aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'}
    >
      {dark ? <SunIcon /> : <MoonIcon />}
    </button>
  )
}

const navClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
    isActive ? 'text-accent-700 dark:text-accent-400' : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
  }`

export function Layout() {
  const { pathname, hash } = useLocation()

  // Scroll to top on page change, or to the anchor when one is given
  useEffect(() => {
    if (hash) {
      document.getElementById(hash.slice(1))?.scrollIntoView()
    } else {
      window.scrollTo(0, 0)
    }
  }, [pathname, hash])

  return (
    <div className="flex min-h-screen flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 btn-primary">
        Skip to content
      </a>
      <header className="sticky top-0 z-40 border-b border-zinc-200/70 bg-white/85 backdrop-blur dark:border-zinc-800/70 dark:bg-zinc-950/85">
        <div className="container-page flex h-16 items-center justify-between gap-2">
          <Link to="/" className="font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            {site.name}
          </Link>
          <nav aria-label="Main" className="flex items-center">
            <NavLink to="/experience" className={navClass}>
              Experience
            </NavLink>
            <NavLink to="/projects" className={navClass}>
              Projects
            </NavLink>
            <Link to="/#contact" className="hidden sm:inline-flex rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100">
              Contact
            </Link>
            <ThemeToggle />
          </nav>
        </div>
      </header>

      <main id="main" className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-zinc-200 py-10 dark:border-zinc-800">
        <div className="container-page flex flex-col items-center justify-between gap-4 text-sm text-zinc-500 sm:flex-row">
          <p>
            © {new Date().getFullYear()} {site.name}
          </p>
          <div className="flex items-center gap-1">
            <a className="rounded-lg p-2 hover:text-zinc-900 dark:hover:text-zinc-100" href={site.socials.github} target="_blank" rel="noreferrer" aria-label="GitHub">
              <GithubIcon />
            </a>
            <a className="rounded-lg p-2 hover:text-zinc-900 dark:hover:text-zinc-100" href={site.socials.linkedin} target="_blank" rel="noreferrer" aria-label="LinkedIn">
              <LinkedinIcon />
            </a>
            <a className="rounded-lg p-2 hover:text-zinc-900 dark:hover:text-zinc-100" href={whatsappLink(site.contact.whatsapp)} target="_blank" rel="noreferrer" aria-label="WhatsApp">
              <WhatsappIcon />
            </a>
            <a className="rounded-lg p-2 hover:text-zinc-900 dark:hover:text-zinc-100" href={`mailto:${site.contact.email}`} aria-label="Email">
              <MailIcon />
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
