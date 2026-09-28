import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

const FONTS = 'https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,300..900&family=Hanken+Grotesk:wght@300..600&family=Cormorant+Garamond:wght@500;600&family=IBM+Plex+Mono:wght@400;500&display=swap'
if (!document.querySelector('link[data-fonts]')) {
  const l = document.createElement('link')
  l.rel = 'stylesheet'
  l.href = FONTS
  l.setAttribute('data-fonts', '')
  document.head.appendChild(l)
}
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
