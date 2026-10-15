/** Real commit activity written by `npm run sync:activity`. */

export interface ProjectActivity {
  commits: number
  activeDays: number
  first: string | null
  last: string | null
  days: Record<string, number>
}

export interface GithubCalendar {
  user: string
  total: number
  activeDays: number
  syncedAt: string
  days: { date: string; count: number }[]
}

const projectFiles = import.meta.glob<ProjectActivity>('../../content/activity/projects/*.json', { eager: true, import: 'default' })
const calendarFiles = import.meta.glob<GithubCalendar>('../../content/activity/github.json', { eager: true, import: 'default' })

const bySlug = Object.fromEntries(Object.entries(projectFiles).map(([p, v]) => [p.split('/').pop()!.replace(/\.json$/, ''), v]))

export const activityFor = (slug: string): ProjectActivity | undefined => bySlug[slug]
export const githubCalendar: GithubCalendar | undefined = Object.values(calendarFiles)[0]
