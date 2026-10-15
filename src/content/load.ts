import siteJson from '../../content/site.json'
import { projectSchema, siteSchema, timelineSchema, type Project, type TimelineEntry } from './schema'

const projectFiles = import.meta.glob('../../content/projects/*.json', { eager: true, import: 'default' })
const timelineFiles = import.meta.glob('../../content/timeline/*.json', { eager: true, import: 'default' })

function parseAll<T>(files: Record<string, unknown>, parse: (v: unknown) => T): T[] {
  return Object.entries(files).map(([path, value]) => {
    try {
      return parse(value)
    } catch (err) {
      throw new Error(`Invalid content file ${path}: ${(err as Error).message}`)
    }
  })
}

export const site = siteSchema.parse(siteJson)

const statusRank: Record<Project['status'], number> = { live: 0, 'in-progress': 1, 'coming-soon': 2, archived: 3 }

export const projects: Project[] = parseAll(projectFiles, (v) => projectSchema.parse(v)).sort(
  (a, b) => a.order - b.order || statusRank[a.status] - statusRank[b.status] || a.title.localeCompare(b.title),
)

/** Newest first; entries without an end date ("present") come first */
export const timeline: TimelineEntry[] = parseAll(timelineFiles, (v) => timelineSchema.parse(v)).sort((a, b) =>
  (b.end ?? '9999-12').localeCompare(a.end ?? '9999-12') || b.start.localeCompare(a.start),
)

export const projectBySlug = (slug: string) => projects.find((p) => p.slug === slug)
export const timelineBySlug = (slug: string) => timeline.find((t) => t.slug === slug)
