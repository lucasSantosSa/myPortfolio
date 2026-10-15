const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export function formatMonth(ym: string): string {
  const [y, m] = ym.split('-').map(Number)
  return `${months[m - 1]} ${y}`
}

export function formatPeriod(start: string, end?: string): string {
  return `${formatMonth(start)} – ${end ? formatMonth(end) : 'Present'}`
}

/** Inclusive month count rendered as "1 yr 5 mos" */
export function formatDuration(start: string, end?: string, now = new Date()): string {
  const [sy, sm] = start.split('-').map(Number)
  const [ey, em] = end ? end.split('-').map(Number) : [now.getFullYear(), now.getMonth() + 1]
  const total = Math.max(1, (ey - sy) * 12 + (em - sm) + 1)
  const years = Math.floor(total / 12)
  const mos = total % 12
  const parts = []
  if (years) parts.push(`${years} yr${years > 1 ? 's' : ''}`)
  if (mos) parts.push(`${mos} mo${mos > 1 ? 's' : ''}`)
  return parts.join(' ')
}

export function whatsappLink(phone: string, text?: string): string {
  return `https://wa.me/${phone}${text ? `?text=${encodeURIComponent(text)}` : ''}`
}

/** Turns YouTube, Loom and asciinema share links into embeddable URLs; others pass through. */
export function toEmbedUrl(url: string): string {
  try {
    const u = new URL(url)
    if (u.hostname.includes('youtube.com') && u.searchParams.get('v')) return `https://www.youtube-nocookie.com/embed/${u.searchParams.get('v')}`
    if (u.hostname === 'youtu.be') return `https://www.youtube-nocookie.com/embed${u.pathname}`
    if (u.hostname.includes('loom.com') && u.pathname.startsWith('/share/')) return url.replace('/share/', '/embed/')
    if (u.hostname.includes('asciinema.org') && /^\/a\/[^/]+$/.test(u.pathname)) return `${url}/iframe`
    return url
  } catch {
    return url
  }
}
