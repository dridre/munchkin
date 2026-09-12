// Genera una pagina estatica por idioma antes de compilar: la raiz en español y
// una carpeta por cada uno de los demas. Cada una lleva su titulo, su
// descripcion y su texto ya traducidos, y los `hreflang` cruzados que le dicen a
// Google que son la misma pagina en otro idioma.
//
// Sin esto habia una sola URL en español: para una busqueda en ingles no habia
// nada que encontrar, porque la traduccion la hace JavaScript despues de cargar.
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { PATHS, SEO, SITE } from '../src/seo.js'

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '..')

const escapar = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const li = (items) => items.map((x) => `          <li>${escapar(x)}</li>`).join('\n')

const alternates = Object.entries(PATHS)
  .map(([code, path]) => `    <link rel="alternate" hreflang="${code}" href="${SITE}${path}" />`)
  .join('\n')

function pagina(code) {
  const s = SEO[code]
  const url = `${SITE}${PATHS[code]}`

  const datos = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: s.name,
    url,
    applicationCategory: 'GameApplication',
    operatingSystem: 'Web',
    isAccessibleForFree: true,
    inLanguage: code,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
    description: s.description,
  }

  // El nombre que sale encima de la direccion en Google. Sin esto lo adivina, y
  // en un subdominio de pages.dev adivina "Cloudflare". Solo va en la portada.
  const sitio = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SEO.es.name,
    alternateName: [...new Set(Object.values(SEO).map((x) => x.name))].filter((n) => n !== SEO.es.name),
    url: `${SITE}/`,
  }

  return `<!doctype html>
<html lang="${code}">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/icon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <meta name="theme-color" content="#0d1013" />
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />

    <title>${escapar(s.title)}</title>
    <meta name="description" content="${escapar(s.description)}" />
    <link rel="canonical" href="${url}" />
    <meta name="robots" content="index, follow" />
${alternates}
    <link rel="alternate" hreflang="x-default" href="${SITE}/" />

    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="${escapar(s.name)}" />
    <meta property="og:title" content="${escapar(s.name)}" />
    <meta property="og:description" content="${escapar(s.description)}" />
    <meta property="og:url" content="${url}" />
    <meta property="og:locale" content="${code}" />
    <meta property="og:image" content="${SITE}/og.png" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta name="twitter:card" content="summary_large_image" />

    <script type="application/ld+json">
${JSON.stringify(PATHS[code] === '/' ? [sitio, datos] : datos, null, 2)
  .split('\n')
  .map((l) => '      ' + l)
  .join('\n')}
    </script>
  </head>
  <body>
    <!-- Lo de dentro de #root lo sustituye la app al arrancar. Esta aqui para
         quien llegue sin JavaScript y para los rastreadores que no lo ejecutan.
         El mismo texto lo ve una persona al final de la pantalla de inicio. -->
    <div id="root">
      <main class="semilla">
        <h1>${escapar(s.name)}</h1>
        <p>${escapar(s.lead)}</p>

        <h2>${escapar(s.featuresTitle)}</h2>
        <ul>
${li(s.features)}
        </ul>

        <h2>${escapar(s.howTitle)}</h2>
        <ol>
${li(s.how)}
        </ol>

        <h2>${escapar(s.faqTitle)}</h2>
${s.faq
  .map((f) => `        <h3>${escapar(f.q)}</h3>\n        <p>${escapar(f.a)}</p>`)
  .join('\n')}

        <h2>${escapar(s.langsTitle)}</h2>
        <p>${escapar(s.langsText)}</p>
      </main>
    </div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
`
}

for (const [code, path] of Object.entries(PATHS)) {
  const destino = resolve(raiz, path === '/' ? 'index.html' : `${path.slice(1)}index.html`)
  mkdirSync(dirname(destino), { recursive: true })
  writeFileSync(destino, pagina(code), 'utf8')
  console.log('pagina', path)
}

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${Object.entries(PATHS)
  .map(
    ([, path]) => `  <url>
    <loc>${SITE}${path}</loc>
${Object.entries(PATHS)
  .map(([c, p]) => `    <xhtml:link rel="alternate" hreflang="${c}" href="${SITE}${p}" />`)
  .join('\n')}
    <changefreq>monthly</changefreq>
  </url>`,
  )
  .join('\n')}
</urlset>
`
writeFileSync(resolve(raiz, 'public/sitemap.xml'), sitemap, 'utf8')
console.log('sitemap con', Object.keys(PATHS).length, 'idiomas')
