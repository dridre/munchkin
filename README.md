# Munchkin Contador de Niveles

Contador de niveles, equipo y desventajas para partidas de Munchkin. La pantalla
del centro de la mesa reparte el espacio según el poder de cada uno, y cada
jugador lleva su personaje desde su propio móvil.

**[Abrir la app →](https://munchkin-btb.pages.dev)** · v1.0.0 · sin cuentas, sin
anuncios y funciona sin internet.

![El tablero: cada jugador ocupa un bloque proporcional a su poder](docs/tablero.png)

## Cómo se usa

1. En la tablet o el portátil que va al centro de la mesa: apunta a quién juega,
   elige a qué nivel se gana y dale a *Empezar*.
2. *Sala → Crear sala*. Sale un código de cuatro letras y un QR.
3. Cada uno escanea el QR — se le abre la web ya dentro — o entra a mano con el
   código, y elige su personaje.

Hay dos papeles, y se eligen una vez por aparato:

- **Mesa** — la pantalla del centro. Meramente visual: ve a todos y puede tocar
  a todos, pero no juega.
- **Jugador** — su ficha a pantalla completa, con botones grandes, y el mapa de
  todos cuando quiere mirar cómo va la cosa. Los contadores ajenos no se tocan.

Lo demás no está bajo llave: **cualquiera puede añadir gente, borrarla o
reiniciar la partida** desde el menú. Se juega con amigos, y ponerle permisos
solo servía para que la partida se quedase bloqueada cuando nadie hacía de mesa.

La mesa no es obligatoria: en un solo aparato funciona todo igual, y sin
internet. La sala solo hace falta si queréis usar varios móviles.

## Lo que hace

- **El tablero enseña el poder de un vistazo.** El área de cada bloque es
  proporcional a nivel + equipo − desventajas, con bloques casi cuadrados para
  que hasta el que va perdiendo se lea desde el otro lado de la mesa.
- **Nivel objetivo configurable**: 10 el estándar, 20 para las variantes largas,
  o lo que juegue tu grupo. Se decide antes de empezar.
- **Mantener pulsado** en −/+ repite y acelera, para subir de 0 a 18 de equipo
  sin machacar el dedo.
- **Se instala como aplicación** (*Añadir a pantalla de inicio*) y ahí desaparece
  la barra del navegador. La partida se guarda en el aparato.
- **Seis idiomas**: español, inglés, francés, alemán, italiano y portugués. Coge
  el del navegador y se cambia a mano.

## Desarrollo

```
npm install
npm run dev      # la app, accesible también desde el móvil de la red local
npm test         # las comprobaciones
npm run build    # + service worker
npm run deploy   # construye y sube la web y el servidor de salas
```

### El servidor de salas

Sin configurar nada, la app funciona entera en un solo aparato. Para las salas
hace falta un Worker de Cloudflare con un Durable Object por partida:

```
npx wrangler login
npm run deploy:sala
```

Y apuntar la app al Worker en `.env`:

```
VITE_ROOM_URL=https://munchkin-salas.TU-SUBDOMINIO.workers.dev
```

Para probarlo en local:

```
npm run dev:sala     # el Worker en el puerto 8787
npm run test:sala    # crea una sala, conecta dos aparatos y comprueba el reparto
```

Las salas se borran solas al día de no tocarlas, y hay un tope de peticiones por
IP para que nadie agote la cuota de la cuenta creando salas en bucle.

## Cómo está montado

- `src/game.js` — las reglas de la partida. Sin React ni navegador: **este mismo
  archivo lo ejecutan el móvil, la mesa y el servidor**, y tienen que sacar el
  mismo resultado.
- `src/territory.js` — reparte la pantalla en bloques proporcionales al poder
  (treemap *squarified*, consciente del formato de la pantalla).
- `src/state.js` — los hooks: partida, papel del aparato y sala.
- `src/room.js` — conexión a la sala, con reintentos espaciados.
- `src/dict.js` — el diccionario de los seis idiomas.
- `worker/index.js` — el servidor: una sala = un Durable Object.

Tres decisiones sostienen el resto:

1. **Todo cambio es una acción, y los contadores se mueven con incrementos.** Si
   el móvil y la mesa suman a la vez, tienen que sumar dos, no pisarse.
2. **Después de cada acción el servidor manda la partida entera.** El aparato la
   aplica al momento para que el botón responda, y encima se reaplica lo que aún
   está sin confirmar, para que el número no retroceda en pantalla.
3. **`reduce()` valida todo lo que entra**, porque es lo que ejecuta el servidor
   con lo que le manda cualquier aparato conectado. Sin eso, un solo mensaje
   raro dejaba la partida de los cinco en blanco durante 24 horas.

`npm test` cubre lo que se rompe en silencio: el reparto del tablero, las reglas
de la partida con entrada hostil, la repetición al mantener pulsado, y que ningún
idioma se deje cadenas sin traducir.

## Licencia

[MIT](LICENSE).

Munchkin es una marca registrada de Steve Jackson Games. Esto es un contador
hecho por un aficionado, sin ninguna relación con ellos ni respaldo suyo.
