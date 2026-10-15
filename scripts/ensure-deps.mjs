// Installs dependencies on first run so `npm run build` / `npm start` work on a fresh clone.
import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..')
if (!fs.existsSync(path.join(root, 'node_modules', '.package-lock.json'))) {
  console.log('Installing dependencies (first run)…')
  execSync('npm install --no-audit --no-fund', { cwd: root, stdio: 'inherit' })
}
