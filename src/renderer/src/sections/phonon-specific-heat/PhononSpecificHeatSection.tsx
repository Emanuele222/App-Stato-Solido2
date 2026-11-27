/**
 * Sezione 6 — Calore specifico del reticolo: evoluzione storica e modello di Debye
 * (dispensa Parte 6, Lezione 4: §§20–23, §25, Figg. 22–27, Tabb. 2–4, eqq. 52–59 e 61–62).
 */
import { useCallback, type JSX, type PointerEvent } from 'react'
import { Panel, ParamSlider, PresetMenu, ToolToggle } from '../../ui/controls'
import { formatNumber, formatSignificant } from '../../ui/format'
import { FOLLOW, GLIDE, useTweened } from '../../ui/motion'
import { SceneView, SectionLayout } from '../../ui/shell'
import { RichText, Tex } from '../../ui/tex'
import { isQuantityId, type QuantityId } from '../../ui/theme'
import { LiveFormula } from '../../viz/LiveFormula'
import { mainFormulaTex, secondaryFormulasTex } from './formulas'
import {
  HISTORICAL_STAGES,
  MATERIAL_PRESET_OPTIONS,
  SPECIFIC_HEAT_PARAMS
} from './manifest'
import { useSpecificHeatModel, type SpecificHeatModel } from './model'
import { SpecificHeatCurveView } from './SpecificHeatCurveView'
import { SpectrumDebyeView } from './SpectrumDebyeView'
import { usePhononSpecificHeatStore } from './store'
import { strings as s } from './strings'
import './phonon-specific-heat.css'

const PRESET_OPTIONS = MATERIAL_PRESET_OPTIONS.map((p) => ({
  id: p.id,
  label: p.label
}))

export function PhononSpecificHeatSection(): JSX.Element {
  const st = usePhononSpecificHeatStore()
  const shown = useTweened(st.params, st.transition === 'glide' ? GLIDE : FOLLOW)
  const model = useSpecificHeatModel(
    st.stage,
    st.scale,
    st.unit,
    st.showT3Asymptote,
    shown,
    st.presetId
  )
  const setHighlight = st.setHighlight

  const onChangeT = useCallback((t: number) => {
    usePhononSpecificHeatStore.getState().setTemperature(t)
  }, [])

  const onNudgeT = useCallback((dt: number) => {
    usePhononSpecificHeatStore.getState().nudgeTemperature(dt)
  }, [])

  const tools = (
    <>
      {HISTORICAL_STAGES.map((item) => (
        <ToolToggle
          key={item.id}
          pressed={st.stage === item.id}
          onToggle={() => st.setStage(item.id)}
          quantity={item.quantity}
          title={s.stageTitles[item.id]}
        >
          {s.stages[item.id]}
        </ToolToggle>
      ))}
    </>
  )

  const sliderValues = st.transition === 'glide' ? shown : st.params

  const params = (
    <div className="phonon-sh-params" style={{ display: 'contents' }}>
      <PresetMenu
        label={s.presets.label}
        freeLabel={s.presets.free}
        options={PRESET_OPTIONS}
        value={st.presetId}
        onSelect={st.applyPreset}
      />
      {SPECIFIC_HEAT_PARAMS.map((spec) => (
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
    </div>
  )

  const is1953 = st.stage === 'beyond-1953'
  const isEinstein = st.stage === 'einstein'
  const spherePct = Math.pow(model.summary.sphereRadiusFraction, 3) * 100
  const spectrumTag = is1953
    ? s.spectrumScene.tag1953
    : isEinstein
      ? s.spectrumScene.tagEinstein
      : s.spectrumScene.tagStandard
  const spectrumHint = is1953
    ? s.spectrumScene.hint1953
    : isEinstein
      ? s.spectrumScene.hintEinstein(
          Math.round(model.summary.thetaEK),
          formatNumber(model.summary.einsteinNorm * 100, 1)
        )
      : s.spectrumScene.hintStandard(
          Math.round(model.summary.thetaDK),
          formatNumber(model.summary.freqDThz, 2),
          formatNumber(spherePct, spherePct < 1 ? 2 : 1)
        )

  const scene = (
    <>
      <SceneView
        tag={s.curveScene.tag}
        hint={<RichText text={s.curveScene.hint} />}
      >
        <SpecificHeatCurveView
          model={model}
          highlight={st.highlight}
          onChangeT={onChangeT}
          onNudgeT={onNudgeT}
          onChangeScale={st.setScale}
          onChangeUnit={st.setUnit}
          onToggleT3={st.toggleT3Asymptote}
        />
      </SceneView>
      <SceneView
        tag={spectrumTag}
        hint={<span className="num"><RichText text={spectrumHint} /></span>}
      >
        <SpectrumDebyeView model={model} highlight={st.highlight} />
      </SceneView>
    </>
  )

  const theoryBlocks = s.theory.blocksByStage[st.stage]

  const aside = (
    <>
      <Panel title={s.formula.title} className="formula-panel phonon-sh-formula-panel">
        <LiveFormula
          tex={mainFormulaTex(st.stage)}
          highlight={st.highlight}
          onHighlight={setHighlight}
          pulse={st.pulse}
          ariaLabel={s.formula.ariaByStage[st.stage]}
          className="formula-main"
        />
        <div className="formula-defs">
          {secondaryFormulasTex(st.stage).map((tex) => (
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
        <SpecificHeatValues model={model} onHighlight={setHighlight} />
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

function SpecificHeatValues({
  model,
  onHighlight
}: {
  model: SpecificHeatModel
  onHighlight: (q: QuantityId | null) => void
}): JSX.Element {
  const v = s.values
  const sum = model.summary
  const mat = model.activeMaterial
  const debyeDigits = sum.debyeJmolK < 1 ? 3 : 2
  const einDigits = sum.einsteinJmolK < 1 ? 3 : 2

  return (
    <dl
      className="values"
      onPointerOver={(e) => hoverQuantity(e, onHighlight)}
      onPointerLeave={() => onHighlight(null)}
    >
      <dt>{v.cursorT}</dt>
      <dd>
        <span className="nowrap">
          <Tex tex="\htmlData{q=T}{T}" /> = <Num value={sum.temperatureK} digits={0} width={4} />
          {'\u00A0K'}
        </span>
        <span className="sub">
          {' · '}
          <span className="nowrap">
            <Tex tex="k_B\htmlData{q=T}{T}" /> = <Num value={sum.thermalEnergyMev} digits={1} width={4} />
            {'\u00A0meV'}
          </span>
        </span>
      </dd>

      <dt>{v.dulongPetit}</dt>
      <dd>
        <span className="nowrap">
          <Tex tex="\htmlData{q=Ek}{3R}" /> = <Num value={sum.dulongPetitJmolK} digits={2} width={5} />
          {'\u00A0J/(mol·K)'}
        </span>
      </dd>

      <dt>{v.einstein}</dt>
      <dd>
        <span className="nowrap">
          <Tex tex="\htmlData{q=omegaOpt}{C_V^{\mathrm{E}}}" /> ={' '}
          <Num value={sum.einsteinJmolK} digits={einDigits} width={5} />
          {'\u00A0J/(mol·K)'}
        </span>
        <span className="sub">
          {' · '}
          <span className="nowrap">
            <Num value={sum.einsteinNorm * 100} digits={1} width={4} />%
          </span>
        </span>
      </dd>

      <dt>{v.debye}</dt>
      <dd>
        <span className="nowrap">
          <Tex tex="\htmlData{q=CV}{C_V^{\mathrm{D}}}" /> ={' '}
          <Num value={sum.debyeJmolK} digits={debyeDigits} width={5} />
          {'\u00A0J/(mol·K)'}
        </span>
        <span className="sub">
          {' · '}
          <span className="nowrap">
            <Num value={sum.debyeNorm * 100} digits={1} width={4} />%
          </span>
        </span>
      </dd>

      <dt>{v.t3Asymptote}</dt>
      <dd>
        <span className="nowrap">
          <Tex tex="\htmlData{q=omega}{C_V^{(T^3)}}" /> ={' '}
          <span className="num value-num" style={{ minWidth: '6ch' }}>
            {sum.debyeT3JmolK >= 10000
              ? '> 9999'
              : sum.debyeT3JmolK < 1
                ? formatNumber(sum.debyeT3JmolK, 3)
                : sum.debyeT3JmolK >= 100
                  ? formatSignificant(sum.debyeT3JmolK, 4)
                  : formatNumber(sum.debyeT3JmolK, 2)}
          </span>
          {'\u00A0J/(mol·K)'}
        </span>
        <span className="sub">
          {' · '}
          <span className="nowrap">
            <Tex tex="T/\Theta_D" /> = <Num value={sum.tOverThetaD} digits={3} width={5} />
          </span>
        </span>
      </dd>

      <dt>{v.cutoff}</dt>
      <dd>
        <span className="nowrap">
          <Tex tex="\htmlData{q=Theta}{\nu_D}" /> = <Num value={sum.freqDThz} digits={2} width={4} />
          {'\u00A0THz'}
        </span>
        <span className="sub">
          {' · '}
          <span className="nowrap">
            <Tex tex="\hbar\htmlData{q=Theta}{\omega_D}" /> = <Num value={sum.energyDMev} digits={1} width={4} />
            {'\u00A0meV'}
          </span>
        </span>
      </dd>

      {mat && (
        <>
          <dt>{mat.id === 'diamond' ? v.diamondEstLabel : v.expTab2}</dt>
          <dd>
            {mat.experimentalPoints.length > 0 ? (
              mat.experimentalPoints.map((ep, idx) => (
                <span key={ep.temperatureK}>
                  {idx > 0 ? '; ' : ''}
                  <span className="nowrap">
                    {ep.temperatureK} K:{' '}
                    <span className="num" style={{ color: 'var(--tone-light-line)' }}>
                      {formatNumber(ep.cvJmolK, ep.cvJmolK < 1 ? 2 : 1)}
                    </span>
                    {'\u00A0J/(mol·K)'}
                  </span>
                </span>
              ))
            ) : (
              <span className="sub">{v.noExpNote}</span>
            )}
          </dd>
        </>
      )}
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
