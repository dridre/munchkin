import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { version } from './package.json'
import { PATHS } from './src/seo.js'

// Una entrada por idioma: index.html en la raiz y una carpeta por cada otro.
const entradas = Object.fromEntries(
  Object.entries(PATHS).map(([code, path]) => [
    code,
    path === '/' ? 'index.html' : `${path.slice(1)}index.html`,
  ]),
)

export default defineConfig({
  // Absoluto, no relativo: las paginas de /en/, /fr/... tienen que apuntar a
  // los mismos /assets, no a /en/assets.
  base: '/',
  build: { rollupOptions: { input: entradas } },
  // Para poder ensenarla en la app: si alguien reporta algo, lo primero es
  // saber que version lleva.
  define: { __VERSION__: JSON.stringify(version) },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: { globPatterns: ['**/*.{js,css,html,svg,woff2}'] },
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'Munchkin Contador de Niveles',
        short_name: 'Munchkin',
        description:
          'Contador de niveles y equipo para Munchkin. Cada uno lleva su personaje desde su movil y la mesa lo ve todo.',
        lang: 'es',
        start_url: '/',
        display: 'fullscreen',
        background_color: '#14110f',
        theme_color: '#14110f',
        icons: [
          { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' },
        ],
      },
    }),
  ],
})
