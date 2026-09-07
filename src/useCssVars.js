import { useLayoutEffect, useRef } from 'react'

// Unico puente entre datos y CSS: la geometria del treemap se calcula en JS y
// llega al DOM como custom properties. Todas las reglas siguen en los .scss.
export function useCssVars(vars) {
  const ref = useRef(null)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    for (const [key, value] of Object.entries(vars)) el.style.setProperty(key, value)
  })
  return ref
}
