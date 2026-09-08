import { useState } from 'react'
import { IconButton } from '@mui/material'
import DashboardIcon from '@mui/icons-material/Dashboard'
import PersonIcon from '@mui/icons-material/Person'
import Board from './Board.jsx'
import GameMenu from './GameMenu.jsx'
import { useT } from '../i18n.jsx'
import { Sheet } from './PlayerSheet.jsx'

// El movil de un jugador: su ficha entera, y el mapa de todos cuando quiere
// mirar como va la cosa. Ahi solo puede abrirse a si mismo; a los demas los
// toca la mesa o su propio dueño.
export default function PlayerScreen({
  me,
  players,
  goal,
  dispatch,
  onLeave,
  onEdit,
  onReset,
  room,
  onRoom,
}) {
  const { t } = useT()
  const [map, setMap] = useState(false)

  // Los dos botones viven fuera de las dos vistas, en el mismo sitio y del
  // mismo tamano: al cambiar entre ficha y mapa el dedo no tiene que buscarlos.
  return (
    <>
      {map ? (
        <Board
          players={players}
          onSelect={(id) => id === me.id && setMap(false)}
          room={room}
          onRoom={onRoom}
        />
      ) : (
        <Sheet player={me} goal={goal} dispatch={dispatch} actions={[]} />
      )}

      <IconButton
        className="board-corner"
        aria-label={map ? t('player.mine') : t('player.map')}
        onClick={() => setMap(!map)}
      >
        {map ? <PersonIcon /> : <DashboardIcon />}
      </IconButton>

      {/* Cualquiera puede añadir gente, borrarla o reiniciar: se juega con
          amigos, y si nadie hace de mesa la partida se quedaba bloqueada.
          "¿Quien es este aparato?" ya sirve para cambiar de jugador, asi que no
          hace falta un boton aparte. */}
      <GameMenu
        className="board-menu--junto"
        onEdit={onEdit}
        onReset={onReset}
        onRole={onLeave}
      />
    </>
  )
}
