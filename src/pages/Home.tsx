import { Link } from 'react-router'
import { ContactForm } from '../components/ContactForm'
import { DownloadIcon, GithubIcon, LinkedinIcon, MailIcon, WhatsappIcon } from '../components/Icons'
import { CountUp, Marquee, Reveal, RotatingWords } from '../components/motion'
import { ProjectCard } from '../components/ProjectBits'
import { Timeline } from '../components/Timeline'
import { projects, site, timeline } from '../content/load'
import { whatsappLink } from '../lib/format'
import { usePageTitle } from '../lib/usePageTitle'

export function SectionHeading({ index, eyebrow, title, children, id }: { index: string; eyebrow: string; title: React.ReactNode; children?: React.ReactNode; id: string }) {
  return (
    <Reveal>
      <p className="eyebrow">
        <span className="text-muted">{index}</span>
        <span className="h-px w-8 bg-accent-400/60" aria-hidden />
        {eyebrow}
      </p>
      <h2 id={id} className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
        {title}
      </h2>
      {children && <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted">{children}</p>}
    </Reveal>
  )
}

function Hero() {
  const first = site.name.split(' ')[0]
  return (
    <section className="relative isolate overflow-hidden pt-32 pb-20 sm:pt-40 sm:pb-28">
      {/* animated backdrop */}
      <div className="grid-bg absolute inset-0 -z-10" aria-hidden />
      <div className="absolute -top-40 -left-40 -z-10 h-[34rem] w-[34rem] animate-aurora rounded-full bg-accent-400/25 blur-3xl dark:bg-accent-400/20" aria-hidden />
      <div className="absolute top-10 -right-40 -z-10 h-[30rem] w-[30rem] animate-aurora rounded-full bg-violet-500/20 blur-3xl [animation-delay:-6s] dark:bg-violet-500/25" aria-hidden />

      <div className="container-page grid items-center gap-14 lg:grid-cols-[1.35fr_1fr]">
        <div>
          <Reveal delay={0}>
            <p className="inline-flex items-center gap-2 rounded-full border border-line bg-card/60 px-3 py-1 text-xs font-medium text-muted backdrop-blur">
              <span className="h-2 w-2 animate-pulse-ring rounded-full bg-accent-400" aria-hidden />
              {site.role} · {site.location}
            </p>
          </Reveal>
          <Reveal delay={120}>
            <h1 className="mt-6 text-[2.6rem] leading-[1.05] font-semibold tracking-tight sm:text-6xl lg:text-7xl">
              Hi, I'm {first}.
              <br />
              <span className="text-muted">I build</span> <RotatingWords words={site.headlineWords} />
            </h1>
          </Reveal>
          <Reveal delay={240}>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">{site.tagline}</p>
          </Reveal>
          <Reveal delay={360}>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link to="/projects" viewTransition className="btn-primary px-6 py-3">
                See my work <span aria-hidden>→</span>
              </Link>
              <a href={site.cv} className="btn-ghost px-6 py-3" download>
                <DownloadIcon /> Download CV
              </a>
              <div className="ml-1 flex gap-1">
                <a className="grid h-11 w-11 place-items-center rounded-full text-muted transition-all hover:-translate-y-0.5 hover:bg-chip hover:text-fg" href={site.socials.github} target="_blank" rel="noreferrer" aria-label="GitHub">
                  <GithubIcon />
                </a>
                <a className="grid h-11 w-11 place-items-center rounded-full text-muted transition-all hover:-translate-y-0.5 hover:bg-chip hover:text-fg" href={site.socials.linkedin} target="_blank" rel="noreferrer" aria-label="LinkedIn">
                  <LinkedinIcon />
                </a>
              </div>
            </div>
          </Reveal>
        </div>

        <Reveal delay={200} className="relative mx-auto w-full max-w-[22rem] lg:max-w-none">
          <div className="relative">
            <div className="absolute -inset-3 rounded-[2.75rem] bg-gradient-to-br from-accent-400 via-violet-500 to-accent-400 opacity-60 blur-2xl" aria-hidden />
            <div className="relative overflow-hidden rounded-[2.5rem] border border-line bg-gradient-to-b from-accent-200/70 to-violet-400/40 dark:from-accent-900/80 dark:to-violet-500/20">
              <img
                src="/media/profile/me-960.webp"
                srcSet="/media/profile/me-480.webp 480w, /media/profile/me-960.webp 960w"
                sizes="(min-width: 1024px) 420px, 352px"
                alt={`Portrait of ${site.name}`}
                className="w-full"
                width={960}
                height={1122}
                fetchPriority="high"
              />
            </div>
            {/* floating chips */}
            {[
              { t: 'React', c: 'top-10 -left-6', d: '0s' },
              { t: 'TypeScript', c: 'top-1/2 -right-6', d: '-2s' },
              { t: 'Node · PostgreSQL', c: 'bottom-10 -left-4', d: '-4s' },
            ].map((chip) => (
              <span
                key={chip.t}
                className={`absolute ${chip.c} hidden animate-float rounded-full border border-line bg-card/85 px-3.5 py-1.5 font-mono text-xs text-fg shadow-lg backdrop-blur sm:block`}
                style={{ animationDelay: chip.d }}
                aria-hidden
              >
                {chip.t}
              </span>
            ))}
          </div>
        </Reveal>
      </div>

      <a href="#highlights" className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 text-xs text-muted transition-colors hover:text-fg lg:flex" aria-label="Scroll down">
        <span className="relative h-9 w-5 rounded-full border border-line">
          <span className="absolute top-1.5 left-1/2 h-2 w-1 -translate-x-1/2 animate-bounce rounded-full bg-accent-400" />
        </span>
      </a>
    </section>
  )
}

export function Home() {
  usePageTitle()
  const featured = projects.filter((p) => p.featured).slice(0, 4)
  const recentWork = timeline.filter((t) => t.kind === 'work').slice(0, 3)
  const tech = [...new Set([...timeline.flatMap((t) => t.stack), ...projects.flatMap((p) => p.stack)])].slice(0, 22)

  return (
    <>
      <Hero />

      <div className="border-y border-line bg-bg-soft py-6" aria-label="Technologies I work with">
        <Marquee items={tech} />
      </div>

      {/* Highlights */}
      <section id="highlights" aria-label="Highlights" className="container-page scroll-mt-24 py-20">
        <dl className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {site.highlights.map((h, i) => (
            <Reveal key={h.label} delay={i * 90} className="card p-6">
              <dt className="sr-only">{h.label}</dt>
              <dd className="font-display text-4xl font-semibold tracking-tight whitespace-nowrap sm:text-5xl">
                <CountUp value={h.value} />
              </dd>
              <dd className="mt-2 text-sm leading-snug text-muted">{h.label}</dd>
            </Reveal>
          ))}
        </dl>
      </section>

      {/* Featured projects (bento) */}
      <section className="container-page py-16" aria-labelledby="featured-heading">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHeading index="01" eyebrow="Projects" title="Things I've built" id="featured-heading">
            Tools I use every day, plus original rebuilds of the kind of systems I've built for clients.
          </SectionHeading>
          <Reveal>
            <Link to="/projects" viewTransition className="btn-ghost">
              All projects <span aria-hidden>→</span>
            </Link>
          </Reveal>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-6">
          {featured.map((p, i) => (
            <Reveal key={p.slug} delay={(i % 2) * 120} className={i === 0 || i === 3 ? 'md:col-span-4' : 'md:col-span-2'}>
              <ProjectCard project={p} large={i === 0 || i === 3} />
            </Reveal>
          ))}
        </div>
      </section>

      {/* Experience */}
      <section className="py-24" aria-labelledby="exp-heading">
        <div className="container-page grid gap-14 lg:grid-cols-[1fr_1.6fr]">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <SectionHeading index="02" eyebrow="Experience" title="Where I've worked" id="exp-heading">
              Client code stays private, so each role describes what I built and how I grew, with links to original projects that use the same patterns.
            </SectionHeading>
            <Reveal delay={120}>
              <Link to="/experience" viewTransition className="btn-ghost mt-8">
                Full timeline <span aria-hidden>→</span>
              </Link>
            </Reveal>
          </div>
          <Timeline entries={recentWork} compact />
        </div>
      </section>

      {/* About */}
      <section className="relative overflow-hidden border-y border-line bg-bg-soft py-24" aria-labelledby="about-heading">
        <div className="absolute -right-32 -bottom-32 h-96 w-96 animate-aurora rounded-full bg-accent-400/10 blur-3xl" aria-hidden />
        <div className="container-page grid items-center gap-14 lg:grid-cols-[1fr_1.5fr]">
          <Reveal className="mx-auto w-full max-w-sm">
            <div className="group relative">
              <div className="absolute inset-0 translate-x-3 translate-y-3 rounded-[2rem] border-2 border-accent-400/50 transition-transform duration-500 group-hover:translate-x-1.5 group-hover:translate-y-1.5" aria-hidden />
              <img src="/media/profile/me-about.webp" alt={`${site.name} smiling outdoors`} loading="lazy" className="relative w-full rounded-[2rem] object-cover" />
            </div>
          </Reveal>
          <div>
            <SectionHeading index="03" eyebrow="About" title="A bit about me" id="about-heading" />
            {site.about.split('\n\n').map((para, i) => (
              <Reveal key={para.slice(0, 20)} delay={i * 100}>
                <p className="mt-5 text-lg leading-relaxed text-muted">{para}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="relative scroll-mt-24 py-24" aria-labelledby="contact-heading">
        <div className="container-page grid gap-14 lg:grid-cols-[1fr_1.4fr]">
          <div>
            <SectionHeading index="04" eyebrow="Contact" title={<>Let's <span className="gradient-text">talk</span>.</>} id="contact-heading">
              Hiring, a project, or just a question? Your message reaches my email and my WhatsApp at the same time.
            </SectionHeading>
            <Reveal delay={120}>
              <ul className="mt-8 space-y-3">
                <li>
                  <a className="group flex items-center gap-4 rounded-2xl border border-line p-4 transition-all hover:-translate-y-0.5 hover:border-accent-400/60" href={`mailto:${site.contact.email}`}>
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-chip text-accent-500 transition-transform group-hover:scale-110">
                      <MailIcon />
                    </span>
                    <span>
                      <span className="block text-xs text-muted">Email</span>
                      <span className="font-medium">{site.contact.email}</span>
                    </span>
                  </a>
                </li>
                <li>
                  <a className="group flex items-center gap-4 rounded-2xl border border-line p-4 transition-all hover:-translate-y-0.5 hover:border-accent-400/60" href={whatsappLink(site.contact.whatsapp)} target="_blank" rel="noreferrer">
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-chip text-emerald-500 transition-transform group-hover:scale-110">
                      <WhatsappIcon />
                    </span>
                    <span>
                      <span className="block text-xs text-muted">WhatsApp</span>
                      <span className="font-medium">Message me directly</span>
                    </span>
                  </a>
                </li>
              </ul>
            </Reveal>
          </div>
          <Reveal delay={150}>
            <ContactForm />
          </Reveal>
        </div>
      </section>
    </>
  )
}
