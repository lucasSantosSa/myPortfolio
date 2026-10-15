import { useLocation } from 'react-router'
import { PageHeader } from '../components/PageHeader'
import { ExperienceExplorer } from '../components/Timeline'
import { timeline } from '../content/load'
import { usePageTitle } from '../lib/usePageTitle'

export function Experience() {
  usePageTitle('Experience')
  const { hash } = useLocation()
  return (
    <>
      <PageHeader eyebrow="Experience" title={<>Career <span className="gradient-text">timeline</span></>}>
        From my first lines of code at 10 to senior engineer. Client code is confidential, so each chapter describes what I built and how I grew, and links to
        an original project with the same kind of architecture where there is one.
      </PageHeader>
      <div className="container-page pb-24">
        <ExperienceExplorer entries={timeline} initial={hash ? decodeURIComponent(hash.slice(1)) : undefined} />
      </div>
    </>
  )
}
