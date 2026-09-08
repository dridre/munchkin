import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { LANGS, detect, translate } from './dict.js'

export * from './dict.js'

const KEY = 'munchkin.idioma'
const CODES = LANGS.map((l) => l.code)

export const I18nCtx = createContext(null)
const Ctx = I18nCtx

export function Idiomas({ children }) {
  const [lang, setLang] = useState(() => {
    try {
      const guardado = localStorage.getItem(KEY)
      if (guardado && CODES.includes(guardado)) return guardado
    } catch {
      /* sin almacenamiento */
    }
    return detect(navigator.languages ?? [navigator.language])
  })

  const choose = useCallback((next) => {
    setLang(next)
    try {
      localStorage.setItem(KEY, next)
    } catch {
      /* vale solo para esta sesion */
    }
  }, [])

  // Que el idioma se vea tambien fuera de React: la pestaña, la descripcion y
  // el atributo que usan los buscadores y los lectores de pantalla.
  useEffect(() => {
    const name = translate(lang, 'app.name')
    const tagline = translate(lang, 'app.tagline')
    document.documentElement.lang = lang
    document.title = `${name} — ${translate(lang, 'stat.level')} & ${translate(lang, 'stat.gear')}`
    for (const sel of ['meta[name="description"]', 'meta[property="og:description"]']) {
      document.querySelector(sel)?.setAttribute('content', tagline)
    }
    document.querySelector('meta[property="og:title"]')?.setAttribute('content', name)
  }, [lang])

  const value = useMemo(
    () => ({ lang, setLang: choose, t: (key, vars) => translate(lang, key, vars) }),
    [lang, choose],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useT() {
  return useContext(Ctx) ?? { lang: 'es', setLang: () => {}, t: (k) => translate('es', k) }
}
