/**
 * Sezione 2 — Catena biatomica, gap fononico e luce infrarossa
 * (dispensa Parte 6: Lezione 2 §§7–8, §10.3, §12 e Lezione 4 §24, §26).
 *
 * Due viste collegate:
 * 1. Spazio reale animato (catena biatomica M–m con molle C, R_cm, dipolo IR e 4 modi Fig. 12)
 * 2. Diagramma di dispersione ν(k) = ω(k)/2π tramite DispersionPlot (rami acustico/ottico,
 *    fascia gap, punti C e B, retta acustica, confronto M = m e retta luce IR opzionali).
 */
import { useCallback, useMemo, type JSX, type PointerEvent } from 'react'
import { diatomicOmega, radSToThz, type DiatomicBranch } from '../../physics'
import { ParamSlider, Panel, PresetMenu, ToolToggle } from '../../ui/controls'
import { formatNumber } from '../../ui/format'
import { FOLLOW, GLIDE, useTweened } from '../../ui/motion'
import { SceneView, SectionLayout } from '../../ui/shell'
import { RichText, Tex } from '../../ui/tex'
import { isQuantityId, type QuantityId } from '../../ui/theme'
import type { LegendEntry } from '../../viz/ChartLegend'
import {
  DispersionPlot,
  type DispersionBranch,
  type DispersionPoint,
  type HorizontalBand,
  type LightLineOverlay,
  type ReferenceLine
} from '../../viz/DispersionPlot'
import { LiveFormula } from '../../viz/LiveFormula'
import { DiatomicChainView } from './DiatomicChainView'
import {
  ALPHA_LIMIT_FORMULAS,
  BRANCH_AND_ZERO_FORMULAS,
  DYNAMICAL_MATRIX_FORMULA,
  edgeAndAlphaFormulas,
  INFRARED_FORMULAS,
  MAIN_FORMULA,
  SECULAR_FORMULA
} from './formulas'
import { NUMERICS, PARAMS, PRESETS } from './manifest'
import { usePhononDiatomicModel, type DiatomicModel } from './model'
import { usePhononDiatomicStore, type PhononDiatomicState } from './store'
import { strings as s } from './strings'

const PRESET_OPTIONS = PRESETS.map((p) => ({
  id: p.id,
  label: s.presets.item(
    p.name,
    formatNumber(p.a, 2),
    formatNumber(p.massHeavyAmu, 1),
    formatNumber(p.massLightAmu, 1),
    formatNumber(p.springC, 0)
  )
}))

export function PhononDiatomicSection(): JSX.Element {
  const st = usePhononDiatomicStore()
  const shown = useTweened(st.params, st.transition === 'glide' ? GLIDE : FOLLOW)
  const model = usePhononDiatomicModel(shown, st.kFrac, st.branch, st.tools)
  const setHighlight = st.setHighlight

  const onPick = useCallback(
    (k: number, _branchIdx: number, branchId: string) => {
      const nextBranch: DiatomicBranch = branchId === 'optical' ? 'optical' : 'acoustic'
      usePhononDiatomicStore.getState().select(k / model.summary.zoneEdge, nextBranch)
    },
    [model.summary.zoneEdge]
  )

  const onNudge = useCallback((dx: number, dBranch: number) => {
    usePhononDiatomicStore.getState().nudge(dx, dBranch)
  }, [])

  const onQuickSelect = useCallback((kFrac: number, branch: DiatomicBranch) => {
    usePhononDiatomicStore.getState().selectExact(kFrac, branch)
  }, [])

  const sliderValues = st.transition === 'glide' ? shown : st.params

  const branches = useMemo<readonly DispersionBranch[]>(() => {
    const out: DispersionBranch[] = []
    if (model.foldingRef) {
      out.push({
        id: 'folding-unfolded',
        x: model.foldingRef.unfolded.k,
        y: model.foldingRef.unfolded.freqThz,
        quantity: 'Ek',
        style: 'dashed',
        lineWidth: 1.5,
        selectable: false
      })
      out.push({
        id: 'folding-optical',
        x: model.foldingRef.foldedOpticalK,
        y: model.foldingRef.foldedOpticalFreqThz,
        quantity: 'Ek',
        style: 'dotted',
        lineWidth: 1.4,
        selectable: false
      })
    }
    out.push(
      {
        id: 'acoustic',
        x: model.curve.k,
        y: model.curve.acousticFreqThz,
        quantity: 'omega',
        fadeOutsideZone: st.tools.folding,
        lineWidth: 2.2
      },
      {
        id: 'optical',
        x: model.curve.k,
        y: model.curve.opticalFreqThz,
        quantity: 'omegaOpt',
        fadeOutsideZone: st.tools.folding,
        lineWidth: 2.2
      }
    )
    return out
  }, [
    model.curve.k,
    model.curve.acousticFreqThz,
    model.curve.opticalFreqThz,
    model.foldingRef,
    st.tools.folding
  ])

  const horizontalBands = useMemo<readonly HorizontalBand[]>(() => {
    if (model.summary.equalMasses || model.summary.freqGapThz < 1e-4) return []
    return [
      {
        id: 'gap',
        yMin: model.summary.freqAcousticMaxThz,
        yMax: model.summary.freqOpticalMinThz,
        quantity: 'omegaOpt',
        label: s.scene.gapBand,
        kind: 'gap'
      }
    ]
  }, [
    model.summary.equalMasses,
    model.summary.freqGapThz,
    model.summary.freqAcousticMaxThz,
    model.summary.freqOpticalMinThz
  ])

  // Retta acustica limitata sotto il bordo inferiore del gap (come Fig. 11 p. 20), così non attraversa «gap fononico»
  const referenceLines = useMemo<readonly ReferenceLine[]>(() => {
    const yCap = Math.min(model.yRange[1] * 0.92, model.summary.freqAcousticMaxThz * 0.97)
    const kEnd = Math.min(
      model.summary.zoneEdge * 0.95,
      model.soundSlopeThzA > 1e-9 ? yCap / model.soundSlopeThzA : model.summary.zoneEdge
    )
    const yEnd = model.soundSlopeThzA * kEnd
    return [
      { x0: 0, y0: 0, x1: kEnd, y1: yEnd, quantity: 'v', dash: [4, 4] },
      { x0: 0, y0: 0, x1: -kEnd, y1: yEnd, quantity: 'v', dash: [4, 4] }
    ]
  }, [model.summary.freqAcousticMaxThz, model.summary.zoneEdge, model.soundSlopeThzA, model.yRange])

  const markers = useMemo<readonly DispersionPoint[]>(() => {
    const kb = model.summary.zoneEdge
    if (model.summary.equalMasses) {
      return [
        {
          x: kb,
          y: model.summary.freqAcousticMaxThz,
          quantity: 'omega',
          radius: 3.8,
          label: 'C = B'
        }
      ]
    }
    return [
      {
        x: kb,
        y: model.summary.freqAcousticMaxThz,
        quantity: 'omega',
        radius: 3.8,
        label: 'C'
      },
      {
        x: kb,
        y: model.summary.freqOpticalMinThz,
        quantity: 'omegaOpt',
        radius: 3.8,
        label: 'B'
      }
    ]
  }, [
    model.summary.zoneEdge,
    model.summary.equalMasses,
    model.summary.freqAcousticMaxThz,
    model.summary.freqOpticalMinThz
  ])

  // Retta luce IR con pendenza esagerata (come Fig. 28 della dispensa p. 60):
  // il pallino giace esattamente sul ramo ottico a k_vis; il valore reale k_luce/(π/a) ~ 2·10⁻⁵ è nei readout.
  const lightLine = useMemo<LightLineOverlay | null>(() => {
    if (!st.tools.infrared) return null
    const kVis = NUMERICS.lightLineVisualKFrac * model.summary.zoneEdge
    const yCross = radSToThz(diatomicOmega(kVis, 'optical', model.params))
    const slope = kVis > 1e-9 ? yCross / kVis : 100
    return {
      slope,
      crossing: {
        x: kVis,
        y: yCross,
        label: s.scene.lightCrossingLabel
      }
    }
  }, [st.tools.infrared, model.summary.zoneEdge, model.params])

  const dispersionLegend = useMemo<readonly LegendEntry[]>(() => {
    const entries: LegendEntry[] = [
      { id: 'acoustic', keyKind: 'solid', color: 'var(--q-omega)', label: <RichText text={s.scene.legendAcoustic} /> },
      { id: 'optical', keyKind: 'solid', color: 'var(--q-omegaOpt)', label: <RichText text={s.scene.legendOptical} /> },
      { id: 'gap', keyKind: 'dotted', color: 'var(--q-omegaOpt)', label: <RichText text={s.scene.legendGap} /> },
      { id: 'sound', keyKind: 'dashed', color: 'var(--q-v)', label: <RichText text={s.scene.legendSound} /> }
    ]
    if (st.tools.folding) {
      entries.push({
        id: 'folding',
        keyKind: 'dashed',
        color: 'var(--q-Ek)',
        label: <RichText text={s.scene.legendFolding} />
      })
    }
    if (st.tools.infrared) {
      entries.push({
        id: 'light',
        keyKind: 'dashed',
        color: 'var(--tone-light-line)',
        label: <RichText text={s.scene.legendLightLine} />
      })
    }
    return entries
  }, [st.tools.folding, st.tools.infrared])

  const tools = (
    <>
      <ToolToggle
        pressed={st.tools.infrared}
        onToggle={() => st.toggleTool('infrared')}
        quantity="omegaOpt"
        title={s.tools.infraredTitle}
      >
        <RichText text={s.tools.infrared} />
      </ToolToggle>
      <ToolToggle
        pressed={st.tools.folding}
        onToggle={() => st.toggleTool('folding')}
        quantity="a"
        title={s.tools.foldingTitle}
      >
        <RichText text={s.tools.folding} />
      </ToolToggle>
      <ToolToggle
        pressed={st.tools.matrix}
        onToggle={() => st.toggleTool('matrix')}
        quantity="C"
        title={s.tools.matrixTitle}
      >
        <RichText text={s.tools.matrix} />
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

  const sel = model.selection
  const heavyIsM = !model.summary.invertedMasses
  const modeNote = sel.atOrigin
    ? sel.branch === 'acoustic'
      ? s.scene.noteAcOrigin
      : s.scene.noteOptOrigin(model.summary.equalMasses)
    : sel.atEdge
      ? model.summary.equalMasses
        ? s.scene.noteGapClosed
        : sel.branch === 'acoustic'
          ? s.scene.noteEdgeC(heavyIsM)
          : s.scene.noteEdgeB(heavyIsM)
      : null

  const branchLabel = sel.branch === 'acoustic' ? s.scene.branchAcoustic : s.scene.branchOptical
  const chainHint = (
    <>
      <span className="num">{s.scene.stateHint(branchLabel, formatNumber(sel.kFrac, 2))}</span>
      {modeNote && (
        <span className="view-note" data-q={sel.branch === 'acoustic' ? 'omega' : 'omegaOpt'}>
          {' · '}
          <RichText text={modeNote} />
        </span>
      )}
    </>
  )

  const scene = (
    <>
      <SceneView tag={s.scene.chainTag} hint={chainHint}>
        <DiatomicChainView
          params={model.params}
          k={sel.k}
          kFrac={sel.kFrac}
          branch={sel.branch}
          omegaRadS={sel.omegaRadS}
          omegaRefRadS={model.summary.omegaOpticalZeroRadS}
          equalMasses={model.summary.equalMasses}
          showInfrared={st.tools.infrared}
          highlight={st.highlight}
          onQuickSelect={onQuickSelect}
        />
      </SceneView>
      <SceneView tag={s.scene.dispersionTag} hint={s.scene.dispersionHint}>
        <DispersionPlot
          mode="1d"
          branches={branches}
          xRange={model.kRange}
          yRange={model.yRange}
          zoneEdge={model.summary.zoneEdge}
          clampToZone={true}
          bands={horizontalBands}
          referenceLines={referenceLines}
          markers={markers}
          lightLine={lightLine}
          selection={{
            x: sel.k,
            y: sel.freqThz,
            branchId: sel.branch
          }}
          highlight={st.highlight}
          yAxisQuantity="omega"
          onPick={onPick}
          onNudge={onNudge}
          legend={dispersionLegend}
          legendAriaLabel={s.scene.legendDispersionAria}
          labels={{
            ariaLabel: s.scene.dispersionAria,
            yAxis: s.scene.yAxis,
            xAxis: s.scene.xAxis
          }}
        />
      </SceneView>
    </>
  )

  const aside = (
    <>
      <Panel title={s.formula.title} className="formula-panel phonon-diat-formula-panel">
        <LiveFormula
          tex={MAIN_FORMULA}
          highlight={st.highlight}
          onHighlight={setHighlight}
          pulse={st.pulse}
          ariaLabel={s.formula.aria}
          className="formula-main"
        />
        <div className="formula-defs">
          {BRANCH_AND_ZERO_FORMULAS.map((tex) => (
            <LiveFormula
              key={tex}
              tex={tex}
              display={false}
              highlight={st.highlight}
              onHighlight={setHighlight}
              pulse={st.pulse}
            />
          ))}
        </div>
        <div className="formula-defs formula-edge">
          {edgeAndAlphaFormulas(model.summary.invertedMasses).map((tex) => (
            <LiveFormula
              key={tex}
              tex={tex}
              display={false}
              highlight={st.highlight}
              onHighlight={setHighlight}
              pulse={st.pulse}
            />
          ))}
        </div>
        <div className="formula-defs">
          {ALPHA_LIMIT_FORMULAS.map((tex) => (
            <LiveFormula
              key={tex}
              tex={tex}
              display={false}
              highlight={st.highlight}
              onHighlight={setHighlight}
              pulse={st.pulse}
            />
          ))}
        </div>
        {st.tools.infrared && (
          <div className="formula-defs formula-edge">
            {INFRARED_FORMULAS.map((tex) => (
              <LiveFormula
                key={tex}
                tex={tex}
                display={false}
                highlight={st.highlight}
                onHighlight={setHighlight}
                pulse={st.pulse}
              />
            ))}
          </div>
        )}
        {st.tools.matrix && (
          <div className="phonon-diat-matrix-block">
            <LiveFormula
              tex={DYNAMICAL_MATRIX_FORMULA}
              highlight={st.highlight}
              onHighlight={setHighlight}
              pulse={st.pulse}
              className="phonon-diat-matrix-formula"
            />
            <div className="formula-defs">
              <LiveFormula
                tex={SECULAR_FORMULA}
                display={false}
                highlight={st.highlight}
                onHighlight={setHighlight}
                pulse={st.pulse}
              />
            </div>
          </div>
        )}
        <Values model={model} st={st} onHighlight={setHighlight} />
      </Panel>
      <Panel title={s.theory.title} className="theory">
        <div onPointerOver={(e) => hoverQuantity(e, setHighlight)} onPointerLeave={() => setHighlight(null)}>
          {s.theory.blocks.map((block) => (
            <div key={block.heading}>
              <h3>
                <RichText text={block.heading} />
              </h3>
              {block.paragraphs.map((p, i) => (
                <p key={i}>
                  <RichText text={p} />
                </p>
              ))}
            </div>
          ))}
          <details className="panel-details">
            <summary>{s.theory.details.title}</summary>
            {s.theory.details.blocks.map((block) => (
              <div key={block.heading}>
                <h3>
                  <RichText text={block.heading} />
                </h3>
                {block.paragraphs.map((p, i) => (
                  <p key={i}>
                    <RichText text={p} />
                  </p>
                ))}
              </div>
            ))}
          </details>
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

function Values({
  model,
  st,
  onHighlight
}: {
  model: DiatomicModel
  st: PhononDiatomicState
  onHighlight: (q: QuantityId | null) => void
}): JSX.Element {
  const v = s.values
  const sum = model.summary
  const sel = model.selection
  const amp = sel.amplitude
  const branchQ: QuantityId = sel.branch === 'optical' ? 'omegaOpt' : 'omega'

  return (
    <dl
      className="values"
      onPointerOver={(e) => hoverQuantity(e, onHighlight)}
      onPointerLeave={() => onHighlight(null)}
    >
      <dt>{v.gapAndEdges}</dt>
      <dd>
        <span className="nowrap">
          <Tex tex="\htmlData{q=omega}{\nu_{\max}^{\mathrm{ac}}}" /> ={' '}
          <Num value={sum.freqAcousticMaxThz} digits={2} width={4} />
          {'\u00A0THz'}
        </span>
        {' · '}
        <span className="nowrap">
          <Tex tex="\htmlData{q=omegaOpt}{\nu_{\min}^{\mathrm{ott}}}" /> ={' '}
          <Num value={sum.freqOpticalMinThz} digits={2} width={4} />
          {'\u00A0THz'}
        </span>
        <br />
        {sum.equalMasses ? (
          <span className="sub">
            <RichText text={v.gapClosed} />
          </span>
        ) : (
          <>
            <span className="nowrap">
              <Tex tex="\htmlData{q=omegaOpt}{\Delta\nu_{\mathrm{gap}}}" /> ={' '}
              <Num value={sum.freqGapThz} digits={2} width={4} />
              {'\u00A0THz'}
            </span>
            <span className="sub">
              {' '}
              <span className="nowrap">
                ({formatNumber(sum.energyGapMev, 1)}
                {'\u00A0meV)'}
              </span>
            </span>
          </>
        )}
        {sum.invertedMasses && (
          <span className="sub note">
            <RichText text={v.invertedWarning} />
          </span>
        )}
      </dd>

      <dt>{v.soundAndCenter}</dt>
      <dd>
        <span className="nowrap">
          <Tex tex="\htmlData{q=v}{v_s}" /> = <Num value={sum.soundSpeedMs / 1e3} digits={2} width={4} />
          {'\u00A0km/s'}
        </span>
        {' · '}
        <span className="nowrap">
          <Tex tex="\htmlData{q=omegaOpt}{\nu_+}(0)" /> ={' '}
          <Num value={sum.freqOpticalZeroThz} digits={2} width={4} />
          {'\u00A0THz'}
        </span>
        <span className="sub">
          {' '}
          <span className="nowrap">
            ({formatNumber(sum.energyOpticalZeroMev, 1)}
            {'\u00A0meV)'}
          </span>
        </span>
      </dd>

      <dt>{v.state}</dt>
      <dd>
        <span className="nowrap">
          <Tex tex="\htmlData{q=k}{k}" /> = <Num value={sel.kFrac} digits={2} width={5} />
          {'\u00A0π/a'}
        </span>
        <span className="sub">
          {' '}
          <span className="nowrap">
            ({formatNumber(sel.k, 2)}
            {'\u00A0Å⁻¹)'}
          </span>
        </span>
        <br />
        <span className="nowrap">
          <Tex tex={`\\htmlData{q=${branchQ}}{${sel.branch === 'optical' ? '\\nu_+' : '\\nu_-'}}`} /> ={' '}
          <Num value={sel.freqThz} digits={2} width={4} />
          {'\u00A0THz'}
        </span>
        <span className="sub">
          {' · '}
          <span className="nowrap">
            <Tex tex={`\\hbar\\htmlData{q=${branchQ}}{${sel.branch === 'optical' ? '\\omega_+' : '\\omega_-'}}`} /> ={' '}
            <Num value={sel.energyMev} digits={1} width={4} />
            {'\u00A0meV'}
          </span>
        </span>
      </dd>

      <dt>
        <RichText text={v.ratioAndCm} />
      </dt>
      <dd>
        {amp.heavyStationary ? (
          <RichText text={v.alphaInf} />
        ) : amp.lightStationary ? (
          <RichText text={v.alphaZero} />
        ) : (
          <span className="nowrap">
            <Tex tex="\htmlData{q=u}{\alpha}" /> = <Num value={amp.alpha ?? 0} digits={2} width={5} />
          </span>
        )}
        {' · '}
        {Math.abs(amp.cmAmp) < 1e-9 ? (
          <span className="sub">
            <RichText text={v.cmStationary} />
          </span>
        ) : (
          <span className="sub nowrap">
            <Tex tex="|R_{\mathrm{cm}}|/u_{\max}" /> = <Num value={amp.cmAmp} digits={2} width={4} />
          </span>
        )}
      </dd>

      <dt>
        <RichText text={v.velocities} />
      </dt>
      <dd>
        {sel.atOrigin && sel.branch === 'acoustic' ? (
          <>
            <span className="nowrap">
              <Tex tex="\htmlData{q=vp}{v_p}, \htmlData{q=v}{v_g} \to \pm\htmlData{q=v}{v_s}" /> = ±
              <Num value={sum.soundSpeedMs / 1e3} digits={2} width={4} />
              {'\u00A0km/s'}
            </span>{' '}
            <span className="sub">
              (<RichText text={v.acOriginVelLimit} />)
            </span>
            <span className="sub note">
              <RichText text={v.acOriginVelNote} />
            </span>
          </>
        ) : sel.atOrigin && sel.branch === 'optical' ? (
          <>
            <span className="nowrap">
              <Tex tex="\htmlData{q=v}{v_g}" /> = <Num value={0} digits={2} width={4} />
              {'\u00A0km/s'}
            </span>
            {' · '}
            <span className="nowrap">
              <Tex tex="\htmlData{q=vp}{v_p} \to \pm\infty" />
            </span>
            <span className="sub note">
              <RichText text={v.optOriginVelNote} />
            </span>
          </>
        ) : sel.atEdge && sum.equalMasses ? (
          <>
            <span className="nowrap">
              <Tex tex="\htmlData{q=vp}{v_p}" /> ={' '}
              <Num value={(sel.vpMs ?? 0) / 1e3} digits={2} width={5} />
              {'\u00A0km/s'}
            </span>
            <span className="sub note">
              <RichText text={v.edgeClosedVelNote} />
            </span>
          </>
        ) : (
          <>
            <span className="nowrap">
              <Tex tex="\htmlData{q=vp}{v_p}" /> ={' '}
              <Num value={(sel.vpMs ?? 0) / 1e3} digits={2} width={5} />
              {'\u00A0km/s'}
            </span>
            {' · '}
            <span className="nowrap">
              <Tex tex="\htmlData{q=v}{v_g}" /> = <Num value={sel.vgMs / 1e3} digits={2} width={5} />
              {'\u00A0km/s'}
            </span>
            {sel.atEdge && !sum.equalMasses && (
              <span className="sub note">
                <RichText text={v.edgeStandingNote} />
              </span>
            )}
            {!sel.atEdge && sel.branch === 'optical' && (
              <span className="sub note">
                <RichText text={sel.kFrac >= 0 ? v.optNegVgNotePos : v.optNegVgNoteNeg} />
              </span>
            )}
          </>
        )}
      </dd>

      {st.tools.infrared && (
        <>
          <dt>
            <RichText text={v.infrared} />
          </dt>
          <dd>
            <span className="nowrap">
              <Tex tex="\lambda_{\mathrm{IR}}" /> ={' '}
              <Num value={model.infrared.wavelengthUm} digits={1} width={4} />
              {'\u00A0µm'}
            </span>
            {' · '}
            <span className="nowrap">
              <Tex tex="\htmlData{q=omegaOpt}{\nu_{\mathrm{IR}}}" /> ={' '}
              <Num value={model.infrared.freqThz} digits={2} width={4} />
              {'\u00A0THz'}
            </span>
            <br />
            <span className="sub">
              <Tex tex="\htmlData{q=k}{k_{\mathrm{luce}}}/(\pi/\htmlData{q=a}{a})" /> ≈{' '}
              <span className="nowrap">
                {formatNumber(model.infrared.kOverZoneEdge / 1e-5, 2)}
                {'\u00A0·\u00A010⁻⁵'}
              </span>
            </span>
            <span className="sub note">
              <RichText text={sum.equalMasses ? v.infraredEqualNote : v.infraredNote} />
            </span>
          </dd>
        </>
      )}

      {st.tools.matrix && model.dynamicalMatrix && (
        <>
          <dt>
            <RichText text={v.matrix} />
            <br />
            <span className="sub">
              (<RichText text={v.matrixUnit} />)
            </span>
          </dt>
          <dd>
            <div className="phonon-diat-matrix-grid">
              <span>{formatNumber(model.dynamicalMatrix.d11 / 1e26, 2)}</span>
              <span>{formatNumber(model.dynamicalMatrix.d12 / 1e26, 2)}</span>
              <span>{formatNumber(model.dynamicalMatrix.d12 / 1e26, 2)}</span>
              <span>{formatNumber(model.dynamicalMatrix.d22 / 1e26, 2)}</span>
            </div>
            <br />
            <span className="sub">
              <span className="nowrap">
                <Tex tex="\htmlData{q=omega}{\omega_-^2}" /> ={' '}
                {formatNumber(model.dynamicalMatrix.eigenvalues[0] / 1e26, 2)}
              </span>
              {' · '}
              <span className="nowrap">
                <Tex tex="\htmlData{q=omegaOpt}{\omega_+^2}" /> ={' '}
                {formatNumber(model.dynamicalMatrix.eigenvalues[1] / 1e26, 2)}
              </span>
            </span>
            <br />
            <span className="sub">
              <span className="nowrap">
                <Tex tex="\htmlData{q=omega}{\boldsymbol{\varepsilon}^-}" /> = (
                {formatNumber(model.dynamicalMatrix.eigenvectors[0][0], 2)};{' '}
                {formatNumber(model.dynamicalMatrix.eigenvectors[0][1], 2)})
              </span>
              {' · '}
              <span className="nowrap">
                <Tex tex="\htmlData{q=omegaOpt}{\boldsymbol{\varepsilon}^+}" /> = (
                {formatNumber(model.dynamicalMatrix.eigenvectors[1][0], 2)};{' '}
                {formatNumber(model.dynamicalMatrix.eigenvectors[1][1], 2)})
              </span>
            </span>
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
