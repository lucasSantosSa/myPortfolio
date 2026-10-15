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
  /** How complete the project is, 0–100. Defaults from status when omitted. */
  progress: z.number().min(0).max(100).optional(),
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

export function projectProgress(p: Project): number {
  if (p.progress !== undefined) return p.progress
  return { live: 100, 'in-progress': 60, 'coming-soon': 15, archived: 100 }[p.status]
}

const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Use a #rrggbb color')

export const chapterPresets = ['notebook', 'print', 'chalkboard', 'academic', 'blueprint', 'terminal', 'editorial', 'outdoors', 'legal', 'harvest', 'travel'] as const

/** Visual theme a chapter applies to the page when selected */
export const chapterThemeSchema = z.object({
  preset: z.enum(chapterPresets),
  primary: hex,
  secondary: hex,
  logos: z
    .array(
      z.object({
        src: z.string().min(1),
        alt: z.string().min(1),
        /** Background the logo needs to be legible on */
        plate: z.enum(['light', 'dark']).default('light'),
      }),
    )
    .default([]),
})
export type ChapterTheme = z.infer<typeof chapterThemeSchema>

export const timelineSchema = z.object({
  slug,
  kind: z.enum(['work', 'freelance', 'education', 'teaching', 'design', 'activity']),
  title: z.string().min(1),
  org: z.string().min(1),
  contract: z.boolean().default(false),
  /** Omit only for undated chapters (e.g. childhood), which need a dateLabel */
  start: yearMonth.optional(),
  /** Omit for "present" */
  end: yearMonth.optional(),
  /** Shown instead of the dates, e.g. "Age 10" */
  dateLabel: z.string().optional(),
  location: z.string().optional(),
  summary: z.string().min(1),
  highlights: z.array(z.string()).default([]),
  stack: z.array(z.string()).default([]),
  growth: z.string().optional(),
  relatedProjects: z.array(slug).default([]),
  theme: chapterThemeSchema.optional(),
}).refine((t) => t.start || t.dateLabel, { message: 'Give a start date or a date label', path: ['start'] })
export type TimelineEntry = z.infer<typeof timelineSchema>

/** Story order: undated chapters first, then by start date. */
export function compareChronological(a: TimelineEntry, b: TimelineEntry): number {
  return (a.start ?? '0000-00').localeCompare(b.start ?? '0000-00') || (a.end ?? '9999-12').localeCompare(b.end ?? '9999-12')
}

/** Newest first: current roles, then by end and start date; undated chapters (childhood) last. */
export function compareTimeline(a: TimelineEntry, b: TimelineEntry): number {
  const key = (t: TimelineEntry) => (t.start ? (t.end ?? '9999-12') : '0000-00')
  return key(b).localeCompare(key(a)) || (b.start ?? '').localeCompare(a.start ?? '')
}

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

export const sidequestIcons = ['gamepad', 'chip', 'guitar', 'drums', 'galaxy', 'atom', 'rocket', 'spider', 'star'] as const

/** Hobbies and interests shown as "side quests" next to the career timeline */
export const sidequestSchema = z.object({
  slug,
  title: z.string().min(1),
  icon: z.enum(sidequestIcons),
  rarity: z.enum(['common', 'rare', 'epic', 'legendary']).default('rare'),
  status: z.enum(['ongoing', 'in-progress', 'completed']).default('ongoing'),
  /** Timeline chapter this quest started in or belongs to */
  chapter: slug.optional(),
  blurb: z.string().min(1),
  tags: z.array(z.string()).default([]),
})
export type Sidequest = z.infer<typeof sidequestSchema>
