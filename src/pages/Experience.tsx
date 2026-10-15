import { Timeline } from '../components/Timeline'
import { timeline } from '../content/load'
import { usePageTitle } from '../lib/usePageTitle'

export function Experience() {
  usePageTitle('Experience')
  return (
    <div className="container-page py-16">
      <p className="eyebrow">Experience</p>
      <h1 className="mt-2 text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Career timeline</h1>
      <p className="mt-4 max-w-2xl text-zinc-600 dark:text-zinc-400">
        What I worked on, with what, and how my role grew. Client code is confidential, so you won't find it here. Where it helps, a role links to an
        original project I built from scratch with the same kind of architecture.
      </p>
      <div className="mt-12">
        <Timeline entries={timeline} filterable />
      </div>
    </div>
  )
}
