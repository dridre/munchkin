import { useCallback, useEffect, useRef, useState } from 'react'
import { REAL_TIMERS } from './hold.js'

// Sin servidor configurado la app funciona igual de bien, solo que en local.
export const ROOM_URL = (import.meta.env?.VITE_ROOM_URL ?? '').replace(/\/+$/, '')
export const hasRooms = Boolean(ROOM_URL)

export const CODE_LENGTH = 4

// Se admite lo que sea y se deja en cuatro caracteres validos: la gente escribe
// con minusculas, espacios y guiones.
export const cleanCode = (raw) =>
  String(raw ?? '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, CODE_LENGTH)

// Lo que lleva el QR: abre la web y entra en la sala de una.
export const linkFor = (code) =>
  `${location.origin}${location.pathname}?sala=${code}`

export async function createRoom(state) {
  const res = await fetch(`${ROOM_URL}/room`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(state),
  })
  // El servidor limita cuantas salas se pueden crear por minuto y por IP.
  if (res.status === 429) throw new Error('tooMany')
  if (!res.ok) throw new Error('create')
  const { code } = await res.json()
  return code
}

const FIRST_WAIT = 500
const MAX_WAIT = 10000
// Con jitter: si se cae el punto de acceso, los cinco moviles se desconectan a
// la vez y sin esto reintentarian todos en el mismo milisegundo, justo cuando
// peor esta la red.
export const nextWait = (wait, dado = Math.random()) =>
  Math.min(MAX_WAIT, Math.round(wait * 1.8 * (0.8 + dado * 0.4)))

// Latido: un ping cada tanto, y si dos seguidos se quedan sin respuesta la
// conexion esta muerta aunque el navegador la de por abierta. Pasa cuando la
// tablet se adormece o el wifi corta sin avisar: el aviso de cierre no llega
// nunca y, sin esto, la mesa se quedaba desconectada hasta recargar.
const PING_EVERY = 15000
const SILENT_BEATS = 3
// Al volver a la pantalla o a la red no se espera al latido: se pregunta ya.
const ANSWER_WITHIN = 4000

// Conexion a la sala, sin React para poder probarla con un reloj y un socket
// falsos. Se reconecta sola espaciando los intentos: en una mesa el wifi se
// cae, alguien bloquea el movil y hay que volver sin que nadie toque nada.
export function connect(url, { onMessage, onStatus }, WS = WebSocket, timers = REAL_TIMERS) {
  let ws = null
  let retry = null
  let check = null
  let wait = FIRST_WAIT
  let silent = 0

  const drop = () => {
    if (!ws) return
    ws.onopen = ws.onmessage = ws.onerror = ws.onclose = null
    ws.close()
    ws = null
  }

  const open = () => {
    onStatus('connecting')
    silent = 0
    const sock = new WS(url)
    ws = sock

    sock.onopen = () => {
      silent = 0
      wait = FIRST_WAIT
      onStatus('online')
    }

    sock.onmessage = (event) => {
      silent = 0
      if (event.data === 'pong') return
      try {
        onMessage(JSON.parse(event.data))
      } catch {
        /* mensaje que no entendemos: mejor ignorarlo que romper la partida */
      }
    }

    sock.onerror = () => sock.close()

    sock.onclose = () => {
      ws = null
      onStatus('offline')
      retry = timers.set(open, wait)
      wait = nextWait(wait)
    }
  }

  // Tira la conexion actual sin esperar a que el navegador se entere, y otra.
  const restart = () => {
    timers.clear(retry)
    timers.clear(check)
    drop()
    wait = FIRST_WAIT
    open()
  }

  const beat = () => {
    tick = timers.set(beat, PING_EVERY)
    if (!ws) return // esperando al siguiente reintento
    if (++silent >= SILENT_BEATS) return restart()
    if (ws.readyState === WS.OPEN) ws.send('ping')
  }
  let tick = timers.set(beat, PING_EVERY)

  const probe = () => {
    if (!ws) return restart()
    if (ws.readyState !== WS.OPEN) return
    silent = Math.max(silent, 1)
    ws.send('ping')
    timers.clear(check)
    check = timers.set(() => silent && restart(), ANSWER_WITHIN)
  }

  open()

  return {
    probe,
    // Si no hay linea, se descarta: la partida sigue en local y al reconectar
    // el servidor manda el estado bueno.
    send: (message) => ws?.readyState === WS.OPEN && ws.send(JSON.stringify(message)),
    close: () => {
      timers.clear(retry)
      timers.clear(check)
      timers.clear(tick)
      drop()
    },
  }
}

export function useRoom(code, onMessage) {
  const [status, setStatus] = useState('idle')
  const conn = useRef(null)
  const latest = useRef(onMessage)
  latest.current = onMessage

  useEffect(() => {
    if (!code || !hasRooms) {
      setStatus('idle')
      return undefined
    }

    const c = connect(`${ROOM_URL.replace(/^http/, 'ws')}/room/${code}/ws`, {
      onMessage: (m) => latest.current(m),
      onStatus: setStatus,
    })
    conn.current = c

    // iOS congela los temporizadores con la pantalla bloqueada, y una tablet
    // dormida vuelve con una conexion que parece abierta y no lo esta.
    const onVisible = () => document.visibilityState === 'visible' && c.probe()
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('online', c.probe)

    return () => {
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('online', c.probe)
      c.close()
      conn.current = null
    }
  }, [code])

  const send = useCallback((message) => conn.current?.send(message), [])

  return { status, send }
}
