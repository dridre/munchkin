// Reglas de la partida, sin nada del navegador ni de React: este mismo archivo
// lo ejecutan el movil, la mesa y el servidor de la sala, y tienen que sacar
// exactamente el mismo resultado.

export const DEFAULT_COLORS = [
  '#e5484d', '#f76b15', '#ffb224', '#46a758',
  '#12a594', '#3e63dd', '#8e4ec6', '#e93d82',
]
// A cuanto se juega. El estandar son 10, pero hay grupos que juegan a 20 (y
// variantes que suben mas), asi que es de cada partida, no del programa.
export const GOAL_DEFAULT = 10
export const GOAL_MIN = 5
export const GOAL_MAX = 30
export const MAX_GEAR = 99
export const MAX_BAD = 99
export const MAX_PLAYERS = DEFAULT_COLORS.length
export const NAME_MAX = 14
export const EMPTY = { players: [], started: false, goal: GOAL_DEFAULT }

export const clamp = (n, min, max) => Math.min(max, Math.max(min, n))

const LIMITS = {
  gear: [0, MAX_GEAR],
  bad: [0, MAX_BAD],
}

// El tope del nivel sale de la partida en curso; el resto son fijos.
const limitsFor = (state, field) =>
  field === 'level' ? [1, goalOf(state)] : LIMITS[field]

const goalOf = (state) => whole(state?.goal, GOAL_DEFAULT, GOAL_MIN, GOAL_MAX)

// Nadie ha empezado a puntuar: partida nueva o recien reiniciada.
export const fresh = (state) =>
  (state?.players ?? []).every((p) => p.level === 1 && p.gear === 0 && p.bad === 0)

// Los unicos campos que se pueden escribir a mano, y como se limpia cada uno.
// Esto es la frontera de confianza de todo el sistema: el servidor ejecuta este
// mismo `reduce` con lo que le manda cualquier aparato conectado a la sala, asi
// que lo que no se valide aqui acaba guardado en la sala de todos.
const WRITABLE = {
  name: (v) => String(v ?? '').slice(0, NAME_MAX),
  sex: (v) => (v === 'f' ? 'f' : 'm'),
  color: (v) => (/^#[0-9a-f]{6}$/i.test(v) ? String(v) : DEFAULT_COLORS[0]),
}

const whole = (n, fallback, min, max) =>
  Number.isFinite(n) ? clamp(Math.trunc(n), min, max) : fallback

// Deja un jugador con todos sus campos y dentro de rango, venga de donde venga:
// de la red, de una partida guardada de una version vieja, o de un cliente con
// mala idea. Sin esto un solo campo raro se propaga a NaN y deja el tablero en
// blanco en todos los aparatos a la vez.
export function sanePlayer(raw, index = 0, goal = GOAL_MAX) {
  const p = raw && typeof raw === 'object' ? raw : {}
  return {
    id: typeof p.id === 'string' && p.id ? p.id : `jugador-${index}`,
    name: WRITABLE.name(p.name),
    sex: WRITABLE.sex(p.sex),
    color: WRITABLE.color(p.color),
    level: whole(p.level, 1, 1, goal),
    gear: whole(p.gear, 0, 0, MAX_GEAR),
    bad: whole(p.bad, 0, 0, MAX_BAD),
  }
}

export function saneState(raw) {
  const players = Array.isArray(raw?.players) ? raw.players : []
  const goal = goalOf(raw)
  return {
    started: Boolean(raw?.started),
    goal,
    players: players.slice(0, MAX_PLAYERS).map((p, i) => sanePlayer(p, i, goal)),
  }
}

// `crypto.randomUUID` no existe fuera de contexto seguro, y probar en el movil
// contra el portatil es siempre por http://192.168.x.x: sin esto, anadir jugador
// revienta justo cuando pruebas en el aparato que importa.
const newId = () =>
  globalThis.crypto?.randomUUID?.() ?? `p-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`

export function newPlayer(players) {
  const free = DEFAULT_COLORS.find((c) => !players.some((p) => p.color === c))
  return {
    id: newId(),
    name: '',
    sex: 'm',
    color: free ?? DEFAULT_COLORS[players.length % DEFAULT_COLORS.length],
    level: 1,
    gear: 0,
    bad: 0,
  }
}

const mapPlayer = (state, id, change) => ({
  ...state,
  players: state.players.map((p) => (p.id === id ? change(p) : p)),
})

// Todo cambio de la partida pasa por aqui. Es una funcion pura y sin sorpresas
// (el id de un jugador nuevo viene dado, no se inventa dentro) porque es lo que
// luego viajara por la sala y tendra que dar el mismo resultado en cada aparato.
//
// Los contadores se mueven con incrementos, nunca mandando el valor final: si el
// movil y la mesa suman a la vez, tienen que sumar dos, no pisarse.
export function reduce(state, action) {
  switch (action.type) {
    case 'add': {
      if (state.players.length >= MAX_PLAYERS) return state
      return {
        ...state,
        players: [...state.players, sanePlayer(action.player, state.players.length)],
      }
    }

    case 'remove':
      return { ...state, players: state.players.filter((p) => p.id !== action.id) }

    case 'set': {
      const clean = WRITABLE[action.field]
      if (!clean) return state
      return mapPlayer(state, action.id, (p) => ({ ...p, [action.field]: clean(action.value) }))
    }

    // Escribir un numero a mano es afirmar un valor, no sumar: si pones 18 de
    // equipo, quieres 18. Los botones -/+ siguen mandando incrementos, que es
    // donde importa que dos aparatos a la vez sumen en vez de pisarse.
    case 'put': {
      const [min, max] = limitsFor(state, action.field) ?? []
      if (min === undefined) return state
      if (!Number.isFinite(action.value)) return state
      return mapPlayer(state, action.id, (p) => ({
        ...p,
        [action.field]: clamp(Math.trunc(action.value), min, max),
      }))
    }

    case 'bump': {
      const [min, max] = limitsFor(state, action.field) ?? []
      if (min === undefined) return state
      // El delta viaja por la red y ademas se agrupa al mantener pulsado, asi
      // que puede ser cualquier entero, pero entero.
      if (!Number.isInteger(action.delta)) return state
      return mapPlayer(state, action.id, (p) => ({
        ...p,
        [action.field]: clamp(p[action.field] + action.delta, min, max),
      }))
    }

    case 'start':
      return {
        ...state,
        started: true,
        players: state.players.map((p, i) => ({
          ...p,
          name: String(p.name ?? '').trim() || `Jugador ${i + 1}`,
        })),
      }

    case 'goal': {
      // A cuanto se juega se decide antes de empezar (o al reiniciar la mesa):
      // cambiarlo con la partida en marcha solo serviria para discutir.
      if (!fresh(state)) return state
      const goal = whole(action.value, GOAL_DEFAULT, GOAL_MIN, GOAL_MAX)
      return {
        ...state,
        goal,
        players: state.players.map((p) => ({ ...p, level: Math.min(p.level, goal) })),
      }
    }

    // Borron y cuenta nueva, sin jugadores. Se queda el nivel objetivo, que es
    // como juega el grupo y no cambia de una partida a otra.
    case 'clear':
      return { ...EMPTY, goal: goalOf(state) }

    case 'edit':
      return { ...state, started: false }

    case 'reset':
      return { ...state, players: state.players.map((p) => ({ ...p, level: 1, gear: 0, bad: 0 })) }

    default:
      return state
  }
}

// Las desventajas restan: es lo que decide cuanto terreno ocupas.
export const force = (p) => p.level + p.gear - p.bad

// Con 0 o en negativo ocupas menos que quien va por 1, pero no desapareces.
export const weight = (p) => Math.max(0.35, force(p))

export const INK_DARK = '#0c1013'
export const INK_LIGHT = '#f4f8fa'

function luminance(hex) {
  const to = (i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * to(1) + 0.7152 * to(3) + 0.0722 * to(5)
}

// De las dos tintas, la que mas contraste da sobre el color elegido (WCAG).
export function inkFor(hex) {
  const on = luminance(hex)
  const ratio = (a, b) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)
  return ratio(on, luminance(INK_DARK)) >= ratio(on, luminance(INK_LIGHT)) ? INK_DARK : INK_LIGHT
}
