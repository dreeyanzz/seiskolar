#!/usr/bin/env node
// The bridge server: a relay on this machine between AI agents and the Figma
// plugin. Agents POST /command (cli.mjs does it for them). The plugin, running
// in Figma desktop, long-polls /plugin/next for work and posts what happened to
// /plugin/result. Node built-ins only, so `npm install` adds nothing.
//
// It listens on loopback only, and every route except /health needs the token
// in TOKEN_FILE. The token is what stops a web page open in your browser from
// sending commands to localhost. See README.md, and ADR 0016 (in dreeyanzz/seiskolar-archive, docs/adr/0016-agents-reach-figma-through-our-own-plugin.md).

import crypto from 'node:crypto'
import http from 'node:http'
import {
  ALLOWED_HOSTS,
  PORT,
  SERVER_NAME,
  TOKEN_FILE,
  readOrCreateToken,
} from './shared.mjs'

const TOKEN = Buffer.from(readOrCreateToken())

const POLL_MS = 25_000 // how long a /plugin/next waits before answering 204
const SESSION_TTL_MS = 40_000 // a plugin that has not polled for this long is gone
const WAIT_FOR_PLUGIN_MS = 5_000 // grace for a plugin reconnecting to a fresh server
const DEFAULT_TIMEOUT_MS = 60_000
const MAX_TIMEOUT_MS = 290_000
const MAX_BODY = 64 * 1024 * 1024 // a large frame exported at 4x is tens of MB

// One session per open plugin window, so two files with the plugin open are
// told apart instead of racing for the same command.
// session id -> { id, file, connectedAt, lastSeen, queue: [command], waiter }
const sessions = new Map()
// command id -> { resolve, session }
const pending = new Map()
let lastRejected = null

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  // Chromium asks before a page served from the internet (figma.com) talks to a
  // loopback address.
  'Access-Control-Allow-Private-Network': 'true',
  'Access-Control-Max-Age': '600',
}

class HttpError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

function log(message) {
  console.log(`${new Date().toISOString()} ${message}`)
}

function send(res, status, body) {
  if (res.writableEnded || res.destroyed) return
  if (body === undefined) {
    res.writeHead(status, CORS)
    res.end()
    return
  }
  res.writeHead(status, { ...CORS, 'Content-Type': 'application/json; charset=utf-8' })
  res.end(JSON.stringify(body))
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    let size = 0
    req.on('data', (chunk) => {
      size += chunk.length
      if (size > MAX_BODY) {
        reject(new HttpError(413, 'Request body is too large'))
        req.destroy()
        return
      }
      chunks.push(chunk)
    })
    req.on('end', () => {
      if (chunks.length === 0) return resolve({})
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')))
      } catch {
        reject(new HttpError(400, 'Request body is not JSON'))
      }
    })
    req.on('error', reject)
  })
}

function authorized(req) {
  const header = req.headers.authorization || ''
  const given = Buffer.from(header.startsWith('Bearer ') ? header.slice(7).trim() : '')
  return given.length === TOKEN.length && crypto.timingSafeEqual(given, TOKEN)
}

function describe(session) {
  const file = session.file || {}
  return {
    session: session.id,
    file: file.name || null,
    fileKey: file.fileKey || null,
    page: file.page || null,
    editorType: file.editorType || null,
    connectedAt: new Date(session.connectedAt).toISOString(),
  }
}

function settle(id, outcome) {
  const entry = pending.get(id)
  if (!entry) return
  pending.delete(id)
  entry.resolve(outcome)
}

// A plugin running a command is not polling, so a quiet session with a command
// in flight is busy, not gone. Dropping it failed the command after 40 seconds
// even when the agent had asked for longer (found 2026-10-05).
function busy(id) {
  for (const entry of pending.values()) if (entry.session === id) return true
  return false
}

function liveSessions() {
  const now = Date.now()
  for (const [id, session] of sessions) {
    if (session.waiter || busy(id) || now - session.lastSeen <= SESSION_TTL_MS) continue
    sessions.delete(id)
    log(`plugin gone: ${session.file ? session.file.name : id}`)
    for (const command of session.queue) {
      settle(command.id, {
        ok: false,
        status: 503,
        error: 'The Figma plugin disconnected',
      })
    }
    for (const [commandId, entry] of pending) {
      if (entry.session === id) {
        settle(commandId, {
          ok: false,
          status: 503,
          error: 'The Figma plugin disconnected',
        })
      }
    }
  }
  return [...sessions.values()]
}

function matching(file) {
  const live = liveSessions()
  if (!file) return live
  const query = String(file).toLowerCase()
  return live.filter(
    (s) =>
      s.file &&
      ((s.file.name || '').toLowerCase().includes(query) || s.file.fileKey === file),
  )
}

function dispatch(session) {
  const waiter = session.waiter
  if (!waiter || session.queue.length === 0) return
  session.waiter = null
  clearTimeout(waiter.timer)
  send(waiter.res, 200, session.queue.shift())
}

async function handleCommand(req, res) {
  const body = await readJson(req)
  if (typeof body.command !== 'string') throw new HttpError(400, 'Missing "command"')

  let candidates = matching(body.file)
  const deadline = Date.now() + WAIT_FOR_PLUGIN_MS
  while (candidates.length === 0 && Date.now() < deadline) {
    await sleep(250)
    candidates = matching(body.file)
  }
  if (candidates.length === 0) {
    const others = liveSessions().map(describe)
    return send(res, 503, {
      ok: false,
      error: body.file
        ? `No open Figma file matches "${body.file}".`
        : 'No Figma file has the SEIskolar Bridge plugin running.',
      hint: lastRejected
        ? 'A plugin tried to connect with the wrong token. Run `npm run -s figma -- token` and paste the result into the plugin window.'
        : 'Open the file in Figma desktop and run Plugins > Development > SEIskolar Bridge. Leave its window open.',
      files: others,
    })
  }
  if (candidates.length > 1) {
    return send(res, 409, {
      ok: false,
      error:
        'More than one Figma file has the plugin open. Pass --file <part of the file name>.',
      files: candidates.map(describe),
    })
  }

  const session = candidates[0]
  const timeoutMs = Math.min(
    Number(body.timeout) * 1000 || DEFAULT_TIMEOUT_MS,
    MAX_TIMEOUT_MS,
  )
  // The plugin gets the timeout too, so a script that never finishes stops
  // holding up the commands behind it once the agent has given up on it.
  const command = {
    id: crypto.randomUUID(),
    command: body.command,
    params: body.params || {},
    timeoutMs,
  }
  log(`-> ${command.command} (${session.file ? session.file.name : session.id})`)

  const outcome = await new Promise((resolve) => {
    const timer = setTimeout(() => {
      session.queue = session.queue.filter((c) => c.id !== command.id)
      settle(command.id, {
        ok: false,
        status: 504,
        error: `Figma did not answer within ${timeoutMs / 1000}s. Is the plugin window still open?`,
      })
    }, timeoutMs)
    pending.set(command.id, {
      session: session.id,
      resolve: (value) => {
        clearTimeout(timer)
        resolve(value)
      },
    })
    session.queue.push(command)
    dispatch(session)
  })

  log(`<- ${command.command} ${outcome.ok ? 'ok' : 'failed: ' + outcome.error}`)
  const { status, ...rest } = outcome
  send(res, outcome.ok ? 200 : status || 502, rest)
}

async function handlePluginHello(req, res) {
  const body = await readJson(req)
  if (typeof body.session !== 'string') throw new HttpError(400, 'Missing "session"')
  const existing = sessions.get(body.session)
  if (existing) {
    existing.file = body.file || existing.file
    existing.lastSeen = Date.now()
  } else {
    sessions.set(body.session, {
      id: body.session,
      file: body.file || null,
      connectedAt: Date.now(),
      lastSeen: Date.now(),
      queue: [],
      waiter: null,
    })
    log(`plugin connected: ${body.file ? body.file.name : body.session}`)
  }
  lastRejected = null
  send(res, 200, { ok: true })
}

function handlePluginNext(req, res, url) {
  const session = sessions.get(url.searchParams.get('session') || '')
  // 410 tells a plugin that outlived a server restart to say hello again.
  if (!session) return send(res, 410, { ok: false, error: 'Unknown session' })
  session.lastSeen = Date.now()
  if (session.waiter) {
    clearTimeout(session.waiter.timer)
    send(session.waiter.res, 204)
    session.waiter = null
  }
  if (session.queue.length > 0) return send(res, 200, session.queue.shift())

  const waiter = {
    res,
    timer: setTimeout(() => {
      if (session.waiter !== waiter) return
      session.waiter = null
      session.lastSeen = Date.now()
      send(res, 204)
    }, POLL_MS),
  }
  session.waiter = waiter
  // res, not req: in Node 16+ a request emits 'close' as soon as its body is read.
  res.on('close', () => {
    if (session.waiter !== waiter) return
    clearTimeout(waiter.timer)
    session.waiter = null
    session.lastSeen = Date.now()
  })
}

async function handlePluginResult(req, res) {
  const body = await readJson(req)
  const session = sessions.get(body.session)
  if (session) session.lastSeen = Date.now()
  if (body.ok) {
    settle(body.id, { ok: true, result: body.result === undefined ? null : body.result })
  } else {
    settle(body.id, {
      ok: false,
      status: 422,
      error: body.error || 'The plugin reported an error',
      stack: body.stack || undefined,
      logs: body.logs || undefined,
    })
  }
  send(res, 204)
}

async function handle(req, res) {
  // A loopback server can still be reached through DNS rebinding; a Host that
  // is not loopback means the request did not come from this machine's tools.
  if (!ALLOWED_HOSTS.includes(req.headers.host)) {
    return send(res, 403, { ok: false, error: 'Bad Host header' })
  }
  if (req.method === 'OPTIONS') return send(res, 204)

  const url = new URL(req.url, `http://${req.headers.host}`)
  const route = `${req.method} ${url.pathname}`

  if (route === 'GET /health') return send(res, 200, { ok: true, name: SERVER_NAME })

  if (!authorized(req)) {
    if (url.pathname.startsWith('/plugin/')) lastRejected = Date.now()
    return send(res, 401, {
      ok: false,
      error: `Wrong or missing token (see ${TOKEN_FILE})`,
    })
  }

  switch (route) {
    case 'GET /status':
      return send(res, 200, {
        ok: true,
        port: PORT,
        files: liveSessions().map(describe),
        lastRejectedPluginAt: lastRejected ? new Date(lastRejected).toISOString() : null,
      })
    case 'POST /command':
      return handleCommand(req, res)
    case 'POST /plugin/hello':
      return handlePluginHello(req, res)
    case 'GET /plugin/next':
      return handlePluginNext(req, res, url)
    case 'POST /plugin/result':
      return handlePluginResult(req, res)
    case 'POST /shutdown':
      send(res, 200, { ok: true })
      log('shutting down')
      setTimeout(() => process.exit(0), 50)
      return
    default:
      return send(res, 404, { ok: false, error: `No route ${route}` })
  }
}

function serve(req, res) {
  handle(req, res).catch((error) => {
    send(res, error.status || 500, { ok: false, error: error.message })
  })
}

const ipv4 = http.createServer(serve)
ipv4.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is taken. The bridge is probably already running.`)
    process.exit(1)
  }
  throw error
})
ipv4.listen(PORT, '127.0.0.1', () => {
  log(`SEIskolar Figma bridge listening on http://localhost:${PORT}`)
  log(`token file: ${TOKEN_FILE}`)
})

// Figma's UI asks for `localhost`, which may resolve to ::1 first. A machine
// without IPv6 simply skips this.
const ipv6 = http.createServer(serve)
ipv6.on('error', () => {})
ipv6.listen(PORT, '::1')
