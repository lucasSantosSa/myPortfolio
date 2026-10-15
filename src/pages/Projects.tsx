import { useState } from 'react'
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
    <div className="container-page py-16">
      <p className="eyebrow">Projects</p>
      <h1 className="mt-2 text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Things I've built</h1>
      <p className="mt-4 max-w-2xl text-zinc-600 dark:text-zinc-400">
        Personal tools, showcase rebuilds of the kind of systems I've built for clients, and earlier work.
      </p>

      <div role="group" aria-label="Filter projects by category" className="mt-8 flex flex-wrap gap-2">
        {(['all', ...categories] as const).map((c) => (
          <button
            key={c}
            type="button"
            aria-pressed={category === c}
            onClick={() => setCategory(c)}
            className={`rounded-full border px-3 py-1 text-sm transition-colors ${
              category === c
                ? 'border-accent-600 bg-accent-600 text-white dark:border-accent-400 dark:bg-accent-400 dark:text-zinc-950'
                : 'border-zinc-300 text-zinc-700 hover:border-zinc-400 dark:border-zinc-700 dark:text-zinc-300'
            }`}
          >
            {c === 'all' ? 'All' : categoryLabels[c]}
          </button>
        ))}
      </div>

      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {active.map((p) => (
          <ProjectCard key={p.slug} project={p} />
        ))}
      </div>
      {active.length === 0 && <p className="mt-8 text-zinc-500">Nothing current in this category.</p>}

      {archived.length > 0 && (
        <section className="mt-16" aria-labelledby="archive-heading">
          <h2 id="archive-heading" className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            Archive
          </h2>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">Earlier projects from my freelance and study years.</p>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {archived.map((p) => (
              <ProjectCard key={p.slug} project={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
