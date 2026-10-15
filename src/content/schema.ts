import { z } from 'zod'

const yearMonth = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Use YYYY-MM')
const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase-words-with-dashes')

export const mediaSchema = z.object({
  type: z.enum(['image', 'video', 'embed']),
  /** Path under /public (e.g. /media/steward/cli.webp) or a full URL */
  src: z.string().min(1),
  alt: z.string().default(''),
  caption: z.string().optional(),
})
export type Media = z.infer<typeof mediaSchema>

export const githubSnapshotSchema = z.object({
  fullName: z.string(),
  description: z.string().nullable().optional(),
  languages: z.array(z.string()).default([]),
  topics: z.array(z.string()).default([]),
  stars: z.number().default(0),
  pushedAt: z.string().optional(),
  importedAt: z.string(),
})
export type GithubSnapshot = z.infer<typeof githubSnapshotSchema>

export const projectSchema = z.object({
  slug,
  title: z.string().min(1),
  summary: z.string().min(1),
  /** Markdown */
  description: z.string().default(''),
  category: z.enum(['web', 'ai', 'tools', 'systems', 'showcase']),
  status: z.enum(['live', 'in-progress', 'coming-soon', 'archived']),
  featured: z.boolean().default(false),
  order: z.number().default(100),
  stack: z.array(z.string()).default([]),
  period: z.object({ start: yearMonth, end: yearMonth.optional() }).optional(),
  repo: z
    .object({ url: z.string().url(), visibility: z.enum(['public', 'private']) })
    .optional(),
  demoUrl: z.string().url().optional(),
  /** Timeline entry this project relates to (e.g. a showcase rebuild of client work) */
  relatedTimeline: slug.optional(),
  media: z.array(mediaSchema).default([]),
  github: githubSnapshotSchema.optional(),
})
export type Project = z.infer<typeof projectSchema>

export const timelineSchema = z.object({
  slug,
  kind: z.enum(['work', 'freelance', 'education', 'teaching', 'design', 'activity']),
  title: z.string().min(1),
  org: z.string().min(1),
  contract: z.boolean().default(false),
  start: yearMonth,
  /** Omit for "present" */
  end: yearMonth.optional(),
  location: z.string().optional(),
  summary: z.string().min(1),
  highlights: z.array(z.string()).default([]),
  stack: z.array(z.string()).default([]),
  growth: z.string().optional(),
  relatedProjects: z.array(slug).default([]),
})
export type TimelineEntry = z.infer<typeof timelineSchema>

export const siteSchema = z.object({
  name: z.string(),
  role: z.string(),
  tagline: z.string(),
  /** Words the hero headline cycles through: "I build ___" */
  headlineWords: z.array(z.string()).min(1).default(['web apps']),
  location: z.string(),
  about: z.string(),
  highlights: z.array(z.object({ value: z.string(), label: z.string() })),
  contact: z.object({
    email: z.string().email(),
    /** International format, digits only, e.g. 5531975564250 */
    whatsapp: z.string().regex(/^\d{10,15}$/),
  }),
  socials: z.object({ github: z.string().url(), linkedin: z.string().url() }),
  cv: z.string(),
  cms: z.object({ repo: z.string().regex(/^[\w.-]+\/[\w.-]+$/), branch: z.string() }),
})
export type Site = z.infer<typeof siteSchema>
