# Munchkin — contador

Contador de niveles, equipo y desventajas para jugar en la mesa. PWA: se instala,
funciona sin internet y guarda la partida en el propio aparato.

```
npm install
npm run dev      # la app
npm test         # comprobaciones
npm run build    # + service worker
```

## Publicar

- Web: <https://munchkin-btb.pages.dev>
- Servidor de salas: <https://munchkin-salas.dridre.workers.dev>

```
npm run deploy        # construye y sube la web a Cloudflare Pages
npm run deploy:sala   # sube el servidor de salas
```

Cada despliegue da también una URL con un hash delante
(`970c968d.munchkin-btb.pages.dev`): esa es de esa subida concreta y cambia cada
vez. La buena, la que no cambia, es la de arriba.

El QR de la sala apunta a la dirección desde la que se generó, así que la sala hay
que crearla desde la URL pública, no desde `localhost`.

## Salas (varios aparatos)

Sin configurar nada, la app funciona entera en un solo aparato. Para que cada uno
lleve su personaje desde su móvil hay que desplegar el servidor de salas: un
Worker de Cloudflare con un Durable Object por partida.

```
npx wrangler login
npm run deploy:sala
```

Apunta la app al Worker en `.env` y vuelve a construir:

```
VITE_ROOM_URL=https://munchkin-salas.dridre.workers.dev
```

Cómo se usa: en la pantalla de la mesa, *Sala → Crear sala*. Sale un QR y un
código de cuatro letras. Cada uno escanea el QR (abre la web ya dentro) o entra a
mano con el código, y elige su personaje.

- **Mesa** — la pantalla del centro: los ve a todos y los toca a todos, no juega.
- **Jugador** — su ficha a pantalla completa y, abajo, cómo van los demás.

Las salas se borran solas al día de no tocarlas.

### Probar la sala en local

```
npm run dev:sala     # el Worker en el puerto 8787
npm run test:sala    # crea una sala, conecta dos aparatos y comprueba el reparto
```

## Cómo está montado

- `src/game.js` — las reglas de la partida. Sin React ni navegador: **este mismo
  archivo lo ejecutan el móvil, la mesa y el servidor**, y tienen que sacar el
  mismo resultado.
- `src/territory.js` — reparte la pantalla en bloques proporcionales al poder
  (treemap *squarified*, consciente del formato de la pantalla).
- `src/state.js` — los hooks: partida, papel del aparato y sala.
- `src/room.js` — conexión a la sala, con reintentos espaciados.
- `worker/index.js` — el servidor: una sala = un Durable Object.

Dos decisiones que sostienen el resto:

1. **Todo cambio es una acción, y los contadores se mueven con incrementos.** Si
   el móvil y la mesa suman a la vez, tienen que sumar dos, no pisarse.
2. **Después de cada acción el servidor manda la partida entera.** El aparato la
   aplica al momento para que el botón responda, y el servidor corrige. Con seis
   jugadores el mensaje son cuatrocientos bytes: sale más barato que pensar en
   ordenar mensajes.
