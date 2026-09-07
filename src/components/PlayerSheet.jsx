import { Button, Dialog, IconButton } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import { MAX_BAD, MAX_GEAR, MAX_LEVEL, force, inkFor } from '../state.js'
import { useCssVars } from '../useCssVars.js'
import { useHold } from '../useHold.js'
import SexPick from './SexPick.jsx'

function Stat({ label, value, min, max, onBump }) {
  // Devuelve false al llegar al tope para que la repeticion se pare sola.
  const step = (delta) => () => {
    const next = value + delta
    if (next < min || next > max) return false
    onBump(delta)
  }

  const down = useHold(step(-1))
  const up = useHold(step(1))

  return (
    <div className="stat">
      <span className="stat__label">{label}</span>
      <div className="stat__control">
        <Button
          className="stat__btn"
          aria-label={`Bajar ${label.toLowerCase()}`}
          disabled={value <= min}
          {...down}
        >
          −
        </Button>
        <span className="stat__value">{value}</span>
        <Button
          className="stat__btn"
          aria-label={`Subir ${label.toLowerCase()}`}
          disabled={value >= max}
          {...up}
        >
          +
        </Button>
      </div>
    </div>
  )
}

function SexStat({ sex, onPick }) {
  return (
    <div className="stat stat--sex">
      <span className="stat__label">Sexo</span>
      <div className="stat__control">
        <SexPick sex={sex} onChange={onPick} />
      </div>
    </div>
  )
}

// La ficha vale igual dentro del dialogo (desde la mesa) que como pantalla
// principal del movil de un jugador; solo cambian los botones de la barra.
export function Sheet({ player, dispatch, actions }) {
  const ref = useCssVars({
    '--player-card': player.color,
    '--player-ink': inkFor(player.color),
  })

  const bump = (field) => (delta) => dispatch({ type: 'bump', id: player.id, field, delta })

  return (
    <div className="sheet" ref={ref}>
      <div className="sheet__bar">
        <h2 className="sheet__name">{player.name}</h2>
        <p className="sheet__force">
          Fuerza <b>{force(player)}</b>
        </p>
        {actions.map((action) => (
          <IconButton
            key={action.label}
            className="sheet__close"
            aria-label={action.label}
            title={action.label}
            onClick={action.onClick}
          >
            {action.icon}
          </IconButton>
        ))}
      </div>

      <div className="sheet__body">
        <Stat label="Nivel" value={player.level} min={1} max={MAX_LEVEL} onBump={bump('level')} />
        <Stat label="Equipo" value={player.gear} min={0} max={MAX_GEAR} onBump={bump('gear')} />
        <Stat
          label="Desventajas"
          value={player.bad}
          min={0}
          max={MAX_BAD}
          onBump={bump('bad')}
        />
        <SexStat
          sex={player.sex}
          onPick={(value) => dispatch({ type: 'set', id: player.id, field: 'sex', value })}
        />
      </div>
    </div>
  )
}

export default function PlayerSheet({ player, dispatch, onClose }) {
  return (
    <Dialog
      fullScreen
      open={Boolean(player)}
      onClose={onClose}
      classes={{ paper: 'sheet__paper' }}
    >
      {player && (
        <Sheet
          player={player}
          dispatch={dispatch}
          actions={[{ icon: <CloseIcon />, label: 'Volver al tablero', onClick: onClose }]}
        />
      )}
    </Dialog>
  )
}
