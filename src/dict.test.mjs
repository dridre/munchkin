import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { LANGS, detect, translate } from './dict.js'

// El castellano es la referencia: si a otro idioma le falta una clave, en esa
// pantalla sale texto en ingles o la propia clave, y eso no se nota hasta que
// alguien lo usa.
const fuente = readFileSync(new URL('./dict.js', import.meta.url), 'utf8')

// Las claves de un idioma, leidas del archivo: el diccionario no se exporta
// entero a proposito.
function keysOf(lang) {
  const bloque = fuente.slice(fuente.indexOf(`  ${lang}: {`))
  return [...bloque.slice(0, bloque.indexOf('\n  },')).matchAll(/'([\w.]+)':/g)].map((m) => m[1])
}

const claves = keysOf('es')
assert.ok(claves.length > 40, `el diccionario base tiene contenido (${claves.length} claves)`)

for (const { code, name } of LANGS) {
  assert.ok(name, `${code} tiene nombre para el selector`)
  const suyas = new Set(keysOf(code))
  const faltan = claves.filter((k) => !suyas.has(k))
  assert.deepEqual(faltan, [], `${code} no se deja claves sin traducir`)

  for (const clave of claves) {
    const texto = translate(code, clave)
    assert.notEqual(texto, clave, `${code}/${clave} tiene texto, no la clave pelada`)
    assert.ok(texto.trim().length > 0, `${code}/${clave} no esta vacia`)
  }
}

// Los huecos se rellenan y los que no vienen se dejan a la vista.
assert.equal(translate('es', 'setup.player', { n: 3 }), 'Jugador 3')
assert.equal(translate('en', 'setup.player', { n: 3 }), 'Player 3')
assert.equal(translate('es', 'setup.player'), 'Jugador {n}')

// Deteccion del idioma del navegador.
assert.equal(detect(['pt-BR', 'en']), 'pt', 'coge el pais y se queda con el idioma')
assert.equal(detect(['ES-es']), 'es', 'sin importar mayusculas')
assert.equal(detect(['ja', 'ko']), 'en', 'y si no lo tenemos, ingles')
assert.equal(detect([]), 'en', 'igual que sin preferencias')

// Que ninguna pantalla se quede con castellano incrustado.
const sueltas = []
for (const file of readdirSync(new URL('./components/', import.meta.url))) {
  if (!file.endsWith('.jsx')) continue
  const code = readFileSync(new URL(`./components/${file}`, import.meta.url), 'utf8')
  for (const m of code.matchAll(/(aria-label|title|label)="([^"]{4,})"/g)) {
    sueltas.push(`${file}: ${m[0]}`)
  }
}
assert.deepEqual(sueltas, [], 'ninguna etiqueta con texto fijo sin traducir')

console.log('idiomas ok')
