/**
 * Vista 3D riusabile per superfici di energia E(k_x, k_y) con stile lavagna:
 *  - importazione dinamica di `three` al montaggio (zero impatto sul bundle iniziale);
 *  - materiale piatto senza illuminazione (MeshBasicMaterial), linee di livello nette,
 *    contorno della prima zona di Brillouin e punti di alta simmetria etichettati;
 *  - cammino k e stato scelto ancorati nello spazio 3D della superficie;
 *  - orbita con trascinamento, zoom con rotella, controllo da tastiera (frecce, +/−);
 *  - rendering su richiesta (nessun ciclo rAF a riposo) e pulizia risorse all'uscita;
 *  - ripiego pulito se WebGL non è disponibile.
 */
import { useCallback, useEffect, useRef, useState, type JSX, type KeyboardEvent } from 'react'
import { useReducedMotion } from '../ui/motion'
import { FONTS, quantityColor, TOKENS } from '../ui/theme'

export type Vec2 = readonly [number, number]

export interface SurfaceMeshSpec {
  readonly id: string
  /** Vertici [kx, ky, E, ...] (3 float per vertice). */
  readonly positions: Float32Array
  /** Indici dei triangoli (3 per triangolo). */
  readonly indices: Uint32Array
  readonly color: string
  readonly opacity?: number
  readonly wireframe?: boolean
  readonly contourLevels?: readonly number[]
  readonly contourColor?: string
  readonly pickable?: boolean
  readonly bandIndex?: number
}

export interface SurfaceSymmetryPoint {
  readonly label: string
  readonly k: Vec2
}

export interface SurfacePathPoint {
  readonly kx: number
  readonly ky: number
  readonly E: number
}

export interface Surface3DProps {
  readonly surfaces: readonly SurfaceMeshSpec[]
  readonly bzOutline: readonly Vec2[]
  readonly symmetryPoints: readonly SurfaceSymmetryPoint[]
  readonly pathOnSurface: readonly SurfacePathPoint[]
  readonly selectedState: SurfacePathPoint | null
  readonly fermiPlane?: { readonly energy: number; readonly color: string } | null
  /** Intervallo di energia per normalizzare l'altezza 3D. */
  readonly eRange: readonly [number, number]
  /** Raggio tipico della zona di Brillouin (Å⁻¹) per calibrare camera e scala. */
  readonly bzRadius: number
  /** Comando camera: cambia seq per far scattare Vista iniziale o Vai a K. */
  readonly cameraAction?: {
    readonly seq: number
    readonly mode: 'reset' | 'focus'
    readonly target?: SurfacePathPoint
  } | null
  readonly onPickPoint?: (kx: number, ky: number, bandIndex: number) => void
  readonly labels: {
    readonly ariaLabel: string
    readonly resetView: string
    readonly focusK?: string
    readonly webglUnavailable: string
    readonly loading: string
  }
  readonly onResetView?: () => void
  readonly onFocusK?: () => void
}

type ThreeModule = typeof import('three')

interface CameraState {
  theta: number
  phi: number
  radius: number
  targetX: number
  targetY: number
  targetZ: number
}

const DEFAULT_THETA = 0.72
const DEFAULT_PHI = 0.96

function defaultCamera(bzRadius: number): CameraState {
  return {
    theta: DEFAULT_THETA,
    phi: DEFAULT_PHI,
    radius: bzRadius * 3.15,
    targetX: 0,
    targetY: 0,
    targetZ: 0
  }
}

function isWebGLAvailable(): boolean {
  try {
    const canvas = document.createElement('canvas')
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl2') || canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    )
  } catch {
    return false
  }
}

/** Estrae segmenti iso-energia su una mesh triangolare. */
function extractContours(
  positions: Float32Array,
  indices: Uint32Array,
  levels: readonly number[],
  eScale: number,
  yLift: number
): Float32Array {
  const out: number[] = []
  const triCount = indices.length / 3
  for (let l = 0; l < levels.length; l++) {
    const level = levels[l]
    for (let t = 0; t < triCount; t++) {
      const i0 = indices[t * 3] * 3
      const i1 = indices[t * 3 + 1] * 3
      const i2 = indices[t * 3 + 2] * 3

      const e0 = positions[i0 + 2]
      const e1 = positions[i1 + 2]
      const e2 = positions[i2 + 2]

      const minE = Math.min(e0, e1, e2)
      const maxE = Math.max(e0, e1, e2)
      if (level < minE || level > maxE || maxE - minE < 1e-9) continue

      const pts: number[] = []
      const edges: readonly [number, number][] = [
        [i0, i1],
        [i1, i2],
        [i2, i0]
      ]
      for (const [ia, ib] of edges) {
        const ea = positions[ia + 2]
        const eb = positions[ib + 2]
        const da = ea - level
        const db = eb - level
        if ((da < 0 && db > 0) || (da > 0 && db < 0) || (da === 0 && db !== 0)) {
          const frac = (level - ea) / (eb - ea)
          const kx = positions[ia] + frac * (positions[ib] - positions[ia])
          const ky = positions[ia + 1] + frac * (positions[ib + 1] - positions[ia + 1])
          pts.push(kx, level * eScale + yLift, -ky)
        }
      }
      if (pts.length >= 6) {
        out.push(pts[0], pts[1], pts[2], pts[3], pts[4], pts[5])
      }
    }
  }
  return new Float32Array(out)
}

function makeLabelTexture(THREE: ThreeModule, text: string, color: string): import('three').CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 128
  canvas.height = 64
  const ctx = canvas.getContext('2d')!
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.font = `600 30px ${FONTS.math}`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = TOKENS.bg
  ctx.lineWidth = 6
  ctx.strokeStyle = TOKENS.bg
  ctx.strokeText(text, 64, 32)
  ctx.fillStyle = color
  ctx.fillText(text, 64, 32)
  const tex = new THREE.CanvasTexture(canvas)
  tex.needsUpdate = true
  return tex
}

export function Surface3D(props: Surface3DProps): JSX.Element {
  const {
    surfaces,
    bzOutline,
    symmetryPoints,
    pathOnSurface,
    selectedState,
    fermiPlane,
    eRange,
    bzRadius,
    cameraAction,
    onPickPoint,
    labels,
    onResetView,
    onFocusK
  } = props

  const reduced = useReducedMotion()
  const hostRef = useRef<HTMLDivElement>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'unavailable'>('loading')

  const threeRef = useRef<ThreeModule | null>(null)
  const rendererRef = useRef<import('three').WebGLRenderer | null>(null)
  const sceneRef = useRef<import('three').Scene | null>(null)
  const cameraRef = useRef<import('three').PerspectiveCamera | null>(null)
  const contentGroupRef = useRef<import('three').Group | null>(null)
  const pickMeshesRef = useRef<Array<{ mesh: import('three').Mesh; bandIndex: number }>>([])

  const camStateRef = useRef<CameraState>(defaultCamera(bzRadius))
  const camTargetRef = useRef<CameraState | null>(null)
  const rafRef = useRef<number | null>(null)
  const lastSeqRef = useRef<number>(-1)
  const onPickRef = useRef(onPickPoint)
  onPickRef.current = onPickPoint

  const eSpan = Math.max(0.5, Math.max(Math.abs(eRange[0]), Math.abs(eRange[1])))
  const eScale = (bzRadius * 0.72) / eSpan

  const renderNow = useCallback(() => {
    const renderer = rendererRef.current
    const scene = sceneRef.current
    const camera = cameraRef.current
    if (!renderer || !scene || !camera) return
    const c = camStateRef.current
    const sinPhi = Math.sin(c.phi)
    camera.position.set(
      c.targetX + c.radius * sinPhi * Math.cos(c.theta),
      c.targetY + c.radius * Math.cos(c.phi),
      c.targetZ + c.radius * sinPhi * Math.sin(c.theta)
    )
    camera.lookAt(c.targetX, c.targetY, c.targetZ)
    renderer.render(scene, camera)
  }, [])

  const scheduleFrame = useCallback(() => {
    if (rafRef.current !== null) return
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null
      const tgt = camTargetRef.current
      if (tgt) {
        if (reduced) {
          camStateRef.current = { ...tgt }
          camTargetRef.current = null
        } else {
          const cur = camStateRef.current
          const alpha = 0.22
          const lerp = (a: number, b: number) => a + (b - a) * alpha
          cur.theta = lerp(cur.theta, tgt.theta)
          cur.phi = lerp(cur.phi, tgt.phi)
          cur.radius = lerp(cur.radius, tgt.radius)
          cur.targetX = lerp(cur.targetX, tgt.targetX)
          cur.targetY = lerp(cur.targetY, tgt.targetY)
          cur.targetZ = lerp(cur.targetZ, tgt.targetZ)
          const done =
            Math.abs(cur.theta - tgt.theta) < 1e-3 &&
            Math.abs(cur.phi - tgt.phi) < 1e-3 &&
            Math.abs(cur.radius - tgt.radius) < 1e-3 &&
            Math.abs(cur.targetX - tgt.targetX) < 1e-3 &&
            Math.abs(cur.targetY - tgt.targetY) < 1e-3 &&
            Math.abs(cur.targetZ - tgt.targetZ) < 1e-3
          if (done) {
            camStateRef.current = { ...tgt }
            camTargetRef.current = null
          } else {
            scheduleFrame()
          }
        }
      }
      renderNow()
    })
  }, [reduced, renderNow])

  // Inizializzazione dinamica di Three.js (solo al montaggio della sezione)
  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    if (!isWebGLAvailable()) {
      setStatus('unavailable')
      return
    }

    let cancelled = false
    let resizeObs: ResizeObserver | null = null
    let renderer: import('three').WebGLRenderer | null = null

    import('three')
      .then((THREE) => {
        if (cancelled) return
        try {
          renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'default' })
        } catch {
          setStatus('unavailable')
          return
        }
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
        renderer.setClearColor(TOKENS.bg, 1)
        const w = Math.max(10, host.clientWidth)
        const h = Math.max(10, host.clientHeight)
        renderer.setSize(w, h, false)
        renderer.domElement.style.width = '100%'
        renderer.domElement.style.height = '100%'
        renderer.domElement.style.display = 'block'
        host.appendChild(renderer.domElement)

        const scene = new THREE.Scene()
        const camera = new THREE.PerspectiveCamera(38, w / h, 0.05, 100)
        const group = new THREE.Group()
        scene.add(group)

        threeRef.current = THREE
        rendererRef.current = renderer
        sceneRef.current = scene
        cameraRef.current = camera
        contentGroupRef.current = group
        camStateRef.current = defaultCamera(bzRadius)

        resizeObs = new ResizeObserver(() => {
          if (!rendererRef.current || !cameraRef.current || !hostRef.current) return
          const nw = Math.max(10, hostRef.current.clientWidth)
          const nh = Math.max(10, hostRef.current.clientHeight)
          rendererRef.current.setSize(nw, nh, false)
          cameraRef.current.aspect = nw / nh
          cameraRef.current.updateProjectionMatrix()
          scheduleFrame()
        })
        resizeObs.observe(host)
        setStatus('ready')
      })
      .catch(() => {
        if (!cancelled) setStatus('unavailable')
      })

    return () => {
      cancelled = true
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
      if (resizeObs) resizeObs.disconnect()
      if (contentGroupRef.current) {
        disposeGroup(contentGroupRef.current)
      }
      if (renderer) {
        renderer.dispose()
        if (renderer.domElement.parentNode === host) {
          host.removeChild(renderer.domElement)
        }
      }
      rendererRef.current = null
      sceneRef.current = null
      cameraRef.current = null
      contentGroupRef.current = null
      pickMeshesRef.current = []
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Ricostruzione della geometria quando cambiano superfici, stato o strumenti
  useEffect(() => {
    const THREE = threeRef.current
    const group = contentGroupRef.current
    if (status !== 'ready' || !THREE || !group) return

    disposeGroup(group)
    pickMeshesRef.current = []

    // 1. Superfici 3D + linee di livello nette
    for (const spec of surfaces) {
      const nVerts = spec.positions.length / 3
      const posArr = new Float32Array(nVerts * 3)
      for (let i = 0; i < nVerts; i++) {
        posArr[i * 3] = spec.positions[i * 3]
        posArr[i * 3 + 1] = spec.positions[i * 3 + 2] * eScale
        posArr[i * 3 + 2] = -spec.positions[i * 3 + 1]
      }
      const geom = new THREE.BufferGeometry()
      geom.setAttribute('position', new THREE.BufferAttribute(posArr, 3))
      geom.setIndex(new THREE.BufferAttribute(spec.indices, 1))
      geom.computeBoundingSphere()

      const opacity = spec.opacity ?? 0.88
      const mat = new THREE.MeshBasicMaterial({
        color: spec.color,
        side: THREE.DoubleSide,
        transparent: opacity < 1,
        opacity,
        wireframe: !!spec.wireframe,
        depthWrite: opacity >= 0.85,
        polygonOffset: true,
        polygonOffsetFactor: 1,
        polygonOffsetUnits: 1
      })
      const mesh = new THREE.Mesh(geom, mat)
      group.add(mesh)
      if (spec.pickable) {
        pickMeshesRef.current.push({ mesh, bandIndex: spec.bandIndex ?? 0 })
      }

      if (spec.contourLevels && spec.contourLevels.length > 0) {
        const segs = extractContours(spec.positions, spec.indices, spec.contourLevels, eScale, 0.004)
        if (segs.length > 0) {
          const cGeom = new THREE.BufferGeometry()
          cGeom.setAttribute('position', new THREE.BufferAttribute(segs, 3))
          const cMat = new THREE.LineBasicMaterial({
            color: spec.contourColor ?? TOKENS.bg,
            transparent: true,
            opacity: 0.72
          })
          group.add(new THREE.LineSegments(cGeom, cMat))
        }
      }
    }

    // 2. Piano della prima zona di Brillouin + etichette
    const bzY = eRange[0] * eScale - bzRadius * 0.14
    if (bzOutline.length >= 3) {
      const pts = bzOutline.map(([kx, ky]) => new THREE.Vector3(kx, bzY, -ky))
      pts.push(new THREE.Vector3(bzOutline[0][0], bzY, -bzOutline[0][1]))
      const bzGeom = new THREE.BufferGeometry().setFromPoints(pts)
      const bzMat = new THREE.LineBasicMaterial({ color: quantityColor('a') })
      group.add(new THREE.Line(bzGeom, bzMat))
    }

    for (const sp of symmetryPoints) {
      const dotGeom = new THREE.SphereGeometry(bzRadius * 0.024, 12, 8)
      const dotMat = new THREE.MeshBasicMaterial({ color: quantityColor('a') })
      const dot = new THREE.Mesh(dotGeom, dotMat)
      dot.position.set(sp.k[0], bzY, -sp.k[1])
      group.add(dot)

      const tex = makeLabelTexture(THREE, sp.label, TOKENS.textSoft)
      const spriteMat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false })
      const sprite = new THREE.Sprite(spriteMat)
      sprite.position.set(sp.k[0] * 1.12, bzY - bzRadius * 0.09, -sp.k[1] * 1.12)
      sprite.scale.set(bzRadius * 0.28, bzRadius * 0.14, 1)
      group.add(sprite)
    }

    // 3. Cammino sulla superficie
    if (pathOnSurface.length >= 2) {
      const pathPts = pathOnSurface.map((p) => new THREE.Vector3(p.kx, p.E * eScale + 0.012, -p.ky))
      const pathGeom = new THREE.BufferGeometry().setFromPoints(pathPts)
      const pathMat = new THREE.LineBasicMaterial({ color: quantityColor('k') })
      group.add(new THREE.Line(pathGeom, pathMat))
    }

    // 4. Piano E_F semitrasparente e linea di Fermi
    if (fermiPlane) {
      const fy = fermiPlane.energy * eScale
      const planeSize = bzRadius * 2.25
      const pGeom = new THREE.PlaneGeometry(planeSize, planeSize)
      pGeom.rotateX(-Math.PI / 2)
      const pMat = new THREE.MeshBasicMaterial({
        color: fermiPlane.color,
        transparent: true,
        opacity: 0.18,
        side: THREE.DoubleSide,
        depthWrite: false
      })
      const pMesh = new THREE.Mesh(pGeom, pMat)
      pMesh.position.y = fy
      group.add(pMesh)

      for (const spec of surfaces) {
        if (!spec.pickable) continue
        const fermiSegs = extractContours(spec.positions, spec.indices, [fermiPlane.energy], eScale, 0.015)
        if (fermiSegs.length > 0) {
          const fGeom = new THREE.BufferGeometry()
          fGeom.setAttribute('position', new THREE.BufferAttribute(fermiSegs, 3))
          const fMat = new THREE.LineBasicMaterial({ color: fermiPlane.color })
          group.add(new THREE.LineSegments(fGeom, fMat))
        }
      }
    }

    // 5. Stato selezionato sulla superficie + proiezione sulla zona
    if (selectedState) {
      const sx = selectedState.kx
      const sy = selectedState.E * eScale + 0.015
      const sz = -selectedState.ky
      const sGeom = new THREE.SphereGeometry(bzRadius * 0.042, 16, 12)
      const sMat = new THREE.MeshBasicMaterial({ color: quantityColor('k') })
      const sMesh = new THREE.Mesh(sGeom, sMat)
      sMesh.position.set(sx, sy, sz)
      group.add(sMesh)

      const dropGeom = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(sx, sy, sz),
        new THREE.Vector3(sx, bzY, sz)
      ])
      const dropMat = new THREE.LineDashedMaterial({
        color: quantityColor('k'),
        dashSize: bzRadius * 0.06,
        gapSize: bzRadius * 0.04,
        transparent: true,
        opacity: 0.7
      })
      const dropLine = new THREE.Line(dropGeom, dropMat)
      dropLine.computeLineDistances()
      group.add(dropLine)
    }

    scheduleFrame()
  }, [status, surfaces, bzOutline, symmetryPoints, pathOnSurface, selectedState, fermiPlane, eRange, bzRadius, eScale, scheduleFrame])

  // Gestione comandi camera (Vista iniziale / Vai a K)
  useEffect(() => {
    if (!cameraAction || cameraAction.seq === lastSeqRef.current) return
    lastSeqRef.current = cameraAction.seq
    if (cameraAction.mode === 'reset') {
      camTargetRef.current = defaultCamera(bzRadius)
    } else if (cameraAction.mode === 'focus' && cameraAction.target) {
      camTargetRef.current = {
        theta: 0.55,
        phi: 1.05,
        radius: bzRadius * 1.45,
        targetX: cameraAction.target.kx,
        targetY: cameraAction.target.E * eScale,
        targetZ: -cameraAction.target.ky
      }
    }
    scheduleFrame()
  }, [cameraAction, bzRadius, eScale, scheduleFrame])

  // Interazione puntatore (orbita + click raycast sulla superficie)
  useEffect(() => {
    const host = hostRef.current
    if (!host || status !== 'ready') return

    let dragging = false
    let moved = 0
    let lastX = 0
    let lastY = 0

    const onDown = (e: PointerEvent): void => {
      if (e.button !== 0) return
      dragging = true
      moved = 0
      lastX = e.clientX
      lastY = e.clientY
      camTargetRef.current = null
      host.setPointerCapture(e.pointerId)
    }

    const onMove = (e: PointerEvent): void => {
      if (!dragging) return
      const dx = e.clientX - lastX
      const dy = e.clientY - lastY
      moved += Math.hypot(dx, dy)
      lastX = e.clientX
      lastY = e.clientY
      const c = camStateRef.current
      c.theta += dx * 0.008
      c.phi = Math.max(0.18, Math.min(Math.PI - 0.18, c.phi - dy * 0.008))
      scheduleFrame()
    }

    const onUp = (e: PointerEvent): void => {
      if (!dragging) return
      dragging = false
      if (host.hasPointerCapture(e.pointerId)) host.releasePointerCapture(e.pointerId)
      if (moved < 5 && threeRef.current && cameraRef.current && rendererRef.current && onPickRef.current) {
        const rect = rendererRef.current.domElement.getBoundingClientRect()
        const ndcX = ((e.clientX - rect.left) / rect.width) * 2 - 1
        const ndcY = -((e.clientY - rect.top) / rect.height) * 2 + 1
        const THREE = threeRef.current
        const ray = new THREE.Raycaster()
        ray.setFromCamera(new THREE.Vector2(ndcX, ndcY), cameraRef.current)
        const targets = pickMeshesRef.current.map((p) => p.mesh)
        const hits = ray.intersectObjects(targets, false)
        if (hits.length > 0) {
          const hit = hits[0]
          const entry = pickMeshesRef.current.find((p) => p.mesh === hit.object)
          onPickRef.current(hit.point.x, -hit.point.z, entry?.bandIndex ?? 0)
        }
      }
    }

    const onWheel = (e: WheelEvent): void => {
      e.preventDefault()
      camTargetRef.current = null
      const c = camStateRef.current
      const factor = e.deltaY > 0 ? 1.08 : 0.92
      c.radius = Math.max(bzRadius * 0.85, Math.min(bzRadius * 7, c.radius * factor))
      scheduleFrame()
    }

    host.addEventListener('pointerdown', onDown)
    host.addEventListener('pointermove', onMove)
    host.addEventListener('pointerup', onUp)
    host.addEventListener('pointercancel', onUp)
    host.addEventListener('wheel', onWheel, { passive: false })
    return () => {
      host.removeEventListener('pointerdown', onDown)
      host.removeEventListener('pointermove', onMove)
      host.removeEventListener('pointerup', onUp)
      host.removeEventListener('pointercancel', onUp)
      host.removeEventListener('wheel', onWheel)
    }
  }, [status, bzRadius, scheduleFrame])

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>): void => {
    const c = camStateRef.current
    let handled = true
    if (e.key === 'ArrowLeft') c.theta -= 0.1
    else if (e.key === 'ArrowRight') c.theta += 0.1
    else if (e.key === 'ArrowUp') c.phi = Math.max(0.18, c.phi - 0.1)
    else if (e.key === 'ArrowDown') c.phi = Math.min(Math.PI - 0.18, c.phi + 0.1)
    else if (e.key === '+' || e.key === '=') c.radius = Math.max(bzRadius * 0.85, c.radius * 0.9)
    else if (e.key === '-' || e.key === '_') c.radius = Math.min(bzRadius * 7, c.radius * 1.1)
    else handled = false
    if (handled) {
      e.preventDefault()
      camTargetRef.current = null
      scheduleFrame()
    }
  }

  return (
    <div className="surface3d-wrap">
      <div
        ref={hostRef}
        className="surface3d-canvas-host"
        tabIndex={0}
        role="img"
        aria-label={labels.ariaLabel}
        onKeyDown={onKeyDown}
      >
        {status === 'loading' && <div className="surface3d-fallback">{labels.loading}</div>}
        {status === 'unavailable' && <div className="surface3d-fallback">{labels.webglUnavailable}</div>}
      </div>
      <div className="surface3d-actions">
        {onResetView && (
          <button type="button" className="surface3d-btn" onClick={onResetView}>
            {labels.resetView}
          </button>
        )}
        {onFocusK && labels.focusK && (
          <button type="button" className="surface3d-btn" onClick={onFocusK}>
            {labels.focusK}
          </button>
        )}
      </div>
    </div>
  )
}

function disposeGroup(group: import('three').Group): void {
  while (group.children.length > 0) {
    const child = group.children[0]
    group.remove(child)
    const anyChild = child as unknown as {
      geometry?: { dispose: () => void }
      material?: { dispose: () => void; map?: { dispose: () => void } | null } | Array<{ dispose: () => void }>
    }
    anyChild.geometry?.dispose()
    if (Array.isArray(anyChild.material)) {
      for (const m of anyChild.material) m.dispose()
    } else if (anyChild.material) {
      anyChild.material.map?.dispose()
      anyChild.material.dispose()
    }
  }
}
