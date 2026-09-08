import { LANGS, useT } from '../i18n.jsx'

// Un `select` nativo a proposito: en el movil abre el selector del sistema, se
// maneja con teclado y no cuesta ni un byte de libreria.
export default function LangPick() {
  const { lang, setLang, t } = useT()

  return (
    <select
      className="lang"
      aria-label={t('lang.label')}
      value={lang}
      onChange={(e) => setLang(e.target.value)}
    >
      {LANGS.map((l) => (
        <option key={l.code} value={l.code} title={l.name}>
          {l.flag}
        </option>
      ))}
    </select>
  )
}
