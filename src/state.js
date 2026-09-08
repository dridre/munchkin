import { useCallback, useEffect, useRef, useState } from 'react'
import { EMPTY, reduce, saneState } from './game.js'
import { useRoom, createRoom, cleanCode, hasRooms } from './room.js'

export * from './game.js'

const KEY = 'munchkin.v2'
const ROLE_KEY = 'munchkin.role'
const ROOM_KEY = 'munchkin.sala'
export const TABLE = 'table'

const read = (key) => {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

const write = (key, value) => {
  try {
    if (value) localStorage.setItem(key, value)
    else localStorage.removeItem(key)
  } catch {
    /* modo privado o sin cuota: vale solo para esta sesion */
  }
}

// Un enlace con ?sala=XXXX (el del QR) entra directo y se quita de la barra,
// para que al recargar no vuelva a arrastrarte a una sala que ya dejaste.
function initialCode() {
  try {
    const fromLink = cleanCode(new URLSearchParams(location.search).get('sala'))
    if (fromLink) {
      history.replaceState(null, '', location.pathname)
      write(ROOM_KEY, fromLink)
      return fromLink
    }
  } catch {
    /* sin URL utilizable */
  }
  return read(ROOM_KEY)
}

// Lo que tarda en salir hacia la sala lo que se ha ido pulsando. Con el dedo
// apoyado se generan ~16 acciones por segundo: agruparlas en una sola con el
// incremento sumado da exactamente el mismo resultado y una decima parte de
// escrituras en el servidor.
const FLUSH = 150

// Junta los `bump` seguidos del mismo jugador y campo: doce +1 son un +12.
function group(actions) {
  const out = []
  for (const action of actions) {
    const last = out[out.length - 1]
    if (
      action.type === 'bump' &&
      last?.type === 'bump' &&
      last.id === action.id &&
      last.field === action.field
    ) {
      out[out.length - 1] = { ...last, delta: last.delta + action.delta }
    } else {
      out.push(action)
    }
  }
  return out
}

export function useGame() {
  const [state, setState] = useState(() => {
    try {
      return saneState(JSON.parse(read(KEY)) ?? EMPTY)
    } catch {
      return EMPTY
    }
  })

  const [code, setCode] = useState(initialCode)
  const [error, setError] = useState(null)
  const [presence, setPresence] = useState({ taken: [], devices: 0 })

  // Quien soy en esta conexion, solo para reconocer mis propias acciones cuando
  // el servidor me las devuelve.
  const me = useRef(Math.random().toString(36).slice(2))
  const counter = useRef(0)
  const outbox = useRef([]) // pulsado, aun sin salir
  const inflight = useRef([]) // enviado, aun sin confirmar
  const timer = useRef(null)

  useEffect(() => {
    write(KEY, JSON.stringify(state))
  }, [state])

  const onMessage = useCallback((message) => {
    if (message.type === 'missing') {
      setCode(null)
      write(ROOM_KEY, null)
      setError('error.missing')
      return
    }

    if (message.type !== 'sync') return
    if (message.taken) setPresence({ taken: message.taken, devices: message.devices ?? 0 })

    // Suelta lo que el servidor ya ha aplicado de lo mio.
    if (message.by === me.current) {
      inflight.current = inflight.current.filter((p) => p.n > message.n)
    }

    // La partida del servidor es la buena, pero encima van mis acciones aun sin
    // confirmar: si no, el numero retrocede en pantalla mientras lo pulsas.
    setState(() => {
      const base = saneState(message.state)
      const mias = [...inflight.current.map((p) => p.action), ...outbox.current]
      return mias.reduce(reduce, base)
    })
  }, [])

  const { status, send } = useRoom(code, onMessage)

  const flush = useCallback(() => {
    timer.current = null
    if (!outbox.current.length) return

    for (const action of group(outbox.current)) {
      const n = ++counter.current
      inflight.current.push({ n, action })
      send({ type: 'action', action, by: me.current, n })
    }
    outbox.current = []
  }, [send])

  // Al recuperar la linea sale todo lo que se quedo pendiente: sin esto, lo que
  // pulsaste sin cobertura se perdia sin que nadie se enterara.
  useEffect(() => {
    if (status !== 'online') return
    for (const { n, action } of inflight.current) {
      send({ type: 'action', action, by: me.current, n })
    }
    flush()
  }, [status, send, flush])

  // El unico sitio por el que se cambia la partida. Se aplica aqui al momento
  // para que el boton responda, y ademas sale hacia la sala.
  const dispatch = useCallback(
    (action) => {
      setState((s) => reduce(s, action))
      outbox.current.push(action)
      if (!timer.current) timer.current = setTimeout(flush, FLUSH)
    },
    [flush],
  )

  useEffect(() => () => clearTimeout(timer.current), [])

  const enter = useCallback((next) => {
    setError(null)
    inflight.current = []
    outbox.current = []
    setCode(next)
    write(ROOM_KEY, next)
  }, [])

  const claim = useCallback((role) => send({ type: 'claim', role }), [send])

  const room = {
    code,
    status,
    error,
    claim,
    taken: presence.taken,
    devices: presence.devices,
    pending: inflight.current.length + outbox.current.length,
    available: hasRooms,
    dismiss: () => setError(null),
    create: async () => {
      setError(null)
      try {
        enter(await createRoom(state))
      } catch (e) {
        setError(e?.message === 'tooMany' ? 'error.tooMany' : 'error.create')
      }
    },
    join: (raw) => {
      const clean = cleanCode(raw)
      if (clean.length === 4) enter(clean)
      else setError('error.code')
    },
    leave: () => enter(null),
  }

  return [state, dispatch, room]
}

// Quien es este aparato: la mesa, o el jugador que ha reclamado. Es del aparato,
// no de la partida, asi que se guarda aparte y no viaja a la sala.
//
// Va atado a la sala en la que se cogio: si esa sala cambia o desaparece, dejas
// de ser ese personaje. Sin esto, quien vuelve semanas despues aterrizaba en la
// ficha de una partida que ya no existe y sin salida a la vista.
export function useRole(code = null) {
  const [stored, setStored] = useState(() => {
    try {
      return JSON.parse(read(ROLE_KEY))
    } catch {
      return null
    }
  })

  const choose = useCallback(
    (next) => {
      const guardado = next ? { code: code ?? null, role: next } : null
      setStored(guardado)
      write(ROLE_KEY, guardado && JSON.stringify(guardado))
    },
    [code],
  )

  const mismaSala = (stored?.code ?? null) === (code ?? null)
  return [mismaSala ? (stored?.role ?? null) : null, choose]
}

// Mantiene la tablet despierta durante la partida.
export function useWakeLock() {
  useEffect(() => {
    let lock = null
    const ask = async () => {
      try {
        lock = await navigator.wakeLock?.request('screen')
      } catch {
        /* sin soporte o denegado */
      }
    }
    const onVisible = () => document.visibilityState === 'visible' && ask()
    ask()
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      document.removeEventListener('visibilitychange', onVisible)
      lock?.release()
    }
  }, [])
}
