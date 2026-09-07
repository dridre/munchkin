import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Solo latin: el paquete completo arrastra tailandes y vietnamita, que el
// service worker precargaba en la primera visita de una app en español.
import '@fontsource/chakra-petch/latin-400.css'
import '@fontsource/chakra-petch/latin-500.css'
import '@fontsource/chakra-petch/latin-600.css'
import App from './App.jsx'
import Boundary from './components/Boundary.jsx'
import './styles/main.scss'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Boundary>
      <App />
    </Boundary>
  </StrictMode>,
)
