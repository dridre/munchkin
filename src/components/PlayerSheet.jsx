import { Button, Dialog, IconButton } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import { useT } from '../i18n.jsx'
import { MAX_BAD, MAX_GEAR, force, inkFor } from '../state.js'
import { useCssVars } from '../useCssVars.js'
import { useHold } from '../useHold.js'
import NumBox from './NumBox.jsx'
import SexPick from './SexPick.jsx'

function Stat({ label, short, value, min, max, onBump, onPut }) {
  const { t } = useT()
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
          aria-label={t('stat.down', { label: label.toLowerCase() })}
          disabled={value <= min}
          {...down}
        >
          −
        </Button>
        <NumBox
          className="stat__value"
          value={value}
          min={min}
          max={max}
          label={short ?? label}
          onSet={onPut}
        />
        <Button
          className="stat__btn"
          aria-label={t('stat.up', { label: label.toLowerCase() })}
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
  const { t } = useT()

  return (
    <div className="stat stat--sex">
      <span className="stat__label">{t('stat.sex')}</span>
      <div className="stat__control">
        <SexPick sex={sex} onChange={onPick} />
      </div>
    </div>
  )
}

// La ficha vale igual dentro del dialogo (desde la mesa) que como pantalla
// principal del movil de un jugador; solo cambian los botones de la barra.
export function Sheet({ player, goal, dispatch, actions }) {
  const { t } = useT()
  const ref = useCssVars({
    '--player-card': player.color,
    '--player-ink': inkFor(player.color),
  })

  const bump = (field) => (delta) => dispatch({ type: 'bump', id: player.id, field, delta })
  const put = (field) => (value) => dispatch({ type: 'put', id: player.id, field, value })

  return (
    <div className="sheet" ref={ref}>
      <div className={`sheet__bar${actions.length ? '' : ' sheet__bar--hueco'}`}>
        <h2 className="sheet__name">{player.name}</h2>
        <p className="sheet__force">
          {t('stat.force')} <b>{force(player)}</b>
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
        <Stat label={t('stat.level')} value={player.level} min={1} max={goal} onBump={bump('level')}
          onPut={put('level')}
        />
        <Stat label={t('stat.gear')} value={player.gear} min={0} max={MAX_GEAR} onBump={bump('gear')}
          onPut={put('gear')}
        />
        <Stat
          label={t('stat.badLong')}
          short={t('stat.bad')}
          value={player.bad}
          min={0}
          max={MAX_BAD}
          onBump={bump('bad')}
          onPut={put('bad')}
        />
        <SexStat
          sex={player.sex}
          onPick={(value) => dispatch({ type: 'set', id: player.id, field: 'sex', value })}
        />
      </div>
    </div>
  )
}

export default function PlayerSheet({ player, goal, dispatch, onClose }) {
  const { t } = useT()

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
          goal={goal}
          dispatch={dispatch}
          actions={[{ icon: <CloseIcon />, label: t('sheet.back'), onClick: onClose }]}
        />
      )}
    </Dialog>
  )
}
