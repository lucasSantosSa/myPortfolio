import { Link } from 'react-router'
import { ContactForm } from '../components/ContactForm'
import { DownloadIcon, GithubIcon, LinkedinIcon, MailIcon, WhatsappIcon } from '../components/Icons'
import { ProjectCard } from '../components/ProjectBits'
import { Timeline } from '../components/Timeline'
import { projects, site, timeline } from '../content/load'
import { whatsappLink } from '../lib/format'
import { usePageTitle } from '../lib/usePageTitle'

export function Home() {
  usePageTitle()
  const featured = projects.filter((p) => p.featured).slice(0, 4)
  const recentWork = timeline.filter((t) => t.kind === 'work').slice(0, 3)

  return (
    <>
      {/* Hero */}
      <section className="container-page grid items-center gap-10 py-16 md:grid-cols-[1.4fr_1fr] md:py-24">
        <div>
          <p className="eyebrow">{site.role}</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl dark:text-zinc-50">Hi, I'm {site.name.split(' ')[0]}.</h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">{site.tagline}</p>
          <p className="mt-3 text-sm text-zinc-500">{site.location}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/#contact" className="btn-primary">
              Get in touch
            </Link>
            <a href={site.cv} className="btn-ghost" download>
              <DownloadIcon /> Download CV
            </a>
          </div>
          <div className="mt-6 flex gap-1 text-zinc-500">
            <a className="rounded-lg p-2 hover:text-zinc-900 dark:hover:text-zinc-100" href={site.socials.github} target="_blank" rel="noreferrer" aria-label="GitHub">
              <GithubIcon />
            </a>
            <a className="rounded-lg p-2 hover:text-zinc-900 dark:hover:text-zinc-100" href={site.socials.linkedin} target="_blank" rel="noreferrer" aria-label="LinkedIn">
              <LinkedinIcon />
            </a>
          </div>
        </div>
        <div className="mx-auto w-64 sm:w-72 md:w-full md:max-w-sm">
          <div className="overflow-hidden rounded-[2rem] bg-gradient-to-b from-accent-100 to-accent-300 dark:from-accent-900 dark:to-zinc-900">
            <img src="/media/profile/me-960.webp" srcSet="/media/profile/me-480.webp 480w, /media/profile/me-960.webp 960w" sizes="(min-width: 768px) 384px, 288px" alt={`Portrait of ${site.name}`} className="w-full" width={960} height={1122} />
          </div>
        </div>
      </section>

      {/* Highlights */}
      <section aria-label="Highlights" className="border-y border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/40">
        <dl className="container-page grid grid-cols-2 gap-6 py-10 md:grid-cols-4">
          {site.highlights.map((h) => (
            <div key={h.label}>
              <dt className="sr-only">{h.label}</dt>
              <dd className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{h.value}</dd>
              <dd className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{h.label}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Featured projects */}
      <section className="container-page py-20" aria-labelledby="featured-heading">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Projects</p>
            <h2 id="featured-heading" className="mt-2 text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              Things I've built
            </h2>
          </div>
          <Link to="/projects" className="text-sm font-semibold text-accent-700 hover:underline dark:text-accent-400">
            All projects →
          </Link>
        </div>
        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          {featured.map((p) => (
            <ProjectCard key={p.slug} project={p} />
          ))}
        </div>
      </section>

      {/* Experience teaser */}
      <section className="border-t border-zinc-200 dark:border-zinc-800" aria-labelledby="exp-heading">
        <div className="container-page grid gap-10 py-20 md:grid-cols-[1fr_2fr]">
          <div>
            <p className="eyebrow">Experience</p>
            <h2 id="exp-heading" className="mt-2 text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              Where I've worked
            </h2>
            <p className="mt-4 text-zinc-600 dark:text-zinc-400">Client code stays private, so each role describes what I built and how I grew, and links to an original project with the same pattern where there is one.</p>
            <Link to="/experience" className="btn-ghost mt-6">
              Full timeline
            </Link>
          </div>
          <Timeline entries={recentWork} compact />
        </div>
      </section>

      {/* About */}
      <section className="border-t border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/40" aria-labelledby="about-heading">
        <div className="container-page grid items-center gap-10 py-20 md:grid-cols-[1fr_1.5fr]">
          <img src="/media/profile/me-about.webp" alt={`${site.name} smiling outdoors`} loading="lazy" className="mx-auto w-64 rounded-2xl object-cover md:w-full md:max-w-sm" />
          <div>
            <p className="eyebrow">About</p>
            <h2 id="about-heading" className="mt-2 text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              A bit about me
            </h2>
            {site.about.split('\n\n').map((para) => (
              <p key={para.slice(0, 20)} className="mt-4 leading-relaxed text-zinc-600 dark:text-zinc-400">
                {para}
              </p>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="scroll-mt-20 border-t border-zinc-200 dark:border-zinc-800" aria-labelledby="contact-heading">
        <div className="container-page grid gap-10 py-20 md:grid-cols-[1fr_1.5fr]">
          <div>
            <p className="eyebrow">Contact</p>
            <h2 id="contact-heading" className="mt-2 text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              Let's talk
            </h2>
            <p className="mt-4 text-zinc-600 dark:text-zinc-400">Hiring, a project, or just a question? Send a message here and it reaches my email and WhatsApp at the same time.</p>
            <ul className="mt-6 space-y-3 text-sm">
              <li>
                <a className="inline-flex items-center gap-2 text-zinc-700 hover:text-accent-700 dark:text-zinc-300 dark:hover:text-accent-400" href={`mailto:${site.contact.email}`}>
                  <MailIcon /> {site.contact.email}
                </a>
              </li>
              <li>
                <a className="inline-flex items-center gap-2 text-zinc-700 hover:text-accent-700 dark:text-zinc-300 dark:hover:text-accent-400" href={whatsappLink(site.contact.whatsapp)} target="_blank" rel="noreferrer">
                  <WhatsappIcon /> Message me on WhatsApp
                </a>
              </li>
            </ul>
          </div>
          <ContactForm />
        </div>
      </section>
    </>
  )
}
