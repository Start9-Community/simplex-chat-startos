import WebSocket from 'ws'
import { T } from '@start9labs/start-sdk'
import { ChatResponse } from '@simplex-chat/types'
import { port } from './utils'

/**
 * Tiny JSON-RPC-over-WebSocket helper for talking to the SimpleX Chat bot
 * daemon from action code.
 *
 * The bot listens for WebSocket connections on TCP `port` (5225 in the
 * container). It speaks newline-delimited JSON: clients send
 *   { "corrId": "...", "cmd": "/some/command" }
 * and the bot replies with one envelope tagged with the matching `corrId`,
 * plus possibly any number of unsolicited event envelopes without one.
 *
 * Action JS runs on the StartOS host outside the daemon's subcontainer, but
 * it can reach the daemon directly via the container's bridge IP — that's
 * what `effects.getContainerIp({})` returns. See:
 * https://github.com/simplex-chat/simplex-chat/blob/stable/bots/README.md#sending-commands
 */

const REQ_TIMEOUT_MS = 15_000

export type Envelope = {
  corrId?: string
  resp?: ChatResponse
}

/**
 * Open a ws://<container-ip>:5225 connection, send one command, wait for the
 * reply matching the corrId, then close. Returns the envelope (containing
 * `resp`). Throws on timeout, handshake failure, connection error.
 *
 * If you want to send multiple commands in one connection, use
 * `withBotSession` instead.
 */
export async function callBot(
  effects: T.Effects,
  cmd: string,
  corrId?: string,
): Promise<Envelope> {
  return withBotSession(effects, (send) => send(cmd, corrId))
}

/**
 * Open a single connection to the bot and yield a `send` function that
 * issues commands sequentially. The connection is closed when `fn` resolves
 * or rejects. Use this to batch a few commands (e.g. /user followed by
 * /_profile) without paying the WS-handshake cost twice.
 */
export async function withBotSession<R>(
  effects: T.Effects,
  fn: (send: (cmd: string, corrId?: string) => Promise<Envelope>) => Promise<R>,
): Promise<R> {
  const ip = await effects.getContainerIp({})
  const url = `ws://${ip}:${port}/`

  return new Promise<R>((resolve, reject) => {
    const ws = new WebSocket(url, { handshakeTimeout: 5_000 })
    let resolved = false
    let pending: {
      corrId: string
      resolve: (env: Envelope) => void
      reject: (err: Error) => void
      timer: NodeJS.Timeout
    } | null = null

    const finish = (err: Error | null, value?: R) => {
      if (resolved) return
      resolved = true
      if (pending) {
        clearTimeout(pending.timer)
        pending.reject(err ?? new Error('Bot session closed'))
        pending = null
      }
      ws.close()
      if (err) reject(err)
      else resolve(value as R)
    }

    const send = (cmd: string, corrId?: string): Promise<Envelope> => {
      if (resolved) {
        return Promise.reject(new Error('Bot session already closed'))
      }
      if (pending) {
        return Promise.reject(
          new Error('Concurrent send not supported — await the previous one'),
        )
      }
      const id =
        corrId ??
        `act-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
      return new Promise<Envelope>((res, rej) => {
        const timer = setTimeout(() => {
          pending = null
          rej(
            new Error(
              `Timed out waiting for bot reply to ${cmd.split(' ')[0]} after ${REQ_TIMEOUT_MS}ms`,
            ),
          )
        }, REQ_TIMEOUT_MS)
        pending = { corrId: id, resolve: res, reject: rej, timer }
        ws.send(JSON.stringify({ corrId: id, cmd }))
      })
    }

    ws.on('open', async () => {
      try {
        const value = await fn(send)
        finish(null, value)
      } catch (err) {
        finish(err as Error)
      }
    })

    ws.on('message', (data) => {
      const text =
        typeof data === 'string'
          ? data
          : Buffer.isBuffer(data)
            ? data.toString('utf8')
            : Buffer.concat(data as Buffer[]).toString('utf8')
      // The bot may send multiple newline-delimited envelopes in one frame.
      for (const line of text.split('\n')) {
        if (!line.trim()) continue
        let env: Envelope
        try {
          env = JSON.parse(line) as Envelope
        } catch {
          continue
        }
        if (pending && env.corrId === pending.corrId) {
          const p = pending
          pending = null
          clearTimeout(p.timer)
          p.resolve(env)
        }
        // Otherwise: unsolicited event — discarded.
      }
    })

    ws.on('error', (err) => finish(err))
    ws.on('close', () => {
      if (!resolved) finish(new Error('Bot WebSocket closed unexpectedly'))
    })
  })
}
