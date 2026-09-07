const FIRST = 450 // lo que tarda en arrancar la repeticion
const FASTEST = 60
const SPEEDUP = 0.72

// Mantener pulsado repite la accion, acelerando. `step` devuelve false cuando ya
// no se puede seguir (tope de la estadistica) y entonces la repeticion para sola.
// Sin React dentro para poder probarlo con un reloj de mentira.

// Envueltos a proposito: en el navegador setTimeout y clearTimeout son metodos
// de window y, colgados de otro objeto, se llaman con ese objeto como `this` y
// revientan con "Illegal invocation". No poner `{ set: setTimeout }` a secas.
export const REAL_TIMERS = {
  set: (fn, ms) => setTimeout(fn, ms),
  clear: (id) => clearTimeout(id),
}

export function holdMachine(step, timers = REAL_TIMERS) {
  let timer = null
  let repeated = false

  const stop = () => {
    timers.clear(timer)
    timer = null
  }

  const press = () => {
    repeated = false
    let delay = FIRST
    const tick = () => {
      if (step() === false) return stop()
      repeated = true
      delay = Math.max(FASTEST, delay * SPEEDUP)
      timer = timers.set(tick, delay)
    }
    timer = timers.set(tick, delay)
  }

  // El click cierra la pulsacion corta y hace que el teclado siga valiendo, pero
  // no cuenta si ya se ha repetido: si no, al soltar sumaria uno de mas.
  const click = () => {
    stop()
    if (repeated) {
      repeated = false
      return
    }
    step()
  }

  return { press, stop, click }
}
