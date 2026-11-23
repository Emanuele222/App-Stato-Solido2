/**
 * Sezione «Legami forti in 2D» (dispense P4 §1.4, §6):
 *  - reticolo quadrato (banda s larga 8t, linea di Fermi a metà riempimento) e
 *    grafene (bande π e π*, coni di Dirac in K e K′, g(E) lineare, massa m̃);
 *  - tre viste collegate: superficie 3D (Three.js caricato dinamicamente),
 *    bande lungo il cammino (+ g(E) per il grafene) e spazio reale 2D;
 *  - formula viva, valori, strumenti e scheda teoria.
 */
import { useCallback, type JSX } from 'react'
import { Panel, ParamSlider, Stepper, ToolToggle } from '../../ui/controls'
import { formatEffectiveMassRatio, formatNumber, formatSignificant } from '../../ui/format'
import { SceneView, SectionLayout } from '../../ui/shell'
import { Tex } from '../../ui/tex'
import { quantityColor, toneColor, TOKENS, type QuantityId } from '../../ui/theme'
import { shellStrings } from '../../strings'
import { ChartLegend, type LegendEntry } from '../../viz/ChartLegend'
import { LiveFormula } from '../../viz/LiveFormula'
import { Surface3D } from '../../viz/Surface3D'
import {
  GRAPHENE_DEFINITIONS,
  GRAPHENE_MAIN_FORMULA,
  SQUARE_DEFINITIONS,
  SQUARE_MAIN_FORMULA
} from './formulas'
import { GRAPHENE_T_PARAM, NUMERICS_2D, SQUARE_PARAMS, type Lattice2D } from './manifest'
import { useTightBinding2DModel } from './model'
import { PathBandPlot } from './PathBandPlot'
import { RealSpace2DCanvas } from './RealSpace2DCanvas'
import { useTightBinding2DStore } from './store'
import { strings as s } from './strings'
import './tightBinding2d.css'
import { grapheneHighSymmetryPoints } from '../../physics'

function formatVelocitySci(v: number): string {
  const exp = Math.floor(Math.log10(v))
  const mant = v / Math.pow(10, exp)
  return `${formatNumber(mant, 2)}·10^${exp} m/s`
}

export function TightBinding2DSection(): JSX.Element {
  const st = useTightBinding2DStore()
  const model = useTightBinding2DModel(
    st.lattice,
    st.squareParams,
    st.grapheneT,
    st.electrons,
    st.selectedK,
    st.tools
  )

  const onHoverQuantity = useCallback((q: QuantityId | null) => {
    useTightBinding2DStore.getState().setHighlight(q)
  }, [])

  const onPickPath = useCallback((kx: number, ky: number, band: 0 | 1, pathFrac: number) => {
    useTightBinding2DStore.getState().selectOnPath(kx, ky, band, pathFrac)
  }, [])

  const onPickSurface = useCallback((kx: number, ky: number, bandIndex: number) => {
    useTightBinding2DStore.getState().selectSurfacePoint(kx, ky, bandIndex >= 1 ? 1 : 0)
  }, [])

  const cameraTarget =
    st.lattice === 'graphene' && st.cameraAction.mode === 'focus'
      ? { kx: grapheneHighSymmetryPoints().K[0], ky: grapheneHighSymmetryPoints().K[1], E: 0 }
      : undefined

  const surfaceLegend: LegendEntry[] = [
    ...(st.lattice === 'square'
      ? [{ id: 'band-s', keyKind: 'solid' as const, color: quantityColor('E'), label: s.views.surface.bandS }]
      : [
          { id: 'band-pi', keyKind: 'solid' as const, color: quantityColor('E'), label: s.views.surface.bandPi },
          {
            id: 'band-pistar',
            keyKind: 'solid' as const,
            color: toneColor('conductionBands'),
            label: s.views.surface.bandPiStar
          }
        ]),
    { id: 'bz', keyKind: 'solid' as const, color: quantityColor('a'), label: s.views.surface.bz },
    { id: 'path', keyKind: 'solid' as const, color: quantityColor('k'), label: s.views.surface.path },
    ...(st.tools.fill
      ? [{ id: 'fermi', keyKind: 'solid' as const, color: quantityColor('EF'), label: s.views.surface.fermi }]
      : []),
    ...(st.tools.mass && st.lattice === 'square'
      ? [
          {
            id: 'parab',
            keyKind: 'dashed' as const,
            color: quantityColor('mstar'),
            label: s.views.surface.paraboloid
          }
        ]
      : []),
    ...(st.tools.compare
      ? [
          {
            id: 'cmp',
            keyKind: 'dashed' as const,
            color: st.lattice === 'graphene' ? quantityColor('v') : quantityColor('Ek'),
            label: st.lattice === 'graphene' ? s.views.surface.diracCone : s.views.surface.freeElectron
          }
        ]
      : [])
  ]

  const realLegend: LegendEntry[] =
    st.lattice === 'square'
      ? [
          { id: 'atom', keyKind: 'dot', color: TOKENS.text, label: s.views.realSpace.atomS },
          { id: 'cell', keyKind: 'solid', color: quantityColor('a'), label: s.views.realSpace.cell }
        ]
      : [
          { id: 'atomA', keyKind: 'dot', color: quantityColor('a'), label: s.views.realSpace.atomA },
          { id: 'atomB', keyKind: 'dot', color: quantityColor('EF'), label: s.views.realSpace.atomB },
          { id: 'nn', keyKind: 'solid', color: quantityColor('t'), label: s.views.realSpace.nn }
        ]

  const commands = (
    <div className="tb2d-controls">
      <div className="tb2d-lattice-switch" role="group" aria-label={s.lattice.label}>
        <span>{s.lattice.label}</span>
        <div className="tb2d-lattice-group">
          {(['square', 'graphene'] as const).map((lat: Lattice2D) => (
            <button
              key={lat}
              type="button"
              className="tb2d-lattice-btn"
              aria-pressed={st.lattice === lat}
              title={lat === 'square' ? s.lattice.squareTitle : s.lattice.grapheneTitle}
              onClick={() => st.setLattice(lat)}
            >
              {s.lattice[lat]}
            </button>
          ))}
        </div>
      </div>

      {st.lattice === 'square' ? (
        <>
          {SQUARE_PARAMS.map((spec) => (
            <ParamSlider
              key={spec.id}
              quantity={spec.quantity}
              symbol={spec.symbol}
              label={s.params[spec.id]}
              value={st.squareParams[spec.id]}
              min={spec.min}
              max={spec.max}
              step={spec.step}
              unit={spec.unit}
              digits={spec.digits}
              active={st.highlight === spec.quantity}
              onChange={(val) => st.setSquareParam(spec.id, val)}
              onHighlight={(q) => st.setHighlight(q)}
            />
          ))}
          <Stepper
            label={s.params.electronsLabel}
            value={st.electrons}
            min={NUMERICS_2D.electrons.min}
            max={NUMERICS_2D.electrons.max}
            onChange={(n) => st.setElectrons(n >= 2 ? 2 : 1)}
            decreaseLabel="Riduci elettroni per cella"
            increaseLabel="Aumenta elettroni per cella"
          />
        </>
      ) : (
        <>
          <ParamSlider
            quantity={GRAPHENE_T_PARAM.quantity}
            symbol={GRAPHENE_T_PARAM.symbol}
            label={s.params.t}
            value={st.grapheneT}
            min={GRAPHENE_T_PARAM.min}
            max={GRAPHENE_T_PARAM.max}
            step={GRAPHENE_T_PARAM.step}
            unit={GRAPHENE_T_PARAM.unit}
            digits={GRAPHENE_T_PARAM.digits}
            active={st.highlight === 't'}
            onChange={(val) => st.setGrapheneT(val)}
            onHighlight={(q) => st.setHighlight(q)}
          />
          <span
            className="tb2d-fixed-param"
            data-q="a"
            onMouseEnter={() => st.setHighlight('a')}
            onMouseLeave={() => st.setHighlight(null)}
          >
            {s.params.aFixed}
          </span>
        </>
      )}
    </div>
  )

  const tools = (
    <>
      <ToolToggle
        pressed={st.tools.fill}
        onToggle={() => st.toggleTool('fill')}
        quantity="EF"
        title={
          st.lattice === 'graphene'
            ? `${s.tools.fillTitle}. ${s.values.grapheneFillingHint}`
            : s.tools.fillTitle
        }
      >
        {s.tools.fill}
      </ToolToggle>
      <ToolToggle
        pressed={st.tools.mass}
        onToggle={() => st.toggleTool('mass')}
        quantity="mstar"
        title={s.tools.massTitle}
      >
        {s.tools.mass}
      </ToolToggle>
      <ToolToggle
        pressed={st.tools.compare}
        onToggle={() => st.toggleTool('compare')}
        quantity={st.lattice === 'graphene' ? 'v' : 'Ek'}
        title={s.tools.compareTitle}
      >
        {s.tools.compare}
      </ToolToggle>
    </>
  )

  const scene = (
    <div className="tb2d-scene">
      <SceneView className="tb2d-surface-panel" tag={s.views.surface.title}>
        <ChartLegend entries={surfaceLegend} ariaLabel={s.views.surface.legendAria} />
        <Surface3D
          surfaces={model.surfaces}
          bzOutline={model.bzOutline}
          symmetryPoints={model.symmetryPoints}
          pathOnSurface={model.pathOnSurface}
          selectedState={model.selectedState}
          fermiPlane={
            model.fermiLevel !== null ? { energy: model.fermiLevel, color: quantityColor('EF') } : null
          }
          eRange={model.eRange}
          bzRadius={model.bzRadius}
          cameraAction={{
            seq: st.cameraAction.seq,
            mode: st.cameraAction.mode,
            target: cameraTarget
          }}
          onPickPoint={onPickSurface}
          onResetView={() => st.triggerCamera('reset')}
          onFocusK={st.lattice === 'graphene' ? () => st.triggerCamera('focus') : undefined}
          labels={{
            ariaLabel: s.views.surface.ariaLabel,
            resetView: s.views.surface.resetView,
            focusK: st.lattice === 'graphene' ? s.views.surface.focusK : undefined,
            webglUnavailable: s.views.surface.webglUnavailable,
            loading: s.views.surface.loading
          }}
        />
      </SceneView>

      <div className="tb2d-bottom-row">
        <SceneView
          className="tb2d-bands-panel"
          tag={st.lattice === 'graphene' ? s.views.bands.titleGraphene : s.views.bands.title}
        >
          <PathBandPlot
            model={model}
            pathFrac={st.selectedK.pathFrac}
            highlight={st.highlight}
            onPickPath={onPickPath}
          />
        </SceneView>

        <SceneView className="tb2d-real-panel" tag={s.views.realSpace.title}>
          <ChartLegend entries={realLegend} ariaLabel={s.views.realSpace.legendAria} />
          <RealSpace2DCanvas model={model} highlight={st.highlight} />
        </SceneView>
      </div>
    </div>
  )

  const mainFormula = st.lattice === 'square' ? SQUARE_MAIN_FORMULA : GRAPHENE_MAIN_FORMULA
  const defs = st.lattice === 'square' ? SQUARE_DEFINITIONS : GRAPHENE_DEFINITIONS

  const aside = (
    <>
      <Panel title="Formula viva" className="formula-panel">
        <LiveFormula
          tex={mainFormula}
          highlight={st.highlight}
          pulse={st.pulse}
          onHighlight={onHoverQuantity}
          className="formula-main"
        />
        <div className="formula-defs">
          {defs.map((d, i) => (
            <LiveFormula
              key={i}
              tex={d}
              display={false}
              highlight={st.highlight}
              pulse={st.pulse}
              onHighlight={onHoverQuantity}
            />
          ))}
        </div>
      </Panel>

      <Panel title={s.values.heading}>
      <dl className="values">
        <dt>{s.values.gamma}</dt>
        <dd data-q="E">
          {st.lattice === 'graphene'
            ? `±${formatNumber(Math.abs(model.summary.eGamma), 2)} eV`
            : `${formatNumber(model.summary.eGamma, 2)} eV`}
        </dd>

        <dt>{st.lattice === 'square' ? s.values.x : s.values.m}</dt>
        <dd data-q="E">
          {st.lattice === 'graphene'
            ? `±${formatNumber(Math.abs(model.summary.eXOrM), 2)} eV`
            : `${formatNumber(model.summary.eXOrM, 2)} eV`}
        </dd>

        <dt>{st.lattice === 'square' ? s.values.m : s.values.k}</dt>
        <dd data-q="E">{formatNumber(model.summary.eMOrK, 2)} eV</dd>

        <dt>{s.values.width}</dt>
        <dd data-q="t">{formatNumber(model.summary.width, 2)} eV</dd>

        <dt>{s.values.selectedK}</dt>
        <dd data-q="k">
          ({formatNumber(model.selectedState.kx, 2)}, {formatNumber(model.selectedState.ky, 2)}) Å⁻¹
        </dd>

        <dt>{s.values.selectedE}</dt>
        <dd data-q="E">{formatNumber(model.selectedState.E, 2, { signed: true })} eV</dd>

        {st.lattice === 'graphene' && model.summary.vF !== null && model.summary.vFOverC !== null && (
          <>
            <dt>{s.values.vF}</dt>
            <dd data-q="v">{formatVelocitySci(model.summary.vF)}</dd>

            <dt>{s.values.vFOverC}</dt>
            <dd data-q="v">c / {formatNumber(1 / model.summary.vFOverC, 0)}</dd>

            <dt>{s.values.dosEf}</dt>
            <dd data-q="EF">0</dd>
          </>
        )}

        {st.tools.fill && model.fermiLevel !== null && (
          <>
            <dt>{s.values.fermiLevel}</dt>
            <dd data-q="EF">{formatNumber(model.fermiLevel, 2)} eV</dd>
          </>
        )}

        {st.tools.mass && st.lattice === 'square' && model.summary.mStarBottom !== null && (
          <>
            <dt>{s.values.mStarBottom}</dt>
            <dd data-q="mstar">{formatSignificant(model.summary.mStarBottom, 3)} m₀</dd>
          </>
        )}

        {st.tools.mass &&
          st.lattice === 'graphene' &&
          model.summary.curvatureMassRatio !== null &&
          model.summary.diracMassRatio !== null && (
            <>
              <dt>{s.values.mStarCurvature}</dt>
              <dd data-q="mstar">
                {formatEffectiveMassRatio(model.summary.curvatureMassRatio)}
                {formatEffectiveMassRatio(model.summary.curvatureMassRatio).includes('flesso') ? '' : ' m₀'}
              </dd>

              <dt>{s.values.mTilde}</dt>
              <dd data-q="mstar">{formatNumber(model.summary.diracMassRatio, 3)} m₀</dd>
            </>
          )}
      </dl>
      {st.tools.fill && st.lattice === 'graphene' && (
        <p className="tb2d-filling-hint">{s.values.grapheneFillingHint}</p>
      )}
    </Panel>

      <Panel title={s.theory.heading} className="theory">
        {s.theory.points.map((p, idx) => (
          <p key={idx}>
            <Tex tex={p} />
          </p>
        ))}
        <p className="tb2d-link-title">{s.theory.linkTitle}</p>
        <p>
          <Tex tex={s.theory.linkBody} />
        </p>
      </Panel>
    </>
  )

  return (
    <SectionLayout
      chapterTitle={shellStrings.chapters.bands}
      sectionTitle={s.title}
      toolsLabel="Strumenti"
      tools={tools}
      scene={scene}
      params={commands}
      aside={aside}
      asideLabel="Formule, valori e teoria"
    />
  )
}
