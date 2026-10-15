import { useState } from 'react'
import type { Media } from '../content/schema'
import { Select, TextInput } from './fields'

const MAX_UPLOAD_MB = 40

export function MediaEditor({
  media,
  onChange,
  onUpload,
}: {
  media: Media[]
  onChange: (m: Media[]) => void
  /** Saves the file and resolves to its public src */
  onUpload: (file: File) => Promise<string>
}) {
  const [url, setUrl] = useState('')
  const [urlType, setUrlType] = useState<Media['type']>('embed')
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const update = (i: number, patch: Partial<Media>) => onChange(media.map((m, j) => (j === i ? { ...m, ...patch } : m)))
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir
    if (j < 0 || j >= media.length) return
    const next = [...media]
    ;[next[i], next[j]] = [next[j], next[i]]
    onChange(next)
  }

  async function upload(files: FileList | null) {
    if (!files) return
    setError(null)
    const added: Media[] = []
    for (const file of Array.from(files)) {
      if (file.size > MAX_UPLOAD_MB * 1024 * 1024) {
        setError(`${file.name} is over ${MAX_UPLOAD_MB} MB. Host large recordings on YouTube or asciinema and add them by URL.`)
        continue
      }
      setBusy(`Uploading ${file.name}…`)
      try {
        const src = await onUpload(file)
        added.push({ type: file.type.startsWith('video/') ? 'video' : 'image', src, alt: '' })
      } catch (err) {
        setError(`${file.name}: ${(err as Error).message}`)
      }
    }
    setBusy(null)
    if (added.length) onChange([...media, ...added])
  }

  return (
    <div className="space-y-4">
      {media.length === 0 && <p className="text-sm text-zinc-500">No screenshots or recordings yet.</p>}
      <ul className="space-y-3">
        {media.map((m, i) => (
          <li key={`${m.src}-${i}`} className="flex gap-3 rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
            <div className="h-20 w-32 shrink-0 overflow-hidden rounded-md bg-zinc-100 dark:bg-zinc-800">
              {m.type === 'image' && <img src={m.src} alt="" className="h-full w-full object-cover" />}
              {m.type === 'video' && <video src={m.src} className="h-full w-full object-cover" muted />}
              {m.type === 'embed' && <span className="flex h-full items-center justify-center text-xs text-zinc-500">Embed</span>}
            </div>
            <div className="grid flex-1 gap-2 sm:grid-cols-2">
              <TextInput id={`m-src-${i}`} value={m.src} onChange={(v) => update(i, { src: v })} aria-label="Source" />
              <Select id={`m-type-${i}`} value={m.type} options={['image', 'video', 'embed'] as const} onChange={(v) => update(i, { type: v })} />
              <TextInput id={`m-alt-${i}`} value={m.alt} onChange={(v) => update(i, { alt: v })} placeholder="Alt text (what the image shows)" aria-label="Alt text" />
              <TextInput id={`m-cap-${i}`} value={m.caption} onChange={(v) => update(i, { caption: v || undefined })} placeholder="Caption (optional)" aria-label="Caption" />
            </div>
            <div className="flex flex-col gap-1">
              <button type="button" className="btn-ghost px-2 py-1" onClick={() => move(i, -1)} aria-label="Move up">
                ↑
              </button>
              <button type="button" className="btn-ghost px-2 py-1" onClick={() => move(i, 1)} aria-label="Move down">
                ↓
              </button>
              <button type="button" className="btn-ghost px-2 py-1 text-red-600" onClick={() => onChange(media.filter((_, j) => j !== i))} aria-label="Remove">
                ✕
              </button>
            </div>
          </li>
        ))}
      </ul>

      <div className="grid gap-3 rounded-lg border border-dashed border-zinc-300 p-3 sm:grid-cols-[1fr_auto] dark:border-zinc-700">
        <div>
          <label htmlFor="m-upload" className="label">
            Upload screenshots or recordings
          </label>
          <input id="m-upload" type="file" multiple accept="image/*,video/mp4,video/webm" onChange={(e) => upload(e.target.files)} className="text-sm" disabled={!!busy} />
          <p className="mt-1 text-xs text-zinc-500">Saved into public/media/&lt;slug&gt;/. Prefer WebP/AVIF images and WebM video.</p>
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto]">
        <TextInput id="m-url" value={url} onChange={setUrl} placeholder="Or paste a URL: YouTube, Loom, asciinema, image or video link" aria-label="Media URL" />
        <Select id="m-url-type" value={urlType} options={[{ value: 'embed', label: 'Embed' }, { value: 'image', label: 'Image' }, { value: 'video', label: 'Video file' }] as { value: Media['type']; label: string }[]} onChange={setUrlType} />
        <button
          type="button"
          className="btn-ghost"
          onClick={() => {
            if (!url.trim()) return
            onChange([...media, { type: urlType, src: url.trim(), alt: '' }])
            setUrl('')
          }}
        >
          Add link
        </button>
      </div>
      {busy && <p className="text-sm text-zinc-500">{busy}</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  )
}
