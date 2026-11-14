/**
 * Sezione «Metodo k·p» (dispensa P4 §3):
 *  - due varianti animate: «Quattro bande (Kane)» (c, hh, lh, so) e «Due bande, esatto» (2×2);
 *  - scena collegata a tre viste: Livelli in Γ (con/senza spin–orbita),
 *    barra di scomposizione dei contributi a m₀/m*, Diagramma E(k) vicino a Γ;
 *  - strumenti trasversali (riempimento intrinseco a T = 0, sonda m*, confronto)
 *    e scheda compatta «Verifica sui quasi liberi».
 */
import { useCallback, type JSX, type PointerEvent, type ReactNode } from 'react'
import { ParamSlider, Panel, PresetMenu, ToolToggle } from '../../ui/controls'
import { formatNumber } from '../../ui/format'
import { FOLLOW, GLIDE, useTweened } from '../../ui/motion'
import { SceneView, SectionLayout } from '../../ui/shell'
import { RichText, Tex } from '../../ui/tex'
import { isQuantityId, type QuantityId } from '../../ui/theme'
import { LiveFormula } from '../../viz/LiveFormula'
import {
  GENERAL_KP_FORMULA,
  KANE_BANDS_FORMULA,
  KANE_MASSES_FORMULA,
  TWO_BAND_MATRIX_FORMULA
} from './formulas'
import { GammaLevelsCanvas } from './GammaLevelsCanvas'
import { KpBandPlot } from './KpBandPlot'
import { PARAMS, PRESETS } from './manifest'
import { MassContributionsBar } from './MassContributionsBar'
import { useKpModel, type KpModel } from './model'
import { useKpStore, type KpBandRole } from './store'
import { strings as s } from './strings'
import './kDotP.css'

const PRESET_OPTIONS = PRESETS.map((p) => ({
  id: p.id,
  label: s.presets.item(p.name, formatNumber(p.eg, 2), formatNumber(p.delta, 2), formatNumber(p.ep, 1))
}))

export function KDotPSection(): JSX.Element {
  const st = useKpStore()
  const shown = useTweened(st.params, st.transition === 'glide' ? GLIDE : FOLLOW)
  const { mix: variantMix } = useTweened({ mix: st.variant === 'two-band' ? 1 : 0 }, GLIDE)

  const model = useKpModel(shown, st.variant, variantMix, st.k, st.role, st.tools, st.presetId)
  const sliderValues = st.transition === 'glide' ? shown : st.params
  const setHighlight = st.setHighlight

  const onPick = useCallback((k: number, role: KpBandRole) => useKpStore.getState().select(k, role), [])
  const onNudge = useCallback((dk: number, dBand: number) => useKpStore.getState().nudge(dk, dBand), [])
  const onSelectRole = useCallback(
    (role: KpBandRole) => useKpStore.getState().select(useKpStore.getState().k, role),
    []
  )

  const activePreset = PRESETS.find((p) => p.id === st.presetId) ?? null
  const isKane = model.effectiveVariant === 'kane'

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
        title={isKane ? s.tools.compareKaneTitle : s.tools.compareTwoBandTitle}
      >
        {isKane ? s.tools.compareKane : s.tools.compareTwoBand}
      </ToolToggle>
    </>
  )

  const params = (
    <>
      <div className="kdotp-variant-switch" role="group" aria-label={s.variants.label}>
        <span>{s.variants.label}</span>
        <div className="kdotp-variant-group">
          <button
            type="button"
            className="kdotp-variant-btn"
            aria-pressed={st.variant === 'kane'}
            title={s.variants.kaneTitle}
            onClick={() => st.setVariant('kane')}
          >
            {s.variants.kane}
          </button>
          <button
            type="button"
            className="kdotp-variant-btn"
            aria-pressed={st.variant === 'two-band'}
            title={s.variants.twoBandTitle}
            onClick={() => st.setVariant('two-band')}
          >
            {s.variants.twoBand}
          </button>
        </div>
      </div>

      {PARAMS.filter((spec) => !spec.kaneOnly || st.variant === 'kane').map((spec) => (
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

  const scene = (
    <>
      <SceneView
        tag={s.scene.levelsTag}
        hint={
          isKane
            ? s.scene.levelsHint(s.scene.bandShort(model.selection.role), formatNumber(model.gammaLevels.delta, 2))
            : s.scene.levelsHintTwoBand(s.scene.bandShort(model.selection.role))
        }
      >
        <GammaLevelsCanvas model={model} highlight={st.highlight} onSelectRole={onSelectRole} />
      </SceneView>

      <SceneView tag={s.scene.contribTag} hint={s.scene.contribHint}>
        <MassContributionsBar model={model} highlight={st.highlight} />
      </SceneView>

      <SceneView
        tag={s.scene.bandsTag}
        hint={isKane ? s.scene.bandsHint : s.scene.bandsHintTwoBand}
      >
        <div className="kdotp-bands-wrap">
          <KpBandPlot
            model={model}
            highlight={st.highlight}
            showProbe={st.tools.mass}
            showCompare={st.tools.compare}
            onPick={onPick}
            onNudge={onNudge}
          />
        </div>
      </SceneView>
    </>
  )

  const aside = (
    <>
      <Panel title={s.formula.title} className="kdotp-formula-panel">
        <div className="kdotp-formula-block">
          <div className="kdotp-formula-subhead">{s.formula.generalTitle}</div>
          <LiveFormula
            className="formula-main"
            tex={GENERAL_KP_FORMULA}
            highlight={st.highlight}
            onHighlight={setHighlight}
            pulse={st.pulse}
            ariaLabel={s.formula.generalAria}
          />
        </div>

        <div className="kdotp-formula-block">
          <div className="kdotp-formula-subhead">
            {isKane ? s.formula.kaneTitle : s.formula.twoBandTitle}
          </div>
          {isKane ? (
            <>
              <LiveFormula
                className="formula-main"
                tex={KANE_BANDS_FORMULA}
                highlight={st.highlight}
                onHighlight={setHighlight}
                pulse={st.pulse}
                ariaLabel={s.formula.kaneAria}
              />
              <LiveFormula
                className="formula-main"
                tex={KANE_MASSES_FORMULA}
                highlight={st.highlight}
                onHighlight={setHighlight}
                pulse={st.pulse}
                ariaLabel={s.formula.kaneAria}
              />
            </>
          ) : (
            <LiveFormula
              className="formula-main"
              tex={TWO_BAND_MATRIX_FORMULA}
              highlight={st.highlight}
              onHighlight={setHighlight}
              pulse={st.pulse}
              ariaLabel={s.formula.twoBandAria}
            />
          )}
        </div>

        <KpValues model={model} activePreset={activePreset} tools={st.tools} onHighlight={setHighlight} />

        {activePreset?.indirectNote && (
          <p className="kdotp-callout kdotp-callout-warn">
            <RichText text={activePreset.indirectNote} />
          </p>
        )}

        {st.tools.fill && (
          <p className="kdotp-callout">
            <RichText text={s.values.fillingBox} />
          </p>
        )}

        {st.tools.compare && (
          <p className="kdotp-callout">
            <RichText text={isKane ? s.values.compareNoteKane : s.values.compareNoteTwoBand} />
          </p>
        )}

        <NearlyFreeVerifyCard summary={model.nearlyFreeCheck} />
      </Panel>

      <Panel title={s.theory.title} className="theory">
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
        <p className="foot">{s.theory.foot}</p>
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

function KpValues({
  model,
  activePreset,
  tools,
  onHighlight
}: {
  readonly model: KpModel
  readonly activePreset: (typeof PRESETS)[number] | null
  readonly tools: { readonly fill: boolean; readonly mass: boolean; readonly compare: boolean }
  readonly onHighlight: (q: QuantityId | null) => void
}): JSX.Element {
  const isKane = model.effectiveVariant === 'kane'
  const km = model.kaneMasses
  const meas = model.presetMeasured
  const sel = model.selection

  const over = (e: PointerEvent<HTMLElement>): void => {
    const t = (e.target as Element).closest?.('[data-q]')
    const q = t ? t.getAttribute('data-q') : null
    onHighlight(isQuantityId(q) ? q : null)
  }

  const fmtMassWithMeas = (calc: number, measuredVal: number | null | undefined, digits: number = 4): ReactNode => (
    <>
      {activePreset ? `${s.values.calcPrefix} ` : ''}
      <Num value={calc} digits={digits} width={6} />
      {measuredVal != null && (
        <span className="sub">
          {' · '}
          {s.values.measPrefix} {formatNumber(measuredVal, measuredVal < 0.02 ? 4 : 3)}
        </span>
      )}
    </>
  )

  return (
    <dl className="values kdotp-values" onPointerOver={over} onPointerLeave={() => onHighlight(null)}>
      <dt>
        <RichText text={s.values.eg} />
      </dt>
      <dd>
        <Tex tex="\htmlData{q=VG}{E_g}" /> = <Num value={model.params.eg} digits={2} width={4} /> eV
      </dd>

      {isKane && (
        <>
          <dt>
            <RichText text={s.values.delta} />
          </dt>
          <dd>
            <Tex tex="\htmlData{q=psi}{\Delta}" /> = <Num value={model.params.delta} digits={2} width={4} /> eV
          </dd>
        </>
      )}

      <dt>
        <RichText text={s.values.ep} />
      </dt>
      <dd>
        <Tex tex="\htmlData{q=v}{E_P}" /> = <Num value={model.params.ep} digits={1} width={4} /> eV
      </dd>

      <dt>
        <RichText text={s.values.pKane} />
      </dt>
      <dd>
        <Tex tex="\htmlData{q=v}{P}" /> = <Num value={km.pKane} digits={3} width={5} /> eV·Å
        <span className="note sub">
          <RichText text={s.values.pKaneNote} />
        </span>
      </dd>

      {isKane ? (
        <>
          <dt>
            <RichText text={s.values.massC} />
          </dt>
          <dd>{fmtMassWithMeas(km.mc, meas?.mc)}</dd>

          <dt>
            <RichText text={s.values.massLH} />
          </dt>
          <dd>{fmtMassWithMeas(km.mlh, meas?.mlh)}</dd>

          <dt>
            <RichText text={s.values.massSO} />
          </dt>
          <dd>{fmtMassWithMeas(km.mso, meas?.mso)}</dd>

          <dt>
            <RichText text={s.values.massHH} />
          </dt>
          <dd>
            {fmtMassWithMeas(km.mhh, meas?.mhh, 2)}
            <span className="note sub">{s.values.hhOrderNote}</span>
          </dd>
        </>
      ) : (
        <>
          <dt>
            <RichText text="$m^*_c(0)/m_0$" />
          </dt>
          <dd>
            <Num value={1 / (1 + model.params.ep / model.params.eg)} digits={4} width={6} />
            {meas?.mc != null && (
              <span className="sub">
                {' · '}
                {s.values.measPrefix} {formatNumber(meas.mc, 4)}
              </span>
            )}
          </dd>

          <dt>
            <RichText text="$m^*_{lh}(0)/m_0$" />
          </dt>
          <dd>
            <Num value={1 / (1 - model.params.ep / model.params.eg)} digits={4} width={7} />
          </dd>
        </>
      )}

      <dt>{s.values.selectedState}</dt>
      <dd>
        <Tex tex="\htmlData{q=k}{k}" /> = <Num value={sel.k} digits={3} width={6} /> Å⁻¹ ·{' '}
        <span className="sub">{s.scene.bandShort(sel.role)}</span>
        <br />
        <Tex tex="\htmlData{q=E}{E}" /> = <Num value={sel.energy} digits={3} width={6} /> eV
      </dd>

      {tools.mass && (
        <>
          <dt>{s.values.localMass}</dt>
          <dd>
            <Tex tex="\htmlData{q=mstar}{m^*}/m_0" /> ={' '}
            {Number.isFinite(sel.numericalMassRatio) ? <Num value={sel.numericalMassRatio} digits={4} width={7} /> : '∞'}
            <span className="note sub">
              {s.values.analyticMass}:{' '}
              {Number.isFinite(sel.formulaMassRatio) ? formatNumber(sel.formulaMassRatio, 4) : '∞'} m₀
            </span>
          </dd>
        </>
      )}

      {!isKane && (
        <>
          <dt>
            <RichText text={s.values.validityRatio} />
          </dt>
          <dd>
            <Num value={sel.pkOverHalfEg} digits={2} width={5} />
            <span className="note sub">
              <RichText text={sel.withinValidity ? s.values.validityInside : s.values.validityOutside} />
            </span>
          </dd>
        </>
      )}

      {activePreset?.id === 'ge' && (
        <>
          <dt>nota Ge</dt>
          <dd className="sub">
            <RichText text={s.values.geNoGammaMassNote} />
          </dd>
        </>
      )}
    </dl>
  )
}

function NearlyFreeVerifyCard({ summary }: { readonly summary: KpModel['nearlyFreeCheck'] }): JSX.Element {
  return (
    <div className="kdotp-verify-card">
      <div className="kdotp-verify-title">{s.verification.title}</div>
      <div className="kdotp-verify-sub">
        <RichText text={s.verification.subtitle} />
      </div>
      <dl className="values">
        <dt>
          <RichText text={s.verification.sumLabel} />
        </dt>
        <dd className="num">{formatNumber(summary.invMassSum, 3)}</dd>

        <dt>
          <RichText text={s.verification.exactLabel} />
        </dt>
        <dd className="num">{formatNumber(summary.invMassExact, 3)}</dd>

        <dt>
          <RichText text={s.verification.twoBandLabel} />
        </dt>
        <dd className="num">{formatNumber(summary.invMassTwoBand, 2)}</dd>

        <dt>
          <RichText text={s.verification.momentumLabel} />
        </dt>
        <dd className="num">
          {formatNumber(summary.p01Abs, 4)} vs {formatNumber(summary.k0, 4)} Å⁻¹
        </dd>
      </dl>
    </div>
  )
}

function Num({ value, digits, width }: { readonly value: number; readonly digits: number; readonly width: number }): JSX.Element {
  return (
    <span className="value-num num" style={{ minWidth: `${width}ch` }}>
      {formatNumber(value, digits)}
    </span>
  )
}
