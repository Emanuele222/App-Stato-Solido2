export interface ElectronShellInfo {
  readonly isElectron: true
  readonly platform: string
}

declare global {
  interface Window {
    /** Presente solo dentro Electron; `undefined` nel browser. */
    readonly electronShell?: ElectronShellInfo
  }
}
