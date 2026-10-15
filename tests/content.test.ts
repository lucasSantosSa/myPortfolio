import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { projectSchema, siteSchema, timelineSchema } from '../src/content/schema'

const root = path.resolve(__dirname, '..')
const readDir = (dir: string) =>
  fs.readdirSync(path.join(root, dir)).filter((f) => f.endsWith('.json')).map((f) => ({ file: f, data: JSON.parse(fs.readFileSync(path.join(root, dir, f), 'utf8')) }))

describe('content files', () => {
  const projects = readDir('content/projects')
  const timeline = readDir('content/timeline')

  it('site.json is valid', () => {
    expect(() => siteSchema.parse(JSON.parse(fs.readFileSync(path.join(root, 'content/site.json'), 'utf8')))).not.toThrow()
  })

  it.each(projects)('project $file is valid and named after its slug', ({ file, data }) => {
    const p = projectSchema.parse(data)
    expect(file).toBe(`${p.slug}.json`)
  })

  it.each(timeline)('timeline $file is valid and named after its slug', ({ file, data }) => {
    const t = timelineSchema.parse(data)
    expect(file).toBe(`${t.slug}.json`)
    if (t.end) expect(t.end >= t.start).toBe(true)
  })

  it('cross references point at existing entries', () => {
    const projectSlugs = new Set(projects.map((p) => p.data.slug))
    const timelineSlugs = new Set(timeline.map((t) => t.data.slug))
    for (const { data } of projects) if (data.relatedTimeline) expect(timelineSlugs).toContain(data.relatedTimeline)
    for (const { data } of timeline) for (const s of data.relatedProjects ?? []) expect(projectSlugs).toContain(s)
  })

  it('local media files exist', () => {
    for (const { data } of projects)
      for (const m of data.media ?? []) if (m.src.startsWith('/')) expect(fs.existsSync(path.join(root, 'public', m.src)), m.src).toBe(true)
  })
})
