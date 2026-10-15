import { bytesToBase64, GithubClient, textToBase64 } from './github'

/** Where the CMS reads and writes content: the local disk (dev server) or the GitHub repo. */
export interface ContentStore {
  kind: 'local' | 'github'
  label: string
  list(dir: string): Promise<string[]>
  read(path: string): Promise<string | null>
  writeText(path: string, text: string, message: string): Promise<void>
  writeBinary(path: string, bytes: Uint8Array, message: string): Promise<void>
  remove(path: string, message: string): Promise<void>
}

export class LocalStore implements ContentStore {
  kind = 'local' as const
  label = 'Local files (dev server)'

  async list(dir: string) {
    const res = await fetch(`/__cms?path=${encodeURIComponent(dir)}`)
    return res.ok ? ((await res.json()) as string[]) : []
  }
  async read(path: string) {
    const res = await fetch(`/${path}?t=${Date.now()}`)
    return res.ok ? res.text() : null
  }
  async writeText(path: string, text: string) {
    await this.put(path, new TextEncoder().encode(text))
  }
  async writeBinary(path: string, bytes: Uint8Array) {
    await this.put(path, bytes)
  }
  async remove(path: string) {
    const res = await fetch(`/__cms?path=${encodeURIComponent(path)}`, { method: 'DELETE' })
    if (!res.ok) throw new Error(await res.text())
  }
  private async put(path: string, bytes: Uint8Array) {
    const res = await fetch(`/__cms?path=${encodeURIComponent(path)}`, { method: 'PUT', body: bytes as BodyInit })
    if (!res.ok) throw new Error(await res.text())
  }
}

export class GithubStore implements ContentStore {
  kind = 'github' as const
  label: string

  constructor(
    private client: GithubClient,
    private repo: string,
    private branch: string,
  ) {
    this.label = `${repo} @ ${branch}`
  }

  list(dir: string) {
    return this.client.listDir(this.repo, dir, this.branch)
  }
  async read(path: string) {
    return (await this.client.getFile(this.repo, path, this.branch))?.text ?? null
  }
  writeText(path: string, text: string, message: string) {
    return this.client.putFile(this.repo, path, this.branch, textToBase64(text), message)
  }
  writeBinary(path: string, bytes: Uint8Array, message: string) {
    return this.client.putFile(this.repo, path, this.branch, bytesToBase64(bytes), message)
  }
  remove(path: string, message: string) {
    return this.client.deleteFile(this.repo, path, this.branch, message)
  }
}

export async function localStoreAvailable(): Promise<boolean> {
  if (!import.meta.env.DEV) return false
  try {
    const res = await fetch('/__cms-ping')
    return res.ok && (await res.text()) === 'ok'
  } catch {
    return false
  }
}
