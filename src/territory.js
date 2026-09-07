// Reparte la pantalla en bloques rectangulares con area proporcional al poder
// de cada jugador, tirando al cuadrado (algoritmo "squarified" de Bruls,
// Huizing & van Wijk): asi hasta el que va perdiendo tiene un bloque legible
// en vez de una tira. Necesita el formato real de la pantalla (ancho/alto), o
// cuadraria bloques que en pixeles salen alargados.
// Devuelve {x, y, w, h} en % y en el orden de entrada.

// Con un lider disparado, el resto se quedaba en tiras ilegibles. En vez de
// poner un suelo (que dejaba a los de abajo todos del mismo tamaño), se le suma
// un colchon a todo el mundo: comprime las diferencias pero las respeta, asi
// que -14 sigue ocupando menos que 1, y 1 menos que 2.
const CUSHION_SHARE = 1 / 3

function cushioned(values) {
  const cushion = (values.reduce((a, b) => a + b, 0) / values.length) * CUSHION_SHARE
  return values.map((v) => Math.max(0.01, v) + cushion)
}

// Peor relacion de aspecto de una fila apoyada en un lado de longitud `side`.
const worst = (first, last, sum, side) =>
  Math.max((side * side * first) / (sum * sum), (sum * sum) / (side * side * last))

export function layout(values, aspect = 1) {
  const out = new Array(values.length)
  if (!values.length) return out

  const side = Math.max(0.05, aspect) * 100
  const weights = cushioned(values)
  const total = weights.reduce((a, b) => a + b, 0)
  const items = weights
    .map((v, i) => ({ i, area: (v / total) * side * 100 }))
    .sort((a, b) => b.area - a.area || a.i - b.i)

  let x = 0
  let y = 0
  let w = side
  let h = 100
  let row = []
  let rowArea = 0

  const flush = () => {
    const thick = rowArea / Math.min(w, h)
    let cursor = w >= h ? y : x
    for (const it of row) {
      const len = it.area / thick
      const box =
        w >= h
          ? { x, y: cursor, w: thick, h: len }
          : { x: cursor, y, w: len, h: thick }
      out[it.i] = { ...box, x: (box.x / side) * 100, w: (box.w / side) * 100 }
      cursor += len
    }
    if (w >= h) {
      x += thick
      w -= thick
    } else {
      y += thick
      h -= thick
    }
    row = []
    rowArea = 0
  }

  for (const it of items) {
    const edge = Math.min(w, h)
    if (
      row.length &&
      worst(row[0].area, row[row.length - 1].area, rowArea, edge) <
        worst(row[0].area, it.area, rowArea + it.area, edge)
    ) {
      flush()
    }
    row.push(it)
    rowArea += it.area
  }
  if (row.length) flush()

  return out
}
