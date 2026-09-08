import { useEffect, useMemo, useState } from 'react'
import ShieldIcon from '@mui/icons-material/Shield'
import { useT } from '../i18n.jsx'
import { force, inkFor, weight } from '../state.js'
import { layout } from '../territory.js'
import { useCssVars } from '../useCssVars.js'
import GameMenu from './GameMenu.jsx'
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

function Region({ player, rect, onSelect }) {
  const { t } = useT()
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
      className="region"
      onClick={onSelect}
    >
      <span className="region__name">
        {player.name} <span className="region__sex">{player.sex === 'f' ? '♀' : '♂'}</span>
      </span>
      <span className="region__force">{force(player)}</span>
      <span className="region__stats">
        <span className="region__stat" title={t('stat.level')}>
          <span className="region__tag">{t('stat.lv')}</span>
          <b>{player.level}</b>
        </span>
        <span className="region__stat region__stat--extra" title={t('stat.gear')}>
          <ShieldIcon className="region__icon" />
          <b>{player.gear}</b>
        </span>
        <span className="region__stat region__stat--extra" title={t('stat.bad')}>
          <SkullIcon className="region__skull" />
          <b>{player.bad}</b>
        </span>
      </span>
    </button>
  )
}

// Sin las opciones de partida (`onEdit` y compañia) el tablero es de mirar:
// eso es cosa de la mesa, no del movil de un jugador.
export default function Board({ players, onSelect, onEdit, onReset, onRole, room, onRoom }) {
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
            onSelect={() => onSelect(p.id)}
          />
        ))}
      </div>

      <RoomChip room={room} onOpen={onRoom} corner />

      {onEdit && <GameMenu onEdit={onEdit} onReset={onReset} onRole={onRole} />}
    </>
  )
}
