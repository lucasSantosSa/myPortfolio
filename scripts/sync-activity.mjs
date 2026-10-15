#!/usr/bin/env node
/**
 * Pulls real commit activity into content/activity/:
 *   github.json          the GitHub contribution calendar for the last year (public + private counts)
 *   projects/<slug>.json daily commit counts by me for each project's repo (GitHub or a local checkout)
 *
 * Needs a GitHub token: GITHUB_TOKEN, or the GitHub CLI's (`gh auth token`).
 * Run: npm run sync:activity
 */
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..')
const config = JSON.parse(fs.readFileSync(path.join(root, 'activity.config.json'), 'utf8'))
const outDir = path.join(root, 'content/activity')
fs.mkdirSync(path.join(outDir, 'projects'), { recursive: true })

const token = process.env.GITHUB_TOKEN || (() => {
  try {
    return execFileSync('gh', ['auth', 'token'], { encoding: 'utf8' }).trim()
  } catch {
    return ''
  }
})()
if (!token) {
  console.error('No GitHub token: set GITHUB_TOKEN or log in with `gh auth login`.')
  process.exit(1)
}

async function gh(url, init = {}) {
  const res = await fetch(url.startsWith('http') ? url : `https://api.github.com${url}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', ...(init.headers ?? {}) },
  })
  if (!res.ok) throw new Error(`${res.status} ${url}: ${(await res.text()).slice(0, 200)}`)
  return res
}

function summarize(days) {
  const dates = Object.keys(days).sort()
  return {
    commits: Object.values(days).reduce((a, b) => a + b, 0),
    activeDays: dates.length,
    first: dates[0] ?? null,
    last: dates.at(-1) ?? null,
    days: Object.fromEntries(dates.map((d) => [d, days[d]])),
  }
}

// 1. Contribution calendar
const q = `query($login:String!){user(login:$login){contributionsCollection{restrictedContributionsCount contributionCalendar{totalContributions weeks{contributionDays{date contributionCount}}}}}}`
const cal = await (await gh('/graphql', { method: 'POST', body: JSON.stringify({ query: q, variables: { login: config.githubUser } }) })).json()
const cc = cal.data.user.contributionsCollection
const calendarDays = cc.contributionCalendar.weeks.flatMap((w) => w.contributionDays).map((d) => ({ date: d.date, count: d.contributionCount }))
fs.writeFileSync(
  path.join(outDir, 'github.json'),
  JSON.stringify(
    {
      user: config.githubUser,
      total: cc.contributionCalendar.totalContributions,
      activeDays: calendarDays.filter((d) => d.count > 0).length,
      syncedAt: new Date().toISOString().slice(0, 10),
      days: calendarDays,
    },
    null,
    1,
  ) + '\n',
)
console.log(`calendar: ${cc.contributionCalendar.totalContributions} contributions`)

// 2. Per-project commits
const projectsDir = path.join(root, 'content/projects')
for (const file of fs.readdirSync(projectsDir).filter((f) => f.endsWith('.json'))) {
  const project = JSON.parse(fs.readFileSync(path.join(projectsDir, file), 'utf8'))
  const days = {}
  const local = config.localRepos?.[project.slug]
  try {
    if (local) {
      const dir = local.replace(/^~/, os.homedir())
      const authors = config.authorEmails.flatMap((e) => ['--author', e])
      const out = execFileSync('git', ['-C', dir, 'log', '--all', ...authors, '--format=%ad', '--date=short'], { encoding: 'utf8' })
      for (const d of out.split('\n').filter(Boolean)) days[d] = (days[d] ?? 0) + 1
    } else if (project.repo?.url?.includes('github.com/')) {
      const full = project.repo.url.replace(/^https:\/\/github\.com\//, '').replace(/\/$/, '')
      let url = `/repos/${full}/commits?author=${config.githubUser}&per_page=100`
      while (url) {
        const res = await gh(url)
        for (const c of await res.json()) {
          const d = (c.commit.author?.date ?? c.commit.committer?.date ?? '').slice(0, 10)
          if (d) days[d] = (days[d] ?? 0) + 1
        }
        url = res.headers.get('link')?.match(/<([^>]+)>;\s*rel="next"/)?.[1] ?? null
      }
    } else {
      continue
    }
  } catch (err) {
    console.warn(`skip ${project.slug}: ${err.message}`)
    continue
  }
  const summary = summarize(days)
  fs.writeFileSync(path.join(outDir, 'projects', `${project.slug}.json`), JSON.stringify(summary, null, 1) + '\n')
  console.log(`${project.slug}: ${summary.commits} commits on ${summary.activeDays} days`)
}
