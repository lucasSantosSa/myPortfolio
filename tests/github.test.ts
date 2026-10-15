import { afterEach, describe, expect, it, vi } from 'vitest'
import { base64ToText, GithubClient, textToBase64 } from '../src/admin/github'
import { GithubStore } from '../src/admin/storage'

afterEach(() => vi.unstubAllGlobals())

describe('GithubStore', () => {
  it('updates an existing file with its sha on the configured branch', async () => {
    const calls: { url: string; init?: RequestInit }[] = []
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string, init?: RequestInit) => {
        calls.push({ url, init })
        if (!init?.method) return new Response(JSON.stringify({ sha: 'abc', content: textToBase64('{}') }))
        return new Response(JSON.stringify({ content: {} }), { status: 200 })
      }),
    )
    const store = new GithubStore(new GithubClient('tok'), 'me/site', 'main')
    await store.writeText('content/projects/x.json', '{"a":"é"}', 'cms: update x')
    const put = calls.find((c) => c.init?.method === 'PUT')!
    expect(put.url).toBe('https://api.github.com/repos/me/site/contents/content/projects/x.json')
    const body = JSON.parse(String(put.init!.body))
    expect(body).toMatchObject({ sha: 'abc', branch: 'main', message: 'cms: update x' })
    expect(base64ToText(body.content)).toBe('{"a":"é"}')
    expect((put.init!.headers as Record<string, string>).Authorization).toBe('Bearer tok')
  })

  it('creates a new file without a sha', async () => {
    let putBody: Record<string, unknown> = {}
    vi.stubGlobal(
      'fetch',
      vi.fn(async (_url: string, init?: RequestInit) => {
        if (!init?.method) return new Response(JSON.stringify({ message: 'Not Found' }), { status: 404 })
        putBody = JSON.parse(String(init.body))
        return new Response('{}', { status: 201 })
      }),
    )
    await new GithubStore(new GithubClient('tok'), 'me/site', 'main').writeBinary('public/media/x/a.png', new Uint8Array([1, 2, 3]), 'add')
    expect(putBody.sha).toBeUndefined()
    expect(putBody.content).toBe('AQID')
  })

  it('returns null for missing files', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ message: 'Not Found' }), { status: 404 })))
    expect(await new GithubStore(new GithubClient('tok'), 'me/site', 'main').read('content/nope.json')).toBeNull()
  })
})
