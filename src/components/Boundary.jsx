import { Component } from 'react'

// Ultima red: si algo revienta a mitad de partida, la PWA instalada se queda en
// negro y recargar no arregla nada, porque el estado malo esta guardado. Esto da
// la salida sin tener que borrar los datos del sitio a mano.
export default class Boundary extends Component {
  state = { roto: false }

  static getDerivedStateFromError() {
    return { roto: true }
  }

  render() {
    if (!this.state.roto) return this.props.children

    return (
      <div className="roto">
        <h1 className="roto__title">Se ha atascado</h1>
        <p className="roto__hint">
          La partida guardada en este aparato no se puede leer. Empezando de cero se arregla.
        </p>
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
          Empezar de cero
        </button>
      </div>
    )
  }
}
