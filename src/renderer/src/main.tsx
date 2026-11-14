import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import { installTheme } from './ui/theme'
import './ui/ui.css'

installTheme()

const container = document.getElementById('root')
if (!container) throw new Error('Elemento #root mancante in index.html')

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>
)
