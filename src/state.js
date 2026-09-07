import { useCallback, useEffect, useState } from 'react'
import { EMPTY, reduce } from './game.js'
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

export function useGame() {
  const [state, setState] = useState(() => {
    const raw = read(KEY)
    try {
      return raw ? { ...EMPTY, ...JSON.parse(raw) } : EMPTY
    } catch {
      return EMPTY
    }
  })

  const [code, setCode] = useState(initialCode)
  const [error, setError] = useState(null)

  useEffect(() => {
    write(KEY, JSON.stringify(state))
  }, [state])

  const onMessage = useCallback((message) => {
    // El servidor manda la partida entera despues de cada cambio: es la version
    // buena y corrige cualquier desajuste sin tener que pensar en el orden.
    if (message.type === 'sync') setState(message.state)
    if (message.type === 'missing') {
      setCode(null)
      write(ROOM_KEY, null)
      setError('Esa sala ya no existe.')
    }
  }, [])

  const { status, send } = useRoom(code, onMessage)

  // El unico sitio por el que se cambia la partida. Se aplica aqui al momento
  // para que el boton responda, y ademas sale hacia la sala.
  const dispatch = useCallback(
    (action) => {
      setState((s) => reduce(s, action))
      send({ type: 'action', action })
    },
    [send],
  )

  const enter = useCallback((next) => {
    setError(null)
    setCode(next)
    write(ROOM_KEY, next)
  }, [])

  const room = {
    code,
    status,
    error,
    available: hasRooms,
    dismiss: () => setError(null),
    create: async () => {
      setError(null)
      try {
        enter(await createRoom(state))
      } catch {
        setError('No se pudo crear la sala. ¿Hay internet?')
      }
    },
    join: (raw) => {
      const clean = cleanCode(raw)
      if (clean.length === 4) enter(clean)
      else setError('El código son cuatro letras.')
    },
    leave: () => enter(null),
  }

  return [state, dispatch, room]
}

// Quien es este aparato: la mesa, o el jugador que ha reclamado. Es del aparato,
// no de la partida, asi que se guarda aparte y no viaja a la sala.
export function useRole() {
  const [role, setRole] = useState(() => read(ROLE_KEY))

  const choose = useCallback((next) => {
    setRole(next)
    write(ROLE_KEY, next)
  }, [])

  return [role, choose]
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
