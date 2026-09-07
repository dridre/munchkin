// Calavera simple: craneo, dos cuencas grandes y nariz. Las cuencas grandes son
// lo que la hace reconocible a 20 px; con huesos cruzados o dientes se
// emborrona. Los huecos son del propio trazo (fill-rule evenodd), asi que vale
// sobre cualquier color de jugador.
export default function SkullIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M12 2C6.8 2 3 5.9 3 10.6c0 2.6 1.2 4.9 3.1 6.3v1.9c0 1.7 1.4 3.2 3.2 3.2h5.4c1.8 0 3.2-1.4 3.2-3.2v-1.9c1.9-1.4 3.1-3.7 3.1-6.3C21 5.9 17.2 2 12 2Zm-3.6 5.6a3 3.2 0 1 0 0 6.4 3 3.2 0 0 0 0-6.4Zm7.2 0a3 3.2 0 1 0 0 6.4 3 3.2 0 0 0 0-6.4ZM12 15.4l1.5 2.8h-3l1.5-2.8Z"
      />
    </svg>
  )
}
