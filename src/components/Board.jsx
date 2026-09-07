import { useEffect, useMemo, useState } from 'react'
import {
  Button,
  Dialog,
  DialogActions,
  DialogTitle,
  IconButton,
  Menu,
  MenuItem,
} from '@mui/material'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import ShieldIcon from '@mui/icons-material/Shield'
import { force, inkFor, weight } from '../state.js'
import { layout } from '../territory.js'
import { useCssVars } from '../useCssVars.js'
import SkullIcon from './SkullIcon.jsx'
import { RoomChip } from './Room.jsx'

// El reparto necesita el formato de la pantalla para no sacar bloques alargados.
function useAspect() {
  const [aspect, setAspect] = useState(() => window.innerWidth / window.innerHeight)

  useEffect(() => {
    const onResize = () => setAspect(window.innerWidth / window.innerHeight)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  return aspect
}

function Region({ player, rect, mine, onSelect }) {
  const ref = useCssVars({
    '--x': rect.x,
    '--y': rect.y,
    '--w': rect.w,
    '--h': rect.h,
    '--card': player.color,
    '--ink': inkFor(player.color),
  })

  return (
    <button
      ref={ref}
      type="button"
      className={`region${mine ? ' region--mine' : ''}`}
      onClick={onSelect}
    >
      <span className="region__name">
        {player.name} <span className="region__sex">{player.sex === 'f' ? '♀' : '♂'}</span>
      </span>
      <span className="region__force">{force(player)}</span>
      <span className="region__stats">
        <span className="region__stat" title="Nivel">
          <span className="region__tag">Lv</span>
          <b>{player.level}</b>
        </span>
        <span className="region__stat region__stat--extra" title="Equipo">
          <ShieldIcon className="region__icon" />
          <b>{player.gear}</b>
        </span>
        <span className="region__stat region__stat--extra" title="Desventajas">
          <SkullIcon className="region__skull" />
          <b>{player.bad}</b>
        </span>
      </span>
    </button>
  )
}

// Con `mine` el tablero es de mirar: solo se abre tu propio bloque y no salen
// las opciones de partida, que son cosa de la mesa.
export default function Board({ players, onSelect, mine, onEdit, onReset, onRole, room, onRoom }) {
  const [anchorEl, setAnchorEl] = useState(null)
  const [confirm, setConfirm] = useState(false)
  const aspect = useAspect()
  const rects = useMemo(() => layout(players.map(weight), aspect), [players, aspect])

  return (
    <>
      <div className="board">
        {players.map((p, i) => (
          <Region
            key={p.id}
            player={p}
            rect={rects[i]}
            mine={p.id === mine}
            onSelect={() => onSelect(p.id)}
          />
        ))}
      </div>

      <RoomChip room={room} onOpen={onRoom} corner />

      {onEdit && (
        <>
      <IconButton
        className="board-menu"
        aria-label="Opciones de la partida"
        onClick={(e) => setAnchorEl(e.currentTarget)}
      >
        <MoreVertIcon />
      </IconButton>

      <Menu
        className="menu"
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        <MenuItem
          onClick={() => {
            setAnchorEl(null)
            onRoom()
          }}
        >
          Sala
        </MenuItem>
        <MenuItem
          onClick={() => {
            setAnchorEl(null)
            onRole()
          }}
        >
          ¿Quién es este aparato?
        </MenuItem>
        <MenuItem
          onClick={() => {
            setAnchorEl(null)
            onEdit()
          }}
        >
          Editar jugadores
        </MenuItem>
        <MenuItem
          onClick={() => {
            setAnchorEl(null)
            setConfirm(true)
          }}
        >
          Empezar de cero
        </MenuItem>
      </Menu>

      <Dialog className="ask" open={confirm} onClose={() => setConfirm(false)}>
        <DialogTitle>¿Estás seguro?</DialogTitle>
        <DialogActions>
          <Button className="btn-ghost" onClick={() => setConfirm(false)}>
            Seguir jugando
          </Button>
          <Button
            className="btn-main"
            onClick={() => {
              setConfirm(false)
              onReset()
            }}
          >
            Reiniciar
          </Button>
        </DialogActions>
      </Dialog>
        </>
      )}
    </>
  )
}
