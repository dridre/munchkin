import { useState } from 'react'
import { IconButton } from '@mui/material'
import GroupsIcon from '@mui/icons-material/Groups'
import MapIcon from '@mui/icons-material/Map'
import PersonIcon from '@mui/icons-material/Person'
import Board from './Board.jsx'
import { Sheet } from './PlayerSheet.jsx'

// El movil de un jugador: su ficha entera, y el mapa de todos cuando quiere
// mirar como va la cosa. Ahi solo puede abrirse a si mismo; a los demas los
// toca la mesa o su propio dueño.
export default function PlayerScreen({ me, players, dispatch, onLeave, room, onRoom }) {
  const [map, setMap] = useState(false)

  if (map) {
    return (
      <>
        <Board
          players={players}
          mine={me.id}
          onSelect={(id) => id === me.id && setMap(false)}
          room={room}
          onRoom={onRoom}
        />
        {/* El mismo sitio que ocupaba el boton del mapa en la ficha: ahora
            devuelve a ella. */}
        <IconButton className="board-corner" aria-label="Mi ficha" onClick={() => setMap(false)}>
          <PersonIcon />
        </IconButton>
        <IconButton
          className="board-corner board-corner--bottom"
          aria-label="Cambiar de jugador"
          onClick={onLeave}
        >
          <GroupsIcon />
        </IconButton>
      </>
    )
  }

  return (
    <Sheet
      player={me}
      dispatch={dispatch}
      actions={[{ icon: <MapIcon />, label: 'Ver el mapa', onClick: () => setMap(true) }]}
    />
  )
}
