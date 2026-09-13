import assert from 'node:assert/strict'
import { CODE_LENGTH, cleanCode, connect, nextWait } from './room.js'

// La gente teclea el codigo como le sale: minusculas, espacios, guiones.
assert.equal(cleanCode('abcd'), 'ABCD', 'lo pone en mayusculas')
assert.equal(cleanCode(' a b-c d '), 'ABCD', 'se come espacios y guiones')
assert.equal(cleanCode('ABCDEFG'), 'ABCD', `se queda en ${CODE_LENGTH}`)
assert.equal(cleanCode('ñ€!'), '', 'tira lo que no vale')
assert.equal(cleanCode(null), '', 'y aguanta que no venga nada')
assert.equal(cleanCode(undefined), '', 'tampoco revienta sin valor')

// Reintentos: cada vez mas espaciados, pero con techo.
let wait = 500
const waits = []
for (let i = 0; i < 12; i++) {
  waits.push(wait)
  wait = nextWait(wait, 0.5)
}
assert.ok(waits.every((w, i) => i === 0 || w > waits[i - 1] || w === 10000), 'va espaciando')
assert.equal(Math.max(...waits), 10000, 'sin pasar de diez segundos')
assert.equal(nextWait(10000, 0.5), 10000, 'y ahi se queda')

// Con jitter: dos moviles que caen a la vez no vuelven en el mismo instante.
assert.notEqual(nextWait(1000, 0), nextWait(1000, 1), 'el reintento se reparte')
assert.ok(nextWait(1000, 0) >= 1000 && nextWait(1000, 1) <= 2600, 'pero sin irse de madre')

// --- la conexion: latido y reconexion, con socket y reloj de mentira ---------
function reloj() {
  let ahora = 0
  let id = 0
  const cola = new Map()
  return {
    set: (fn, ms) => (cola.set(++id, { at: ahora + ms, fn }), id),
    clear: (i) => cola.delete(i),
    pasa(ms) {
      const fin = ahora + ms
      for (;;) {
        const [i, t] = [...cola].filter(([, t]) => t.at <= fin).sort((a, b) => a[1].at - b[1].at)[0] ?? []
        if (!t) break
        cola.delete(i)
        ahora = t.at
        t.fn()
      }
      ahora = fin
    },
  }
}

class FakeWS {
  static OPEN = 1
  static todos = []
  constructor() {
    this.readyState = 0
    this.enviado = []
    this.contesta = true // un servidor vivo responde al ping
    FakeWS.todos.push(this)
  }
  send(texto) {
    this.enviado.push(texto)
    if (texto === 'ping' && this.contesta) this.onmessage?.({ data: 'pong' })
  }
  close() {
    this.readyState = 3
    this.cerrado = true
  }
  abre() {
    this.readyState = 1
    this.onopen?.()
  }
  cae() {
    this.readyState = 3
    this.onclose?.()
  }
}

const probar = () => {
  FakeWS.todos = []
  const r = reloj()
  const estados = []
  const recibido = []
  const c = connect('ws://x', { onMessage: (m) => recibido.push(m), onStatus: (s) => estados.push(s) }, FakeWS, r)
  const ultimo = () => FakeWS.todos.at(-1)
  ultimo().abre()
  return { r, c, estados, recibido, ultimo }
}

{
  const { r, recibido, ultimo, estados } = probar()
  ultimo().onmessage({ data: '{"type":"sync"}' })
  assert.deepEqual(recibido, [{ type: 'sync' }], 'los mensajes llegan')
  r.pasa(10 * 60_000)
  assert.equal(FakeWS.todos.length, 1, 'con el servidor contestando, diez minutos con la misma conexion')
  assert.ok(ultimo().enviado.includes('ping'), 'mandando latidos')
  assert.equal(estados.at(-1), 'online')
}

{
  // Lo de la mesa: la conexion muere sin que llegue el cierre.
  const { r, ultimo, estados } = probar()
  const zombi = ultimo()
  zombi.contesta = false
  r.pasa(60_000)
  assert.equal(FakeWS.todos.length, 2, 'sin respuesta al latido abre otra conexion')
  assert.ok(zombi.cerrado, 'y suelta la muerta')
  assert.equal(estados.at(-1), 'connecting')
  ultimo().abre()
  zombi.onmessage?.({ data: '{"type":"sync"}' })
  assert.equal(estados.at(-1), 'online', 'la muerta ya no puede tocar nada')
}

{
  // Al volver a la pantalla se pregunta al momento, sin esperar al latido.
  const { r, c, ultimo } = probar()
  c.probe()
  r.pasa(5000)
  assert.equal(FakeWS.todos.length, 1, 'si contesta, se queda con la que tiene')
  ultimo().contesta = false
  c.probe()
  r.pasa(5000)
  assert.equal(FakeWS.todos.length, 2, 'si no contesta en unos segundos, reconecta')
}

{
  // Un cierre normal: reintenta espaciando.
  const { r, ultimo, estados } = probar()
  ultimo().cae()
  assert.equal(estados.at(-1), 'offline')
  r.pasa(1000)
  assert.equal(FakeWS.todos.length, 2, 'reintenta solo')
  ultimo().cae()
  r.pasa(60_000)
  assert.ok(FakeWS.todos.length > 2, 'y sigue reintentando')
}

{
  const { r, c } = probar()
  c.close()
  r.pasa(10 * 60_000)
  assert.equal(FakeWS.todos.length, 1, 'al salir de la sala no vuelve a conectar')
}

console.log('sala ok')
