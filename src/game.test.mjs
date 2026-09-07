import assert from 'node:assert/strict'
import {
  EMPTY,
  MAX_PLAYERS,
  saneState,
  INK_DARK,
  INK_LIGHT,
  MAX_LEVEL,
  force,
  inkFor,
  newPlayer,
  reduce,
  weight,
} from './game.js'

assert.equal(force({ level: 5, gear: 4, bad: 2 }), 7, 'las desventajas restan')
assert.equal(force({ level: 1, gear: 0, bad: 3 }), -2, 'la fuerza puede quedar negativa')

const hundido = { level: 1, gear: 0, bad: 15 }
assert.ok(weight(hundido) < weight({ level: 1, gear: 0, bad: 0 }), 'en negativo ocupas menos que con 1')
assert.ok(weight(hundido) > 0, 'pero sigues en el tablero')
assert.equal(weight({ level: 4, gear: 2, bad: 1 }), 5, 'en positivo, el terreno es la fuerza')

for (const [color, ink] of [
  ['#ffb224', INK_DARK],
  ['#f76b15', INK_DARK],
  ['#e5484d', INK_DARK],
  ['#3e63dd', INK_LIGHT],
  ['#000000', INK_LIGHT],
  ['#ffffff', INK_DARK],
]) {
  assert.equal(inkFor(color), ink, `tinta legible sobre ${color}`)
}

console.log('state ok')

// --- acciones: lo que luego viajara por la sala -------------------------------

const start = () => {
  let s = reduce(EMPTY, { type: 'add', player: newPlayer([]) })
  s = reduce(s, { type: 'add', player: newPlayer(s.players) })
  return [s, s.players[0].id, s.players[1].id]
}

{
  const [s, uno, dos] = start()
  assert.equal(s.players.length, 2, 'se añaden jugadores')
  assert.notEqual(s.players[0].color, s.players[1].color, 'cada uno con su color')

  // Lo importante de mandar incrementos: dos que suban a la vez suman dos.
  const subido = [
    { type: 'bump', id: uno, field: 'level', delta: 1 },
    { type: 'bump', id: uno, field: 'level', delta: 1 },
  ].reduce(reduce, s)
  assert.equal(subido.players[0].level, 3, 'dos incrementos suman dos')
  assert.equal(subido.players[1].level, 1, 'y no tocan al vecino')
}

{
  const [s, uno] = start()
  const tope = Array.from({ length: 40 }, () => ({
    type: 'bump', id: uno, field: 'level', delta: 1,
  })).reduce(reduce, s)
  assert.equal(tope.players[0].level, MAX_LEVEL, 'el nivel no se pasa del tope')

  const suelo = reduce(s, { type: 'bump', id: uno, field: 'gear', delta: -5 })
  assert.equal(suelo.players[0].gear, 0, 'ni baja de cero')

  const raro = reduce(s, { type: 'bump', id: uno, field: 'inventado', delta: 1 })
  assert.equal(raro, s, 'una accion que no entiende no cambia nada')
  assert.equal(reduce(s, { type: 'ruido' }), s, 'ni una accion desconocida')
}

{
  const [s, uno, dos] = start()
  const puesto = reduce(s, { type: 'set', id: dos, field: 'sex', value: 'f' })
  assert.equal(puesto.players[1].sex, 'f', 'set cambia el campo')
  assert.equal(puesto.players[0].sex, 'm', 'solo al jugador indicado')

  const fuera = reduce(s, { type: 'remove', id: uno })
  assert.deepEqual(fuera.players.map((p) => p.id), [dos], 'se puede echar a alguien')
}

{
  const [s, uno] = start()
  const jugando = [
    { type: 'start' },
    { type: 'bump', id: uno, field: 'level', delta: 4 },
    { type: 'bump', id: uno, field: 'gear', delta: 3 },
    { type: 'bump', id: uno, field: 'bad', delta: 2 },
  ].reduce(reduce, s)

  assert.ok(jugando.started, 'empieza la partida')
  assert.equal(jugando.players[0].name, 'Jugador 1', 'quien no puso nombre, se le pone')
  assert.equal(force(jugando.players[0]), 6, 'nivel 5 + equipo 3 - desventajas 2')

  const cero = reduce(jugando, { type: 'reset' })
  assert.deepEqual(
    cero.players.map((p) => [p.level, p.gear, p.bad]),
    [[1, 0, 0], [1, 0, 0]],
    'reiniciar deja los contadores a cero',
  )
  assert.equal(cero.players[0].name, 'Jugador 1', 'y mantiene a los jugadores')
  assert.ok(cero.started, 'sin echar a nadie de la partida')
}

console.log('acciones ok')

// --- entrada hostil ----------------------------------------------------------
// El servidor ejecuta este mismo `reduce` con lo que mande cualquier aparato de
// la sala. Nada de lo que llegue puede dejar la partida en un estado imposible:
// un solo NaN se propaga a `force` y deja el tablero en blanco para todos, y
// como el servidor lo guarda, no se arregla ni reconectando.
{
  const [base, uno] = start()
  const veneno = [
    { type: 'set', id: uno, field: 'level', value: {} },
    { type: 'set', id: uno, field: 'level', value: 999999 },
    { type: 'set', id: uno, field: 'admin', value: true },
    { type: 'set', id: uno, field: 'id', value: 'secuestrado' },
    { type: 'set', id: uno, field: 'name', value: 7 },
    { type: 'set', id: uno, field: 'color', value: 'javascript:alert(1)' },
    { type: 'set', id: uno, field: 'sex', value: 'x' },
    { type: 'bump', id: uno, field: 'level' },
    { type: 'bump', id: uno, field: 'level', delta: 'x' },
    { type: 'bump', id: uno, field: 'level', delta: 1.5 },
    { type: 'bump', id: uno, field: 'gear', delta: Infinity },
    { type: 'add', player: {} },
    { type: 'add', player: null },
    { type: 'add' },
    { type: 'ruido' },
    {},
  ]

  const despues = veneno.reduce((s, action) => {
    const next = reduce(s, action)
    assert.ok(Array.isArray(next.players), `sigue habiendo jugadores tras ${JSON.stringify(action)}`)
    next.players.forEach((p) => {
      assert.ok(Number.isFinite(force(p)), `fuerza finita tras ${JSON.stringify(action)}`)
      assert.equal(typeof p.name, 'string', `el nombre sigue siendo texto`)
    })
    return next
  }, base)

  assert.equal(despues.players[0].id, uno, 'nadie puede cambiar el id de un jugador')
  assert.equal(despues.players[0].level, 1, 'ni saltarse el tope por la puerta de atras')
  assert.equal(despues.players[0].sex, 'm', 'el sexo solo puede ser m o f')
  assert.match(despues.players[0].color, /^#[0-9a-f]{6}$/i, 'el color siempre es un color')
  assert.doesNotThrow(() => reduce(despues, { type: 'start' }), 'empezar no revienta')
}

// Nadie mete mas jugadores de los que hay colores.
{
  let s = EMPTY
  for (let i = 0; i < MAX_PLAYERS + 5; i++) s = reduce(s, { type: 'add', player: newPlayer(s.players) })
  assert.equal(s.players.length, MAX_PLAYERS, `el tope de ${MAX_PLAYERS} tambien vale en el servidor`)
}

// Una partida guardada por una version vieja se cura, no envenena.
{
  const vieja = saneState({ started: true, players: [{ id: 'x', name: 'Ana', level: 3 }] })
  assert.equal(force(vieja.players[0]), 3, 'un jugador sin equipo ni desventajas no da NaN')
  assert.equal(saneState(null).players.length, 0, 'y un guardado ilegible no revienta')
  assert.equal(saneState({ players: 'no' }).players.length, 0, 'ni uno con la forma cambiada')
}

console.log('entrada hostil ok')
