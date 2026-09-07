import { reduce } from '../src/game.js'

// Sin I, L, O, 0 ni 1: son las que se confunden al leerlas de una pantalla al
// otro lado de la mesa.
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
const CODE_LENGTH = 4
const TRIES = 5

// Una sala sin tocar un dia se borra sola. Son partidas, no cuentas.
const ROOM_LIFE = 24 * 60 * 60 * 1000

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET,POST,OPTIONS',
  'access-control-allow-headers': 'content-type',
}

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json', ...CORS },
  })

const newCode = () =>
  Array.from(crypto.getRandomValues(new Uint8Array(CODE_LENGTH)), (n) => ALPHABET[n % ALPHABET.length]).join('')

const roomFor = (env, code) => env.ROOMS.get(env.ROOMS.idFromName(code))

export default {
  async fetch(request, env) {
    const url = new URL(request.url)

    if (request.method === 'OPTIONS') return new Response(null, { headers: CORS })

    // La mesa crea la sala y le pasa la partida que ya tiene montada.
    if (request.method === 'POST' && url.pathname === '/room') {
      const state = await request.json().catch(() => null)
      if (!state?.players) return json({ error: 'partida no valida' }, 400)

      for (let intento = 0; intento < TRIES; intento++) {
        const code = newCode()
        const res = await roomFor(env, code).fetch('https://sala/create', {
          method: 'POST',
          body: JSON.stringify(state),
        })
        if (res.ok) return json({ code })
      }
      return json({ error: 'no hay codigos libres' }, 503)
    }

    const joining = url.pathname.match(/^\/room\/([A-Z0-9]{4})\/ws$/)
    if (joining) return roomFor(env, joining[1]).fetch(request)

    return new Response('Salas de Munchkin', { headers: CORS })
  },
}

export class Room {
  constructor(ctx) {
    this.ctx = ctx
  }

  async fetch(request) {
    const url = new URL(request.url)

    if (url.pathname === '/create') {
      // Si ya hay partida aqui, el codigo esta cogido: que el Worker pruebe otro.
      if (await this.ctx.storage.get('state')) return new Response('cogido', { status: 409 })
      await this.save(await request.json())
      return new Response('ok')
    }

    if (request.headers.get('upgrade') !== 'websocket') {
      return new Response('esperaba un websocket', { status: 426 })
    }

    const { 0: client, 1: server } = new WebSocketPair()
    // Con hibernacion: la sala se duerme entre toque y toque sin cortar a nadie.
    this.ctx.acceptWebSocket(server)

    const state = await this.ctx.storage.get('state')
    if (state) {
      server.send(JSON.stringify({ type: 'sync', state }))
    } else {
      server.send(JSON.stringify({ type: 'missing' }))
      server.close(1000, 'esa sala no existe')
    }

    return new Response(null, { status: 101, webSocket: client })
  }

  async webSocketMessage(ws, raw) {
    let message
    try {
      message = JSON.parse(raw)
    } catch {
      return
    }
    if (message?.type !== 'action') return

    const state = await this.ctx.storage.get('state')
    if (!state) return

    // El servidor manda la partida entera despues de cada cambio: asi nadie se
    // queda desincronizado aunque se pierda un mensaje o lleguen desordenados.
    const next = reduce(state, message.action)
    await this.save(next)

    const payload = JSON.stringify({ type: 'sync', state: next })
    for (const open of this.ctx.getWebSockets()) {
      try {
        open.send(payload)
      } catch {
        /* ese ya se ha ido */
      }
    }
  }

  async save(state) {
    await this.ctx.storage.put('state', state)
    await this.ctx.storage.setAlarm(Date.now() + ROOM_LIFE)
  }

  async alarm() {
    await this.ctx.storage.deleteAll()
  }
}
