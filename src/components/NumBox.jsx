import { useEffect, useRef, useState } from 'react'
import { useT } from '../i18n.jsx'
import { clamp } from '../state.js'

// El numero se puede escribir a mano: subir el equipo de 0 a 18 a base de
// pulsaciones es absurdo. Siempre es un campo, para que baste con tocarlo.
//
// Lo que sale es un incremento, no el valor final: asi sigue valiendo la regla
// de la sala (si dos aparatos tocan a la vez, se suman en vez de pisarse).
export default function NumBox({ value, min, max, label, onSet, className }) {
  const { t } = useT()
  const [text, setText] = useState(String(value))
  const writing = useRef(false)

  useEffect(() => {
    if (!writing.current) setText(String(value))
  }, [value])

  const commit = () => {
    writing.current = false
    const n = Number.parseInt(text, 10)
    if (Number.isFinite(n)) onSet(clamp(n, min, max))
    else setText(String(value)) // vacio o ilegible: se queda como estaba
  }

  return (
    <input
      className={className}
      type="text"
      inputMode="numeric"
      value={text}
      aria-label={t('stat.type', { label })}
      onFocus={() => {
        // Se vacia al tocarlo: "seleccionar todo" no agarra siempre en un movil
        // y acababas tecleando un 5 sobre un 3 y quedandote un 35.
        writing.current = true
        setText('')
      }}
      onChange={(e) => {
        writing.current = true
        setText(e.target.value.replace(/[^\d-]/g, '').slice(0, 4))
      }}
      onBlur={commit}
      onKeyDown={(e) => e.key === 'Enter' && e.target.blur()}
    />
  )
}
