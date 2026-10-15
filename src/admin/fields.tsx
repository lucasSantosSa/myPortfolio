import type { ReactNode } from 'react'

export function Field({ label, hint, children, id }: { label: string; hint?: string; children: ReactNode; id: string }) {
  return (
    <div>
      <label htmlFor={id} className="label">
        {label}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs text-zinc-500">{hint}</p>}
    </div>
  )
}

export function TextInput({ id, value, onChange, ...rest }: { id: string; value: string | undefined; onChange: (v: string) => void } & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'id'>) {
  return <input id={id} className="input" value={value ?? ''} onChange={(e) => onChange(e.target.value)} {...rest} />
}

export function TextArea({ id, value, onChange, rows = 4, mono }: { id: string; value: string | undefined; onChange: (v: string) => void; rows?: number; mono?: boolean }) {
  return <textarea id={id} rows={rows} className={`input ${mono ? 'font-mono text-xs' : ''}`} value={value ?? ''} onChange={(e) => onChange(e.target.value)} />
}

export function Select<T extends string>({ id, value, options, onChange }: { id: string; value: T; options: readonly T[] | { value: T; label: string }[]; onChange: (v: T) => void }) {
  const opts = (options as (T | { value: T; label: string })[]).map((o) => (typeof o === 'string' ? { value: o, label: o } : o))
  return (
    <select id={id} className="input" value={value} onChange={(e) => onChange(e.target.value as T)}>
      {opts.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  )
}

/** Comma-separated list input, e.g. a tech stack */
export function ListInput({ id, value, onChange, placeholder }: { id: string; value: string[] | undefined; onChange: (v: string[]) => void; placeholder?: string }) {
  return (
    <input
      id={id}
      className="input"
      placeholder={placeholder}
      defaultValue={(value ?? []).join(', ')}
      key={(value ?? []).join('|')}
      onBlur={(e) =>
        onChange(
          e.target.value
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
        )
      }
    />
  )
}

export function Notice({ kind, children }: { kind: 'ok' | 'error' | 'info'; children: ReactNode }) {
  const cls = {
    ok: 'border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200',
    error: 'border-red-300 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200',
    info: 'border-sky-300 bg-sky-50 text-sky-900 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-200',
  }[kind]
  return (
    <div role={kind === 'error' ? 'alert' : 'status'} className={`rounded-lg border p-3 text-sm whitespace-pre-line ${cls}`}>
      {children}
    </div>
  )
}

export function zodMessage(err: unknown): string {
  const issues = (err as { issues?: { path: (string | number)[]; message: string }[] }).issues
  if (!issues) return (err as Error).message
  return issues.map((i) => `${i.path.join('.') || 'value'}: ${i.message}`).join('\n')
}
