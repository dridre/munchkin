// Prueba de la sala de verdad, contra el Worker corriendo en local:
//   npx wrangler dev --port 8787
//   npm run test:sala
import assert from 'node:assert/strict'

const URL_BASE = process.env.ROOM_URL ?? 'http://127.0.0.1:8787'

const partida = {
  started: true,
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

// --- crear una sala ----------------------------------------------------------
const creada = await fetch(`${URL_BASE}/room`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify(partida),
})
assert.ok(creada.ok, 'la sala se crea')
const { code } = await creada.json()
assert.match(code, /^[A-Z0-9]{4}$/, `codigo de cuatro: ${code}`)

// --- entran la mesa y un movil ----------------------------------------------
const mesa = await conectar(code)
assert.deepEqual((await siguiente(mesa)).state, partida, 'al entrar te dan la partida entera')

const movil = await conectar(code)
assert.deepEqual((await siguiente(movil)).state, partida, 'y al siguiente tambien')

// --- un cambio en el movil llega a la mesa -----------------------------------
movil.send(JSON.stringify({ type: 'action', action: { type: 'bump', id: 'a', field: 'level', delta: 1 } }))

for (const [quien, ws] of [['la mesa', mesa], ['el movil', movil]]) {
  const { type, state } = await siguiente(ws)
  assert.equal(type, 'sync', `${quien} recibe la partida`)
  assert.equal(state.players[0].level, 2, `${quien} ve el nivel subido`)
}

// --- dos a la vez sobre el mismo jugador suman dos, no se pisan --------------
const subir = JSON.stringify({ type: 'action', action: { type: 'bump', id: 'b', field: 'gear', delta: 1 } })
mesa.send(subir)
movil.send(subir)

let equipo = 0
for (let i = 0; i < 4; i++) {
  const { state } = await siguiente(i % 2 ? movil : mesa)
  equipo = Math.max(equipo, state.players[1].gear)
}
assert.equal(equipo, 4, 'dos incrementos a la vez suman dos (2 + 1 + 1)')

// --- una sala que no existe lo dice ------------------------------------------
const fantasma = await conectar('ZZZZ')
assert.equal((await siguiente(fantasma)).type, 'missing', 'avisa de que esa sala no existe')

// --- y al reconectar te ponen al dia -----------------------------------------
mesa.close()
const vuelve = await conectar(code)
const { state } = await siguiente(vuelve)
assert.equal(state.players[0].level, 2, 'quien vuelve recibe el estado bueno')
assert.equal(state.players[1].gear, 4, 'con todo lo que se perdio')

for (const ws of [movil, fantasma, vuelve]) ws.close()
console.log('sala en vivo ok')
