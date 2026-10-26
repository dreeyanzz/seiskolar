#!/usr/bin/env node
// The agent's side of the bridge: read and edit the Figma file from a shell.
// Prints JSON on stdout. On failure prints JSON on stderr and exits 1. Starts
// the bridge server in the background if it is not already running.
// See README.md beside this file. Ported from the archive's tools/figma-bridge/; why the
// bridge exists is ADR 0016 (in dreeyanzz/seiskolar-archive, docs/adr/0016-agents-reach-figma-through-our-own-plugin.md).

import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import {
  Failure,
  command,
  ensureServer,
  fail,
  healthy,
  request,
  sleep,
} from './client.mjs'
import {
  BASE_URL,
  LOG_FILE,
  MANIFEST,
  OUT_DIR,
  TEAM_FILE,
  TOKEN_FILE,
  readOrCreateToken,
} from './shared.mjs'

const USAGE = `SEIskolar Figma bridge

Usage: npm run -s figma -- <command> [options]
   or: node tools/figma/cli.mjs <command> [options]

Reading
  status                       Is the bridge up, and which files have the plugin open
  tree [nodeId] [--depth N]    The node tree. No id: the whole file, pages down (depth 2)
  node <nodeId>                Every property of one node, its parent and children
  selection                    What the person in Figma has selected right now
  screenshot <nodeId>          Export a node to an image you can look at
      [--scale 2] [--format png|jpg|svg] [--out path]

Writing
  run <script.js | ->          Run JavaScript inside Figma, with \`figma\` in scope
      [--code "..."]           ...or pass the code inline instead of a file
      [--args '{"json":1}']    Available to the script as \`args\`

Setup and housekeeping
  doctor                       Check every setup step; says what the person must do next
  token [--copy]               The token for the plugin window. --copy puts it on the
                               clipboard instead of printing it (use this in a chat)
  stop                         Stop the background bridge server

Options for every command
  --file <name>                Which file, when more than one has the plugin open
  --timeout <seconds>          How long to wait for Figma (default 60)

Node ids may be written 78:1178 or 78-1178 (as in a Figma URL).`

// The server keeps the token it started with. If the token file changes under a
// running server, it refuses the new token, and `stop` cannot stop it either,
// because stopping needs the token too.
const STALE_SERVER_FIX =
  'The running bridge server was started with a different token (the token file changed after it started), so it refuses this one and cannot be stopped from here. Ask the person to end it: on Windows, in Task Manager, end the Node.js process running tools\\figma\\server.mjs; on macOS or Linux, run `pkill -f tools/figma/server.mjs`. Then run doctor again.'

function parseArgs(argv) {
  const positional = []
  const flags = {}
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg.startsWith('--')) {
      const next = argv[i + 1]
      if (next === undefined || next.startsWith('--')) flags[arg.slice(2)] = true
      else {
        flags[arg.slice(2)] = next
        i++
      }
    } else positional.push(arg)
  }
  return { positional, flags }
}

function print(value) {
  process.stdout.write(JSON.stringify(value, null, 2) + '\n')
}

function readCode(positional, flags) {
  if (typeof flags.code === 'string') return flags.code
  const source = positional[1]
  if (!source) fail('run needs a script file, `-` for stdin, or --code "..."')
  if (source === '-') return fs.readFileSync(0, 'utf8')
  return fs.readFileSync(path.resolve(source), 'utf8')
}

function parseJsonFlag(value, name) {
  if (value === undefined) return undefined
  try {
    return JSON.parse(value)
  } catch {
    fail(`--${name} is not valid JSON`)
  }
}

// The token goes from the clipboard into the plugin window, so an agent can hand
// it over without it ever appearing in a chat transcript.
function copyToClipboard(text) {
  const tools =
    process.platform === 'win32'
      ? [['clip', []]]
      : process.platform === 'darwin'
        ? [['pbcopy', []]]
        : [
            ['wl-copy', []],
            ['xclip', ['-selection', 'clipboard']],
            ['xsel', ['--clipboard', '--input']],
          ]
  for (const [tool, args] of tools) {
    const result = spawnSync(tool, args, { input: text, windowsHide: true })
    if (!result.error && result.status === 0) return true
  }
  return false
}

function findFigmaDesktop() {
  const home = os.homedir()
  const candidates =
    process.platform === 'win32'
      ? [
          path.join(
            process.env.LOCALAPPDATA || path.join(home, 'AppData', 'Local'),
            'Figma',
            'Figma.exe',
          ),
          path.join(
            process.env.ProgramFiles || 'C:\\Program Files',
            'Figma',
            'Figma.exe',
          ),
        ]
      : process.platform === 'darwin'
        ? [
            '/Applications/Figma.app',
            '/Applications/Figma Beta.app',
            path.join(home, 'Applications', 'Figma.app'),
          ]
        : []
  return candidates.find((candidate) => fs.existsSync(candidate)) || null
}

// One check per setup step, in the order a person does them. Each failing check
// carries `fix`: what the agent does next, and what it tells the person, in plain
// words. `nextStep` is the first of those. SETUP.md explains each one. Reports on stdout either way; exits 1 when not ready.
async function doctor(token) {
  const checks = []
  const add = (id, ok, detail, fix) =>
    checks.push(ok === true || !fix ? { id, ok, detail } : { id, ok, detail, fix })

  const major = Number(process.versions.node.split('.')[0])
  add(
    'node',
    major >= 20,
    `Node ${process.versions.node}`,
    'Tell the person to install Node 20 or later; then run `nvm install && nvm use` in the repository.',
  )
  add('token', true, `Token file: ${TOKEN_FILE}`)

  let status = null
  try {
    await ensureServer()
    // A plugin retries every two seconds, so give it a moment to find a server
    // that was just started.
    for (let i = 0; i < 12; i++) {
      status = (await request(token, 'GET', '/status')).data
      if (!status.ok || status.files.length > 0) break
      await sleep(500)
    }
    add(
      'server',
      status.ok === true,
      status.ok ? `Listening at ${BASE_URL}` : status.error,
      STALE_SERVER_FIX,
    )
  } catch (error) {
    add(
      'server',
      false,
      error.message,
      `Read ${LOG_FILE}. If another program holds port 4517, tell the person which one and ask before stopping it.`,
    )
  }

  const files = status && status.ok ? status.files : []
  const desktop = findFigmaDesktop()
  if (files.length > 0) {
    add('figma-desktop', true, 'Figma desktop is running the plugin')
  } else if (desktop) {
    add('figma-desktop', true, `Installed at ${desktop}`)
  } else if (process.platform === 'win32' || process.platform === 'darwin') {
    add(
      'figma-desktop',
      false,
      'Figma desktop was not found in the usual places',
      'Tell the person to install Figma desktop from https://www.figma.com/downloads/ and sign in with the account that can edit the team file. Do not download or run the installer yourself. The browser version cannot run development plugins.',
    )
  } else {
    add(
      'figma-desktop',
      null,
      'Figma has no official desktop app for this platform, and development plugins need it',
      'Tell the person that Figma work through the bridge needs a Windows or macOS machine.',
    )
  }

  const rejected = status && status.ok && status.lastRejectedPluginAt
  if (files.length > 0) {
    add('plugin', true, `Open in: ${files.map((f) => f.file).join(', ')}`)
  } else if (rejected) {
    add(
      'plugin',
      false,
      `A plugin tried to connect with the wrong token at ${rejected}`,
      'Run `npm run -s figma -- token --copy`, then tell the person to paste it into the SEIskolar Bridge window and press Save.',
    )
  } else {
    add(
      'plugin',
      false,
      'No Figma file has the SEIskolar Bridge plugin open',
      `Tell the person: open the team file (${TEAM_FILE.url}) in Figma desktop. If the plugin has never been imported on this computer, use Plugins > Development > Import plugin from manifest... and choose ${MANIFEST}. Then run Plugins > Development > SEIskolar Bridge and leave its window open.`,
    )
  }

  const team = files.find((f) => (f.file || '').toLowerCase().includes(TEAM_FILE.match))
  if (files.length > 0) {
    add(
      'team-file',
      Boolean(team),
      team
        ? `Connected to "${team.file}"`
        : 'The plugin is open, but not in the team file',
      `Tell the person to open the team file (${TEAM_FILE.url}) in Figma desktop and run SEIskolar Bridge there.`,
    )
  }

  if (team) {
    const started = Date.now()
    const { data } = await request(token, 'POST', '/command', {
      command: 'ping',
      params: {},
      file: team.file,
      timeout: 15,
    })
    add(
      'round-trip',
      data.ok === true,
      data.ok ? `Figma answered in ${Date.now() - started} ms` : data.error,
      'Tell the person to check that the SEIskolar Bridge window is still open and says Connected. If it does, ask them to close it and run it again.',
    )
  }

  const failing = checks.find((check) => check.ok === false)
  const ready = checks.some((c) => c.id === 'round-trip' && c.ok) && !failing
  return {
    ready,
    nextStep: failing ? failing.fix : ready ? 'Nothing. The bridge is ready.' : null,
    manifest: MANIFEST,
    teamFile: TEAM_FILE.url,
    checks,
  }
}

async function main() {
  const { positional, flags } = parseArgs(process.argv.slice(2))
  const name = positional[0]

  if (!name || name === 'help' || flags.help) {
    process.stdout.write(USAGE + '\n')
    return
  }

  const token = readOrCreateToken()

  if (name === 'token') {
    if (!flags.copy) {
      process.stdout.write(token + '\n')
      return
    }
    if (!copyToClipboard(token)) {
      fail({
        ok: false,
        error: 'No clipboard tool found (clip, pbcopy, wl-copy, xclip or xsel).',
        hint: 'Ask the person to run `npm run -s figma -- token` in their own terminal and copy it from there.',
      })
    }
    return print({ ok: true, copied: true, tokenFile: TOKEN_FILE })
  }

  if (name === 'doctor') {
    const report = await doctor(token)
    print(report)
    if (!report.ready) process.exitCode = 1
    return
  }

  if (name === 'stop') {
    if (!(await healthy())) return print({ ok: true, running: false })
    const { status, data } = await request(token, 'POST', '/shutdown')
    if (status === 401) fail({ ok: false, error: data.error, fix: STALE_SERVER_FIX })
    return print(data)
  }

  await ensureServer()

  switch (name) {
    case 'status': {
      const { data } = await request(token, 'GET', '/status')
      if (!data.ok) fail(data)
      return print(data)
    }
    case 'tree':
      return print(
        await command(token, flags, 'tree', {
          id: positional[1],
          depth: flags.depth === undefined ? 2 : Number(flags.depth),
        }),
      )
    case 'node':
      if (!positional[1]) fail('node needs a node id')
      return print(await command(token, flags, 'node', { id: positional[1] }))
    case 'selection':
      return print(await command(token, flags, 'selection', {}))
    case 'screenshot': {
      const id = positional[1]
      if (!id) fail('screenshot needs a node id')
      const format = String(flags.format || 'png').toLowerCase()
      const result = await command(token, flags, 'screenshot', {
        id,
        format,
        scale: flags.scale === undefined ? 2 : Number(flags.scale),
      })
      const file = path.resolve(
        typeof flags.out === 'string'
          ? flags.out
          : path.join(OUT_DIR, `${id.replace(/[:;]/g, '-')}.${format}`),
      )
      fs.mkdirSync(path.dirname(file), { recursive: true })
      const bytes =
        format === 'svg'
          ? Buffer.from(result.svg, 'utf8')
          : Buffer.from(result.base64, 'base64')
      fs.writeFileSync(file, bytes)
      return print({
        file,
        format,
        node: result.node,
        width: result.width,
        height: result.height,
        bytes: bytes.length,
      })
    }
    case 'run':
      return print(
        await command(token, flags, 'run', {
          code: readCode(positional, flags),
          args: parseJsonFlag(flags.args, 'args'),
        }),
      )
    default:
      fail(`Unknown command "${name}". Run with no arguments for help.`)
  }
}

main().catch((error) => {
  const payload =
    error instanceof Failure ? error.payload : { ok: false, error: error.message }
  process.stderr.write(JSON.stringify(payload, null, 2) + '\n')
  process.exitCode = 1
})
