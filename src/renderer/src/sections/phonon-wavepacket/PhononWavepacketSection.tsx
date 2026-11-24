/**
 * Sezione 4 — Pacchetti d'onda: velocità di fase e di gruppo
 * (dispensa Parte 6: Lezione 2 §6 pp. 14–17, Figg. 7–9, §12 pp. 29–30).
 *
 * Due viste principali collegate:
 * 1. Spazio reale animato Ψ(x, t) con inviluppo ±F(x − v_g t), cresta marcata a v_p,
 *    atomi discreti campionati ogni passo a (nei 3 regimi reticolari) e mini-curva σ(t)/σ₀;
 * 2. DispersionPlot su ν(k) con corda v_p dall'origine, tangente v_g in k₀ e fascia spettrale Δk.
 */
import { useCallback, useMemo, type JSX, type PointerEvent } from 'react'
import { velocityMsToThzAngstrom } from '../../physics'
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
  type ReferenceLine,
  type VelocityProbeOverlay
} from '../../viz/DispersionPlot'
import { LiveFormula } from '../../viz/LiveFormula'
import {
  mainFormulaTex,
  regimeFormulas,
  SPREADING_FORMULA,
  velocityAndUncertaintyFormulas
} from './formulas'
import { PARAMS, PRESETS, REGIMES } from './manifest'
import { usePhononWavepacketModel, type WavepacketModel } from './model'
import { usePhononWavepacketStore, type PhononWavepacketState } from './store'
import { strings as s } from './strings'
import { WavepacketView } from './WavepacketView'
import './phonon-wavepacket.css'

const PRESET_OPTIONS = PRESETS.map((p) => ({
  id: p.id,
  label: s.presets.item(p.name, formatNumber(p.kFrac, 2), formatNumber(p.sigma0InA, 1))
}))

export function PhononWavepacketSection(): JSX.Element {
  const st = usePhononWavepacketStore()
  const shown = useTweened(st.params, st.transition === 'glide' ? GLIDE : FOLLOW)
  const model = usePhononWavepacketModel(st.regime, shown)
  const setHighlight = st.setHighlight

  const onPick = useCallback(
    (k: number) => {
      usePhononWavepacketStore.getState().selectKFrac(k / model.characteristics.zoneEdge)
    },
    [model.characteristics.zoneEdge]
  )

  const onNudge = useCallback((dx: number) => {
    usePhononWavepacketStore.getState().nudge(dx)
  }, [])

  const sliderValues = st.transition === 'glide' ? shown : st.params
  const char = model.characteristics
  const curveQ: QuantityId =
    st.regime === 'optical' ? 'omegaOpt' : st.regime === 'quadratic' ? 'Ek' : 'omega'

  const branches = useMemo<readonly DispersionBranch[]>(() => {
    const out: DispersionBranch[] = []
    if (model.linearRefCurve) {
      out.push({
        id: 'linear-ref',
        x: model.linearRefCurve.k,
        y: model.linearRefCurve.freqThz,
        quantity: 'Ek',
        style: 'dashed',
        lineWidth: 1.3,
        selectable: false
      })
    }
    out.push({
      id: 'spectrum-envelope',
      x: model.spectralProfile.k,
      y: model.spectralProfile.yThz,
      quantity: 'psi',
      style: 'solid',
      lineWidth: 1.5,
      selectable: false
    })
    out.push({
      id: 'dispersion',
      x: model.curve.k,
      y: model.curve.freqThz,
      quantity: curveQ,
      lineWidth: 2.3
    })
    return out
  }, [model.linearRefCurve, model.spectralProfile.k, model.spectralProfile.yThz, model.curve.k, model.curve.freqThz, curveQ])

  const referenceLines = useMemo<readonly ReferenceLine[]>(() => {
    const ySpanTop = model.yRange[1] * 0.92
    const lines: ReferenceLine[] = [
      {
        x0: model.spectralProfile.kLeft,
        y0: 0,
        x1: model.spectralProfile.kLeft,
        y1: Math.min(ySpanTop, char.freq0Thz > 0.2 ? char.freq0Thz : ySpanTop * 0.45),
        quantity: 'psi',
        dash: [3, 3]
      },
      {
        x0: model.spectralProfile.kRight,
        y0: 0,
        x1: model.spectralProfile.kRight,
        y1: Math.min(ySpanTop, char.freq0Thz > 0.2 ? char.freq0Thz : ySpanTop * 0.45),
        quantity: 'psi',
        dash: [3, 3]
      }
    ]
    // Limiti ±v_s al punto angoloso k₀ = 0 per il regime lineare (su 'acoustic' è già disegnata la retta suono)
    if (char.isOriginCusp && st.regime === 'linear' && char.soundSpeedMs !== null) {
      const slopeVs = velocityMsToThzAngstrom(char.soundSpeedMs)
      const kLim = 0.28 * char.zoneEdge
      lines.push(
        { x0: 0, y0: 0, x1: kLim, y1: slopeVs * kLim, quantity: 'v', dash: [4, 3] },
        { x0: 0, y0: 0, x1: -kLim, y1: slopeVs * kLim, quantity: 'v', dash: [4, 3] }
      )
    }
    return lines
  }, [
    model.spectralProfile.kLeft,
    model.spectralProfile.kRight,
    model.yRange,
    char.freq0Thz,
    char.isOriginCusp,
    char.soundSpeedMs,
    char.zoneEdge,
    st.regime
  ])

  const probe = useMemo<VelocityProbeOverlay>(() => {
    return {
      x: char.k0,
      y: char.freq0Thz,
      slopeVg: model.slopeVgThzA,
      showVp: char.vpMs !== null && Math.abs(char.k0) > 1e-6,
      showVg: !char.isOriginCusp,
      vpLabel: 'v_p',
      vgLabel: 'v_g'
    }
  }, [char.k0, char.freq0Thz, char.vpMs, char.isOriginCusp, model.slopeVgThzA])

  const dispersionLegend = useMemo<readonly LegendEntry[]>(() => {
    const entries: LegendEntry[] = [
      {
        id: 'curve',
        keyKind: 'solid',
        color: `var(--q-${curveQ})`,
        label: <RichText text={s.scene.legendCurve(st.regime)} />
      },
      { id: 'vp', keyKind: 'dashed', color: 'var(--q-vp)', label: <RichText text={s.scene.legendVp} /> },
      { id: 'vg', keyKind: 'solid', color: 'var(--q-v)', label: <RichText text={s.scene.legendVg} /> },
      { id: 'spec', keyKind: 'solid', color: 'var(--q-psi)', label: <RichText text={s.scene.legendSpectrum} /> }
    ]
    if (model.linearRefCurve) {
      entries.push({
        id: 'linref',
        keyKind: 'dashed',
        color: 'var(--q-Ek)',
        label: <RichText text={s.scene.legendLinearRef} />
      })
    }
    return entries
  }, [curveQ, st.regime, model.linearRefCurve])

  const tools = (
    <>
      <ToolToggle
        pressed={st.tools.comoving}
        onToggle={() => st.toggleTool('comoving')}
        quantity="v"
        title={s.tools.comovingTitle}
      >
        <RichText text={s.tools.comoving} />
      </ToolToggle>
      <ToolToggle
        pressed={st.tools.initialProfile}
        onToggle={() => st.toggleTool('initialProfile')}
        quantity="u"
        title={s.tools.initialProfileTitle}
      >
        <RichText text={s.tools.initialProfile} />
      </ToolToggle>
    </>
  )

  const params = (
    <>
      <div className="phonon-wp-regime-group" role="group" aria-label={s.regimeControl.label}>
        {REGIMES.map((r) => (
          <button
            key={r.id}
            type="button"
            className="phonon-wp-regime-btn"
            aria-pressed={st.regime === r.id}
            title={r.title}
            onClick={() => st.setRegime(r.id)}
          >
            <RichText text={r.label} />
          </button>
        ))}
      </div>
      <PresetMenu
        label={s.presets.label}
        freeLabel={s.presets.free}
        options={PRESET_OPTIONS}
        value={st.presetId}
        onSelect={st.applyPreset}
      />
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
    </>
  )

  const waveNote = char.isZoneEdgeStanding
    ? s.scene.noteStandingEdge
    : st.regime === 'optical' && !char.isVpDivergent && Math.abs(char.k0Frac) > 1e-4
      ? char.k0Frac > 0
        ? s.scene.noteBackwardOpt
        : s.scene.noteBackwardOptNeg
      : st.regime === 'linear' && !char.isOriginCusp
        ? s.scene.noteLinearExact
        : st.regime === 'quadratic' && Math.abs(char.k0Frac) > 1e-4
          ? s.scene.noteQuadraticDouble
          : null

  const waveHint = (
    <>
      <span className="num">
        {s.scene.stateHint(formatNumber(char.k0Frac, 2), formatNumber(shown.sigma0InA, 1))}
      </span>
      {waveNote && (
        <span className="view-note" data-q={st.regime === 'optical' ? 'omegaOpt' : 'v'}>
          {' · '}
          <RichText text={waveNote} />
        </span>
      )}
    </>
  )

  const scene = (
    <>
      <SceneView tag={s.scene.waveTag} hint={waveHint}>
        <WavepacketView
          wpParams={model.wpParams}
          spreadCurve={model.spreadCurve}
          hasDiscreteLattice={char.hasDiscreteLattice}
          comoving={st.tools.comoving}
          showInitialProfile={st.tools.initialProfile}
          highlight={st.highlight}
        />
      </SceneView>
      <SceneView tag={s.scene.dispersionTag} hint={s.scene.dispersionHint}>
        <DispersionPlot
          mode="1d"
          branches={branches}
          xRange={model.kRange}
          yRange={model.yRange}
          zoneEdge={char.zoneEdge}
          clampToZone={true}
          referenceLines={referenceLines}
          probe={probe}
          selection={{
            x: char.k0,
            y: char.freq0Thz,
            branchId: 'dispersion'
          }}
          highlight={st.highlight}
          yAxisQuantity={curveQ}
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
      <Panel title={s.formula.title} className="formula-panel phonon-wp-formula-panel">
        <LiveFormula
          tex={mainFormulaTex(st.regime)}
          highlight={st.highlight}
          onHighlight={setHighlight}
          pulse={st.pulse}
          ariaLabel={s.formula.aria}
          className="formula-main"
        />
        <div className="formula-defs">
          {velocityAndUncertaintyFormulas(st.regime).map((tex) => (
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
          <LiveFormula
            tex={SPREADING_FORMULA}
            display={false}
            highlight={st.highlight}
            onHighlight={setHighlight}
            pulse={st.pulse}
          />
          {regimeFormulas(st.regime).map((tex) => (
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
  model: WavepacketModel
  st: PhononWavepacketState
  onHighlight: (q: QuantityId | null) => void
}): JSX.Element {
  const v = s.values
  const char = model.characteristics
  const omegaQ: QuantityId =
    st.regime === 'optical' ? 'omegaOpt' : st.regime === 'quadratic' ? 'Ek' : 'omega'
  const isQuad = st.regime === 'quadratic'
  const curvTenMinus6 = char.omegaSecondM2S / 1e-6
  const nearZeroCurv = Math.abs(curvTenMinus6) < 0.005

  return (
    <dl
      className="values"
      onPointerOver={(e) => hoverQuantity(e, onHighlight)}
      onPointerLeave={() => onHighlight(null)}
    >
      <dt>{v.regimeLabel}</dt>
      <dd>
        <span>{v.regimeNames[st.regime]}</span>
        {!isQuad && (
          <span className="sub">
            {' · '}
            <span className="nowrap">
              <Tex tex="\htmlData{q=a}{a}" /> = {formatNumber(char.latticeA, 2)}
              {'\u00A0Å'}
            </span>
          </span>
        )}
      </dd>

      <dt>{v.centerState}</dt>
      <dd>
        <span className="nowrap">
          <Tex tex="\htmlData{q=k}{k_0}" /> = <Num value={char.k0Frac} digits={2} width={5} />
          {'\u00A0π/a'}
        </span>
        <span className="sub">
          {' '}
          <span className="nowrap">
            ({formatNumber(char.k0, 2)}
            {'\u00A0Å⁻¹)'}
          </span>
        </span>
        <br />
        <span className="nowrap">
          <Tex tex={`\\htmlData{q=${omegaQ}}{\\nu_0}`} /> ={' '}
          <Num value={char.freq0Thz} digits={isQuad ? 1 : 2} width={5} />
          {'\u00A0THz'}
        </span>
        <span className="sub">
          {' · '}
          <span className="nowrap">
            {isQuad ? (
              <>
                <Tex tex={`\\hbar\\htmlData{q=${omegaQ}}{\\omega_0}`} /> ={' '}
                {formatNumber(char.energy0Mev / 1e3, 2)}
                {'\u00A0eV'}
              </>
            ) : (
              <>
                <Tex tex={`\\hbar\\htmlData{q=${omegaQ}}{\\omega_0}`} /> ={' '}
                {formatNumber(char.energy0Mev, 1)}
                {'\u00A0meV'}
              </>
            )}
          </span>
        </span>
      </dd>

      <dt>{v.velocities}</dt>
      <dd>
        {char.isOriginCusp ? (
          <>
            <span className="nowrap">
              <RichText text={v.originCuspLimit} /> = ±
              <Num value={(char.soundSpeedMs ?? 0) / 1e3} digits={2} width={4} />
              {'\u00A0km/s'}
            </span>
            <span className="sub note">
              <RichText text={v.originCuspNote} />
            </span>
          </>
        ) : char.isVpDivergent ? (
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
              <RichText text={v.opticalOriginNote} />
            </span>
          </>
        ) : (
          <>
            <span className="nowrap">
              <Tex tex="\htmlData{q=vp}{v_p}" /> ={' '}
              <Num value={(char.vpMs ?? 0) / 1e3} digits={isQuad ? 1 : 2} width={5} />
              {'\u00A0km/s'}
            </span>
            {' · '}
            <span className="nowrap">
              <Tex tex="\htmlData{q=v}{v_g}" /> ={' '}
              <Num value={char.vgMs / 1e3} digits={isQuad ? 1 : 2} width={5} />
              {'\u00A0km/s'}
            </span>
            {isQuad && Math.abs(char.k0Frac) < 1e-4 && (
              <span className="sub note">
                <RichText text={v.quadraticOriginNote} />
              </span>
            )}
            {char.isZoneEdgeStanding && (
              <span className="sub note">
                <RichText text={st.regime === 'optical' ? v.edgeNoteOptical : v.edgeNoteAcoustic} />
              </span>
            )}
            {!char.isZoneEdgeStanding && st.regime === 'optical' && (
              <span className="sub note">
                <RichText text={v.opticalOppositeNote} />
              </span>
            )}
            {isQuad && Math.abs(char.k0Frac) >= 1e-4 && (
              <span className="sub note">
                <RichText text={v.quadraticRatioNote} />
              </span>
            )}
          </>
        )}
      </dd>

      <dt>{v.widths}</dt>
      <dd>
        <span className="nowrap">
          <Tex tex="\htmlData{q=u}{\sigma_0}" /> = <Num value={char.sigma0Ang} digits={1} width={4} />
          {'\u00A0Å'}
        </span>
        {' · '}
        <span className="nowrap">
          <Tex tex="\htmlData{q=k}{\Delta k}" /> = <Num value={char.deltaKAngInv} digits={3} width={5} />
          {'\u00A0Å⁻¹'}
        </span>
        <br />
        <span className="sub nowrap">
          <Tex tex="\Delta x\,\Delta k = \sigma_0\Delta k = 0{,}50" />
        </span>
      </dd>

      <dt>{v.curvature}</dt>
      <dd>
        {char.isOriginCusp ? (
          <span className="sub">
            <RichText text={v.originCuspCurvatureNote} />
          </span>
        ) : st.regime === 'linear' ? (
          <span className="sub">
            <RichText text={v.noSpreading} />
          </span>
        ) : char.spreadingTimeScaleS === null || (st.regime === 'optical' && nearZeroCurv) ? (
          <span className="sub">
            <RichText text={v.inflectionZeroSpread} />
          </span>
        ) : (
          <>
            <span className="nowrap">
              <Tex tex="\omega''" /> ={' '}
              <Num
                value={curvTenMinus6}
                digits={2}
                width={5}
              />
              {'\u00A0·\u00A010⁻⁶\u00A0m²/s'}
            </span>
            {char.spreadingTimeScaleS !== null && (
              <span className="sub">
                {' · '}
                <span className="nowrap">
                  <Tex tex="\tau_{\mathrm{disp}}" /> ={' '}
                  {formatNumber(char.spreadingTimeScaleS * model.spreadCurve.unitFactor, 2)}
                  {`\u00A0${model.spreadCurve.unitLabel}`}
                </span>
              </span>
            )}
          </>
        )}
      </dd>
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
