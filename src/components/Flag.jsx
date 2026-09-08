// Banderas dibujadas a mano. Material UI no trae banderas de paises (solo un
// icono generico), y las banderas emoji no se dibujan en Windows: salen como
// "ES", "GB". Seis SVG simplificados pesan nada y se ven igual en todas partes.
const FLAGS = {
  es: (
    <>
      <rect width="20" height="14" fill="#c60b1e" />
      <rect y="3.5" width="20" height="7" fill="#ffc400" />
    </>
  ),
  en: (
    <>
      <rect width="20" height="14" fill="#012169" />
      <path d="M0 0 20 14M20 0 0 14" stroke="#fff" strokeWidth="2.8" />
      <path d="M0 0 20 14M20 0 0 14" stroke="#c8102e" strokeWidth="1.4" />
      <path d="M10 0v14M0 7h20" stroke="#fff" strokeWidth="4.6" />
      <path d="M10 0v14M0 7h20" stroke="#c8102e" strokeWidth="2.6" />
    </>
  ),
  fr: (
    <>
      <rect width="20" height="14" fill="#fff" />
      <rect width="6.67" height="14" fill="#002395" />
      <rect x="13.33" width="6.67" height="14" fill="#ed2939" />
    </>
  ),
  de: (
    <>
      <rect width="20" height="14" fill="#000" />
      <rect y="4.67" width="20" height="4.67" fill="#d00" />
      <rect y="9.33" width="20" height="4.67" fill="#ffce00" />
    </>
  ),
  it: (
    <>
      <rect width="20" height="14" fill="#f4f5f0" />
      <rect width="6.67" height="14" fill="#008c45" />
      <rect x="13.33" width="6.67" height="14" fill="#cd212a" />
    </>
  ),
  pt: (
    <>
      <rect width="20" height="14" fill="#f00" />
      <rect width="8" height="14" fill="#060" />
      <circle cx="8" cy="7" r="2.7" fill="#ffcc00" stroke="#c00" strokeWidth=".7" />
    </>
  ),
}

export default function Flag({ code, className = 'bandera' }) {
  return (
    <svg className={className} viewBox="0 0 20 14" aria-hidden="true">
      {FLAGS[code] ?? FLAGS.en}
    </svg>
  )
}
