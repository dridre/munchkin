import { MenuItem, Select } from '@mui/material'
import { LANGS, useT } from '../i18n.jsx'
import Flag from './Flag.jsx'

// Un `select` nativo no puede llevar SVG dentro de las opciones, y las banderas
// emoji no se dibujan en Windows. Con el de Material UI, que ya esta en el
// paquete, se ve la bandera sola cerrado y bandera + idioma al abrirlo.
export default function LangPick() {
  const { lang, setLang, t } = useT()

  return (
    <Select
      className="lang"
      value={lang}
      onChange={(e) => setLang(e.target.value)}
      renderValue={(code) => <Flag code={code} />}
      inputProps={{ 'aria-label': t('lang.label') }}
      MenuProps={{ className: 'menu' }}
    >
      {LANGS.map((l) => (
        <MenuItem key={l.code} value={l.code}>
          <Flag code={l.code} />
          <span className="lang__name">{l.name}</span>
        </MenuItem>
      ))}
    </Select>
  )
}
