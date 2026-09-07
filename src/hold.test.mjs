import assert from 'node:assert/strict'
import { REAL_TIMERS, holdMachine } from './hold.js'

// En el navegador setTimeout y clearTimeout son metodos de window: colgados tal
// cual de otro objeto se llaman con ese objeto como `this` y revientan con
// "Illegal invocation". Tienen que ir envueltos. (En node no falla, de ahi el
// aviso explicito aqui.)
assert.notEqual(REAL_TIMERS.set, setTimeout, 'setTimeout va envuelto, no crudo')
assert.notEqual(REAL_TIMERS.clear, clearTimeout, 'clearTimeout va envuelto, no crudo')
REAL_TIMERS.clear(REAL_TIMERS.set(() => {}, 0))

// Reloj de mentira: nada de esperas reales en el test.
function clock() {
  let now = 0
  let id = 0
  const jobs = new Map()
  return {
    timers: {
      set: (fn, ms) => {
        const key = ++id
        jobs.set(key, { fn, at: now + ms })
        return key
      },
      clear: (key) => jobs.delete(key),
    },
    advance(ms) {
      const end = now + ms
      for (;;) {
        const due = [...jobs.entries()].sort((a, b) => a[1].at - b[1].at)[0]
        if (!due || due[1].at > end) break
        now = due[1].at
        jobs.delete(due[0])
        due[1].fn()
      }
      now = end
    },
  }
}

// Un toque suelta un paso, ni mas ni menos.
{
  let steps = 0
  const c = clock()
  const hold = holdMachine(() => steps++, c.timers)
  hold.press()
  c.advance(80)
  hold.click()
  c.advance(3000)
  assert.equal(steps, 1, 'un toque, un paso')
}

// Mantener pulsado repite y acelera.
{
  let steps = 0
  const c = clock()
  const hold = holdMachine(() => steps++, c.timers)
  hold.press()
  c.advance(400)
  assert.equal(steps, 0, 'no arranca antes de tiempo')
  c.advance(100)
  assert.equal(steps, 1, 'arranca a los 450 ms')

  c.advance(1000)
  const alSegundo = steps
  assert.ok(alSegundo > 3, `repite mientras se aguanta (${alSegundo})`)

  hold.stop()
  hold.click() // el click de soltar no cuenta: ya venia repitiendo
  c.advance(3000)
  assert.equal(steps, alSegundo, 'al soltar no suma uno de mas ni sigue corriendo')
}

// Y el toque siguiente vuelve a contar.
{
  let steps = 0
  const c = clock()
  const hold = holdMachine(() => steps++, c.timers)
  hold.press()
  c.advance(2000)
  hold.stop()
  hold.click()
  const tras = steps

  hold.press()
  c.advance(50)
  hold.click()
  assert.equal(steps, tras + 1, 'el toque de despues sigue sumando')
}

// Al llegar al tope se para sola.
{
  let steps = 0
  const c = clock()
  const hold = holdMachine(() => (steps++ < 3 ? undefined : false), c.timers)
  hold.press()
  c.advance(5000)
  assert.equal(steps, 4, 'para en cuanto la estadistica no puede subir mas')
  c.advance(5000)
  assert.equal(steps, 4, 'y no queda ningun temporizador suelto')
}

console.log('hold ok')
