import { useEffect, useState } from 'react'
import { Button, Dialog, TextField } from '@mui/material'
import { useT } from '../i18n.jsx'
import { CODE_LENGTH, linkFor } from '../room.js'

const STATUS = (t, status) => t(`status.${status}`)

export function RoomChip({ room, onOpen, corner }) {
  const { t } = useT()

  if (!room.available) return null

  return (
    <button
      type="button"
      className={`room-chip room-chip--${room.status}${corner ? ' room-chip--corner' : ''}`}
      onClick={onOpen}
      title={STATUS(t, room.status)}
    >
      <span className="room-chip__dot" />
      {room.code ?? t('room.title')}
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
  const { t } = useT()
  const [typed, setTyped] = useState('')

  return (
    <Dialog className="ask" open={open} onClose={onClose} fullWidth maxWidth="xs">
      <div className="room">
        {!room.available && (
          <>
            <h2 className="room__title">{t('room.title')}</h2>
            <p className="room__hint">{t('room.notReady')}</p>
          </>
        )}

        {room.available && room.code && (
          <>
            <h2 className="room__title">{t('room.scan')}</h2>
            <Qr code={room.code} />
            <p className="room__hint">{t('room.orCode')}</p>
            <p className="room__code">{room.code}</p>
            <p className={`room__status room__status--${room.status}`}>
              {STATUS(t, room.status)}
              {room.devices > 0 &&
                ` · ${t(room.devices === 1 ? 'room.device' : 'room.devices', { n: room.devices })}`}
            </p>
            <p className="room__hint">{t('room.privacy')}</p>
            <div className="room__actions">
              <Button className="btn-ghost" onClick={room.leave}>
                {t('room.leave')}
              </Button>
              <Button className="btn-main" onClick={onClose}>
                {t('room.done')}
              </Button>
            </div>
          </>
        )}

        {room.available && !room.code && (
          <>
            <h2 className="room__title">{t('room.title')}</h2>
            <p className="room__hint">{t('room.createHint')}</p>
            <Button className="btn-main room__create" onClick={room.create}>
              {t('room.create')}
            </Button>

            <p className="room__hint room__hint--split">{t('room.orJoin')}</p>
            <div className="room__join">
              <TextField
                className="field"
                label={t('room.code')}
                value={typed}
                onChange={(e) => setTyped(e.target.value.toUpperCase())}
                inputProps={{ maxLength: CODE_LENGTH, autoCapitalize: 'characters' }}
                size="small"
              />
              <Button className="btn-ghost" onClick={() => room.join(typed)}>
                {t('room.enter')}
              </Button>
            </div>
          </>
        )}

        {room.error && <p className="room__error">{t(room.error)}</p>}
      </div>
    </Dialog>
  )
}
