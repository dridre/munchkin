import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { LANGS, detect, translate } from './dict.js'
import { SEO } from './seo.js'

export * from './dict.js'

const KEY = 'munchkin.idioma'
const CODES = LANGS.map((l) => l.code)

export const I18nCtx = createContext(null)
const Ctx = I18nCtx

export function Idiomas({ children }) {
  const [lang, setLang] = useState(() => {
    // La ruta gana: /en/ es una pagina en ingles y asi la comparte quien la
    // comparte. Despues lo que eligio este aparato, y por ultimo el navegador.
    const enRuta = location.pathname.split('/').filter(Boolean)[0]
    if (CODES.includes(enRuta)) return enRuta

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
  // el atributo que usan los buscadores y los lectores de pantalla. Los mismos
  // textos que la pagina estatica: Google indexa lo que queda tras montar.
  useEffect(() => {
    const s = SEO[lang] ?? SEO.es
    document.documentElement.lang = lang
    document.title = s.title
    for (const sel of ['meta[name="description"]', 'meta[property="og:description"]']) {
      document.querySelector(sel)?.setAttribute('content', s.description)
    }
    document.querySelector('meta[property="og:title"]')?.setAttribute('content', s.name)
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
