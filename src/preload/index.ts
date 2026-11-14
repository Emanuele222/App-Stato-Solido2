import { contextBridge } from 'electron'

// Ponte minimo, nessuna logica. Il renderer non deve dipendere da questo
// oggetto: aperto in un browser semplicemente non esiste.
contextBridge.exposeInMainWorld('electronShell', {
  isElectron: true,
  platform: process.platform
})
