/**
 * Sezione «Elettroni quasi liberi» (dispensa P3 §11): spazio reale e
 * diagramma E(k) collegati, formula viva del modello a due onde, scheda teoria.
 */
import { useCallback, type JSX, type PointerEvent } from 'react'
import { isEffectiveMassDivergent } from '../../physics'
import { ParamSlider, Panel, PresetMenu, Stepper, ToolToggle } from '../../ui/controls'
import { formatEffectiveMassRatio, formatNumber } from '../../ui/format'
import { FOLLOW, GLIDE, useTweened } from '../../ui/motion'
import { SceneView, SectionLayout } from '../../ui/shell'
import { RichText, Tex } from '../../ui/tex'
import { isQuantityId, type QuantityId } from '../../ui/theme'
import { BandPlot, type GapMarker } from '../../viz/BandPlot'
import { LiveFormula } from '../../viz/LiveFormula'
import { RealSpaceView } from '../../viz/RealSpaceView'
import { DEFINITIONS, EDGE_FORMULAS, MAIN_FORMULA } from './formulas'
import { NUMERICS, PARAMS, PRESETS } from './manifest'
import { useNearlyFreeModel, type NearlyFreeModel } from './model'
import { useNearlyFreeStore, type NearlyFreeState } from './store'
import { strings as s } from './strings'

const PRESET_OPTIONS = PRESETS.map((p) => ({
  id: p.id,
  label: s.presets.item(p.name, formatNumber(p.a, 2), formatNumber(p.gap, 2))
}))

export function NearlyFreeSection(): JSX.Element {
  const st = useNearlyFreeStore()
  const shown = useTweened(st.params, st.transition === 'glide' ? GLIDE : FOLLOW)
  const model = useNearlyFreeModel(shown, st.kFrac, st.band, {
    fill: st.tools.fill,
    electrons: st.electrons,
    mass: st.tools.mass
  })
  const setHighlight = st.setHighlight
  const onPick = useCallback(
    (k: number, band: number) => useNearlyFreeStore.getState().select(k / model.zoneEdge, band),
    [model.zoneEdge]
  )
  const shownBand = model.selection.band
  const onNudge = useCallback(
    (dk: number, dBand: number) => useNearlyFreeStore.getState().nudge(dk, dBand, shownBand),
    [shownBand]
  )

  // durante un preset i cursori seguono la planata; altrimenti mostrano il bersaglio
  const sliderValues = st.transition === 'glide' ? shown : st.params

  const tools = (
    <>
      <ToolToggle pressed={st.tools.fill} onToggle={() => st.toggleTool('fill')} quantity="EF" title={s.tools.fillTitle}>
        {s.tools.fill}
      </ToolToggle>
      <ToolToggle pressed={st.tools.mass} onToggle={() => st.toggleTool('mass')} quantity="mstar" title={s.tools.massTitle}>
        {s.tools.mass}
      </ToolToggle>
      <ToolToggle
        pressed={st.tools.compare}
        onToggle={() => st.toggleTool('compare')}
        quantity="Ek"
        title={s.tools.compareTitle}
      >
        {s.tools.compare}
      </ToolToggle>
    </>
  )

  const params = (
    <>
      {PARAMS.map((spec) => (
        <ParamSlider
          key={spec.id}
          quantity={spec.quantity}
          symbol={spec.symbol}
          label={s.params[spec.id]}
          value={sliderValues[spec.id]}
          min={spec.min}
          max={spec.max}
          step={spec.step}
          unit={spec.unit}
          digits={spec.digits}
          active={st.highlight === spec.quantity}
          onChange={(v) => st.setParam(spec.id, v)}
          onHighlight={setHighlight}
        />
      ))}
      {st.tools.fill && (
        <Stepper
          label={s.electrons.label}
          value={st.electrons}
          min={NUMERICS.electrons.min}
          max={NUMERICS.electrons.max}
          onChange={st.setElectrons}
          decreaseLabel={s.electrons.decrease}
          increaseLabel={s.electrons.increase}
        />
      )}
      <PresetMenu
        label={s.presets.label}
        freeLabel={s.presets.free}
        options={PRESET_OPTIONS}
        value={st.presetId}
        onSelect={st.applyPreset}
        note={s.presets.note}
      />
    </>
  )

  const scene = (
    <>
      <SceneView
        tag={s.scene.realTag}
        hint={
          <>
            <span className="num">{s.scene.stateHint(formatNumber(model.selection.kFrac, 2), shownBand + 1)}</span>
            {standingNote(model) && (
              <span className="view-note" data-q="psi">
                {' · '}
                <RichText text={standingNote(model) ?? ''} />
              </span>
            )}
          </>
        }
      >
        <RealSpaceView
          xs={model.xs}
          potential={model.potentialSamples}
          density={model.density}
          a={shown.a}
          potentialQuantity="VG"
          potentialAlso={['V2G']}
          highlight={st.highlight}
          labels={{
            ariaLabel: s.scene.realAria,
            ions: s.scene.ions,
            density: s.scene.density,
            potential: s.scene.potential
          }}
        />
      </SceneView>
      <SceneView tag={s.scene.bandsTag} hint={s.scene.bandsHint}>
        <BandPlot
          bands={model.bands}
          kRange={[-NUMERICS.kWindow, NUMERICS.kWindow]}
          eRange={model.eRange}
          zoneEdge={model.zoneEdge}
          compare={{
            bands: model.emptyLattice,
            visible: st.tools.compare,
            quantity: 'Ek',
            label: s.scene.compareLegend
          }}
          filling={
            model.filling
              ? {
                  fermiLevel: model.filling.fermiLevel,
                  label: model.filling.kind === 'insulator' ? s.scene.insulator : s.scene.metal
                }
              : null
          }
          gaps={gapMarkers(model)}
          levels={[{ energy: model.E0, k: model.zoneEdge, label: s.scene.e0, quantity: 'Ek' }]}
          selection={{ k: model.selection.k, energy: model.selection.energy }}
          probe={
            model.probe
              ? {
                  k: model.selection.k,
                  energy: model.selection.energy,
                  slope: model.probe.slope,
                  curvature: model.probe.curvature,
                  label: s.scene.probe
                }
              : null
          }
          highlight={st.highlight}
          onPick={onPick}
          onNudge={onNudge}
          labels={{
            ariaLabel: s.scene.bandsAria,
            energyAxis: s.scene.energyAxis,
            kAxis: s.scene.kAxis,
            bandsLegend: s.scene.bandsLegend
          }}
        />
      </SceneView>
    </>
  )

  const aside = (
    <>
      <Panel title={s.formula.title} className="formula-panel">
        <LiveFormula
          tex={MAIN_FORMULA}
          highlight={st.highlight}
          onHighlight={setHighlight}
          pulse={st.pulse}
          ariaLabel={s.formula.aria}
          className="formula-main"
        />
        <div className="formula-defs">
          {DEFINITIONS.map((tex) => (
            <LiveFormula key={tex} tex={tex} display={false} highlight={st.highlight} onHighlight={setHighlight} pulse={st.pulse} />
          ))}
        </div>
        <div className="formula-defs formula-edge">
          {EDGE_FORMULAS.map((tex) => (
            <LiveFormula key={tex} tex={tex} display={false} highlight={st.highlight} onHighlight={setHighlight} pulse={st.pulse} />
          ))}
        </div>
        <Values model={model} shown={shown} st={st} onHighlight={setHighlight} />
      </Panel>
      <Panel title={s.theory.title} className="theory">
        <div onPointerOver={(e) => hoverQuantity(e, setHighlight)} onPointerLeave={() => setHighlight(null)}>
          {s.theory.blocks.map((block) => (
            <div key={block.heading}>
              <h3>{block.heading}</h3>
              {block.paragraphs.map((p, i) => (
                <p key={i}>
                  <RichText text={p} />
                </p>
              ))}
            </div>
          ))}
          <p className="foot">
            <RichText text={s.theory.foot} />
          </p>
        </div>
      </Panel>
    </>
  )

  return (
    <SectionLayout
      chapterTitle={s.chapter}
      sectionTitle={s.title}
      toolsLabel={s.toolsLabel}
      tools={tools}
      scene={scene}
      params={params}
      aside={aside}
      asideLabel={s.asideLabel}
    />
  )
}

function hoverQuantity(e: PointerEvent, setHighlight: (q: QuantityId | null) => void): void {
  const term = (e.target as Element).closest?.('[data-q]')
  const q = term?.getAttribute('data-q')
  setHighlight(isQuantityId(q) ? q : null)
}

function standingNote(model: NearlyFreeModel): string | null {
  if (!model.selection.atEdge) return null
  if (model.selection.standingWave === 'c') return s.scene.noteCos
  if (model.selection.standingWave === 's') return s.scene.noteSin
  return model.edgeGap.width < 1e-6 ? s.scene.noteDegenerate : null
}

function gapMarkers(model: NearlyFreeModel): GapMarker[] {
  const { edgeGap, centerGap, twoWaveCenterGap } = model
  // in k = 0 l'etichetta è 2|V_2G| solo se il gap è davvero quello; altrimenti E_g
  const match = Math.abs(centerGap.width - twoWaveCenterGap) < 0.2 * Math.max(centerGap.width, 0.05)
  return [
    { k: edgeGap.k, lower: edgeGap.lower, upper: edgeGap.upper, label: s.scene.gapG, quantity: 'VG' },
    {
      k: centerGap.k,
      lower: centerGap.lower,
      upper: centerGap.upper,
      label: match ? s.scene.gap2G : s.scene.gapGeneric,
      quantity: 'V2G'
    }
  ]
}

function planeWaveLabelTex(gMultiple: number): string {
  if (gMultiple === 0) return 'c_0'
  if (gMultiple === -1) return 'c_{-G}'
  if (gMultiple === 1) return 'c_{G}'
  return `c_{${gMultiple}G}`
}

/** Valori vivi sotto la formula. Larghezze stabili: cifre tabulari e campi a larghezza minima. */
function Values({
  model,
  shown,
  st,
  onHighlight
}: {
  model: NearlyFreeModel
  shown: { a: number; vG: number; v2G: number }
  st: NearlyFreeState
  onHighlight: (q: QuantityId | null) => void
}): JSX.Element {
  const v = s.values
  const sel = model.selection
  const pureSecondOrderCenterGap = Math.abs(shown.v2G) < 1e-4 && model.centerGap.width > 1e-5
  return (
    <dl
      className="values"
      onPointerOver={(e) => hoverQuantity(e, onHighlight)}
      onPointerLeave={() => onHighlight(null)}
    >
      <dt>{v.e0}</dt>
      <dd>
        <Tex tex="\htmlData{q=Ek}{E_0}" /> = <Num value={model.E0} width={5} /> eV
      </dd>

      <dt>{v.gapEdge}</dt>
      <dd>
        <Tex tex="2|\htmlData{q=VG}{V_G}|" /> = <Num value={model.twoWaveEdgeGap} width={4} /> eV{' '}
        <span className="sub">({v.twoWaveFormula})</span>
        <br />
        <span className="sub nowrap">
          {v.computedExact(NUMERICS.planeWaves)} <Num value={model.edgeGap.width} width={4} /> eV
        </span>
        {model.weakPotentialRatio > 0.5 && (
          <span className="sub note">
            <RichText text={v.strong(formatNumber(model.weakPotentialRatio, 2))} />
          </span>
        )}
      </dd>

      <dt>{v.gapCenter}</dt>
      <dd>
        <Tex tex="2|\htmlData{q=V2G}{V_{2G}}|" /> = <Num value={model.twoWaveCenterGap} width={4} /> eV{' '}
        <span className="sub">({v.twoWaveFormula})</span>
        <br />
        <span className="sub nowrap">
          {v.computedExact(NUMERICS.planeWaves)} <Num value={model.centerGap.width} digits={3} width={5} /> eV
        </span>
        {pureSecondOrderCenterGap && (
          <span className="sub note">
            <RichText text={v.secondOrderNotVisible} />
          </span>
        )}
      </dd>

      <dt>{v.state}</dt>
      <dd>
        <Tex tex="\htmlData{q=k}{k}" /> = <Num value={sel.kFrac} width={5} /> π/a · {v.band} {sel.band + 1}
        <br />
        <Tex tex="\htmlData{q=E}{E}" /> = <Num value={sel.energy} width={5} /> eV
      </dd>

      <dt data-q="psi">{v.planeWaveWeights}</dt>
      <dd data-q="psi">
        {sel.dominantWeights.map((w, idx) => (
          <span key={w.gMultiple} className="nowrap">
            {idx > 0 ? ' · ' : ''}
            <Tex tex={`|\\htmlData{q=psi}{${planeWaveLabelTex(w.gMultiple)}}|^2`} /> ={' '}
            <Num value={w.weight * 100} digits={1} width={4} />%
          </span>
        ))}
      </dd>

      {sel.atEdge && (
        <>
          <dt>{v.standing}</dt>
          <dd data-q="psi" className="standing">
            <RichText
              text={sel.standingWave === 'c' ? v.standingCos : sel.standingWave === 's' ? v.standingSin : v.standingDegenerate}
            />
          </dd>
        </>
      )}

      {model.filling && (
        <>
          <dt>{v.fermi}</dt>
          <dd>
            <Tex tex="\htmlData{q=EF}{E_F}" /> = <Num value={model.filling.fermiLevel} width={5} /> eV
            <span className="sub">
              {' · '}
              {model.filling.kind === 'insulator' ? s.scene.insulator : s.scene.metal}{' '}
              <span className="nowrap">({v.electrons(st.electrons)})</span>
            </span>
            {model.filling.kind === 'insulator' && st.electrons === 4 && Math.abs(shown.v2G) < 1e-4 && (
              <span className="sub note">
                <RichText text={v.secondOrderInsulatorNote} />
              </span>
            )}
          </dd>
        </>
      )}

      {model.probe && (
        <>
          <dt>{v.mass}</dt>
          <dd>
            <Tex tex="\htmlData{q=mstar}{m^*}/m_0" />{' '}
            <span className="num value-num" style={{ minWidth: '7ch' }}>
              {formatEffectiveMassRatio(model.probe.massRatio, { significant: 3, withEquals: true })}
            </span>
            {!isEffectiveMassDivergent(model.probe.massRatio) && model.probe.massRatio < 0 && (
              <span className="sub note">
                <RichText text={v.massNegative} />
              </span>
            )}
          </dd>
          <dt>{v.velocity}</dt>
          <dd>
            <Tex tex="\htmlData{q=v}{v}" /> = <Num value={model.probe.velocity / 1e6} width={5} /> · 10⁶ m/s
          </dd>
        </>
      )}
    </dl>
  )
}

function Num({ value, digits = 2, width }: { value: number; digits?: number; width: number }): JSX.Element {
  return (
    <span className="num value-num" style={{ minWidth: `${width}ch` }}>
      {formatNumber(value, digits)}
    </span>
  )
}
