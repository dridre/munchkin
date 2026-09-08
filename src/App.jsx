import { useEffect, useState } from 'react'
import Setup from './components/Setup.jsx'
import Board from './components/Board.jsx'
import PlayerScreen from './components/PlayerScreen.jsx'
import PlayerSheet from './components/PlayerSheet.jsx'
import RolePicker from './components/RolePicker.jsx'
import { RoomPanel } from './components/Room.jsx'
import { useT } from './i18n.jsx'
import { TABLE, useGame, useRole, useWakeLock } from './state.js'

export default function App() {
  const { t } = useT()
  const [state, dispatch, room] = useGame()
  const [role, setRole] = useRole(room.code)
  const [openId, setOpenId] = useState(null)
  const [roomOpen, setRoomOpen] = useState(false)
  useWakeLock()

  const showRoom = () => setRoomOpen(true)
  const me = state.players.find((p) => p.id === role)

  // Que la sala sepa que personaje lleva este aparato: para que nadie coja el
  // mismo y para que la mesa vea cuantos han entrado. Se repite al reconectar.
  useEffect(() => {
    room.claim(role)
  }, [role, room.status, room.claim])

  let screen

  if (!state.started) {
    // La monta cualquiera: no hace falta ser la mesa para tocar la lista.
    screen = (
      <Setup
        players={state.players}
        goal={state.goal}
        dispatch={dispatch}
        room={room}
        onRoom={showRoom}
      />
    )
  } else if (role !== TABLE && !me) {
    // Aun no se sabe que es este aparato, o el jugador que tenia ya no esta.
    screen = (
      <RolePicker
        players={state.players}
        taken={room.taken}
        onPick={setRole}
        onNewGame={() => {
          // Borra la partida entera y suelta el papel: quien monte la siguiente
          // decidira despues si quiere ser mesa o jugador.
          dispatch({ type: 'clear' })
          setRole(null)
        }}
        room={room}
        onRoom={showRoom}
      />
    )
  } else if (me) {
    screen = (
      <PlayerScreen
        me={me}
        players={state.players}
        goal={state.goal}
        dispatch={dispatch}
        onLeave={() => setRole(null)}
        onEdit={() => dispatch({ type: 'edit' })}
        onReset={() => dispatch({ type: 'reset' })}
        room={room}
        onRoom={showRoom}
      />
    )
  } else {
    screen = (
      <>
        <Board
          players={state.players}
          onSelect={setOpenId}
          onEdit={() => dispatch({ type: 'edit' })}
          onReset={() => dispatch({ type: 'reset' })}
          onRole={() => setRole(null)}
          room={room}
          onRoom={showRoom}
        />
        <PlayerSheet
          player={state.players.find((p) => p.id === openId)}
          goal={state.goal}
          dispatch={dispatch}
          onClose={() => setOpenId(null)}
        />
      </>
    )
  }

  return (
    <>
      {screen}

      {/* El aviso de que la sala ya no existe vivia solo dentro del panel, que
          esta cerrado: nadie se enteraba de nada. */}
      {room.error && (
        <button type="button" className="aviso" onClick={room.dismiss}>
          {t(room.error)}
        </button>
      )}

      <RoomPanel open={roomOpen} room={room} onClose={() => setRoomOpen(false)} />
    </>
  )
}
