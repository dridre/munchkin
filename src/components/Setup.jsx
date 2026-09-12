import { useEffect, useRef, useState } from 'react'
import { Button, IconButton, TextField } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import { useT } from '../i18n.jsx'
import { useHold } from '../useHold.js'
import About from './About.jsx'
import LangPick from './LangPick.jsx'
import NumBox from './NumBox.jsx'
import { GOAL_MAX, GOAL_MIN, MAX_PLAYERS, fresh, newPlayer } from '../state.js'
import SexPick from './SexPick.jsx'
import { RoomChip } from './Room.jsx'

// Lo que tarda en darse por escrito el nombre.
const PAUSE = 600

// El nombre se lleva aparte mientras se escribe y se manda al rato de parar. Si
// cada tecla fuera a la sala, la partida que devuelve el servidor llegaria con
// el nombre a medias y se comerian letras al escribir rapido.
function NameField({ value, label, onCommit }) {
  const [text, setText] = useState(value)
  const writing = useRef(false)
  const timer = useRef(null)

  // Mientras se escribe manda lo tecleado; si el cambio viene de fuera (otro
  // aparato de la sala) se recoge solo cuando aqui no se esta escribiendo.
  useEffect(() => {
    if (!writing.current) setText(value)
  }, [value])

  useEffect(() => () => clearTimeout(timer.current), [])

  const commit = (next) => {
    clearTimeout(timer.current)
    // Ya esta escrito: vuelve a hacer caso a lo que llegue de la sala. En un
    // movil el blur no siempre dispara (cierras el teclado, cambias de app) y
    // el campo se quedaba sordo para siempre.
    writing.current = false
    if (next !== value) onCommit(next)
  }

  return (
    <TextField
      className="field slot__name"
      label={label}
      value={text}
      size="small"
      inputProps={{ maxLength: 14 }}
      onChange={(e) => {
        const next = e.target.value
        writing.current = true
        setText(next)
        clearTimeout(timer.current)
        timer.current = setTimeout(() => commit(next), PAUSE)
      }}
      onBlur={() => {
        writing.current = false
        commit(text)
      }}
      onKeyDown={(e) => e.key === 'Enter' && e.target.blur()}
    />
  )
}

export default function Setup({ players, goal, dispatch, room, onRoom }) {
  const { t } = useT()
  // A cuanto se juega solo se toca antes de empezar a puntuar.
  const puedeCambiarObjetivo = fresh({ players })
  const set = (id, field) => (value) => dispatch({ type: 'set', id, field, value })

  // Mantener pulsado tambien aqui: de 10 a 20 son diez toques.
  const mover = (delta) => () => {
    const siguiente = goal + delta
    if (!puedeCambiarObjetivo || siguiente < GOAL_MIN || siguiente > GOAL_MAX) return false
    dispatch({ type: 'goal', value: siguiente })
  }
  const bajarObjetivo = useHold(mover(-1))
  const subirObjetivo = useHold(mover(1))

  // El nombre entero es lo que se busca, pero en una linea no cabe en un movil.
  const [marca, ...resto] = t('app.name').split(' ')

  return (
    <div className="setup">
      <div className="setup__inner">
        <div className="setup__head">
          <h1 className="setup__title">
            <span className="setup__marca">{marca}</span>{' '}
            <span className="setup__sub">{resto.join(' ')}</span>
          </h1>
        </div>

        {/* Sala e idioma comparten fila, uno en cada punta: asi el titulo se
            queda con todo el ancho y no se parte en dos. */}
        <div className="fila">
          <RoomChip room={room} onOpen={onRoom} />
          <LangPick />
        </div>

        <div className="meta">
          <span className="meta__label">
            {t('goal.label')}
            {!puedeCambiarObjetivo && <em className="meta__locked">{t('goal.locked')}</em>}
          </span>
          <div className="meta__stepper">
            <button
              type="button"
              className="meta__btn"
              aria-label={t('goal.down')}
              disabled={goal <= GOAL_MIN || !puedeCambiarObjetivo}
              {...bajarObjetivo}
            >
              −
            </button>
            <NumBox
              className="meta__value"
              value={goal}
              min={GOAL_MIN}
              max={GOAL_MAX}
              label={t('goal.label')}
              onSet={(n) => dispatch({ type: 'goal', value: n })}
            />
            <button
              type="button"
              className="meta__btn"
              aria-label={t('goal.up')}
              disabled={goal >= GOAL_MAX || !puedeCambiarObjetivo}
              {...subirObjetivo}
            >
              +
            </button>
          </div>
        </div>

        {players.length === 0 ? (
          <p className="setup__empty">{t('setup.empty')}</p>
        ) : (
          <div className="setup__list">
            {players.map((p, i) => (
              <div className="slot" key={p.id}>
                <input
                  type="color"
                  className="slot__color"
                  value={p.color}
                  aria-label={t('setup.color', { name: p.name || t('setup.player', { n: i + 1 }) })}
                  onChange={(e) => set(p.id, 'color')(e.target.value)}
                />

                <NameField
                  value={p.name}
                  label={t('setup.player', { n: i + 1 })}
                  onCommit={set(p.id, 'name')}
                />

                <SexPick sex={p.sex} onChange={set(p.id, 'sex')} />

                <IconButton
                  className="icon-btn"
                  aria-label={t('setup.remove', { name: p.name || t('setup.player', { n: i + 1 }) })}
                  onClick={() => dispatch({ type: 'remove', id: p.id })}
                >
                  <DeleteIcon />
                </IconButton>
              </div>
            ))}
          </div>
        )}

        <About />

        <p className="setup__pie">
          <a href="https://github.com/dridre/munchkin" target="_blank" rel="noreferrer">
            github.com/dridre/munchkin
          </a>{' '}
          · v{__VERSION__}
        </p>

        <div className="setup__actions">
          <Button
            className="btn-ghost"
            startIcon={<AddIcon />}
            disabled={players.length >= MAX_PLAYERS}
            onClick={() => dispatch({ type: 'add', player: newPlayer(players) })}
          >
            {t('setup.add')}
          </Button>
          <Button
            className="btn-main"
            disabled={players.length === 0}
            onClick={() => dispatch({ type: 'start' })}
          >
            {t('setup.start')}
          </Button>
        </div>
      </div>
    </div>
  )
}
