// Prueba de la sala de verdad, contra el Worker corriendo en local:
//   npm run dev:sala
//   npm run test:sala
import assert from 'node:assert/strict'

const URL_BASE = process.env.ROOM_URL ?? 'http://127.0.0.1:8787'

const partida = {
  started: true,
  goal: 10,
  players: [
    { id: 'a', name: 'Rubén', sex: 'm', color: '#e5484d', level: 1, gear: 0, bad: 0 },
    { id: 'b', name: 'Marta', sex: 'f', color: '#3e63dd', level: 4, gear: 2, bad: 0 },
  ],
}

const conectar = (code) =>
  new Promise((listo, falla) => {
    const ws = new WebSocket(`${URL_BASE.replace(/^http/, 'ws')}/room/${code}/ws`)
    ws.buzon = []
    ws.espera = null
    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data)
      if (ws.espera) {
        const suelta = ws.espera
        ws.espera = null
        suelta(msg)
      } else ws.buzon.push(msg)
    }
    ws.onopen = () => listo(ws)
    ws.onerror = falla
  })

const siguiente = (ws) =>
  ws.buzon.length
    ? Promise.resolve(ws.buzon.shift())
    : new Promise((listo, falla) => {
        ws.espera = listo
        setTimeout(() => falla(new Error('el servidor no contesto')), 4000)
      })

const manda = (ws, action, extra = {}) =>
  ws.send(JSON.stringify({ type: 'action', action, ...extra }))

// Los avisos de acciones anteriores pueden llegar tarde, asi que se espera a que
// se cumpla la condicion en vez de fiarse del primer mensaje que entre.
async function esperar(ws, cumple, que, intentos = 8) {
  for (let i = 0; i < intentos; i++) {
    const msg = await siguiente(ws)
    if (cumple(msg)) return msg
  }
  throw new Error(`no llego: ${que}`)
}

// --- crear una sala ----------------------------------------------------------
const creada = await fetch(`${URL_BASE}/room`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify(partida),
})
assert.ok(creada.ok, 'la sala se crea')
const { code } = await creada.json()
assert.match(code, /^[A-Z0-9]{4}$/, `codigo de cuatro: ${code}`)

// Una partida con la forma cambiada no se acepta.
const mala = await fetch(`${URL_BASE}/room`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ players: 'no' }),
})
assert.equal(mala.status, 400, 'una partida no valida se rechaza al crear')

// --- entran la mesa y un movil ----------------------------------------------
const mesa = await conectar(code)
assert.deepEqual((await siguiente(mesa)).state, partida, 'al entrar te dan la partida entera')

const movil = await conectar(code)
assert.deepEqual((await siguiente(movil)).state, partida, 'y al siguiente tambien')
await siguiente(mesa) // la mesa se entera de que ha entrado alguien

// --- un cambio en el movil llega a la mesa -----------------------------------
manda(movil, { type: 'bump', id: 'a', field: 'level', delta: 1 }, { by: 'movil', n: 7 })

for (const [quien, ws] of [['la mesa', mesa], ['el movil', movil]]) {
  const msg = await siguiente(ws)
  assert.equal(msg.type, 'sync', `${quien} recibe la partida`)
  assert.equal(msg.state.players[0].level, 2, `${quien} ve el nivel subido`)
  assert.equal(msg.by, 'movil', 'vuelve quien la mando')
  assert.equal(msg.n, 7, 'y con que numero, para poder soltarla de la cola')
}

// --- dos a la vez sobre el mismo jugador suman dos, no se pisan --------------
const subir = { type: 'bump', id: 'b', field: 'gear', delta: 1 }
manda(mesa, subir)
manda(movil, subir)

let equipo = 0
for (let i = 0; i < 4; i++) {
  const { state } = await siguiente(i % 2 ? movil : mesa)
  equipo = Math.max(equipo, state.players[1].gear)
}
assert.equal(equipo, 4, 'dos incrementos a la vez suman dos (2 + 1 + 1)')

// --- un incremento agrupado equivale a repetirlo -----------------------------
manda(mesa, { type: 'bump', id: 'b', field: 'gear', delta: 5 })
await siguiente(mesa)
const { state: agrupado } = await siguiente(movil)
assert.equal(agrupado.players[1].gear, 9, 'mandar +5 de una vez es como mandar cinco +1')

// --- acciones con mala idea no dejan la sala inservible ----------------------
const veneno = [
  { type: 'set', id: 'a', field: 'level', value: {} },
  { type: 'set', id: 'a', field: 'admin', value: true },
  { type: 'set', id: 'a', field: 'id', value: 'secuestrado' },
  { type: 'bump', id: 'a', field: 'level', delta: 'x' },
  { type: 'add', player: {} },
  { type: 'ruido' },
]
for (const action of veneno) manda(mesa, action)
mesa.send('esto no es json')
mesa.send(JSON.stringify({ type: 'action', action: { type: 'set', id: 'a', field: 'name', value: 'x'.repeat(9000) } }))

// La sala sigue viva y respondiendo, que es lo que importa.
manda(mesa, { type: 'bump', id: 'a', field: 'gear', delta: 1 })
let sano = null
for (let i = 0; i < 12 && !sano; i++) {
  const msg = await siguiente(mesa)
  if (msg.state?.players?.[0]?.gear === 1) sano = msg.state
}
assert.ok(sano, 'la sala sigue aceptando cambios despues del veneno')
assert.equal(sano.players[0].id, 'a', 'nadie ha cambiado el id de un jugador')
assert.ok(Number.isFinite(sano.players[0].level), 'ni ha metido un NaN en el nivel')
assert.ok(sano.players[0].name.length <= 14, 'ni un nombre de nueve mil letras')

// Los buzones arrastran los avisos de todo lo anterior: se vacian para poder
// medir lo siguiente sin contar cola vieja.
const vaciar = () => {
  mesa.buzon.length = 0
  movil.buzon.length = 0
}

// --- quien lleva cada personaje ---------------------------------------------
vaciar()
movil.send(JSON.stringify({ type: 'claim', role: 'a' }))
let presencia = null
for (let i = 0; i < 6 && !presencia; i++) {
  const msg = await siguiente(mesa)
  if (msg.taken?.length) presencia = msg
}
assert.deepEqual(presencia.taken, ['a'], 'la mesa sabe que personaje esta cogido')
assert.equal(presencia.devices, 2, 'y cuantos aparatos hay dentro')

// --- una sala que no existe lo dice ------------------------------------------
const fantasma = await conectar('ZZZZ')
assert.equal((await siguiente(fantasma)).type, 'missing', 'avisa de que esa sala no existe')

// --- y al reconectar te ponen al dia -----------------------------------------
mesa.close()
const vuelve = await conectar(code)
const { state } = await siguiente(vuelve)
assert.equal(state.players[0].gear, 1, 'quien vuelve recibe el estado bueno')
assert.equal(state.players[1].gear, 9, 'con todo lo que se perdio')

// --- escribir un numero manda el valor, no un incremento --------------------
vaciar()
manda(vuelve, { type: 'put', id: 'b', field: 'gear', value: 7 })
const puesto = await esperar(movil, (m) => m.state?.players?.[1]?.gear === 7, 'el valor escrito a mano')
assert.equal(puesto.state.players[1].gear, 7, 'queda 7, no 7 sumado a lo que hubiera')

// --- a cuanto se juega: solo antes de empezar o al reiniciar ----------------
// A media partida la accion se ignora, aunque llegue desde otro aparato.
vaciar()
manda(vuelve, { type: 'goal', value: 20 })
assert.equal((await siguiente(movil)).state.goal, 10, 'a media partida el objetivo no se cambia')

// Al reiniciar la mesa vuelve a estar en juego.
vaciar()
manda(vuelve, { type: 'reset' })
await esperar(movil, (m) => m.state?.players?.[0]?.level === 1, 'el reinicio llega')

vaciar()
manda(vuelve, { type: 'goal', value: 20 })
await esperar(movil, (m) => m.state?.goal === 20, 'tras reiniciar se puede volver a decidir')

// Y con el objetivo en 20 ya se pasa de 10.
vaciar()
manda(vuelve, { type: 'bump', id: 'a', field: 'level', delta: 15 })
const pasa10 = await esperar(movil, (m) => m.state?.players?.[0]?.level > 10, 'con objetivo 20 se pasa de 10')
assert.equal(pasa10.state.players[0].level, 16, 'y llega exactamente a 16')

for (const ws of [movil, fantasma, vuelve]) ws.close()
console.log('sala en vivo ok')
