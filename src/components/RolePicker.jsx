import { useT } from '../i18n.jsx'
import LangPick from './LangPick.jsx'
import { TABLE, inkFor } from '../state.js'
import { useCssVars } from '../useCssVars.js'
import { RoomChip } from './Room.jsx'

function PlayerCard({ player, cogido, onPick }) {
  const { t } = useT()
  const ref = useCssVars({ '--card': player.color, '--ink': inkFor(player.color) })

  return (
    <button
      type="button"
      className={`role__card role__card--player${cogido ? ' role__card--cogido' : ''}`}
      ref={ref}
      onClick={() => onPick(player.id)}
    >
      <span className="role__name">{player.name}</span>
      {cogido && <span className="role__cogido">{t('role.taken')}</span>}
    </button>
  )
}

export default function RolePicker({ players, taken = [], onPick, onNewGame, room, onRoom }) {
  const { t } = useT()

  return (
    <div className="role">
      <div className="role__inner">
        <div className="fila">
          <RoomChip room={room} onOpen={onRoom} />
          <LangPick />
        </div>
        <h1 className="role__title">{t('role.who')}</h1>

        <button type="button" className="role__card role__card--table" onClick={() => onPick(TABLE)}>
          <span className="role__name">{t('role.table')}</span>
          <span className="role__hint">{t('role.tableHint')}</span>
        </button>

        <p className="role__aparte">{t('role.orPick')}</p>

        <div className="role__list">
          {players.map((p) => (
            <PlayerCard key={p.id} player={p} cogido={taken.includes(p.id)} onPick={onPick} />
          ))}
        </div>

        {/* Solo fuera de una sala: un movil no puede rehacer por su cuenta la
            partida que lleva la mesa. */}
        {!room?.code && (
          <>
            <p className="role__aparte">{t('role.orNew')}</p>
            <button type="button" className="role__card" onClick={onNewGame}>
              <span className="role__name">{t('role.newGame')}</span>
              <span className="role__hint">{t('role.newGameHint')}</span>
            </button>
          </>
        )}
      </div>
    </div>
  )
}
