import { PageHeader } from '../components/PageHeader'
import { Timeline } from '../components/Timeline'
import { timeline } from '../content/load'
import { usePageTitle } from '../lib/usePageTitle'

export function Experience() {
  usePageTitle('Experience')
  return (
    <>
      <PageHeader eyebrow="Experience" title={<>Career <span className="gradient-text">timeline</span></>}>
        What I worked on, with what, and how my role grew. Client code is confidential, so you won't find it here. Where it helps, a role links to an
        original project I built from scratch with the same kind of architecture.
      </PageHeader>
      <div className="container-page pb-24">
        <Timeline entries={timeline} filterable />
      </div>
    </>
  )
}
