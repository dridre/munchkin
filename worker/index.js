import { reduce, saneState } from '../src/game.js'

// Sin I, L, O, 0 ni 1: son las que se confunden al leerlas de una pantalla al
// otro lado de la mesa.
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
const CODE_LENGTH = 4
const TRIES = 5

// Una sala sin tocar un dia se borra sola. Son partidas, no cuentas.
const ROOM_LIFE = 24 * 60 * 60 * 1000
// No se reprograma la alarma en cada pulsacion: con el dedo apoyado son ~16
// acciones por segundo y cada una costaba una escritura de mas.
const ALARM_SLACK = 60 * 60 * 1000
// Una accion son ~120 bytes. Todo lo que pase de aqui es alguien probando.
const MAX_MESSAGE = 4000

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

// Topes por IP: sin esto, un bucle de `curl` puede crear salas hasta agotar la
// cuota diaria de la cuenta, y con ella las partidas de todo el mundo. Tambien
// frena el ir probando codigos de cuatro letras uno por uno.
//
// El binding de rate limiting de Cloudflare esta disponible pero no aplica nada
// en esta cuenta (comprobado: con limite de 3 cada 10 s pasan ocho seguidas),
// asi que se cuenta con un Durable Object por IP, que si es fiable.
const CREATE_CAP = { limit: 10, period: 60_000 }
const JOIN_CAP = { limit: 60, period: 60_000 }

async function allowed(env, request, cap) {
  const ip = request.headers.get('CF-Connecting-IP') ?? 'desconocida'
  try {
    const contador = env.LIMITS.get(env.LIMITS.idFromName(`${cap.limit}:${cap.period}:${ip}`))
    const res = await contador.fetch('https://limite/', {
      method: 'POST',
      body: JSON.stringify(cap),
    })
    const { ok } = await res.json()
    return ok
  } catch {
    // Si el contador falla, mejor dejar jugar que cerrar la puerta.
    return true
  }
}

const tooMany = () =>
  json({ error: 'demasiadas peticiones, prueba en un minuto' }, 429)

export default {
  async fetch(request, env) {
    const url = new URL(request.url)

    if (request.method === 'OPTIONS') return new Response(null, { headers: CORS })

    // La mesa crea la sala y le pasa la partida que ya tiene montada.
    if (request.method === 'POST' && url.pathname === '/room') {
      if (!(await allowed(env, request, CREATE_CAP))) return tooMany()

      const body = await request.json().catch(() => null)
      if (!Array.isArray(body?.players)) return json({ error: 'partida no valida' }, 400)

      // Se limpia aqui: lo que se guarde tiene que ser una partida jugable.
      const state = saneState(body)

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
    if (joining) {
      if (!(await allowed(env, request, JOIN_CAP))) return tooMany()
      return roomFor(env, joining[1]).fetch(request)
    }

    return new Response('Salas de Munchkin', { headers: CORS })
  },
}

// Una ventana de tiempo por IP. Un objeto por IP y por tope, que se borra solo
// en cuanto deja de usarse.
export class Limiter {
  constructor(ctx) {
    this.ctx = ctx
  }

  async fetch(request) {
    const { limit, period } = await request.json()
    const ahora = Date.now()

    let ventana = await this.ctx.storage.get('ventana')
    if (!ventana || ahora - ventana.desde > period) ventana = { desde: ahora, n: 0 }
    ventana.n++

    await this.ctx.storage.put('ventana', ventana)
    await this.ctx.storage.setAlarm(ahora + period * 3)

    return Response.json({ ok: ventana.n <= limit })
  }

  async alarm() {
    await this.ctx.storage.deleteAll()
  }
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
      await this.save(saneState(await request.json()))
      return new Response('ok')
    }

    if (request.headers.get('upgrade') !== 'websocket') {
      return new Response('esperaba un websocket', { status: 426 })
    }

    const { 0: client, 1: server } = new WebSocketPair()
    // Con hibernacion: la sala se duerme entre toque y toque sin cortar a nadie.
    this.ctx.acceptWebSocket(server)
    server.serializeAttachment({ role: null })

    const state = await this.ctx.storage.get('state')
    if (state) {
      // A todos, no solo al que entra: la mesa quiere ver como van llegando.
      this.broadcast({ type: 'sync', state, ...this.presence() })
    } else {
      server.send(JSON.stringify({ type: 'missing' }))
      server.close(1000, 'esa sala no existe')
    }

    return new Response(null, { status: 101, webSocket: client })
  }

  // Quien hay conectado y que personaje ha cogido cada uno, para que nadie
  // reclame el mismo jugador y para que la mesa vea si ya han entrado todos.
  presence() {
    const sockets = this.ctx.getWebSockets()
    const taken = []
    for (const ws of sockets) {
      const role = ws.deserializeAttachment()?.role
      if (role && role !== 'table' && !taken.includes(role)) taken.push(role)
    }
    return { taken, devices: sockets.length }
  }

  broadcast(payload) {
    const text = JSON.stringify(payload)
    for (const open of this.ctx.getWebSockets()) {
      try {
        open.send(text)
      } catch {
        /* ese ya se ha ido */
      }
    }
  }

  async webSocketMessage(ws, raw) {
    // Una excepcion aqui abortaria el objeto y tiraria a los cinco a la vez.
    try {
      if (typeof raw !== 'string' || raw.length > MAX_MESSAGE) return

      const message = JSON.parse(raw)

      if (message?.type === 'claim') {
        const role = typeof message.role === 'string' ? message.role : null
        ws.serializeAttachment({ role })
        const state = await this.ctx.storage.get('state')
        if (state) this.broadcast({ type: 'sync', state, ...this.presence() })
        return
      }

      if (message?.type !== 'action') return

      const state = await this.ctx.storage.get('state')
      if (!state) return

      // El servidor manda la partida entera despues de cada cambio: asi nadie se
      // queda desincronizado aunque se pierda un mensaje o lleguen desordenados.
      // `by` y `n` vuelven tal cual para que quien la mando sepa cual ya esta
      // aplicada y pueda soltarla de su cola de pendientes.
      const next = reduce(state, message.action)
      await this.save(next)
      this.broadcast({
        type: 'sync',
        state: next,
        by: message.by,
        n: message.n,
        ...this.presence(),
      })
    } catch {
      /* mensaje ilegible: se ignora, la sala sigue viva */
    }
  }

  async webSocketClose() {
    const state = await this.ctx.storage.get('state')
    if (state) this.broadcast({ type: 'sync', state, ...this.presence() })
  }

  async save(state) {
    await this.ctx.storage.put('state', state)

    const alarma = await this.ctx.storage.getAlarm()
    if (!alarma || alarma < Date.now() + ROOM_LIFE - ALARM_SLACK) {
      await this.ctx.storage.setAlarm(Date.now() + ROOM_LIFE)
    }
  }

  async alarm() {
    await this.ctx.storage.deleteAll()
  }
}
