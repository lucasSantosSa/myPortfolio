import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Link, useParams } from 'react-router'
import { ExternalIcon, GithubIcon } from '../components/Icons'
import { CompletenessMeter, ProjectActivityPanel } from '../components/Activity'
import { MediaGallery } from '../components/MediaGallery'
import { activityFor } from '../content/activity'
import { Reveal } from '../components/motion'
import { categoryLabels, ProjectCard, StatusBadge, Tags } from '../components/ProjectBits'
import { projectBySlug, projects, timelineBySlug } from '../content/load'
import { formatPeriod } from '../lib/format'
import { usePageTitle } from '../lib/usePageTitle'
import { NotFound } from './NotFound'

export function ProjectDetail() {
  const { slug = '' } = useParams()
  const project = projectBySlug(slug)
  usePageTitle(project?.title ?? 'Not found')
  if (!project) return <NotFound />
  const related = project.relatedTimeline ? timelineBySlug(project.relatedTimeline) : undefined
  const more = projects.filter((p) => p.slug !== project.slug && p.status !== 'archived' && p.category === project.category).slice(0, 2)

  return (
    <article>
      <header className="relative isolate overflow-hidden pt-36 pb-10 sm:pt-40">
        <div className="grid-bg absolute inset-0 -z-10" aria-hidden />
        <div className="absolute -top-32 right-1/4 -z-10 h-80 w-80 animate-aurora rounded-full bg-violet-500/20 blur-3xl" aria-hidden />
        <div className="container-page max-w-4xl">
          <Reveal>
            <Link to="/projects" viewTransition className="group inline-flex items-center gap-2 text-sm font-medium text-muted hover:text-fg">
              <span className="transition-transform group-hover:-translate-x-1" aria-hidden>
                ←
              </span>
              All projects
            </Link>
          </Reveal>
          <Reveal delay={80}>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <p className="eyebrow">{categoryLabels[project.category]}</p>
              <StatusBadge status={project.status} />
              {project.period && <span className="font-mono text-xs text-muted">{formatPeriod(project.period.start, project.period.end)}</span>}
            </div>
            <div className="mt-4 flex items-start justify-between gap-6">
              <h1 className="text-5xl font-semibold tracking-tight sm:text-6xl">{project.title}</h1>
              <span className="shrink-0 pt-2">
                <CompletenessMeter project={project} size={64} />
              </span>
            </div>
          </Reveal>
          <Reveal delay={160}>
            <p className="mt-5 text-xl leading-relaxed text-muted">{project.summary}</p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              {project.demoUrl && (
                <a href={project.demoUrl} target="_blank" rel="noreferrer" className="btn-primary px-6 py-3">
                  Live demo <ExternalIcon />
                </a>
              )}
              {project.repo?.visibility === 'public' && (
                <a href={project.repo.url} target="_blank" rel="noreferrer" className="btn-ghost px-6 py-3">
                  <GithubIcon width={16} height={16} /> Source code
                </a>
              )}
              {project.repo?.visibility === 'private' && <span className="chip py-1">Source is private for now</span>}
            </div>
          </Reveal>
        </div>
      </header>

      <div className="container-page max-w-4xl pb-24">
        {related && (
          <Reveal>
            <p className="rounded-3xl border border-accent-400/40 bg-accent-400/10 p-5 text-sm leading-relaxed">
              Built from scratch with a generic domain and fake data to show the kind of work I did as {related.title} at{' '}
              <Link to="/experience" viewTransition className="font-semibold underline underline-offset-4">
                {related.org}
              </Link>
              . No client code or design is used.
            </p>
          </Reveal>
        )}

        <Reveal className="mt-10">
          <MediaGallery media={project.media} />
          {project.media.length === 0 && project.status === 'coming-soon' && (
            <div className="grid place-items-center rounded-3xl border border-dashed border-line p-12 text-center text-sm text-muted">Screenshots and a live demo are on the way.</div>
          )}
        </Reveal>

        {activityFor(project.slug) && (
          <Reveal className="mt-10">
            <ProjectActivityPanel activity={activityFor(project.slug)!} />
          </Reveal>
        )}

        <div className="mt-12 grid gap-12 md:grid-cols-[1fr_14rem]">
          {project.description ? (
            <Reveal className="prose-lite text-lg text-fg/85">
              <Markdown remarkPlugins={[remarkGfm]}>{project.description}</Markdown>
            </Reveal>
          ) : (
            <div />
          )}
          <Reveal delay={120}>
            <aside className="md:sticky md:top-28">
              <h2 className="font-mono text-xs tracking-widest text-muted uppercase">Built with</h2>
              <div className="mt-3">
                <Tags items={project.stack} />
              </div>
            </aside>
          </Reveal>
        </div>

        {more.length > 0 && (
          <section className="mt-24" aria-labelledby="more-heading">
            <Reveal>
              <h2 id="more-heading" className="text-2xl font-semibold tracking-tight">
                More like this
              </h2>
            </Reveal>
            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              {more.map((p, i) => (
                <Reveal key={p.slug} delay={i * 100}>
                  <ProjectCard project={p} />
                </Reveal>
              ))}
            </div>
          </section>
        )}
      </div>
    </article>
  )
}
