#!/usr/bin/env node
/**
 * Publishes the site to GitHub Pages at https://<user>.github.io/<repo>/ by building with that
 * base path and force-pushing dist/ to the gh-pages branch.
 * Run: npm run deploy:gh-pages
 * The contact form needs a server, so on GitHub Pages it falls back to pre-filled WhatsApp/email links.
 */
import { execFileSync, execSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..')
const sh = (cmd, opts = {}) => execSync(cmd, { cwd: root, stdio: 'inherit', ...opts })
const remote = execFileSync('git', ['remote', 'get-url', 'origin'], { cwd: root, encoding: 'utf8' }).trim()
const repo = remote.replace(/\.git$/, '').split(/[/:]/).pop()

console.log(`Building for /${repo}/ …`)
sh('node scripts/ensure-deps.mjs')
sh('npx tsc --noEmit -p .')
sh('npx vite build', { env: { ...process.env, BASE_PATH: `/${repo}/` } })
fs.writeFileSync(path.join(root, 'dist', '.nojekyll'), '')

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'gh-pages-'))
fs.cpSync(path.join(root, 'dist'), tmp, { recursive: true })
const git = (...args) => execFileSync('git', args, { cwd: tmp, stdio: 'inherit' })
const name = execFileSync('git', ['config', 'user.name'], { cwd: root, encoding: 'utf8' }).trim()
const email = execFileSync('git', ['config', 'user.email'], { cwd: root, encoding: 'utf8' }).trim()
git('init', '-q', '-b', 'gh-pages')
git('add', '-A')
git('-c', `user.name=${name}`, '-c', `user.email=${email}`, 'commit', '-q', '-m', `Deploy ${new Date().toISOString().slice(0, 16).replace('T', ' ')}`)
git('push', '-f', remote, 'gh-pages')
fs.rmSync(tmp, { recursive: true, force: true })
console.log('Pushed to gh-pages. GitHub Pages must be set to serve the gh-pages branch (Settings → Pages).')
