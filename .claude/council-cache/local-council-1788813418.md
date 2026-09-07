# Council local — Munchkin contador

**Aviso:** estas ocho perspectivas son Claude haciendo papeles distintos, no ocho
fabricantes de IA distintos. Comparten modelo y sesgos, así que **coincidir entre
ellas es señal débil**, no confirmación independiente. El valor está en los
ángulos y en la cobertura de puntos ciegos, no en el consenso.

Pregunta: revisión general, fiabilidad de las salas, monetización y UX en móvil y
tablet. Repo desplegado en munchkin-btb.pages.dev + munchkin-salas.dridre.workers.dev.

---

## 🗳️ Abogado del diablo

**Position.** El diseño de acciones+incrementos es correcto, pero el servidor confía ciegamente en cualquier cliente y `reduce` no valida nada: un solo mensaje malformado deja la sala inutilizable de forma persistente. Y de fondo: el 80% de la complejidad del repo (Worker, DO, `room.js`, `Room.jsx`, `RolePicker.jsx`, `PlayerScreen.jsx`, `useRole`, el QR) existe para evitar que cinco personas alarguen el brazo hacia una tablet que ya está en el centro de la mesa.

**Key points.**
- La sala se brickea con un mensaje. `webSocketMessage` hace `reduce(state, message.action)` sin validar, y `game.js` `case 'set'` escribe `{...p, [action.field]: action.value}` sin whitelist ni clamp. `set level={}` → `force()` NaN → `layout()` rects nulos → tablero en blanco en los cinco aparatos, persistido 24 h. Igual con `bump` sin `delta`, con `add player={}` (sin tope: `MAX_PLAYERS` solo vive en `Setup.jsx`) y con `start` haciendo `p.name.trim()` sobre un número.
- Los papeles no existen en el protocolo, solo en la UI. El WS acepta `reset`, `edit` y `remove` de quien sea. `App.jsx` evalúa `if (!state.started)` antes de mirar el papel: quien escanee el QR antes de "Empezar" aterriza en `Setup` con botón de borrar. `RolePicker` no marca personajes cogidos.
- Wifi malo = pérdidas silenciosas presentadas como feature. `room.js:send` descarta si no está OPEN pero `dispatch` ya aplicó optimista. Y con `useHold` a 16/s y 200 ms de RTT cada `sync` retrocede el número visiblemente.
- Coste y abuso: dos escrituras por acción, `setAlarm` en cada una. `POST /room` con `allow-origin: *` y cero rate limit. 31⁴ ≈ 923k códigos enumerables. Sin versión de protocolo en el `sync`.
- Monetización cero: la app no implementa una sola regla de Munchkin. La marca no aporta funcionalidad, solo riesgo. Lo original son las ~60 líneas de `territory.js`.

**Risks & blind spots.** La pregunta asume que los dos papeles son necesarios. Entrar en una sala borra la partida en curso sin confirmar. No hay estado de victoria ni deshacer (teniendo el primitivo perfecto: bump con delta inverso). `weight` con suelo 0.35 hace que −14, −5 y 0 salgan idénticos. `useCssVars` sin deps. `NameField` ignora lo remoto hasta perder el foco. Tocar a otro jugador en el mapa no hace nada y se lee como app colgada.

**Confidence.** `high` — ejecutó el reducer y `layout` para confirmar los NaN.

---

## 🗳️ Defensor de la simplicidad

**Position.** El núcleo (`game.js`, `worker/index.js`, `territory.js`) es honesto y pequeño —160 líneas de lógica real—, pero está envuelto en 431 KB de JS para pintar ocho botones. La deuda no es lo que falta, es lo que sobra.

**Key points.**
- MUI + emotion es el mayor gasto y no lo estás usando: 8 componentes y **30 reglas `.Mui*`** en `src/styles/` neutralizando lo que trae. Pagas la librería y pagas por deshacerla. Los sustitutos ya están en el repo: `SexPick.jsx` es un `<button>` pelado que funciona; `Dialog` fullscreen es `<dialog>`; `TextField` es un `<input>`; los iconos, SVG como `SkullIcon.jsx`.
- `useCssVars.js` sobra entero: React soporta custom properties en `style` desde 2018. Un `useLayoutEffect` sin deps reescribiendo 48 propiedades en cada tick del hold.
- `bad` es un tercio del modelo para algo que es `gear` con signo. Desaparecerían `MAX_BAD`, la fila "Desventajas", `SkullIcon`, media container query y el media query que existe solo porque la palabra es larga.
- Dos escrituras a disco por cada `+1`: ~80/segundo con cinco móviles. Estado en memoria con `blockConcurrencyWhile` y `setAlarm` movido a `/create`.
- Tests: `node --test src worker` descubre solo; `hold.test.mjs` reimplementa en 30 líneas el reloj falso que `node:test` da en `mock.timers`. El contenido está bien; sobra el andamio.

**Risks & blind spots.** El colchón `CUSHION_SHARE = 1/3` hace que un 10x de poder se vea como 4.4x: el área ya no codifica poder sino un ranking suavizado — legítimo como estética, pero entonces el squarified resuelve con precisión un problema al que ya renunciaste. El `sync` de la primera acción retrocede el número mientras mantienes pulsado (arreglo: contador `pending`, aplicar sync solo con `pending === 0`). `App.jsx` enseña `Setup` a todos cuando `started === false`. Monetizar borra las dos mejores propiedades del proyecto (sin cuentas, offline primero). UX que sobra: la fila "Sexo" ocupa lo mismo que Nivel; la container query oculta sus datos justo al que va perdiendo; el número gigante es `force` pero gana quien llega a nivel 10; falta que la mesa vea cuántos móviles hay conectados.

**Confidence.** `high` — eliminaciones verificables, 431 KB medido.

---

## 🗳️ Auditor de seguridad

**Position.** No existe frontera de confianza: `reduce()` es el servidor y no valida nada, así que con un `curl` y un WebSocket cualquiera deja una sala inservible 24 h y las cinco pantallas en blanco.

**Key points.**
- PoC ejecutado: `{field:'level',value:999999}` → nivel 999999 (`MAX_LEVEL` es decorativo, solo lo respeta `bump`); `{field:'admin',value:true}` → campo inventado persistido; `delta:'x'` → NaN → `layout()` `{w:null,h:null}`; `add player={}` + `start` → `TypeError` dentro de `webSocketMessage`, después de persistir.
- El brick llega al cliente y sobrevive al reinicio: `POST /room -d '{"players":1}'` crea sala válida y `App.jsx` revienta con pantalla blanca. Sin error boundary y con la sala en localStorage, recargar vuelve a reventar: no hay forma de salir sin borrar datos del sitio, y es una PWA instalada.
- Escalada de privilegios por diseño: cualquier socket manda `{type:'edit'}` → todos a `Setup`. El problema no es el ataque, es que la UI comunica un modelo de autorización que el sistema no aplica.
- El Worker no tiene ni un límite: ni tamaño de POST, ni de mensaje, ni ratio, ni sockets por sala, ni nº de jugadores (metió 501 y 26 KB, retransmitidos enteros en cada acción). `save()` reprograma la alarma en cada mensaje: un ping al día mantiene la sala viva para siempre. `newCode()` tiene sesgo de módulo.
- Wifi malo: sin cola, sin ack, sin secuencia. Con socket medio abierto `OPEN` sigue en true y ni se cae al camino de reintento. Sin ping/pong (los operadores matan sockets ociosos a los ~60 s) y sin jitter: los cinco vuelven en tromba.

**Risks & blind spots.** La suite de tests da confianza falsa: cero aserciones con entrada hostil, todo lo anterior pasa los tests. "El servidor corrige" no es una propiedad de seguridad: el servidor es un par más que se cree a todo el mundo. Offline-first amplifica el daño: el estado envenenado se persiste y el service worker sigue sirviendo la app rota. Sin `public/_headers` (CSP, `frame-ancestors`, `Referrer-Policy`); `QRCode.toDataURL` + `<img>` elimina el único `dangerouslySetInnerHTML`.

**Confidence.** `high` — PoC ejecutados contra `reduce` y `layout` reales.

---

## 🗳️ Arquitecto de escalabilidad

**Position.** El eje de las salas está bien resuelto: un Durable Object por sala es sharding perfecto y crece a millones sin tocar nada. El problema es el **eje de escrituras por partida**: ~2 escrituras por cada `+1` y `hold.js` disparando hasta 16,6 acciones/segundo.

**Key points.**
- La cuenta que importa: `hold.js` va de 450 a 60 ms en ~8 ticks. Cada acción hace `storage.get` + `put` + `setAlarm`. Una partida real (subir equipo manteniendo el dedo, cinco jugadores, dos horas) son 1.000–3.000 acciones → 2.000–6.000 filas escritas. El plan gratuito ronda 100.000 filas/día: **~20–50 partidas al día entre todos tus usuarios**. El muro está a un 10x, no a un 100x.
- El 20x es gratis: agrupar los `bump` consecutivos del mismo `id`+`field` cada ~200 ms (mandar `delta: 12` una vez es exactamente el mismo estado final que doce `delta: 1`, y el clamp es idempotente para deltas del mismo signo), y no rearmar la alarma si ya hay una a menos de una hora.
- Dos fallos silenciosos sin cobertura de test: mensajes descartados si el socket no está OPEN, y **no hay reconciliación optimista** — cualquier `sync` provocado por otro aparato pisa tu `+1` en vuelo y el número rebota; a más aparatos, más rebotes.
- El servidor no valida nada y eso sí es problema de escala: el tope de 8 jugadores solo existe en `Setup.jsx`; un objeto grande revienta el `put` con excepción **no capturada** → el DO aborta y se caen los cinco. `CORS` no protege WebSockets: `new WebSocket()` ignora `access-control-allow-origin`.
- Lo que sí escala y no hay que tocar: difundir el estado entero salva del desfase de versiones en despliegues incrementales. El ahorro está en el **número de escrituras**, no en el tamaño del mensaje.

**Risks & blind spots.** El eje de crecimiento no es el que sugiere la pregunta: el 100x son más partidas simultáneas, no más gente por sala; optimizar el fan-out sería tiempo perdido. `useRole` guarda el papel en clave global sin sala: dos móviles pueden reclamar el mismo jugador, y al cambiar de sala arrastras el rol. `crypto.randomUUID()` no existe fuera de contexto seguro: probar contra `http://192.168.x.x:5173` peta al añadir jugador. `territory.js` ordena por área, así que **los bloques intercambian sitio** cuando alguien adelanta — desorientador en una tablet compartida y peor cuanto más gente. Falta presencia: la mesa no sabe qué móviles siguen vivos. `linkFor` usa `location.origin`: un QR generado desde el dominio con hash clava a los invitados en ese build.

**Confidence.** `medium-high` — caminos de código trazados enteros; las cifras exactas del plan gratuito pueden variar, la conclusión no.

---

## 🗳️ Defensor del mantenimiento

**Position.** El núcleo puro está de los mejor documentados que se ven, con un test de propiedades en `territory.js`. La deuda está toda en los bordes: `reduce()` es la frontera de confianza y no valida nada, `useRoom` es el código más frágil y el único sin probar, y no hay CI ni historial (3 commits con mensaje vacío).

**Key points.**
- `reduce()` no valida y es lo que ejecuta el servidor. `{type:'set',field:'id',...}` cambia el id de un jugador (colisión de `key` en React y el móvil con ese rol se va a `RolePicker`). `bump` tiene `LIMITS`; `set` no tiene nada — esa asimetría es el agujero. ~6 líneas en el archivo compartido.
- **El patrón para probar `useRoom` lo inventaste tú y no lo aplicaste donde importa.** `hold.js`/`useHold.js` separa la máquina del hook y se prueba con reloj falso. `room.js` no: de 60 líneas de efecto solo se prueba `nextWait`, la trivial. Extrae `connectionMachine(url, {Socket, timers})` y los casos límite de wifi malo pasan de suposición a test.
- Deuda estructural: `export * from './game.js'` hace que cuatro componentes importen constantes puras a través de un módulo que arrastra React, mientras `Board` importa `layout` directo. `CODE_LENGTH = 4` duplicado en tres sitios, y `cleanCode` acepta I/L/O/0/1 que el `ALPHABET` nunca genera.
- El modelo de permisos es implícito: "solo mirar" se codifica como "no le pasé `onEdit`", y el permiso de un jugador se disfraza de navegación. Pero `Setup` no tiene ese guardarraíl. Pásale `role` explícito.
- Monetización es sobre todo un problema de renombrado diferido: hoy cuesta un `sed`, después cuesta migrar PWAs instaladas, la clave `munchkin.v2`, el subdominio y el nombre del Worker. Y **no hay LICENSE**: repo sin licencia = nadie puede contribuir ni forkear.

**Risks & blind spots.** Lo que la pregunta no contempla es el traspaso: commits vacíos, sin CI, `worker/sala.test.mjs` fuera de `npm test` y exigiendo `wrangler dev` a mano (se va a pudrir), y el despliegue desde el portátil del autor con sus credenciales. Todo el "por qué" vive en los comentarios: protégelos, son el activo. Falta versionado del estado persistido: `{...EMPTY, ...JSON.parse(raw)}` fusiona cualquier forma, así que un guardado antiguo sin `bad` da NaN por la misma vía, sin ataque. El test de `territory.js` es tan bueno que da falsa sensación de cobertura global: núcleo 100%, React 0%, worker 0%.

**Confidence.** `high` — ejecutó `reduce()` con acciones hostiles.

---

## 🗳️ Optimizador de rendimiento

**Position.** La idea de sincronización es correcta pero la **frecuencia** no está controlada en ningún punto: cada acción atraviesa `localStorage.setItem` → WebSocket → `put` + `setAlarm` → broadcast → recálculo del treemap → transición CSS de 400 ms sobre 8 bloques con `container-type: size`.

**Key points.**
- Amplificación por pulsación mantenida: 5 s = ~66 acciones. Por cada una, `JSON.stringify` + `localStorage.setItem` **síncrono en todos los aparatos que reciben el sync** (en Android pica el hilo principal), 2 escrituras durables en el DO, y una transición que se reinicia sin llegar a terminar. Arreglos de 2–4 líneas: debounce del `localStorage` con flush en `pagehide`, `put` sin `await` (el output gate ya ordena), `useDeferredValue(players)` como dependencia del layout.
- La reconciliación optimista pierde escrituras: `setState(message.state)` a pelo. A 60 ms por tick y 250 ms de RTT vas 4 cuentas por detrás de forma continua; con wifi malo, 8. Fix: cola `pending` en un ref, `setState(pending.current.reduce(reduce, message.state))`, el servidor devuelve el `seq` aplicado. ~10 líneas y es el mejor valor/tamaño del repo.
- Techo de coste: con hibernación cada mensaje entrante se factura como request; 100k/día. Una pulsación mantenida son 66 requests → techo ~200 partidas/día. Agrupar multiplica por ~8.
- Bundle 441 KB / 138 KB gz en un chunk, todo en la ruta crítica del QR (cinco personas escaneando desde el hotspot de alguien). Tres cortes triviales: `@fontsource/chakra-petch/400.css` arrastra **thai, vietnamese y latin-ext**; `qrcode` importado estáticamente aunque solo lo use la mesa; MUI ~70 KB gz que luego pisas en SCSS.
- `reduce()` es entrada no validada: `add` sin límite permite crecer el estado hasta el tope de 128 KiB por valor del DO.

**Risks & blind spots.** El "~400 bytes" no está validado en ningún test y depende de que nadie infle `players`. Nadie ha probado con más de 2 sockets. `nextWait` no tiene jitter: si cae el AP los cinco reintentan en lockstep exactamente a los mismos 500/900/1620 ms. No hay reconexión al volver a primer plano (iOS suspende timers). El QR y "Crear sala" son alcanzables desde cualquier aparato: dos personas creando sala = partida partida en dos. **El coste dominante no es el servidor sino el renderizado en la tablet**, que es el único aparato que dibuja el treemap completo y recibe todos los broadcasts — y es el más viejo de la mesa. Medir ahí, no en el portátil.

**Confidence.** `high` — cifras medidas sobre `dist/`.

---

## 🗳️ Experiencia de desarrollo

**Position.** El código es limpio y los comentarios explican el porqué mejor que el 95% de los repos, pero el proyecto está montado para un solo desarrollador que además es el único usuario que sabe reiniciar el móvil. Faltan cuatro costuras de diagnóstico.

**Key points.**
- **`npm run deploy` no despliega el servidor.** `worker/index.js` importa `../src/game.js`: ese archivo se despliega por dos caminos distintos y nada comprueba que coincidan. Tocas `LIMITS` o el reducer, subes solo la web, y el cliente aplica la regla nueva y el `sync` del servidor viejo la revierte — sin error, sin log, en el móvil de otra persona. Una línea en `package.json`. Con cinturón: `export const REGLAS = 1`, mandarlo en el `sync`, y `RoomChip` en rojo con "Actualiza la app".
- Las acciones se tiran sin dejar rastro. El usuario no ve un error: ve un botón que "a veces no funciona". La cola son seis líneas y es correcta precisamente porque son incrementos.
- El servidor se cree todo y el estado malo es permanente. No hay ni un `console.log` en el Worker, así que `wrangler tail` no dice nada y depurar "se ha quedado tonta la sala QWER" implica abrir un WebSocket a mano. Añade un `GET /room/:code` de tres líneas.
- Tres bugs concretos: `commit()` desde el temporizador nunca devuelve `writing.current` a `false` (en móvil el blur no siempre dispara, y ese campo ignora para siempre los nombres remotos); `crypto.randomUUID()` no existe en contexto inseguro, así que probar desde el móvil contra `npm run dev` revienta "Añadir jugador" — y `dev` no lleva `--host`; no hay error boundary, así que un localStorage con un jugador sin `bad` deja la pantalla negra y el service worker impide arreglarlo recargando.
- Higiene: 28 de 73 archivos versionados son `.wrangler/state` (1,3 MB). `npx oxlint` saca 14 warnings, dos de ellos de ficheros de `.wrangler`. Un lint con warnings crónicos es un lint que nadie mira. Los tres commits tienen mensaje vacío.

**Risks & blind spots.** El diseño optimista convierte **todos** los fallos de red en el mismo síntoma mudo: un número que vuelve atrás. Sin cola, sin indicador de "cambios sin confirmar" y sin un log en el Worker, no hay señal que distinga "se perdió tu acción" de "estás en una versión vieja" o "otro aparato lo deshizo". `user-scalable=no` junto a `user-select: none` bloquea el zoom, y esto es literalmente un juego de mirar números pequeños al otro lado de una mesa. Lo que **no** cambiaría: el reducer compartido, los incrementos, el sync completo, el treemap con colchón, `holdMachine` sin React, y el offline-first.

**Confidence.** `high` — leyó las ~1.700 líneas, corrió `npm test` y `oxlint`.

---

## 🗳️ Cumplimiento normativo

**Position.** Sorprendentemente limpio en lo que suele fallar (cero terceros, cero analítica, borrado a 24 h, `localStorage` estrictamente necesario → **no necesita banner de cookies**), pero con tres agujeros reales: sin control de acceso ni límite de tasa, `reduce()` acepta escrituras arbitrarias que se persisten en tu cuenta, y no hay ni una línea de aviso de privacidad donde los nombres salen del móvil.

**Key points.**
- El código de sala es la única credencial y va sin protección: sin validar `Origin`, sin límite de tasa, 923.000 códigos con ventana de 24 h. Enumerar salas activas y leer nombres es un fallo del tratamiento (art. 32 RGPD). Arreglo barato: regla de Rate Limiting de Cloudflare (cero código) + fijar el origen.
- `case 'set'` es escritura arbitraria que el servidor ejecuta y guarda: **te conviertes en alojador de contenido de terceros** 24 h en tu cuenta, sin mecanismo de retirada. Los límites que crees tener (`MAX_PLAYERS`, `maxLength: 14`) son solo de cliente.
- Falta el aviso del art. 13, y el sitio es `RoomPanel`, no una página legal: dos líneas junto al botón, *"Al crear la sala, los nombres viajan a un servidor en Cloudflare y se borran solos a las 24 h"*. Complemento obligado: `room.leave()` solo borra tu localStorage; la sala sigue viva. Un `POST /room/CODE/close` con `deleteAll()` convierte el borrado en efectivo.
- **El campo `sex` es el peor dato del proyecto: máxima carga regulatoria, valor nulo.** Característica protegida, binaria, por defecto `'m'`, viaja al servidor, se persiste, y su único uso es pintar un glifo. No supera minimización (art. 5.1.c). Munchkin lo juegan menores y en España el consentimiento digital es a los 14. Bórralo o cámbialo por un avatar sin semántica de género.
- Monetizar bajo la marca es el riesgo dominante: el uso nominativo no cubre usar la marca como nombre propio, ni en el dominio. Con pago pasas de fan project tolerado a competidor de su contador oficial. Punto a favor que no conviene estropear: la app **no contiene texto de cartas** — las reglas no son protegibles, el texto sí. No añadas base de datos de cartas.

**Risks & blind spots.** El día que entre publicidad se cae la exención de cookies (hoy no necesitas banner; mucha gente sobre-cumple aquí y tú no tienes que hacerlo) y adiós a la limpieza actual: verificado, no hay ni un host de terceros. Si monetizas como persona física española: art. 10 LSSI, IVA por OSS, alta censal, probablemente autónomo. No hay logs de servidor **y eso es correcto** para minimización, pero no podrías investigar un abuso ni notificar en 72 h. Hay **28 archivos de `.wrangler/state/` versionados**, incluidos los `.sqlite` del DO local: hoy sin nombres, mañana sí. El QR mete la credencial en la URL — ya mitigado con `history.replaceState`, pero el código queda en la analítica HTTP del Worker.

**Confidence.** `medium-high` — alto en los hallazgos de código, medio en marca.

---

# Síntesis

## Puntos de partida compartidos (señal débil: mismo modelo)

**1. `reduce()` es la frontera de confianza y no valida nada.** Seis de los ocho llegaron ahí solos, tres ejecutando exploits. Verificado por mí: `set level={}` → NaN → tablero en blanco; `bump` sin `delta` → NaN; `add player={}` mete `{}`; nombre numérico → excepción dentro del Durable Object. Persistido, así que sobrevive a reconexiones hasta la alarma de 24 h.

**2. Las acciones se pierden en silencio y el contador rebota.** Cinco lo señalaron. Dos causas distintas: `send` descarta si el socket no está OPEN, y `setState(message.state)` tira las acciones en vuelo.

**3. Monetizar es mala idea.** Unánime, por cuatro razones distintas: marca (legal), simplicidad (borra "sin cuentas" y "offline"), cumplimiento (RGPD, IVA, LSSI) y escalabilidad (el coste marginal sube con la amplificación de escrituras). Todos apuntan al mismo activo: `territory.js` y el reducer compartido, no el nombre.

**4. `RolePicker` no marca personajes cogidos.** Cuatro lo citaron como el fallo de UX que más se nota con cinco móviles.

**Qué podrían estar fallando todos por el mismo motivo:** los ocho leyeron el código y ninguno ha jugado una partida. Todos optimizan el sistema que existe; solo el abogado del diablo preguntó si las salas se van a usar siquiera. Esa es la pregunta cara, y ninguno tiene datos para responderla.

## Tensiones reales

- **Borrar vs. estabilizar.** Simplicidad quiere fuera MUI, `useCssVars`, `bad`, y señala que el colchón del treemap contradice la precisión del squarified. Mantenimiento y DX dicen que el núcleo y sus comentarios son el activo. No se contradicen: simplicidad ataca los bordes (MUI, andamios), los otros defienden el centro.
- **Las salas, ¿acierto o complejidad de más?** El choque más fuerte. El abogado del diablo dice que una tablet en el centro elimina el 80% del repo; escalabilidad dice que un DO por sala es sharding perfecto y solo hay que arreglar las escrituras. Ambos tienen razón sobre cosas distintas: la arquitectura es buena y puede que el problema no existiera.
- **`sex`: cumplimiento quiere borrarlo, tú lo pediste.** Dato protegido, binario, por defecto `'m'`, viaja al servidor, y su único uso es pintar un glifo. Es tu decisión, pero conviene tomarla sabiendo eso.
- **Cómo arreglar el rebote:** cola de pendientes reaplicada sobre el sync (rendimiento, DX) vs. contador `pending` que ignora syncs (simplicidad). La primera es correcta; la segunda, cuatro líneas.

## Puntos ciegos que solo vio uno

- **DX:** `npm run deploy` no sube el Worker → desfase silencioso de versiones. Verificado.
- **Cumplimiento:** 28 ficheros `.wrangler/state/` versionados en git. Verificado.
- **Rendimiento:** el aparato crítico es la tablet (dibuja el treemap entero y recibe todos los broadcasts) y es el más viejo de la mesa; y las fuentes cargan tailandés y vietnamita. Verificado: 9 woff2 con subconjuntos thai/vietnamese/latin-ext + 12 `.woff` que no usa nadie.
- **Escalabilidad:** el treemap reordena por tamaño, así que los bloques cambian de sitio cuando alguien adelanta — pierdes de vista el tuyo justo cuando pasa algo.
- **Seguridad:** sin error boundary, una sala envenenada deja la PWA instalada irrecuperable sin borrar datos del sitio.
- **Nadie cubrió:** qué pasa al ganar (nivel 10 solo deshabilita el `+`), y que no existe deshacer teniendo el primitivo perfecto (bump con delta inverso).

## Dirección sugerida

**Antes de que lo use nadie más** (todas las lentes lo respaldan):
1. Validar en `reduce()`: whitelist de campos en `set`, `Number.isFinite(delta)`, tope de jugadores, `String(name)`. Un solo sitio arregla cliente y servidor. Con tests de entrada hostil.
2. Ignorar `sync` sin `players` válido + error boundary con "empezar de cero".
3. Cola de pendientes: guardar mientras no haya línea, volcar en `onopen`, reaplicar sobre el `sync`. Arregla la pérdida silenciosa y el rebote a la vez.
4. `npm run deploy` que despliegue las dos cosas.
5. `.wrangler` fuera de git.

**Baratas y de mucho efecto:** agrupar los `bump` del hold en uno con `delta` acumulado (÷10 escrituras y mata el rebote); `setAlarm` solo cuando toca; jitter en los reintentos; marcar personajes cogidos y enseñar cuántos móviles hay conectados; el `writing.current` de `NameField`; `vite --host` + respaldo de `randomUUID` para poder probar en móviles reales; fuentes solo latin.

**Decisiones tuyas, no obvias:** quitar MUI (~70 KB gz, un día de trabajo); qué hacer con `sex`; si los bloques deben mantener posición fija en vez de ordenarse por tamaño.

**Sobre la tensión grande:** las salas ya existen y funcionan. El argumento de borrarlas es el mejor que nadie hizo, pero llega tarde. La pregunta real es si se usan. El experimento más barato: una partida con la tablet en el centro y los móviles disponibles, y ver si alguien saca el móvil. Eso decide dónde va el esfuerzo siguiente mejor que ocho opiniones.
