import { resolve } from 'node:path'
import { defineConfig } from 'electron-vite'
import react from '@vitejs/plugin-react'

// Tre build separate: processo principale, preload (ponte minimo) e renderer (React).
// Il renderer è una normale app Vite: `npm run dev` lo serve anche via http,
// quindi si può aprire in un browser senza Electron.
export default defineConfig({
  main: {},
  preload: {},
  renderer: {
    root: resolve(__dirname, 'src/renderer'),
    plugins: [react()]
  }
})
