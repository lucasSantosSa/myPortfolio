import type { ReactNode } from 'react'
import { Reveal } from './motion'

export function PageHeader({ eyebrow, title, children }: { eyebrow: string; title: ReactNode; children?: ReactNode }) {
  return (
    <header className="relative isolate overflow-hidden pt-36 pb-12 sm:pt-44">
      <div className="grid-bg absolute inset-0 -z-10" aria-hidden />
      <div className="absolute -top-32 left-1/3 -z-10 h-80 w-80 animate-aurora rounded-full bg-accent-400/20 blur-3xl" aria-hidden />
      <div className="container-page">
        <Reveal>
          <p className="eyebrow">{eyebrow}</p>
        </Reveal>
        <Reveal delay={100}>
          <h1 className="mt-4 text-5xl font-semibold tracking-tight sm:text-6xl">{title}</h1>
        </Reveal>
        {children && (
          <Reveal delay={200}>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">{children}</p>
          </Reveal>
        )}
      </div>
    </header>
  )
}
