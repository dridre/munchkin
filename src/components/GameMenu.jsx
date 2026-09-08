import { useState } from 'react'
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
import { useT } from '../i18n.jsx'

// El mismo menu para la mesa y para el movil de un jugador: si juegas con
// amigos, cualquiera puede añadir gente, borrarla o reiniciar. El permiso nunca
// existio en el servidor, solo estaba escondido en la interfaz de unos y no de
// otros, y eso dejaba la partida bloqueada cuando nadie hacia de mesa.
export default function GameMenu({ onEdit, onReset, onRole, onRoom, className = '' }) {
  const { t } = useT()
  const [anchorEl, setAnchorEl] = useState(null)
  const [confirm, setConfirm] = useState(false)

  const cerrarY = (accion) => () => {
    setAnchorEl(null)
    accion()
  }

  return (
    <>
      <IconButton
        className={`board-menu ${className}`.trim()}
        aria-label={t('board.menu')}
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
        {onRoom && <MenuItem onClick={cerrarY(onRoom)}>{t('room.title')}</MenuItem>}
        <MenuItem onClick={cerrarY(onRole)}>{t('board.who')}</MenuItem>
        <MenuItem onClick={cerrarY(onEdit)}>{t('board.edit')}</MenuItem>
        <MenuItem onClick={cerrarY(() => setConfirm(true))}>{t('board.restart')}</MenuItem>
      </Menu>

      <Dialog className="ask" open={confirm} onClose={() => setConfirm(false)}>
        <DialogTitle>{t('board.sure')}</DialogTitle>
        <DialogActions>
          <Button className="btn-ghost" onClick={() => setConfirm(false)}>
            {t('board.keep')}
          </Button>
          <Button
            className="btn-main"
            onClick={() => {
              setConfirm(false)
              onReset()
            }}
          >
            {t('board.restartOk')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
