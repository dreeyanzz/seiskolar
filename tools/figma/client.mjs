// The bridge's HTTP client: starts the bridge server if it is not running, and sends it
// requests. cli.mjs uses it for every command, and import.mjs to send whole frames,
// which are too large to pass on a command line. See README.md beside this file.

import { spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { BASE_URL, LOG_FILE, ROOT, SERVER_NAME, STATE_DIR } from './shared.mjs'

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

// Thrown, not process.exit()ed: on Windows, exiting while fetch still holds a
// socket aborts Node with a libuv assertion instead of exit code 1.
export class Failure extends Error {
  constructor(payload) {
    super(typeof payload === 'string' ? payload : payload.error)
    this.payload = typeof payload === 'string' ? { ok: false, error: payload } : payload
  }
}

export function fail(payload) {
  throw new Failure(payload)
}

export async function healthy() {
  try {
    const res = await fetch(BASE_URL + '/health')
    return (await res.json()).name === SERVER_NAME
  } catch {
    return false
  }
}

export async function ensureServer() {
  if (await healthy()) return
  fs.mkdirSync(STATE_DIR, { recursive: true })
  const out = fs.openSync(LOG_FILE, 'a')
  const child = spawn(process.execPath, [path.join(ROOT, 'server.mjs')], {
    detached: true,
    stdio: ['ignore', out, out],
    windowsHide: true,
  })
  child.unref()
  for (let i = 0; i < 50; i++) {
    await sleep(100)
    if (await healthy()) {
      process.stderr.write(
        `Started the bridge server in the background (log: ${LOG_FILE}).\n`,
      )
      return
    }
  }
  fail(`Could not start the bridge server. See ${LOG_FILE}`)
}

export async function request(token, method, urlPath, body) {
  const res = await fetch(BASE_URL + urlPath, {
    method,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const text = await res.text()
  try {
    return { status: res.status, data: text ? JSON.parse(text) : {} }
  } catch {
    return { status: res.status, data: { ok: false, error: text } }
  }
}

export async function command(token, flags, name, params) {
  const { data } = await request(token, 'POST', '/command', {
    command: name,
    params,
    file: typeof flags.file === 'string' ? flags.file : undefined,
    timeout: flags.timeout ? Number(flags.timeout) : undefined,
  })
  if (!data.ok) fail(data)
  return data.result
}
