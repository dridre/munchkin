import { useCallback, useEffect, useRef, useState } from 'react'

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
  if (!res.ok) throw new Error('no se pudo crear la sala')
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

// Conexion a la sala. Se reconecta sola espaciando los intentos: en una mesa el
// wifi se cae, alguien bloquea el movil y hay que volver sin que nadie toque nada.
export function useRoom(code, onMessage) {
  const [status, setStatus] = useState('idle')
  const socket = useRef(null)
  const latest = useRef(onMessage)
  latest.current = onMessage

  useEffect(() => {
    if (!code || !hasRooms) {
      setStatus('idle')
      return undefined
    }

    let alive = true
    let retry = null
    let wait = FIRST_WAIT

    const open = () => {
      setStatus('connecting')
      const ws = new WebSocket(`${ROOM_URL.replace(/^http/, 'ws')}/room/${code}/ws`)
      socket.current = ws

      ws.onopen = () => {
        if (!alive) return ws.close()
        wait = FIRST_WAIT
        setStatus('online')
      }

      ws.onmessage = (event) => {
        try {
          latest.current(JSON.parse(event.data))
        } catch {
          /* mensaje que no entendemos: mejor ignorarlo que romper la partida */
        }
      }

      ws.onerror = () => ws.close()

      ws.onclose = () => {
        socket.current = null
        if (!alive) return
        setStatus('offline')
        retry = setTimeout(open, wait)
        wait = nextWait(wait)
      }
    }

    open()

    // iOS congela los temporizadores con la pantalla bloqueada: al volver puede
    // quedarse hasta diez segundos sin linea mientras su dueño toca botones.
    const onVisible = () => {
      if (document.visibilityState === 'visible' && !socket.current) {
        clearTimeout(retry)
        wait = FIRST_WAIT
        open()
      }
    }
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      document.removeEventListener('visibilitychange', onVisible)
      alive = false
      clearTimeout(retry)
      socket.current?.close()
      socket.current = null
    }
  }, [code])

  // Si no hay linea, se descarta: la partida sigue en local y al reconectar el
  // servidor manda el estado bueno.
  const send = useCallback((message) => {
    const ws = socket.current
    if (ws?.readyState === WebSocket.OPEN) ws.send(JSON.stringify(message))
  }, [])

  return { status, send }
}
