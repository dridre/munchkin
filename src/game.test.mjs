import assert from 'node:assert/strict'
import {
  EMPTY,
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
