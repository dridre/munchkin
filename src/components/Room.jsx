import { useEffect, useState } from 'react'
import { Button, Dialog, TextField } from '@mui/material'
import { CODE_LENGTH, linkFor } from '../room.js'

const STATUS = {
  idle: 'Sin sala',
  connecting: 'Conectando…',
  online: 'Conectado',
  offline: 'Sin conexión',
}

export function RoomChip({ room, onOpen, corner }) {
  if (!room.available) return null

  return (
    <button
      type="button"
      className={`room-chip room-chip--${room.status}${corner ? ' room-chip--corner' : ''}`}
      onClick={onOpen}
      title={STATUS[room.status]}
    >
      <span className="room-chip__dot" />
      {room.code ?? 'Sala'}
    </button>
  )
}

function Qr({ code }) {
  const [svg, setSvg] = useState('')

  useEffect(() => {
    let alive = true
    // Se carga al abrir el panel, no en el arranque: la ruta critica es que
    // cinco personas abran la web a la vez desde los datos del movil de alguien.
    import('qrcode')
      .then(({ default: QRCode }) =>
        QRCode.toString(linkFor(code), {
          type: 'svg',
          margin: 1,
          color: { dark: '#0d1013', light: '#ffffff' },
        }),
      )
      .then((out) => alive && setSvg(out))
      .catch(() => alive && setSvg(''))
    return () => {
      alive = false
    }
  }, [code])

  // Lo genera esta misma app, no viene de fuera.
  return <div className="room__qr" dangerouslySetInnerHTML={{ __html: svg }} />
}

export function RoomPanel({ open, room, onClose }) {
  const [typed, setTyped] = useState('')

  return (
    <Dialog className="ask" open={open} onClose={onClose} fullWidth maxWidth="xs">
      <div className="room">
        {!room.available && (
          <>
            <h2 className="room__title">Sala</h2>
            <p className="room__hint">
              Para jugar con varios aparatos hay que desplegar el servidor de salas y apuntar
              a él con <code>VITE_ROOM_URL</code>. Mientras tanto la app funciona entera en
              este aparato.
            </p>
          </>
        )}

        {room.available && room.code && (
          <>
            <h2 className="room__title">Escanea para entrar</h2>
            <Qr code={room.code} />
            <p className="room__hint">O entra a mano con este código:</p>
            <p className="room__code">{room.code}</p>
            <p className={`room__status room__status--${room.status}`}>
              {STATUS[room.status]}
              {room.devices > 0 &&
                ` · ${room.devices} ${room.devices === 1 ? 'aparato' : 'aparatos'}`}
            </p>
            <p className="room__hint">
              Los nombres viajan a un servidor en Cloudflare y la sala se borra sola a las 24 h.
            </p>
            <div className="room__actions">
              <Button className="btn-ghost" onClick={room.leave}>
                Salir de la sala
              </Button>
              <Button className="btn-main" onClick={onClose}>
                Listo
              </Button>
            </div>
          </>
        )}

        {room.available && !room.code && (
          <>
            <h2 className="room__title">Sala</h2>
            <p className="room__hint">
              Crea una sala desde la pantalla de la mesa y que cada uno entre con su móvil.
            </p>
            <Button className="btn-main room__create" onClick={room.create}>
              Crear sala
            </Button>

            <p className="room__hint room__hint--split">o entra en una que ya exista</p>
            <div className="room__join">
              <TextField
                className="field"
                label="Código"
                value={typed}
                onChange={(e) => setTyped(e.target.value.toUpperCase())}
                inputProps={{ maxLength: CODE_LENGTH, autoCapitalize: 'characters' }}
                size="small"
              />
              <Button className="btn-ghost" onClick={() => room.join(typed)}>
                Entrar
              </Button>
            </div>
          </>
        )}

        {room.error && <p className="room__error">{room.error}</p>}
      </div>
    </Dialog>
  )
}
