/**
 * Sezione 5 — Modi quantizzati (fononi) e processi Umklapp
 * (dispensa Parte 6: Lezione 2 §11 eqq. 29–30; Lezione 3 §§15–18, Figg. 19–21, eqq. 40–42 e 46–51).
 *
 * Due modalità 100% visive commutabili dalla topbar:
 * - Modalità A: Quantizzazione del modo (parabola V(Q), P_n vs P_cl, tunneling, Bose–Einstein
 *   e catena vibrante sincronizzata con ampiezza ∝ √(2n+1) / √(2n̄+1)).
 * - Modalità B: Collisioni nella 1BZ (schema vettoriale k₁, k₂, G, k₃ e curva ν(k) con v_g).
 */
import { useCallback, type JSX, type PointerEvent } from 'react'
import { Panel, ParamSlider, PresetMenu, ToolToggle } from '../../ui/controls'
import { formatNumber } from '../../ui/format'
import { FOLLOW, GLIDE, useTweened } from '../../ui/motion'
import { SceneView, SectionLayout } from '../../ui/shell'
import { RichText, Tex } from '../../ui/tex'
import { isQuantityId, type QuantityId } from '../../ui/theme'
import { LiveFormula } from '../../viz/LiveFormula'
import { mainFormulaTex, secondaryFormulasTex } from './formulas'
import {
  QUANT_PARAMS,
  QUANT_PRESETS,
  UMKLAPP_PARAMS,
  UMKLAPP_PRESETS
} from './manifest'
import {
  useQuantizationModel,
  useUmklappModel,
  type QuantizationModel,
  type UmklappModel
} from './model'
import { QuantumChainView } from './QuantumChainView'
import { QuantumOscillatorView } from './QuantumOscillatorView'
import { usePhononQuantumStore } from './store'
import { strings as s } from './strings'
import { Umklapp1BZView } from './Umklapp1BZView'
import { UmklappDispersionView } from './UmklappDispersionView'
import './phonon-quantum.css'

const QUANT_PRESET_OPTIONS = QUANT_PRESETS.map((p) => ({ id: p.id, label: p.name }))
const UMKLAPP_PRESET_OPTIONS = UMKLAPP_PRESETS.map((p) => ({ id: p.id, label: p.name }))

export function PhononQuantumSection(): JSX.Element {
  const st = usePhononQuantumStore()
  const shownQuant = useTweened(st.quantParams, st.transition === 'glide' ? GLIDE : FOLLOW)
  const shownUmklapp = useTweened(st.umklappParams, st.transition === 'glide' ? GLIDE : FOLLOW)

  const quantModel = useQuantizationModel(st.source, shownQuant)
  const umklappModel = useUmklappModel(shownUmklapp)

  const setHighlight = st.setHighlight
  const isQuant = st.mode === 'quantization'
  const isThermal = st.source === 'thermal'

  const onChangeK = useCallback((which: 'k1' | 'k2', kFrac: number) => {
    usePhononQuantumStore.getState().setUmklappK(which, kFrac)
  }, [])

  const onNudgeK = useCallback((which: 'k1' | 'k2', dx: number) => {
    usePhononQuantumStore.getState().nudgeUmklapp(which, dx)
  }, [])

  const tools = (
    <>
      <ToolToggle
        pressed={isQuant}
        onToggle={() => st.setMode('quantization')}
        quantity="psi"
        title={s.modes.quantizationTitle}
      >
        {s.modes.quantization}
      </ToolToggle>
      <ToolToggle
        pressed={!isQuant}
        onToggle={() => st.setMode('umklapp')}
        quantity="k"
        title={s.modes.umklappTitle}
      >
        {s.modes.umklapp}
      </ToolToggle>
    </>
  )

  const quantSliderValues = st.transition === 'glide' ? shownQuant : st.quantParams
  const umklappSliderValues = st.transition === 'glide' ? shownUmklapp : st.umklappParams

  const params = isQuant ? (
    <>
      <div className="phonon-q-source-group" role="group" aria-label={s.quantSource.label}>
        <button
          type="button"
          className="phonon-q-source-btn"
          aria-pressed={!isThermal}
          onClick={() => st.setSource('level')}
        >
          {s.quantSource.level}
        </button>
        <button
          type="button"
          className="phonon-q-source-btn"
          aria-pressed={isThermal}
          onClick={() => st.setSource('thermal')}
        >
          {s.quantSource.thermal}
        </button>
      </div>
      {QUANT_PARAMS.filter((spec) =>
        isThermal ? spec.id !== 'n' : spec.id !== 'temperatureK'
      ).map((spec) => (
        <ParamSlider
          key={spec.id}
          quantity={spec.quantity}
          symbol={spec.symbol}
          label={s.quantParams[spec.id]}
          value={spec.id === 'n' ? Math.round(quantSliderValues.n) : quantSliderValues[spec.id]}
          min={spec.min}
          max={spec.max}
          step={spec.step}
          unit={spec.unit}
          digits={spec.digits}
          active={st.highlight === spec.quantity}
          onChange={(v) => st.setQuantParam(spec.id, v)}
          onHighlight={setHighlight}
        />
      ))}
      <PresetMenu
        label={s.presets.label}
        freeLabel={s.presets.free}
        options={QUANT_PRESET_OPTIONS}
        value={st.quantPresetId}
        onSelect={st.applyQuantPreset}
        note={s.presets.quantNote}
      />
    </>
  ) : (
    <div className="phonon-q-umklapp-params" style={{ display: 'contents' }}>
      {UMKLAPP_PARAMS.map((spec) => (
        <ParamSlider
          key={spec.id}
          quantity={spec.quantity}
          symbol={spec.symbol}
          label={s.umklappParams[spec.id]}
          value={umklappSliderValues[spec.id]}
          min={spec.min}
          max={spec.max}
          step={spec.step}
          unit={spec.unit}
          digits={spec.digits}
          active={st.highlight === spec.quantity}
          onChange={(v) => st.setUmklappParam(spec.id, v)}
          onHighlight={setHighlight}
        />
      ))}
      <PresetMenu
        label={s.presets.label}
        freeLabel={s.presets.free}
        options={UMKLAPP_PRESET_OPTIONS}
        value={st.umklappPresetId}
        onSelect={st.applyUmklappPreset}
        note={s.presets.umklappNote}
      />
    </div>
  )

  const oscHint = isThermal
    ? s.quantScene.oscillatorHintThermal(
        formatNumber(quantModel.thermalSummary.nBar, 2),
        Math.round(quantModel.thermalSummary.temperatureK)
      )
    : s.quantScene.oscillatorHintLevel(
        quantModel.nInt,
        formatNumber(quantModel.modeSummary.tunnelingFraction * 100, 1)
      )

  const chainRms = isThermal
    ? quantModel.thermalSummary.rmsAmpAng
    : quantModel.modeSummary.deltaXRmsAng
  const chainPct = isThermal
    ? (quantModel.thermalSummary.rmsOverLattice ?? 0) * 100
    : (quantModel.modeSummary.rmsOverLattice ?? 0) * 100
  const chainHint =
    !isThermal && quantModel.nInt === 0
      ? s.quantScene.chainHintZp(formatNumber(chainRms, 3), formatNumber(chainPct, 1))
      : s.quantScene.chainHintRms(formatNumber(chainRms, 3), formatNumber(chainPct, 1))

  const scene = isQuant ? (
    <>
      <SceneView tag={s.quantScene.oscillatorTag} hint={<span className="num"><RichText text={oscHint} /></span>}>
        <QuantumOscillatorView model={quantModel} highlight={st.highlight} />
      </SceneView>
      <SceneView tag={s.quantScene.chainTag} hint={<span className="num"><RichText text={chainHint} /></span>}>
        <QuantumChainView model={quantModel} highlight={st.highlight} />
      </SceneView>
    </>
  ) : (
    <>
      <SceneView tag={s.umklappScene.zoneTag} hint={<RichText text={s.umklappScene.zoneHint} />}>
        <Umklapp1BZView
          model={umklappModel}
          highlight={st.highlight}
          onChangeK={onChangeK}
          onNudge={onNudgeK}
        />
      </SceneView>
      <SceneView tag={s.umklappScene.dispersionTag} hint={s.umklappScene.dispersionHint}>
        <UmklappDispersionView
          model={umklappModel}
          highlight={st.highlight}
          onChangeK={onChangeK}
          onNudge={onNudgeK}
        />
      </SceneView>
    </>
  )

  const theoryBlocks = isQuant ? s.theory.quantBlocks : s.theory.umklappBlocks
  const formulaAria = isQuant
    ? isThermal
      ? s.formula.ariaQuantThermal
      : s.formula.ariaQuantLevel
    : s.formula.ariaUmklapp

  const aside = (
    <>
      <Panel title={s.formula.title} className="formula-panel phonon-q-formula-panel">
        <LiveFormula
          tex={mainFormulaTex(st.mode, st.source)}
          highlight={st.highlight}
          onHighlight={setHighlight}
          pulse={st.pulse}
          ariaLabel={formulaAria}
          className="formula-main"
        />
        <div className="formula-defs">
          {secondaryFormulasTex(st.mode, st.source).map((tex) => (
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
        {isQuant ? (
          <QuantValues model={quantModel} onHighlight={setHighlight} />
        ) : (
          <UmklappValues model={umklappModel} onHighlight={setHighlight} />
        )}
      </Panel>
      <Panel title={s.theory.title} className="theory">
        <div
          onPointerOver={(e) => hoverQuantity(e, setHighlight)}
          onPointerLeave={() => setHighlight(null)}
        >
          {theoryBlocks.map((block) => (
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

function QuantValues({
  model,
  onHighlight
}: {
  model: QuantizationModel
  onHighlight: (q: QuantityId | null) => void
}): JSX.Element {
  const v = s.values
  const m = model.modeSummary
  const th = model.thermalSummary
  const isThermal = model.source === 'thermal'

  return (
    <dl
      className="values"
      onPointerOver={(e) => hoverQuantity(e, onHighlight)}
      onPointerLeave={() => onHighlight(null)}
    >
      {isThermal ? (
        <>
          <dt>{v.thermalOccupation}</dt>
          <dd>
            <span className="nowrap">
              <Tex tex="\htmlData{q=T}{\bar{n}}" /> = <Num value={th.nBar} digits={2} width={5} />
            </span>
            <span className="sub">
              {' · '}
              <span className="nowrap">
                <Tex tex="\langle E\rangle" /> = <Num value={th.meanEnergyMev} digits={1} width={5} />
                {'\u00A0meV'}
              </span>
            </span>
          </dd>

          <dt>{v.thermalScale}</dt>
          <dd>
            <span className="nowrap">
              <Tex tex="k_B\htmlData{q=T}{T}" /> = <Num value={th.kBTmev} digits={1} width={4} />
              {'\u00A0meV'}
            </span>
            <span className="sub">
              {' · '}
              <span className="nowrap">
                <Tex tex="\hbar\htmlData{q=omega}{\omega}" /> = <Num value={th.hbarOmegaMev} digits={1} width={4} />
                {'\u00A0meV'}
              </span>
            </span>
          </dd>

          <dt>{v.scales}</dt>
          <dd>
            <span className="nowrap">
              <Tex tex="\htmlData{q=psi}{a_{\mathrm{ho}}}" /> = <Num value={m.aHoAng} digits={3} width={5} />
              {'\u00A0Å'}
            </span>
            <span className="sub">
              {' · '}
              <span className="nowrap">
                <Tex tex="\htmlData{q=u}{\Delta x_{\mathrm{rms}}}" /> = <Num value={th.rmsAmpAng} digits={3} width={5} />
                {'\u00A0Å'}
              </span>
            </span>
          </dd>

          <dt>{v.zeroPointRatio}</dt>
          <dd>
            <span className="nowrap">
              <Tex tex="\htmlData{q=u}{\Delta x_{\mathrm{rms}}}/\htmlData{q=a}{a}" /> ={' '}
              <Num value={(th.rmsOverLattice ?? 0) * 100} digits={1} width={4} />%
            </span>
            <span className="sub">
              {' · '}
              <span className="nowrap">
                <Tex tex="\htmlData{q=u}{\Delta x_{\mathrm{zp}}}/\htmlData{q=a}{a}" /> ={' '}
                {formatNumber((m.zpOverLattice ?? 0) * 100, 1)}%
              </span>
            </span>
          </dd>
        </>
      ) : (
        <>
          <dt>{v.levelEnergy}</dt>
          <dd>
            <span className="nowrap">
              <Tex tex="\htmlData{q=E}{E}_{\htmlData{q=psi}{n}}" /> ={' '}
              <Num value={m.unitsHbarOmega} digits={1} width={4} />
              {'\u00A0ħω'}
            </span>
            <span className="sub">
              {' · '}
              <span className="nowrap">
                <Num value={m.energyMev} digits={1} width={5} />
                {'\u00A0meV'}
              </span>
            </span>
          </dd>

          <dt>{v.scales}</dt>
          <dd>
            <span className="nowrap">
              <Tex tex="\htmlData{q=psi}{a_{\mathrm{ho}}}" /> = <Num value={m.aHoAng} digits={3} width={5} />
              {'\u00A0Å'}
            </span>
            <span className="sub">
              {' · '}
              <span className="nowrap">
                <Tex tex="\htmlData{q=Ek}{x_{\mathrm{cl}}}" /> = <Num value={m.xClAng} digits={3} width={5} />
                {'\u00A0Å'}
              </span>
            </span>
          </dd>

          <dt>{v.tunneling}</dt>
          <dd>
            <span className="nowrap">
              <Tex tex="\int_{|x|>x_{\mathrm{cl}}}\htmlData{q=psi}{P_n}\,\mathrm{d}x" /> ={' '}
              <Num value={m.tunnelingFraction * 100} digits={1} width={4} />%
            </span>
            <span className="sub note">
              <RichText text={v.tunnelingNote(model.nInt)} />
            </span>
          </dd>

          <dt>{v.zeroPointRatio}</dt>
          <dd>
            <span className="nowrap">
              <Tex tex="\htmlData{q=u}{\Delta x_{\mathrm{zp}}}" /> = <Num value={m.deltaXzpAng} digits={3} width={5} />
              {'\u00A0Å'}
            </span>
            <span className="sub">
              {' ('}
              <Num value={(m.zpOverLattice ?? 0) * 100} digits={1} width={4} />
              {'% di '}
              <Tex tex="\htmlData{q=a}{a}" />)
            </span>
          </dd>
        </>
      )}
    </dl>
  )
}

function UmklappValues({
  model,
  onHighlight
}: {
  model: UmklappModel
  onHighlight: (q: QuantityId | null) => void
}): JSX.Element {
  const v = s.values
  const c = model.collision
  const isUmklapp = c.kind === 'umklapp'

  return (
    <dl
      className="values"
      onPointerOver={(e) => hoverQuantity(e, onHighlight)}
      onPointerLeave={() => onHighlight(null)}
    >
      <dt>{v.processKind}</dt>
      <dd>
        <span data-q={isUmklapp ? 'a' : 'omega'}>
          {isUmklapp ? v.umklappLabel : v.normalLabel}
        </span>
        <span className="sub note">
          <RichText text={c.flowReversed ? v.flowReversedNote : v.flowNormalNote} />
        </span>
      </dd>

      <dt>{v.vectors}</dt>
      <dd>
        <span className="nowrap">
          <Tex tex="\htmlData{q=k}{k_1 + k_2}" /> = <Num value={c.kSumFrac} digits={2} width={5} />
          {'\u00A0π/a'}
        </span>
        <br />
        <span className="nowrap">
          <Tex tex="\htmlData{q=a}{G}" /> = {c.mG === 0 ? '0' : c.mG < 0 ? '+2\u00A0π/a' : '−2\u00A0π/a'}
        </span>
        <br />
        <span className="nowrap">
          <Tex tex="\htmlData{q=omega}{k_3}" /> = <Num value={c.k3Frac} digits={2} width={5} />
          {'\u00A0π/a'}
        </span>
      </dd>

      <dt>{v.groupVelocities}</dt>
      <dd>
        <span className="nowrap">
          <Tex tex="\htmlData{q=v}{v_g}(k_1)" /> = <Num value={c.vg1Ms / 1e3} digits={2} width={5} />
          {'\u00A0km/s'}
        </span>
        <br />
        <span className="nowrap">
          <Tex tex="\htmlData{q=v}{v_g}(k_2)" /> = <Num value={c.vg2Ms / 1e3} digits={2} width={5} />
          {'\u00A0km/s'}
        </span>
        <br />
        <span className="nowrap">
          <Tex tex="\htmlData{q=v}{v_g}(k_3)" /> = <Num value={c.vg3Ms / 1e3} digits={2} width={5} />
          {'\u00A0km/s'}
        </span>
      </dd>

      <dt>{v.energyCheck}</dt>
      <dd>
        <span className="nowrap">
          <Tex tex="\hbar(\omega_1 + \omega_2)" /> ={' '}
          <Num value={c.energy1Mev + c.energy2Mev} digits={1} width={4} />
          {'\u00A0meV'}
        </span>
        <br />
        <span className="nowrap">
          <Tex tex="\hbar\omega_3" /> = <Num value={c.energy3Mev} digits={1} width={4} />
          {'\u00A0meV'}
        </span>
        <span className="sub note">
          <RichText text={v.energyNote} />
        </span>
      </dd>
    </dl>
  )
}

function Num({
  value,
  digits = 2,
  width
}: {
  value: number
  digits?: number
  width: number
}): JSX.Element {
  return (
    <span className="num value-num" style={{ minWidth: `${width}ch` }}>
      {formatNumber(value, digits)}
    </span>
  )
}
