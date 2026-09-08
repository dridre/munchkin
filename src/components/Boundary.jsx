import { Component } from 'react'
import { I18nCtx, translate } from '../i18n.jsx'

// Ultima red: si algo revienta a mitad de partida, la PWA instalada se queda en
// negro y recargar no arregla nada, porque el estado malo esta guardado. Esto da
// la salida sin tener que borrar los datos del sitio a mano.
export default class Boundary extends Component {
  static contextType = I18nCtx

  state = { roto: false }

  static getDerivedStateFromError() {
    return { roto: true }
  }

  render() {
    if (!this.state.roto) return this.props.children

    // Si lo que revento fue el propio proveedor de idioma, tiramos de ingles.
    const t = this.context?.t ?? ((key) => translate('en', key))

    return (
      <div className="roto">
        <h1 className="roto__title">{t('boundary.title')}</h1>
        <p className="roto__hint">{t('boundary.hint')}</p>
        <button
          type="button"
          className="roto__btn"
          onClick={() => {
            try {
              localStorage.clear()
            } catch {
              /* si no se puede, al menos recargamos */
            }
            location.reload()
          }}
        >
          {t('boundary.action')}
        </button>
      </div>
    )
  }
}
