import { useEffect, useRef } from 'react'
import { holdMachine } from './hold.js'

export function useHold(step) {
  const latest = useRef(step)
  latest.current = step

  const machine = useRef(null)
  if (!machine.current) machine.current = holdMachine(() => latest.current())

  useEffect(() => machine.current.stop, [])

  return {
    onPointerDown: machine.current.press,
    onPointerUp: machine.current.stop,
    onPointerLeave: machine.current.stop,
    onPointerCancel: machine.current.stop,
    onClick: machine.current.click,
    // Mantener pulsado en un movil saca el menu de "copiar/pegar" o el del
    // boton derecho en escritorio; con estos botones nunca interesa.
    onContextMenu: (e) => e.preventDefault(),
  }
}
