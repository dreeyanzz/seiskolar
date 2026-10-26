// What the bridge server and the CLI agree on: the port, where the token lives,
// and where screenshots go. See README.md beside this file.

import crypto from 'node:crypto'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// The plugin cannot read this file. If you change the port, change it in
// plugin/manifest.json (devAllowedDomains) and plugin/ui.html (BRIDGE) too.
export const PORT = 4517
export const BASE_URL = `http://127.0.0.1:${PORT}`
export const ALLOWED_HOSTS = [`127.0.0.1:${PORT}`, `localhost:${PORT}`, `[::1]:${PORT}`]
export const SERVER_NAME = 'seiskolar-figma-bridge'

export const ROOT = path.dirname(fileURLToPath(import.meta.url))
export const OUT_DIR = path.join(ROOT, '.out')
export const MANIFEST = path.join(ROOT, 'plugin', 'manifest.json')

// The team's Figma file for the current design (FIGMA.md). `doctor` checks the plugin is
// open in it. Matched on 'current design', not on 'asph': the earlier file, 'Asph –
// SEIskolar', has that in its name too, and is only opened to label it as earlier.
export const TEAM_FILE = {
  match: 'current design',
  name: 'SEIskolar – current design (Asph)',
  url: 'https://www.figma.com/design/fsEKjSfF5mPRh5NIwwuign',
}

// The token and the log live in the home directory, not the checkout, so every
// clone and worktree on one machine shares one token and the plugin is paired
// once.
export const STATE_DIR = path.join(os.homedir(), '.seiskolar-figma-bridge')
export const TOKEN_FILE = path.join(STATE_DIR, 'token')
export const LOG_FILE = path.join(STATE_DIR, 'bridge.log')

export function readToken() {
  try {
    return fs.readFileSync(TOKEN_FILE, 'utf8').trim() || null
  } catch {
    return null
  }
}

export function readOrCreateToken() {
  const existing = readToken()
  if (existing) return existing
  fs.mkdirSync(STATE_DIR, { recursive: true })
  const token = crypto.randomBytes(16).toString('hex')
  fs.writeFileSync(TOKEN_FILE, token + '\n', { mode: 0o600 })
  return token
}
