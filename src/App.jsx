import { useEffect, useState } from 'react'
import Setup from './components/Setup.jsx'
import Board from './components/Board.jsx'
import PlayerScreen from './components/PlayerScreen.jsx'
import PlayerSheet from './components/PlayerSheet.jsx'
import RolePicker from './components/RolePicker.jsx'
import Waiting from './components/Waiting.jsx'
import { RoomPanel } from './components/Room.jsx'
import { TABLE, useGame, useRole, useWakeLock } from './state.js'

export default function App() {
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

  if (!state.started && (role === TABLE || !room.code)) {
    // Monta la partida quien hace de mesa; en solitario, este mismo aparato.
    screen = <Setup players={state.players} dispatch={dispatch} room={room} onRoom={showRoom} />
  } else if (!state.started) {
    screen = <Waiting room={room} onRoom={showRoom} onTable={() => setRole(TABLE)} />
  } else if (role !== TABLE && !me) {
    // Aun no se sabe que es este aparato, o el jugador que tenia ya no esta.
    screen = (
      <RolePicker
        players={state.players}
        taken={room.taken}
        onPick={setRole}
        onNewGame={() => {
          dispatch({ type: 'reset' })
          dispatch({ type: 'edit' })
          setRole(TABLE)
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
        dispatch={dispatch}
        onLeave={() => setRole(null)}
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
          {room.error}
        </button>
      )}

      <RoomPanel open={roomOpen} room={room} onClose={() => setRoomOpen(false)} />
    </>
  )
}
