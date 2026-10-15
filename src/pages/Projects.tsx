import { useState } from 'react'
import { Reveal } from '../components/motion'
import { PageHeader } from '../components/PageHeader'
import { categoryLabels, ProjectCard } from '../components/ProjectBits'
import { projects } from '../content/load'
import type { Project } from '../content/schema'
import { usePageTitle } from '../lib/usePageTitle'

const order: Project['category'][] = ['ai', 'tools', 'showcase', 'web', 'systems']

export function Projects() {
  usePageTitle('Projects')
  const [category, setCategory] = useState<Project['category'] | 'all'>('all')
  const active = projects.filter((p) => p.status !== 'archived' && (category === 'all' || p.category === category))
  const archived = projects.filter((p) => p.status === 'archived' && (category === 'all' || p.category === category))
  const categories = order.filter((c) => projects.some((p) => p.category === c))

  return (
    <>
      <PageHeader eyebrow="Projects" title={<>Things I've <span className="gradient-text">built</span></>}>
        Personal tools, showcase rebuilds of the kind of systems I've built for clients, and earlier work.
      </PageHeader>

      <div className="container-page pb-24">
        <Reveal>
          <div role="group" aria-label="Filter projects by category" className="inline-flex flex-wrap gap-1 rounded-full border border-line bg-card/60 p-1 backdrop-blur">
            {(['all', ...categories] as const).map((c) => (
              <button
                key={c}
                type="button"
                aria-pressed={category === c}
                onClick={() => setCategory(c)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-300 ${category === c ? 'bg-fg text-bg' : 'text-muted hover:text-fg'}`}
              >
                {c === 'all' ? 'All' : categoryLabels[c]}
              </button>
            ))}
          </div>
        </Reveal>

        <div key={category} className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {active.map((p, i) => (
            <Reveal key={p.slug} delay={(i % 3) * 90}>
              <ProjectCard project={p} />
            </Reveal>
          ))}
        </div>
        {active.length === 0 && <p className="mt-10 text-muted">Nothing current in this category.</p>}

        {archived.length > 0 && (
          <section className="mt-24" aria-labelledby="archive-heading">
            <Reveal>
              <h2 id="archive-heading" className="text-3xl font-semibold tracking-tight">
                Archive
              </h2>
              <p className="mt-2 text-muted">Earlier projects from my freelance and study years.</p>
            </Reveal>
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {archived.map((p, i) => (
                <Reveal key={p.slug} delay={(i % 3) * 90}>
                  <ProjectCard project={p} />
                </Reveal>
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  )
}
