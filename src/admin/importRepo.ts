import type { Project } from '../content/schema'
import type { GithubClient } from './github'

export interface RepoFile {
  path: string
  sha: string
  size?: number
}

export interface RepoImport {
  draft: Partial<Project>
  /** Images and videos found in the repo that can be copied into the portfolio */
  mediaCandidates: RepoFile[]
  portfolioJsonFound: boolean
}

/** Optional file a project repo can include to control how it appears in the portfolio. */
interface PortfolioJson {
  title?: string
  summary?: string
  pitch?: string
  description?: string
  stack?: string[]
  demoUrl?: string
  category?: Project['category']
  screenshots?: string[]
}

const MEDIA_EXT = /\.(png|jpe?g|gif|webp|avif|svg|mp4|webm)$/i
const MEDIA_DIRS = /(^|\/)(screenshots?|docs|media|assets|images|img|\.github|demo|preview)(\/|$)/i
const SKIP = /(^|\/)(node_modules|dist|build|vendor|target|coverage|\.next)\//
const STOP_HEADINGS = /^#{1,3}\s*(install|installation|setup|getting started|quick ?start|usage|development|contributing|license|requirements|commands|keys)\b/i

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** Strips badges, images, HTML and setup sections; keeps the part of a README that describes the project. */
export function readmeToDescription(readme: string): { summary?: string; description: string } {
  const lines = readme.replace(/\r/g, '').split('\n')
  const kept: string[] = []
  let started = false
  for (const raw of lines) {
    const line = raw.trimEnd()
    if (!started && /^#\s/.test(line)) {
      started = true
      continue // the H1 is the title
    }
    if (STOP_HEADINGS.test(line.trim())) break
    if (/^\s*(\[!\[|!\[|<img|<p|<\/p|<div|<\/div|<a |<\/a|<table|<\/table|<tr|<\/tr|<td|<\/td|<h\d|<br|---\s*$)/i.test(line)) continue
    kept.push(line)
    started = true
  }
  const description = kept.join('\n').replace(/\n{3,}/g, '\n\n').trim().slice(0, 3000)
  const firstPara = description
    .split('\n\n')
    .map((p) => p.replace(/^>\s*/, '').trim())
    .find((p) => p && !p.startsWith('#') && !p.startsWith('|') && !p.startsWith('```') && !p.startsWith('-'))
  return { summary: firstPara?.replace(/\s+/g, ' ').slice(0, 220), description }
}

export function pickMediaCandidates(files: RepoFile[], readme: string | null, extra: string[] = []): RepoFile[] {
  const referenced = new Set<string>()
  for (const m of (readme ?? '').matchAll(/(?:!\[[^\]]*\]\(|<img[^>]+src=["'])([^)"'\s]+)/g)) {
    referenced.add(m[1].replace(/^\.?\//, ''))
  }
  extra.forEach((e) => referenced.add(e.replace(/^\.?\//, '')))
  return files
    .filter((f) => MEDIA_EXT.test(f.path) && !SKIP.test(f.path))
    .filter((f) => referenced.has(f.path) || (MEDIA_DIRS.test(f.path) && (f.size ?? 0) > 8_000 && !/(favicon|logo|icon)/i.test(f.path)))
    .sort((a, b) => Number(referenced.has(b.path)) - Number(referenced.has(a.path)))
    .slice(0, 30)
}

export function guessCategory(languages: string[], topics: string[]): Project['category'] {
  const all = [...languages, ...topics].map((s) => s.toLowerCase())
  if (all.some((s) => /llm|ai|ml|machine-learning|openai|anthropic|claude/.test(s))) return 'ai'
  if (all.some((s) => /^(shell|rust|go|c|c\+\+)$/.test(s) || /cli|tui|linux/.test(s))) return 'tools'
  return 'web'
}

export async function importRepo(client: GithubClient, fullName: string): Promise<RepoImport> {
  const repo = await client.repo(fullName)
  const [langs, readme, tree] = await Promise.all([
    client.languages(fullName).catch(() => ({}) as Record<string, number>),
    client.readme(fullName),
    client.tree(fullName, repo.default_branch).catch(() => []),
  ])

  const total = Object.values(langs).reduce((a, b) => a + b, 0) || 1
  const languages = Object.entries(langs)
    .filter(([, bytes]) => bytes / total > 0.03)
    .sort((a, b) => b[1] - a[1])
    .map(([l]) => l)

  let pj: PortfolioJson = {}
  const pjFile = tree.find((f) => f.path === 'portfolio.json')
  if (pjFile) {
    try {
      pj = JSON.parse(new TextDecoder().decode(await client.blob(fullName, pjFile.sha))) as PortfolioJson
    } catch {
      pj = {}
    }
  }

  const fromReadme = readme ? readmeToDescription(readme) : { description: '' }
  const topics = repo.topics ?? []
  const draft: Partial<Project> = {
    slug: slugify(pj.title ?? repo.name),
    title: pj.title ?? repo.name,
    summary: pj.summary ?? pj.pitch ?? repo.description ?? fromReadme.summary ?? '',
    description: pj.description ?? fromReadme.description,
    stack: pj.stack ?? [...new Set([...languages, ...topics.map(titleCaseTopic)])].slice(0, 10),
    category: pj.category ?? guessCategory(languages, topics),
    repo: { url: repo.html_url, visibility: repo.private ? 'private' : 'public' },
    demoUrl: pj.demoUrl ?? (repo.homepage || undefined),
    period: { start: repo.created_at.slice(0, 7) },
    github: {
      fullName: repo.full_name,
      description: repo.description,
      languages,
      topics,
      stars: repo.stargazers_count,
      pushedAt: repo.pushed_at,
      importedAt: new Date().toISOString(),
    },
  }

  return { draft, mediaCandidates: pickMediaCandidates(tree, readme, pj.screenshots), portfolioJsonFound: Boolean(pjFile) }
}

function titleCaseTopic(t: string) {
  return t
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}
