/**
 * Sezione 1 — Catena monatomica e prima zona di Brillouin
 * (dispensa Parte 6: Lezione 1 §§1–5 e Lezione 3 §13).
 *
 * Due viste collegate:
 * 1. Spazio reale animato (catena lineare 1D o anello periodico di Born–von Kármán)
 * 2. Diagramma di dispersione ν(k) = ω(k)/2π su [−2π/a, 2π/a] tramite DispersionPlot
 */
import { useCallback, useMemo, type JSX, type PointerEvent } from 'react'
import { ParamSlider, Panel, PresetMenu, Stepper, ToolToggle } from '../../ui/controls'
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
  type ReferenceLine
} from '../../viz/DispersionPlot'
import { LiveFormula } from '../../viz/LiveFormula'
import { BVK_FORMULAS, DEFINITIONS, MAIN_FORMULA, VELOCITY_AND_BZ_FORMULAS } from './formulas'
import { NUMERICS, PARAMS, PRESETS } from './manifest'
import { usePhononMonatomicModel, type MonatomicModel } from './model'
import { MonatomicChainView } from './MonatomicChainView'
import { usePhononMonatomicStore, type PhononMonatomicState } from './store'
import { strings as s } from './strings'

const PRESET_OPTIONS = PRESETS.map((p) => ({
  id: p.id,
  label: s.presets.item(
    p.name,
    formatNumber(p.a, 2),
    formatNumber(p.massAmu, 1),
    formatNumber(p.springC, 0)
  )
}))

export function PhononMonatomicSection(): JSX.Element {
  const st = usePhononMonatomicStore()
  const shown = useTweened(st.params, st.transition === 'glide' ? GLIDE : FOLLOW)
  const model = usePhononMonatomicModel(shown, st.kFrac, st.tools, st.bvkN)
  const setHighlight = st.setHighlight

  const onPick = useCallback(
    (k: number) => usePhononMonatomicStore.getState().select(k / model.summary.zoneEdge),
    [model.summary.zoneEdge]
  )

  const onNudge = useCallback((dx: number) => {
    usePhononMonatomicStore.getState().nudge(dx)
  }, [])

  const onQuickSelect = useCallback((kFrac: number) => {
    usePhononMonatomicStore.getState().selectExact(kFrac)
  }, [])

  const sliderValues = st.transition === 'glide' ? shown : st.params

  const branches = useMemo<readonly DispersionBranch[]>(
    () => [
      {
        id: 'acoustic',
        x: model.curve.k,
        y: model.curve.freqThz,
        quantity: 'omega',
        fadeOutsideZone: true,
        lineWidth: 2.2
      }
    ],
    [model.curve.k, model.curve.freqThz]
  )

  const horizontalBands = useMemo<readonly HorizontalBand[]>(
    () => [
      {
        id: 'evanescent',
        yMin: model.summary.freqMaxThz,
        quantity: 'omegaOpt',
        label: s.scene.evanescentBand,
        kind: 'evanescent'
      }
    ],
    [model.summary.freqMaxThz]
  )

  // Rette acustiche senza etichetta galleggiante sul canvas (è nella legenda esterna ChartLegend):
  // evita qualsiasi sovrapposizione con curva, punti BvK o tangente v_g a tutte le risoluzioni.
  const referenceLines = useMemo<readonly ReferenceLine[]>(() => {
    const yCap = Math.min(model.yRange[1] * 0.94, model.summary.freqMaxThz * 1.18)
    const kEnd = Math.min(
      model.summary.zoneEdge * 0.92,
      model.soundSlopeThzA > 1e-9 ? yCap / model.soundSlopeThzA : model.summary.zoneEdge
    )
    const yEnd = model.soundSlopeThzA * kEnd
    return [
      { x0: 0, y0: 0, x1: kEnd, y1: yEnd, quantity: 'v', dash: [4, 4] },
      { x0: 0, y0: 0, x1: -kEnd, y1: yEnd, quantity: 'v', dash: [4, 4] }
    ]
  }, [model.summary.freqMaxThz, model.summary.zoneEdge, model.soundSlopeThzA, model.yRange])

  const bvkPoints = useMemo<readonly DispersionPoint[] | undefined>(() => {
    if (!st.tools.bvk) return undefined
    return model.bvkPoints.map((pt) => ({
      x: pt.x,
      y: pt.y,
      quantity: 'omega',
      radius: 3.6
    }))
  }, [st.tools.bvk, model.bvkPoints])

  const dispersionLegend = useMemo<readonly LegendEntry[]>(() => {
    const entries: LegendEntry[] = [
      { id: 'branch', keyKind: 'solid', color: 'var(--q-omega)', label: <RichText text={s.scene.legendBranch} /> },
      { id: 'replicas', keyKind: 'dashed', color: 'var(--q-omega)', label: <RichText text={s.scene.legendReplicas} /> },
      { id: 'sound', keyKind: 'dashed', color: 'var(--q-v)', label: <RichText text={s.scene.legendSound} /> },
      {
        id: 'evanescent',
        keyKind: 'dotted',
        color: 'var(--q-omegaOpt)',
        label: <RichText text={s.scene.legendEvanescent} />
      }
    ]
    if (st.tools.bvk) {
      entries.push({ id: 'bvk', keyKind: 'dot', color: 'var(--q-omega)', label: s.scene.legendBvk })
    }
    if (st.tools.probe) {
      entries.push({ id: 'vp', keyKind: 'dashed', color: 'var(--q-vp)', label: <RichText text={s.scene.legendVp} /> })
      entries.push({ id: 'vg', keyKind: 'solid', color: 'var(--q-v)', label: <RichText text={s.scene.legendVg} /> })
    }
    return entries
  }, [st.tools.bvk, st.tools.probe])

  const tools = (
    <>
      <ToolToggle
        pressed={st.tools.aliasing}
        onToggle={() => st.toggleTool('aliasing')}
        quantity="k"
        title={s.tools.aliasingTitle}
      >
        <RichText text={s.tools.aliasing} />
      </ToolToggle>
      <ToolToggle
        pressed={st.tools.bvk}
        onToggle={() => st.toggleTool('bvk')}
        quantity="a"
        title={s.tools.bvkTitle}
      >
        <RichText text={s.tools.bvk} />
      </ToolToggle>
      <ToolToggle
        pressed={st.tools.probe}
        onToggle={() => st.toggleTool('probe')}
        quantity="v"
        title={s.tools.probeTitle}
      >
        <RichText text={s.tools.probe} />
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
      {st.tools.bvk && (
        <Stepper
          label={s.bvkStepper.label}
          value={st.bvkN}
          min={NUMERICS.bvk.min}
          max={NUMERICS.bvk.max}
          onChange={st.setBvkN}
          decreaseLabel={s.bvkStepper.decrease}
          increaseLabel={s.bvkStepper.increase}
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

  const sel = model.selection
  const modeNote = sel.atOrigin
    ? s.scene.noteOrigin
    : sel.atEdge
      ? s.scene.noteStanding
      : null

  const chainHint = (
    <>
      <span className="num">
        {st.tools.bvk && sel.bvkJ !== null
          ? s.scene.stateHintBvk(sel.bvkJ, st.bvkN, formatNumber(sel.kFrac, 2))
          : s.scene.stateHint(formatNumber(sel.kFrac, 2))}
      </span>
      {modeNote && (
        <span className="view-note" data-q="u">
          {' · '}
          <RichText text={modeNote} />
        </span>
      )}
    </>
  )

  const scene = (
    <>
      <SceneView tag={st.tools.bvk ? s.scene.ringTag : s.scene.chainTag} hint={chainHint}>
        <MonatomicChainView
          a={shown.a}
          massAmu={shown.massAmu}
          springC={shown.springC}
          k={sel.k}
          kFrac={sel.kFrac}
          omegaRadS={sel.omegaRadS}
          omegaMaxRadS={model.summary.omegaMaxRadS}
          aliasK={sel.aliasK}
          showAliasing={st.tools.aliasing}
          bvkMode={st.tools.bvk}
          bvkN={st.bvkN}
          bvkJ={sel.bvkJ}
          highlight={st.highlight}
          onQuickSelect={onQuickSelect}
        />
      </SceneView>
      <SceneView
        tag={s.scene.dispersionTag}
        hint={st.tools.bvk ? s.scene.dispersionBvkHint : s.scene.dispersionHint}
      >
        <DispersionPlot
          mode="1d"
          branches={branches}
          xRange={model.kRange}
          yRange={model.yRange}
          zoneEdge={model.summary.zoneEdge}
          clampToZone={true}
          bands={horizontalBands}
          referenceLines={referenceLines}
          bvkPoints={bvkPoints}
          selection={{
            x: sel.k,
            y: sel.freqThz,
            branchId: 'acoustic',
            aliasX: st.tools.aliasing ? sel.aliasK : undefined,
            aliasLabel: st.tools.aliasing ? (sel.aliasM > 0 ? 'k+G' : 'k−G') : undefined
          }}
          probe={
            st.tools.probe
              ? {
                  x: sel.k,
                  y: sel.freqThz,
                  slopeVg: sel.slopeVgThzA,
                  showVp: !sel.atOrigin,
                  showVg: !sel.atOrigin,
                  vpLabel: s.scene.vpLabel,
                  vgLabel: s.scene.vgLabel
                }
              : null
          }
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
      <Panel title={s.formula.title} className="formula-panel phonon-mono-formula-panel">
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
          {VELOCITY_AND_BZ_FORMULAS.map((tex) => (
            <LiveFormula
              key={tex}
              tex={tex}
              display={false}
              highlight={st.highlight}
              onHighlight={setHighlight}
              pulse={st.pulse}
            />
          ))}
          {st.tools.bvk &&
            BVK_FORMULAS.map((tex) => (
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
        <Values model={model} shownA={shown.a} st={st} onHighlight={setHighlight} />
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

function Values({
  model,
  shownA,
  st,
  onHighlight
}: {
  model: MonatomicModel
  shownA: number
  st: PhononMonatomicState
  onHighlight: (q: QuantityId | null) => void
}): JSX.Element {
  const v = s.values
  const sum = model.summary
  const sel = model.selection
  const aliasFrac = sel.kFrac + 2 * sel.aliasM
  const aliasSign = sel.aliasM > 0 ? '+' : '-'

  return (
    <dl
      className="values"
      onPointerOver={(e) => hoverQuantity(e, onHighlight)}
      onPointerLeave={() => onHighlight(null)}
    >
      <dt>{v.scales}</dt>
      <dd>
        <span className="nowrap">
          <Tex tex="\htmlData{q=omega}{\nu_{\max}}" /> = <Num value={sum.freqMaxThz} digits={2} width={5} />
          {'\u00A0THz'}
        </span>
        <span className="sub">
          {' · '}
          <span className="nowrap">
            <Tex tex="\hbar\htmlData{q=omega}{\omega_{\max}}" /> ={' '}
            <Num value={sum.energyMaxMev} digits={1} width={4} />
            {'\u00A0meV'}
          </span>
        </span>
        <br />
        <span className="sub">
          <Tex tex="\htmlData{q=omega}{\omega_{\max}}" /> ={' '}
          <span className="nowrap">
            <Num value={sum.omegaMaxRadS / 1e13} digits={2} width={4} />
            {'\u00A0·\u00A010¹³\u00A0rad/s'}
          </span>
        </span>
      </dd>

      <dt>{v.soundSpeed}</dt>
      <dd>
        <span className="nowrap">
          <Tex tex="\htmlData{q=v}{v_s}" /> = <Num value={sum.soundSpeedMs / 1e3} digits={2} width={5} />
          {'\u00A0km/s'}
        </span>
        <span className="sub">
          {' · '}
          <span className="nowrap">
            <Tex tex="\pi/\htmlData{q=a}{a}" /> = <Num value={sum.zoneEdge} digits={2} width={4} />
            {'\u00A0Å⁻¹'}
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
            (<Num value={sel.k} digits={2} width={5} />
            {'\u00A0Å⁻¹)'}
          </span>
        </span>
        <br />
        <span className="nowrap">
          <Tex tex="\htmlData{q=omega}{\nu}" /> = <Num value={sel.freqThz} digits={2} width={5} />
          {'\u00A0THz'}
        </span>
        <span className="sub">
          {' · '}
          <span className="nowrap">
            <Tex tex="\hbar\htmlData{q=omega}{\omega}" /> = <Num value={sel.energyMev} digits={1} width={4} />
            {'\u00A0meV'}
          </span>
        </span>
      </dd>

      <dt>{v.wavelength}</dt>
      <dd>
        {sel.wavelengthA === null ? (
          <span className="sub">{v.wavelengthInf}</span>
        ) : (
          <>
            <span className="nowrap">
              <Tex tex="\lambda" /> = <Num value={sel.wavelengthA} digits={2} width={5} />
              {'\u00A0Å'}
            </span>
            <span className="sub">
              {' '}
              <span className="nowrap">
                (<Num value={sel.wavelengthA / shownA} digits={2} width={4} />{' '}
                <Tex tex="\htmlData{q=a}{a}" />)
              </span>
            </span>
          </>
        )}
      </dd>

      {st.tools.aliasing && (
        <>
          <dt>{v.aliasing}</dt>
          <dd>
            <span className="nowrap">
              <Tex tex={`\\htmlData{q=k}{k'} = \\htmlData{q=k}{k} ${aliasSign} \\htmlData{q=a}{G}`} /> ={' '}
              <Num value={aliasFrac} digits={2} width={5} />
              {'\u00A0π/a'}
            </span>
            <span className="sub note">
              <RichText text={v.aliasingSame} />
            </span>
          </dd>
        </>
      )}

      {st.tools.probe && (
        <>
          <dt>{v.velocities}</dt>
          <dd>
            {sel.atOrigin ? (
              <>
                <span className="nowrap">
                  <Tex tex="\htmlData{q=vp}{v_p}, \htmlData{q=v}{v_g} \to \pm\htmlData{q=v}{v_s}" /> = ±
                  <Num value={sum.soundSpeedMs / 1e3} digits={2} width={4} />
                  {'\u00A0km/s'}
                </span>{' '}
                <span className="sub">
                  (<RichText text={v.originVelLimit} />)
                </span>
                <span className="sub note">
                  <RichText text={v.originVelNote} />
                </span>
              </>
            ) : (
              <>
                <span className="nowrap">
                  <Tex tex="\htmlData{q=vp}{v_p}" /> = <Num value={sel.vpMs / 1e3} digits={2} width={5} />
                  {'\u00A0km/s'}
                </span>
                {' · '}
                <span className="nowrap">
                  <Tex tex="\htmlData{q=v}{v_g}" /> = <Num value={sel.vgMs / 1e3} digits={2} width={5} />
                  {'\u00A0km/s'}
                </span>
                {sel.atEdge && (
                  <span className="sub note">
                    <RichText text={v.edgeVelNote} />
                  </span>
                )}
              </>
            )}
          </dd>
        </>
      )}

      {st.tools.bvk && model.bvkGrid && sel.bvkJ !== null && (
        <>
          <dt>{v.bvk}</dt>
          <dd>
            <span className="num nowrap">{v.bvkSummary(model.bvkGrid.nCells, sel.bvkJ)}</span>
            <br />
            <span className="sub">
              <Tex tex="\Delta\htmlData{q=k}{k} = \tfrac{2\pi}{N\htmlData{q=a}{a}}" /> ={' '}
              <span className="nowrap">
                <Num value={model.bvkGrid.deltaK} digits={3} width={5} />
                {'\u00A0Å⁻¹'}
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
