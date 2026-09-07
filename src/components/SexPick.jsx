// Mismo par de botones en la ficha del jugador y en la pantalla de creacion.
export default function SexPick({ sex, onChange }) {
  return (
    <div className="sex-pick">
      <button
        type="button"
        className={`sex-btn sex-btn--male${sex === 'm' ? ' sex-btn--on' : ''}`}
        aria-label="Hombre"
        aria-pressed={sex === 'm'}
        onClick={() => onChange('m')}
      >
        ♂
      </button>
      <button
        type="button"
        className={`sex-btn sex-btn--female${sex === 'f' ? ' sex-btn--on' : ''}`}
        aria-label="Mujer"
        aria-pressed={sex === 'f'}
        onClick={() => onChange('f')}
      >
        ♀
      </button>
    </div>
  )
}
