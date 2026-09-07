import assert from 'node:assert/strict'
import { layout } from './territory.js'

const area = (r) => r.w * r.h
// En pixeles, no en porcentaje: es lo que se ve.
const ratio = (r, aspect) => Math.max((r.w * aspect) / r.h, r.h / (r.w * aspect))
const overlap = (a, b) =>
  a.x < b.x + b.w - 1e-9 && b.x < a.x + a.w - 1e-9 &&
  a.y < b.y + b.h - 1e-9 && b.y < a.y + a.h - 1e-9

assert.deepEqual(layout([]), [])

for (const aspect of [16 / 9, 4 / 3, 3 / 4, 9 / 16]) {
for (const values of [
  [1],
  [3, 1],
  [13, 7, 3, 12, 1],
  [1, 1, 1, 1, 1],
  [1, 1, 1, 1, 1, 1, 1, 1],
  [40, 1, 1, 1, 1, 1, 1, 1],
  [24, 3, 1, 0.35, 1],
  [5, 0.35, 9],
]) {
  const rects = layout(values, aspect)
  const label = `${values} en ${aspect.toFixed(2)}`

  assert.equal(rects.length, values.length, `un bloque por jugador: ${label}`)
  assert.ok(
    Math.abs(rects.reduce((a, r) => a + area(r), 0) - 10000) < 1e-6,
    `cubre toda la pantalla: ${label}`,
  )

  rects.forEach((r, i) => {
    assert.ok(
      r.x >= -1e-9 && r.y >= -1e-9 && r.x + r.w <= 100 + 1e-9 && r.y + r.h <= 100 + 1e-9,
      `dentro de la pantalla: ${label} #${i}`,
    )
    // Nada de tiras: todo bloque tiene que poder leerse.
    assert.ok(
      ratio(r, aspect) <= 3.5,
      `bloque legible, no una tira: ${label} #${i} (${ratio(r, aspect).toFixed(1)})`,
    )
    assert.ok(area(r) / 10000 >= 0.02, `nadie desaparece: ${label} #${i}`)
  })

  for (let i = 0; i < rects.length; i++) {
    for (let j = i + 1; j < rects.length; j++) {
      assert.ok(!overlap(rects[i], rects[j]), `sin solapes: ${label} ${i}/${j}`)
    }
  }

  // Mas poder, mas sitio. Y con mas poder, ESTRICTAMENTE mas sitio: al que va
  // hundido no puede tocarle lo mismo que al que va por 1 o por 2.
  values.forEach((v, p) =>
    values.forEach((w, q) => {
      if (v > w) assert.ok(area(rects[p]) > area(rects[q]), `mas poder, mas sitio: ${label} ${p}>${q}`)
      if (v === w) {
        assert.ok(
          Math.abs(area(rects[p]) - area(rects[q])) < 1e-9,
          `mismo poder, mismo sitio: ${label} ${p}=${q}`,
        )
      }
    }),
  )

  assert.deepEqual(layout(values, aspect), rects, `estable: ${label}`)
}
}

// El caso que se veia mal: hundido en negativo contra los que van por 1 y por 2.
const spread = layout([0.35, 3, 2, 24, 1], 16 / 9)
assert.ok(area(spread[0]) < area(spread[4]), 'en negativo ocupas menos que con 1')
assert.ok(area(spread[4]) < area(spread[2]), 'y con 1 menos que con 2')
assert.ok(area(spread[3]) > area(spread[1]) * 3, 'el lider se sigue notando')

const before = layout([5, 5, 5], 16 / 9)
const after = layout([9, 5, 5], 16 / 9)
assert.ok(area(after[0]) > area(before[0]), 'quien sube, gana terreno')
assert.ok(area(after[1]) < area(before[1]), 'y se lo quita al vecino')

console.log('layout ok')
