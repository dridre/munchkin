// Reglas de la partida, sin nada del navegador ni de React: este mismo archivo
// lo ejecutan el movil, la mesa y el servidor de la sala, y tienen que sacar
// exactamente el mismo resultado.

export const DEFAULT_COLORS = [
  '#e5484d', '#f76b15', '#ffb224', '#46a758',
  '#12a594', '#3e63dd', '#8e4ec6', '#e93d82',
]
export const MAX_LEVEL = 10
export const MAX_GEAR = 99
export const MAX_BAD = 99
export const EMPTY = { players: [], started: false }

export const clamp = (n, min, max) => Math.min(max, Math.max(min, n))

const LIMITS = {
  level: [1, MAX_LEVEL],
  gear: [0, MAX_GEAR],
  bad: [0, MAX_BAD],
}

export function newPlayer(players) {
  const free = DEFAULT_COLORS.find((c) => !players.some((p) => p.color === c))
  return {
    id: crypto.randomUUID(),
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
    case 'add':
      return { ...state, players: [...state.players, action.player] }

    case 'remove':
      return { ...state, players: state.players.filter((p) => p.id !== action.id) }

    case 'set':
      return mapPlayer(state, action.id, (p) => ({ ...p, [action.field]: action.value }))

    case 'bump': {
      const [min, max] = LIMITS[action.field] ?? []
      if (min === undefined) return state
      return mapPlayer(state, action.id, (p) => ({
        ...p,
        [action.field]: clamp(p[action.field] + action.delta, min, max),
      }))
    }

    case 'start':
      return {
        ...state,
        started: true,
        players: state.players.map((p, i) => ({ ...p, name: p.name.trim() || `Jugador ${i + 1}` })),
      }

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
