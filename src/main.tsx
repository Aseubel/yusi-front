import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { initializeTheme } from './stores/themeStore'
import { registerSW } from 'virtual:pwa-register'

// Initialize theme before rendering
initializeTheme()

// Register PWA service worker
registerSW({ immediate: true })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
