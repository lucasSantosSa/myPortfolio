import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Link, useParams } from 'react-router'
import { ExternalIcon, GithubIcon } from '../components/Icons'
import { MediaGallery } from '../components/MediaGallery'
import { categoryLabels, StatusBadge, Tags } from '../components/ProjectBits'
import { projectBySlug, timelineBySlug } from '../content/load'
import { formatPeriod } from '../lib/format'
import { usePageTitle } from '../lib/usePageTitle'
import { NotFound } from './NotFound'

export function ProjectDetail() {
  const { slug = '' } = useParams()
  const project = projectBySlug(slug)
  usePageTitle(project?.title ?? 'Not found')
  if (!project) return <NotFound />
  const related = project.relatedTimeline ? timelineBySlug(project.relatedTimeline) : undefined

  return (
    <article className="container-page max-w-4xl py-16">
      <Link to="/projects" className="text-sm font-medium text-accent-700 hover:underline dark:text-accent-400">
        ← All projects
      </Link>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <p className="eyebrow">{categoryLabels[project.category]}</p>
        <StatusBadge status={project.status} />
      </div>
      <h1 className="mt-2 text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">{project.title}</h1>
      <p className="mt-4 text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">{project.summary}</p>
      {project.period && <p className="mt-2 text-sm text-zinc-500">{formatPeriod(project.period.start, project.period.end)}</p>}

      <div className="mt-6 flex flex-wrap gap-3">
        {project.demoUrl && (
          <a href={project.demoUrl} target="_blank" rel="noreferrer" className="btn-primary">
            Live demo <ExternalIcon />
          </a>
        )}
        {project.repo?.visibility === 'public' && (
          <a href={project.repo.url} target="_blank" rel="noreferrer" className="btn-ghost">
            <GithubIcon width={16} height={16} /> Source code
          </a>
        )}
        {project.repo?.visibility === 'private' && <span className="self-center text-sm text-zinc-500">Source is private for now.</span>}
      </div>

      {related && (
        <p className="mt-8 rounded-xl border border-accent-200 bg-accent-50 p-4 text-sm text-accent-900 dark:border-accent-900 dark:bg-accent-900/20 dark:text-accent-100">
          Built from scratch with a generic domain and fake data to show the kind of work I did as {related.title} at{' '}
          <Link to="/experience" className="font-semibold underline">
            {related.org}
          </Link>
          . No client code or design is used.
        </p>
      )}

      <div className="mt-10">
        <MediaGallery media={project.media} />
        {project.media.length === 0 && project.status === 'coming-soon' && (
          <p className="rounded-xl border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500 dark:border-zinc-700">Screenshots and a live demo are on the way.</p>
        )}
      </div>

      {project.description && (
        <div className="prose-lite mt-10 text-zinc-700 dark:text-zinc-300">
          <Markdown remarkPlugins={[remarkGfm]}>{project.description}</Markdown>
        </div>
      )}

      <section className="mt-10" aria-labelledby="stack-heading">
        <h2 id="stack-heading" className="mb-3 text-sm font-semibold tracking-wide text-zinc-500 uppercase">
          Built with
        </h2>
        <Tags items={project.stack} />
      </section>
    </article>
  )
}
