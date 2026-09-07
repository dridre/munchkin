import { RoomChip } from './Room.jsx'

// Lo que ve un movil que entra en la sala antes de que la mesa pulse Empezar.
// Antes caia en la pantalla de creacion, con poder para renombrar y borrar a
// todos los jugadores de la partida de los demas.
export default function Waiting({ room, onRoom, onTable }) {
  return (
    <div className="role">
      <div className="role__inner">
        <RoomChip room={room} onOpen={onRoom} />
        <h1 className="role__title">Preparando</h1>
        <p className="role__hint">
          La mesa está montando la partida. En cuanto empiece, aquí eliges tu personaje.
        </p>
        <button type="button" className="role__card" onClick={onTable}>
          <span className="role__name">Soy la mesa</span>
          <span className="role__hint">Montar yo la partida desde este aparato.</span>
        </button>
      </div>
    </div>
  )
}
