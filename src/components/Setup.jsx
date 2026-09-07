import { useEffect, useRef, useState } from 'react'
import { Button, IconButton, TextField } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import { DEFAULT_COLORS, newPlayer } from '../state.js'
import SexPick from './SexPick.jsx'
import { RoomChip } from './Room.jsx'

const MAX_PLAYERS = DEFAULT_COLORS.length

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

export default function Setup({ players, dispatch, room, onRoom }) {
  const set = (id, field) => (value) => dispatch({ type: 'set', id, field, value })

  return (
    <div className="setup">
      <div className="setup__inner">
        <div className="setup__head">
          <h1 className="setup__title">Munchkin</h1>
        </div>

        {players.length === 0 ? (
          <p className="setup__empty">Todavía no hay nadie en la partida.</p>
        ) : (
          <div className="setup__list">
            {players.map((p, i) => (
              <div className="slot" key={p.id}>
                <input
                  type="color"
                  className="slot__color"
                  value={p.color}
                  aria-label={`Color de ${p.name || `jugador ${i + 1}`}`}
                  onChange={(e) => set(p.id, 'color')(e.target.value)}
                />

                <NameField
                  value={p.name}
                  label={`Jugador ${i + 1}`}
                  onCommit={set(p.id, 'name')}
                />

                <SexPick sex={p.sex} onChange={set(p.id, 'sex')} />

                <IconButton
                  className="icon-btn"
                  aria-label={`Quitar a ${p.name || `jugador ${i + 1}`}`}
                  onClick={() => dispatch({ type: 'remove', id: p.id })}
                >
                  <DeleteIcon />
                </IconButton>
              </div>
            ))}
          </div>
        )}

        <div className="setup__actions">
          <RoomChip room={room} onOpen={onRoom} />
          <Button
            className="btn-ghost"
            startIcon={<AddIcon />}
            disabled={players.length >= MAX_PLAYERS}
            onClick={() => dispatch({ type: 'add', player: newPlayer(players) })}
          >
            Añadir jugador
          </Button>
          <Button
            className="btn-main"
            disabled={players.length === 0}
            onClick={() => dispatch({ type: 'start' })}
          >
            Empezar
          </Button>
        </div>
      </div>
    </div>
  )
}
