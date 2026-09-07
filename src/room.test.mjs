import assert from 'node:assert/strict'
import { CODE_LENGTH, cleanCode, nextWait } from './room.js'

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
  wait = nextWait(wait)
}
assert.ok(waits.every((w, i) => i === 0 || w > waits[i - 1] || w === 10000), 'va espaciando')
assert.equal(Math.max(...waits), 10000, 'sin pasar de diez segundos')
assert.equal(nextWait(10000), 10000, 'y ahi se queda')

console.log('sala ok')
