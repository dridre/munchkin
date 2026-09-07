import { useState } from 'react'
import Setup from './components/Setup.jsx'
import Board from './components/Board.jsx'
import PlayerScreen from './components/PlayerScreen.jsx'
import PlayerSheet from './components/PlayerSheet.jsx'
import RolePicker from './components/RolePicker.jsx'
import { RoomPanel } from './components/Room.jsx'
import { TABLE, useGame, useRole, useWakeLock } from './state.js'

export default function App() {
  const [state, dispatch, room] = useGame()
  const [role, setRole] = useRole()
  const [openId, setOpenId] = useState(null)
  const [roomOpen, setRoomOpen] = useState(false)
  useWakeLock()

  const showRoom = () => setRoomOpen(true)
  const me = state.players.find((p) => p.id === role)

  let screen

  if (!state.started) {
    screen = <Setup players={state.players} dispatch={dispatch} room={room} onRoom={showRoom} />
  } else if (role !== TABLE && !me) {
    // Aun no se sabe que es este aparato, o el jugador que tenia ya no esta.
    screen = <RolePicker players={state.players} onPick={setRole} room={room} onRoom={showRoom} />
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
      <RoomPanel open={roomOpen} room={room} onClose={() => setRoomOpen(false)} />
    </>
  )
}
