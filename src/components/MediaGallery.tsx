import { useEffect, useRef, useState } from 'react'
import type { Media } from '../content/schema'
import { toEmbedUrl } from '../lib/format'

function MediaView({ item, large }: { item: Media; large?: boolean }) {
  if (item.type === 'video') {
    return <video src={item.src} controls preload="metadata" className="w-full rounded-xl bg-black" aria-label={item.alt || item.caption} />
  }
  if (item.type === 'embed') {
    return (
      <div className="aspect-video w-full overflow-hidden rounded-xl bg-chip">
        <iframe src={toEmbedUrl(item.src)} title={item.alt || item.caption || 'Embedded recording'} className="h-full w-full" allow="fullscreen; picture-in-picture" loading="lazy" />
      </div>
    )
  }
  return <img src={item.src} alt={item.alt} loading="lazy" className={`w-full rounded-xl border border-line ${large ? 'max-h-[80vh] object-contain' : 'h-auto'}`} />
}

export function MediaGallery({ media }: { media: Media[] }) {
  const dialog = useRef<HTMLDialogElement>(null)
  const [open, setOpen] = useState<number | null>(null)
  const images = media.map((m, i) => ({ m, i })).filter(({ m }) => m.type === 'image')

  useEffect(() => {
    if (open === null) dialog.current?.close()
    else if (!dialog.current?.open) dialog.current?.showModal()
  }, [open])

  const step = (dir: 1 | -1) => {
    if (open === null) return
    const pos = images.findIndex(({ i }) => i === open)
    setOpen(images[(pos + dir + images.length) % images.length].i)
  }

  if (media.length === 0) return null
  const current = open !== null ? media[open] : null

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        {media.map((item, i) => (
          <figure key={`${item.src}-${i}`} className={media.length === 1 || item.type !== 'image' ? 'sm:col-span-2' : ''}>
            {item.type === 'image' ? (
              <button type="button" onClick={() => setOpen(i)} className="block w-full cursor-zoom-in" aria-label={`Open screenshot: ${item.alt || item.caption || i + 1}`}>
                <MediaView item={item} />
              </button>
            ) : (
              <MediaView item={item} />
            )}
            {item.caption && <figcaption className="mt-2 text-sm text-muted">{item.caption}</figcaption>}
          </figure>
        ))}
      </div>

      <dialog
        ref={dialog}
        onClose={() => setOpen(null)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight') step(1)
          if (e.key === 'ArrowLeft') step(-1)
        }}
        onClick={(e) => e.target === dialog.current && setOpen(null)}
        className="m-auto w-[min(1200px,95vw)] rounded-2xl bg-card p-4 text-fg backdrop:bg-black/80 backdrop:backdrop-blur-sm"
        aria-label="Screenshot viewer"
      >
        {current && (
          <div>
            <MediaView item={current} large />
            <div className="mt-3 flex items-center justify-between gap-2 text-sm">
              <span className="text-muted">{current.caption ?? current.alt}</span>
              <div className="flex gap-2">
                {images.length > 1 && (
                  <>
                    <button type="button" className="btn-ghost py-1.5" onClick={() => step(-1)} aria-label="Previous screenshot">
                      ←
                    </button>
                    <button type="button" className="btn-ghost py-1.5" onClick={() => step(1)} aria-label="Next screenshot">
                      →
                    </button>
                  </>
                )}
                <button type="button" className="btn-primary py-1.5" onClick={() => setOpen(null)} autoFocus>
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </dialog>
    </>
  )
}
