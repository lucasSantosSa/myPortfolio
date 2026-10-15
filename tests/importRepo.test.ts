import { describe, expect, it } from 'vitest'
import { guessCategory, pickMediaCandidates, readmeToDescription, slugify } from '../src/admin/importRepo'
import { parseRepoRef } from '../src/admin/github'

describe('parseRepoRef', () => {
  it.each([
    ['lucasSantosSa/steward', 'lucasSantosSa/steward'],
    ['https://github.com/lucasSantosSa/appimage-pin', 'lucasSantosSa/appimage-pin'],
    ['https://github.com/lucasSantosSa/appimage-pin.git', 'lucasSantosSa/appimage-pin'],
    ['git@github.com:lucasSantosSa/GeoMap.git', 'lucasSantosSa/GeoMap'],
  ])('%s', (input, expected) => expect(parseRepoRef(input)).toBe(expected))
  it('rejects junk', () => expect(parseRepoRef('not a repo')).toBeNull())
})

describe('readmeToDescription', () => {
  const readme = `# myWorks — Project Hub

[![CI](https://x/badge.svg)](https://x)

A full-screen terminal hub for all your projects.

It's built in Rust.

## Commands

| Command | What |
`
  it('drops the title, badges and setup sections', () => {
    const { summary, description } = readmeToDescription(readme)
    expect(summary).toBe('A full-screen terminal hub for all your projects.')
    expect(description).toContain("It's built in Rust.")
    expect(description).not.toContain('Commands')
    expect(description).not.toContain('badge')
  })
})

describe('pickMediaCandidates', () => {
  it('prefers images referenced by the README and skips icons and node_modules', () => {
    const files = [
      { path: 'docs/screenshot.png', sha: '1', size: 50_000 },
      { path: 'node_modules/x/docs/a.png', sha: '2', size: 50_000 },
      { path: 'public/favicon.png', sha: '3', size: 50_000 },
      { path: 'docs/logo.png', sha: '4', size: 50_000 },
      { path: 'img/demo.gif', sha: '5', size: 1_000 },
      { path: 'src/app.ts', sha: '6', size: 50_000 },
    ]
    const picked = pickMediaCandidates(files, '![demo](./img/demo.gif)').map((f) => f.path)
    expect(picked).toEqual(['img/demo.gif', 'docs/screenshot.png'])
  })
})

describe('helpers', () => {
  it('slugify', () => expect(slugify('Três Jota — Visual!')).toBe('tres-jota-visual'))
  it('guessCategory', () => {
    expect(guessCategory(['Rust'], [])).toBe('tools')
    expect(guessCategory(['Python'], ['llm'])).toBe('ai')
    expect(guessCategory(['TypeScript'], [])).toBe('web')
  })
})
