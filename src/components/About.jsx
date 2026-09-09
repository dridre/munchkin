import { useT } from '../i18n.jsx'
import { SEO } from '../seo.js'

// El mismo texto que llevan las paginas estaticas, pero dentro de la app y
// visible para una persona. Hace falta que este aqui: Google ejecuta
// JavaScript, asi que indexa el DOM ya montado, y la app borra la semilla del
// HTML al arrancar. Va plegado para no llenar la pantalla de inicio, que sigue
// contando como contenido accesible y no como texto escondido.
export default function About() {
  const { lang } = useT()
  const s = SEO[lang] ?? SEO.en

  return (
    <details className="about">
      <summary className="about__title">{s.aboutTitle}</summary>

      <div className="about__cuerpo">
        <p>{s.lead}</p>

        <h2>{s.featuresTitle}</h2>
        <ul>
          {s.features.map((f) => (
            <li key={f}>{f}</li>
          ))}
        </ul>

        <h2>{s.howTitle}</h2>
        <ol>
          {s.how.map((h) => (
            <li key={h}>{h}</li>
          ))}
        </ol>

        <h2>{s.faqTitle}</h2>
        <dl>
          {s.faq.map((f) => (
            <div key={f.q}>
              <dt>{f.q}</dt>
              <dd>{f.a}</dd>
            </div>
          ))}
        </dl>

        <h2>{s.langsTitle}</h2>
        <p>{s.langsText}</p>
      </div>
    </details>
  )
}
