/**
 * Stringhe in italiano della sezione «Legami forti in 2D».
 */
export const strings = {
  title: 'Legami forti in 2D',
  lattice: {
    label: 'Reticolo',
    square: 'Quadrato',
    graphene: 'Grafene',
    squareTitle: 'Reticolo quadrato con un orbitale s per atomo (banda unica)',
    grapheneTitle: 'Grafene: nido d’ape con due atomi A e B per cella (bande π e π*)'
  },
  params: {
    t: 'integrale di salto',
    a: 'passo reticolare',
    aFixed: 'passo fisso a = 2,46 Å (a_CC = 1,42 Å)',
    electronsLabel: 'Elettroni per cella'
  },
  tools: {
    fill: 'Riempimento',
    fillTitle: 'Mostra il livello di Fermi E_F e la linea di Fermi sulla superficie',
    mass: 'Massa efficace',
    massTitle: 'Quadrato: paraboloide osculatore al fondo; grafene: m* da curvatura contro m̃',
    compare: 'Confronto',
    compareTitle: 'Quadrato: parabola dell’elettrone libero; grafene: cono di Dirac attorno a K'
  },
  views: {
    surface: {
      title: 'Superficie E(k_x, k_y)',
      ariaLabel: 'Superficie 3D dell’energia E(k_x, k_y) sopra la prima zona di Brillouin',
      resetView: 'Vista iniziale',
      focusK: 'Vai a K',
      webglUnavailable: 'WebGL non è disponibile in questo ambiente: le altre due viste restano attive.',
      loading: 'Caricamento vista 3D…',
      legendAria: 'Legenda della superficie 3D',
      bandS: 'Banda s',
      bandPi: 'Banda π',
      bandPiStar: 'Banda π*',
      bz: 'Prima zona',
      path: 'Cammino k',
      fermi: 'E_F (linea di Fermi)',
      paraboloid: 'Paraboloide osculatore',
      freeElectron: 'Elettrone libero',
      diracCone: 'Cono di Dirac'
    },
    bands: {
      title: 'Bande lungo il cammino',
      titleGraphene: 'Bande lungo il cammino e g(E)',
      ariaLabel: 'Diagramma delle bande lungo il cammino di alta simmetria',
      energyAxis: 'E (eV)',
      dosAxis: 'g(E)',
      legendAria: 'Legenda del diagramma a bande'
    },
    realSpace: {
      title: 'Spazio reale',
      ariaLabel: 'Reticolo bidimensionale nello spazio reale con cella primitiva',
      legendAria: 'Legenda dello spazio reale',
      atomS: 'Atomo (orbitale s)',
      atomA: 'Sottoreticolo A',
      atomB: 'Sottoreticolo B',
      cell: 'Cella primitiva',
      nn: 'Primi vicini δ_i'
    }
  },
  values: {
    heading: 'Valori',
    gamma: 'E(Γ)',
    x: 'E(X)',
    m: 'E(M)',
    k: 'E(K)',
    width: 'Larghezza W',
    selectedK: 'Stato k',
    selectedE: 'E(k)',
    vF: 'Velocità di Fermi v_F',
    vFOverC: 'v_F / c',
    dosEf: 'g(E_F)',
    fermiLevel: 'Livello di Fermi E_F',
    mStarBottom: 'm* al fondo (Γ)',
    mStarCurvature: 'm* (curvatura)',
    mTilde: 'm̃ = ħq/v_F',
    grapheneFillingHint:
      'Banda π piena (2 elettroni π per cella): E_F passa esattamente per i vertici K e K′ dove g(E_F) = 0 (semimetallo).'
  },
  theory: {
    heading: 'In breve',
    points: [
      'In due dimensioni E(k_x, k_y) è una superficie sopra la prima zona di Brillouin: i diagrammi lungo Γ–X–M–Γ o Γ–M–K–Γ sono tagli di quella superficie.',
      'Nel reticolo quadrato la banda s è larga 8t; con 1 elettrone per cella E_F = Ē_s e la linea di Fermi |k_x| + |k_y| = π/a è un quadrato ruotato di 45°.',
      'Nel grafene i due atomi equivalenti A e B per cella (come la catena biatomica con E_A = E_B) chiudono il gap: le bande π e π* si toccano nei vertici K e K′ formando coni di Dirac, con g(E_F) = 0 e m* da curvatura priva di senso (mentre m̃ = ħq/v_F → 0).'
    ],
    linkTitle: 'Collegamento con «Legami forti»',
    linkBody:
      'La formula del grafene è la stessa della catena biatomica A–B con E_A = E_B = Ē_p: l’equivalenza dei due sottoreticoli annulla il gap nei vertici K e K′.'
  }
} as const
