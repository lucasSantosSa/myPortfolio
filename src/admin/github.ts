/** Minimal GitHub REST client used by the CMS. The token never leaves the browser except to api.github.com. */

const API = 'https://api.github.com'

export class GithubError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message)
  }
}

export function bytesToBase64(bytes: Uint8Array): string {
  let binary = ''
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) binary += String.fromCharCode(...bytes.subarray(i, i + chunk))
  return btoa(binary)
}

export function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64.replace(/\s/g, ''))
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

export const textToBase64 = (text: string) => bytesToBase64(new TextEncoder().encode(text))
export const base64ToText = (b64: string) => new TextDecoder().decode(base64ToBytes(b64))

export class GithubClient {
  constructor(private token?: string) {}

  async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const res = await fetch(`${API}${path}`, {
      ...init,
      headers: {
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
        ...init.headers,
      },
    })
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { message?: string }
      throw new GithubError(body.message ?? `GitHub request failed (${res.status})`, res.status)
    }
    return res.status === 204 ? (undefined as T) : ((await res.json()) as T)
  }

  user() {
    return this.request<{ login: string }>('/user')
  }

  // ---- repository contents (the portfolio repo itself) ----

  async getFile(repo: string, path: string, ref: string): Promise<{ text: string; sha: string } | null> {
    try {
      const f = await this.request<{ content: string; sha: string }>(`/repos/${repo}/contents/${encodePath(path)}?ref=${encodeURIComponent(ref)}`)
      return { text: base64ToText(f.content), sha: f.sha }
    } catch (err) {
      if (err instanceof GithubError && err.status === 404) return null
      throw err
    }
  }

  async listDir(repo: string, path: string, ref: string): Promise<string[]> {
    try {
      const items = await this.request<{ name: string; type: string }[]>(`/repos/${repo}/contents/${encodePath(path)}?ref=${encodeURIComponent(ref)}`)
      return items.filter((i) => i.type === 'file').map((i) => i.name)
    } catch (err) {
      if (err instanceof GithubError && err.status === 404) return []
      throw err
    }
  }

  async putFile(repo: string, path: string, branch: string, contentBase64: string, message: string) {
    const existing = await this.getSha(repo, path, branch)
    await this.request(`/repos/${repo}/contents/${encodePath(path)}`, {
      method: 'PUT',
      body: JSON.stringify({ message, content: contentBase64, branch, ...(existing ? { sha: existing } : {}) }),
    })
  }

  async deleteFile(repo: string, path: string, branch: string, message: string) {
    const sha = await this.getSha(repo, path, branch)
    if (!sha) return
    await this.request(`/repos/${repo}/contents/${encodePath(path)}`, { method: 'DELETE', body: JSON.stringify({ message, sha, branch }) })
  }

  private async getSha(repo: string, path: string, ref: string): Promise<string | null> {
    try {
      const f = await this.request<{ sha: string }>(`/repos/${repo}/contents/${encodePath(path)}?ref=${encodeURIComponent(ref)}`)
      return f.sha
    } catch (err) {
      if (err instanceof GithubError && err.status === 404) return null
      throw err
    }
  }

  // ---- reading a project's repository for import ----

  repo(fullName: string) {
    return this.request<{
      full_name: string
      name: string
      description: string | null
      homepage: string | null
      html_url: string
      private: boolean
      topics?: string[]
      stargazers_count: number
      pushed_at: string
      created_at: string
      default_branch: string
    }>(`/repos/${fullName}`)
  }

  languages(fullName: string) {
    return this.request<Record<string, number>>(`/repos/${fullName}/languages`)
  }

  async readme(fullName: string): Promise<string | null> {
    try {
      const f = await this.request<{ content: string }>(`/repos/${fullName}/readme`)
      return base64ToText(f.content)
    } catch {
      return null
    }
  }

  async tree(fullName: string, branch: string) {
    const t = await this.request<{ tree: { path: string; type: string; sha: string; size?: number }[] }>(
      `/repos/${fullName}/git/trees/${encodeURIComponent(branch)}?recursive=1`,
    )
    return t.tree.filter((n) => n.type === 'blob')
  }

  async blob(fullName: string, sha: string): Promise<Uint8Array> {
    const b = await this.request<{ content: string }>(`/repos/${fullName}/git/blobs/${sha}`)
    return base64ToBytes(b.content)
  }
}

function encodePath(path: string) {
  return path.split('/').map(encodeURIComponent).join('/')
}

/** Accepts "owner/repo", "https://github.com/owner/repo" or a .git URL. */
export function parseRepoRef(input: string): string | null {
  const s = input.trim().replace(/\.git$/, '').replace(/\/$/, '')
  const m = s.match(/^(?:https?:\/\/github\.com\/|git@github\.com:)?([\w.-]+)\/([\w.-]+)$/)
  return m ? `${m[1]}/${m[2]}` : null
}
