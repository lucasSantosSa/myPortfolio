import { describe, expect, it } from 'vitest'
import { formatDuration, formatPeriod, toEmbedUrl, whatsappLink } from '../src/lib/format'

describe('format', () => {
  it('formatPeriod', () => {
    expect(formatPeriod('2024-05', '2025-10')).toBe('May 2024 – Oct 2025')
    expect(formatPeriod('2026-09')).toBe('Sep 2026 – Present')
  })
  it('formatDuration counts months inclusively', () => {
    expect(formatDuration('2024-05', '2025-10')).toBe('1 yr 6 mos')
    expect(formatDuration('2023-05', '2023-08')).toBe('4 mos')
    expect(formatDuration('2020-06', '2022-05')).toBe('2 yrs')
  })
  it('whatsappLink encodes text', () => expect(whatsappLink('5531975564250', 'Oi Lucas!')).toBe('https://wa.me/5531975564250?text=Oi%20Lucas!'))
  it('toEmbedUrl', () => {
    expect(toEmbedUrl('https://www.youtube.com/watch?v=abc')).toBe('https://www.youtube-nocookie.com/embed/abc')
    expect(toEmbedUrl('https://youtu.be/abc')).toBe('https://www.youtube-nocookie.com/embed/abc')
    expect(toEmbedUrl('https://asciinema.org/a/123')).toBe('https://asciinema.org/a/123/iframe')
  })
})
