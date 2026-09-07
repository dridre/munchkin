import { TABLE, inkFor } from '../state.js'
import { useCssVars } from '../useCssVars.js'
import { RoomChip } from './Room.jsx'

function PlayerCard({ player, cogido, onPick }) {
  const ref = useCssVars({ '--card': player.color, '--ink': inkFor(player.color) })

  return (
    <button
      type="button"
      className={`role__card role__card--player${cogido ? ' role__card--cogido' : ''}`}
      ref={ref}
      onClick={() => onPick(player.id)}
    >
      <span className="role__name">{player.name}</span>
      {cogido && <span className="role__cogido">ya lo lleva otro</span>}
    </button>
  )
}

export default function RolePicker({ players, taken = [], onPick, onNewGame, room, onRoom }) {
  return (
    <div className="role">
      <div className="role__inner">
        <RoomChip room={room} onOpen={onRoom} />
        <h1 className="role__title">¿Quién eres?</h1>

        <button type="button" className="role__card role__card--table" onClick={() => onPick(TABLE)}>
          <span className="role__name">Mesa</span>
          <span className="role__hint">
            La pantalla del centro: los ve a todos y los toca a todos, pero no juega.
          </span>
        </button>

        <p className="role__aparte">o coge tu personaje</p>

        <div className="role__list">
          {players.map((p) => (
            <PlayerCard key={p.id} player={p} cogido={taken.includes(p.id)} onPick={onPick} />
          ))}
        </div>

        {/* Solo fuera de una sala: un movil no puede rehacer por su cuenta la
            partida que lleva la mesa. */}
        {!room?.code && (
          <>
            <p className="role__aparte">o si hoy toca otra cosa</p>
            <button type="button" className="role__card" onClick={onNewGame}>
              <span className="role__name">Montar otra partida</span>
              <span className="role__hint">
                Los mismos jugadores, todos a nivel 1. Antes de empezar puedes cambiarlos.
              </span>
            </button>
          </>
        )}
      </div>
    </div>
  )
}
