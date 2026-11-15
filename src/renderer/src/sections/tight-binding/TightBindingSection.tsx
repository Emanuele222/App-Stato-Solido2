/**
 * Sezione «Legami forti» (dispense P3 §12, P4 §§1.4–2):
 *  - due varianti animate: catena monoatomica (bande indipendenti s, p) e biatomica A–B;
 *  - interruttore «Avvicina gli atomi» con legge esponenziale indicativa t(a) e diagramma bordi vs a;
 *  - spazio reale (orbitali s/p o A/B, lobi +/− dopo e^{ikna}, Re ψ_k e |ψ_k|² in forma indicativa);
 *  - diagramma E(k) tramite viz/BandPlot con livelli Ē_{s}/Ē_{p} o E_{A}/E_{B}, gap in ±π/a e pillole legante/antilegante;
 *  - formula viva, valori (blocco dl.values coerente con le altre sezioni), strumenti e scheda teoria.
 */
import { useCallback, type JSX, type PointerEvent } from 'react'
import { Panel, ParamSlider, Stepper, ToolToggle } from '../../ui/controls'
import { formatEffectiveMassRatio, formatNumber, formatSignificant } from '../../ui/format'
import { FOLLOW, GLIDE, useTweened } from '../../ui/motion'
import { SceneView, SectionLayout } from '../../ui/shell'
import { RichText, Tex } from '../../ui/tex'
import { isQuantityId, type QuantityId } from '../../ui/theme'
import { BandPlot } from '../../viz/BandPlot'
import { LiveFormula } from '../../viz/LiveFormula'
import { BandExtremumOverlay } from './BandExtremumOverlay'
import { EdgesVsDistancePlot } from './EdgesVsDistancePlot'
import {
  DIATOMIC_DEFINITIONS,
  DIATOMIC_MAIN_FORMULA,
  GENERAL_FORMULA,
  MONO_DEFINITIONS,
  MONO_MAIN_FORMULA
} from './formulas'
import { DIATOMIC_PARAMS, MONO_PARAMS, NUMERICS, type MonoParams, type TightBindingVariant } from './manifest'
import { useTightBindingModel, type TightBindingModel } from './model'
import {
  useTightBindingStore,
  type TightBindingHighlightTarget,
  type TightBindingState
} from './store'
import { strings as s } from './strings'
import { TightBindingRealSpace } from './TightBindingRealSpace'
import './tightBinding.css'

export function TightBindingSection(): JSX.Element {
  const st = useTightBindingStore()
  const shownMono = useTweened(st.monoParams, FOLLOW)
  const shownDiat = useTweened(st.diatomicParams, FOLLOW)
  const variantMix = useTweened({ mix: st.variant === 'diatomic' ? 1 : 0 }, GLIDE).mix

  const model = useTightBindingModel(shownMono, shownDiat, variantMix, st.variant, st.kFrac, st.band, {
    linkDistance: st.linkDistance,
    tRefAtA0: st.tRefAtA0,
    fill: st.tools.fill,
    electrons: st.electrons,
    mass: st.tools.mass,
    compare: st.tools.compare
  })

  const setHighlight = st.setHighlight
  const onPick = useCallback(
    (k: number, band: number) => {
      const kb = model.zoneEdge
      useTightBindingStore.getState().select(kb > 0 ? k / kb : 0, band)
    },
    [model.zoneEdge]
  )
  const onNudge = useCallback(
    (dk: number, dBand: number) => useTightBindingStore.getState().nudge(dk, dBand),
    []
  )

  const variantSwitch = (
    <div className="tb-variant-switch" role="group" aria-label={s.variants.label}>
      <span>{s.variants.label}</span>
      <div className="tb-variant-group">
        {(['monoatomic', 'diatomic'] as const).map((v: TightBindingVariant) => (
          <button
            key={v}
            type="button"
            className="tb-variant-btn"
            aria-pressed={st.variant === v}
            title={v === 'monoatomic' ? s.variants.monoatomicTitle : s.variants.diatomicTitle}
            onClick={() => st.setVariant(v)}
          >
            {s.variants[v]}
          </button>
        ))}
      </div>
    </div>
  )

  const paramControls =
    st.variant === 'monoatomic' ? (
      <>
        {MONO_PARAMS.filter((p) => !st.linkDistance || (p.id !== 'tS' && p.id !== 'absTP')).map((spec) => {
          const sub: TightBindingHighlightTarget = spec.id === 'a' ? null : spec.id
          const isActive =
            st.highlight === spec.quantity &&
            (sub === null || st.highlightTarget === null || st.highlightTarget === sub)
          return (
            <ParamSlider
              key={spec.id}
              quantity={spec.quantity}
              symbol={spec.symbol}
              label={s.params.monoatomic[spec.id]}
              value={st.monoParams[spec.id]}
              min={spec.min}
              max={spec.max}
              step={spec.step}
              unit={spec.unit}
              digits={spec.digits}
              active={isActive}
              onChange={(val) => st.setMonoParam(spec.id, val)}
              onHighlight={(q) => setHighlight(q, q ? sub : null)}
            />
          )
        })}
        <ToolToggle
          pressed={st.linkDistance}
          onToggle={st.toggleLinkDistance}
          quantity="t"
          title={s.params.linkDistance.title}
        >
          {s.params.linkDistance.toggle}
        </ToolToggle>
        {st.linkDistance && (
          <span
            className="tb-linked-param"
            data-q="t"
            onMouseEnter={() => setHighlight('t', null)}
            onMouseLeave={() => setHighlight(null, null)}
          >
            <RichText
              text={s.params.linkDistance.linkedNote(
                formatNumber(st.monoParams.tS, 2),
                formatNumber(st.monoParams.absTP, 2)
              )}
            />
          </span>
        )}
      </>
    ) : (
      <>
        {DIATOMIC_PARAMS.map((spec) => {
          const sub: TightBindingHighlightTarget = spec.id === 'eA' || spec.id === 'eB' ? spec.id : null
          const isActive =
            st.highlight === spec.quantity &&
            (sub === null || st.highlightTarget === null || st.highlightTarget === sub)
          return (
            <ParamSlider
              key={spec.id}
              quantity={spec.quantity}
              symbol={spec.symbol}
              label={s.params.diatomic[spec.id]}
              value={st.diatomicParams[spec.id]}
              min={spec.min}
              max={spec.max}
              step={spec.step}
              unit={spec.unit}
              digits={spec.digits}
              active={isActive}
              onChange={(val) => st.setDiatomicParam(spec.id, val)}
              onHighlight={(q) => setHighlight(q, q ? sub : null)}
            />
          )
        })}
      </>
    )

  const maxElectrons = st.variant === 'diatomic' ? 2 : NUMERICS.electrons.max
  const controls = (
    <div className="tb-params-grid">
      {variantSwitch}
      {paramControls}
      {st.tools.fill && (
        <Stepper
          label={st.variant === 'diatomic' ? s.tools.electronsDiatomic : s.tools.electronsMono}
          value={Math.min(st.electrons, maxElectrons)}
          min={NUMERICS.electrons.min}
          max={maxElectrons}
          onChange={st.setElectrons}
          decreaseLabel={s.tools.electronsDecrease}
          increaseLabel={s.tools.electronsIncrease}
        />
      )}
    </div>
  )

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

  const charText = s.scene.character(model.selection.character)
  const realHint =
    model.effectiveVariant === 'monoatomic'
      ? s.scene.realHintMono(model.selection.band === 0 ? '$s$' : '$p$', charText)
      : s.scene.realHintDiatomic(
          model.selection.band === 0 ? '$E_-$' : '$E_+$',
          charText,
          formatNumber(model.diatomic.bA2, 2),
          formatNumber(model.diatomic.bB2, 2)
        )

  const bandsHint = st.tools.compare ? `${s.scene.bandsHint} · ${s.scene.compareHint}` : s.scene.bandsHint

  const fillingProp = model.filling
    ? {
        fermiLevel: model.filling.fermiLevel,
        label: model.filling.kind === 'insulator' ? s.scene.insulator : s.scene.metal
      }
    : null

  const probeProp = model.probe
    ? {
        k: model.selection.k,
        energy: model.selection.energy,
        slope: model.probe.slope,
        curvature: model.probe.curvature,
        label: s.scene.probe
      }
    : null

  const gapProp =
    model.gapAtPi.value > 0
      ? {
          k: model.zoneEdge,
          lower: model.gapAtPi.lower,
          upper: model.gapAtPi.upper,
          label: model.gapAtPi.label,
          quantity: 'VG' as const
        }
      : null

  const scene = (
    <>
      <SceneView tag={s.scene.realTag} hint={<RichText text={realHint} />}>
        {st.variant === 'monoatomic' && model.mono.edgesVsA ? (
          <div className="tb-real-split">
            <div className="tb-real-main">
              <TightBindingRealSpace model={model} highlight={st.highlight} />
            </div>
            <EdgesVsDistancePlot points={model.mono.edgesVsA} currentA={shownMono.a} />
          </div>
        ) : (
          <TightBindingRealSpace model={model} highlight={st.highlight} />
        )}
      </SceneView>
      <SceneView tag={s.scene.bandsTag} hint={bandsHint}>
        <div className="tb-bands-wrap">
          <BandPlot
            bands={model.bands}
            kRange={[-NUMERICS.kWindow, NUMERICS.kWindow]}
            eRange={model.eRange}
            zoneEdge={model.zoneEdge}
            compare={
              model.compareBands
                ? {
                    bands: model.compareBands,
                    visible: st.tools.compare,
                    quantity: 'Ek',
                    label: s.scene.compareLegend
                  }
                : undefined
            }
            filling={fillingProp}
            gaps={gapProp ? [gapProp] : []}
            levels={model.levels.map((lv) => ({
              energy: lv.energy,
              k: 0,
              label: lv.label,
              quantity: 'Ek' as const
            }))}
            selection={{ k: model.selection.k, energy: model.selection.energy }}
            probe={probeProp}
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
          <BandExtremumOverlay
            kRange={[-NUMERICS.kWindow, NUMERICS.kWindow]}
            eRange={model.eRange}
            zoneEdge={model.zoneEdge}
            badges={model.extBadges}
            levels={model.levels}
            gap={gapProp}
            filling={fillingProp}
            probe={probeProp}
            selection={{ k: model.selection.k, energy: model.selection.energy }}
            compareVisible={st.tools.compare}
          />
        </div>
      </SceneView>
    </>
  )

  const isMono = st.variant === 'monoatomic'

  const aside = (
    <>
      <Panel title={s.formula.title} className="formula-panel">
        <div onPointerOver={(e) => hoverTerm(e, setHighlight)} onPointerLeave={() => setHighlight(null, null)}>
          <LiveFormula
            tex={GENERAL_FORMULA}
            highlight={st.highlight}
            pulse={st.pulse}
            ariaLabel={s.formula.generalAria}
          />
          <LiveFormula
            tex={isMono ? MONO_MAIN_FORMULA : DIATOMIC_MAIN_FORMULA}
            highlight={st.highlight}
            pulse={st.pulse}
            ariaLabel={isMono ? s.formula.monoAria : s.formula.diatomicAria}
            className="formula-main"
          />
          <div className="formula-defs">
            {(isMono ? MONO_DEFINITIONS : DIATOMIC_DEFINITIONS).map((def) => (
              <LiveFormula
                key={def}
                tex={def}
                display={false}
                highlight={st.highlight}
                pulse={st.pulse}
              />
            ))}
          </div>
        </div>
        {isMono && st.linkDistance && (
          <p className="tb-linked-note">
            <RichText text={s.params.linkDistance.badge} />
          </p>
        )}
        <Values
          model={model}
          shownMono={shownMono}
          shownDiat={shownDiat}
          st={st}
          onHighlight={setHighlight}
        />
      </Panel>

      <Panel title={s.theory.title} className="theory">
        <div onPointerOver={(e) => hoverTerm(e, setHighlight)} onPointerLeave={() => setHighlight(null, null)}>
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
      params={controls}
      aside={aside}
      asideLabel={s.asideLabel}
    />
  )
}

function Values({
  model,
  shownMono,
  shownDiat,
  st,
  onHighlight
}: {
  model: TightBindingModel
  shownMono: MonoParams
  shownDiat: { readonly a: number; readonly eA: number; readonly eB: number; readonly t: number }
  st: TightBindingState
  onHighlight: (q: QuantityId | null, target?: TightBindingHighlightTarget) => void
}): JSX.Element {
  const v = s.values
  const sel = model.selection
  const isMono = st.variant === 'monoatomic'
  const tP = -st.monoParams.absTP
  const gapVal = model.gapAtPi.value

  return (
    <>
      <dl
        className="values"
        onPointerOver={(e) => hoverTerm(e, onHighlight)}
        onPointerLeave={() => onHighlight(null, null)}
      >
        <dt data-q="a">{v.a}</dt>
        <dd data-q="a">
          <Tex tex="\htmlData{q=a}{a}" /> = <Num value={model.aEff} width={4} /> Å
          <span className="sub">
            {' · '}
            <Tex tex="\htmlData{q=a}{\pi/a}" /> = <Num value={model.zoneEdge} digits={3} width={5} /> Å⁻¹
          </span>
        </dd>

        {isMono ? (
          <>
            <dt data-q="E">
              <RichText text={v.bandS} />
            </dt>
            <dd data-q="E">
              <Tex tex="\htmlData{q=t}{t_s}" /> = <Num value={shownMono.tS} width={4} /> eV ·{' '}
              <Tex tex="\htmlData{q=t}{W_s}" /> = <Num value={model.mono.s.width} width={4} /> eV
              <br />
              <span className="sub">
                [<Num value={model.mono.s.min} width={5} />; <Num value={model.mono.s.max} width={5} />] eV ·{' '}
                <Tex tex="\htmlData{q=Ek}{\bar{E}_s}" /> = <Num value={shownMono.centerS} digits={1} width={4} /> eV
              </span>
            </dd>

            <dt data-q="E">
              <RichText text={v.bandP} />
            </dt>
            <dd data-q="E">
              <Tex tex="\htmlData{q=t}{t_p}" /> = <Num value={tP} width={5} /> eV ·{' '}
              <Tex tex="\htmlData{q=t}{W_p}" /> = <Num value={model.mono.p.width} width={4} /> eV
              <br />
              <span className="sub">
                [<Num value={model.mono.p.min} width={5} />; <Num value={model.mono.p.max} width={5} />] eV ·{' '}
                <Tex tex="\htmlData{q=Ek}{\bar{E}_p}" /> = <Num value={shownMono.centerP} digits={1} width={4} /> eV
              </span>
            </dd>
          </>
        ) : (
          <>
            <dt data-q="Ek">{v.levelsAB}</dt>
            <dd data-q="Ek">
              <Tex tex="\htmlData{q=Ek}{E_A}" /> = <Num value={shownDiat.eA} width={5} /> eV ·{' '}
              <Tex tex="\htmlData{q=Ek}{E_B}" /> ={' '}
              <Num value={Math.max(shownDiat.eA, shownDiat.eB)} width={5} /> eV
            </dd>

            <dt data-q="E">
              <RichText text={v.bandsDiat} />
            </dt>
            <dd data-q="E">
              <Tex tex="\htmlData{q=t}{W}" /> = <Num value={model.diatomic.exactWidth} digits={3} width={5} /> eV
              {shownDiat.t < 0.25 * Math.max(0.01, shownDiat.eB - shownDiat.eA) && (
                <span className="sub">
                  {' · '}
                  <RichText text={v.approxNote} />: <Num value={model.diatomic.approxWidth} digits={3} width={5} /> eV
                </span>
              )}
            </dd>
          </>
        )}

        <dt data-q="VG">
          <RichText text={v.gapPi} />
        </dt>
        <dd data-q="VG">
          <Tex tex="\htmlData{q=VG}{E_g}" /> ={' '}
          <Num value={isMono ? gapVal : Math.abs(gapVal) <= 1e-4 ? 0 : gapVal} width={5} /> eV
          {isMono && gapVal < -1e-4 && <span className="sub"> · {v.overlapNotice}</span>}
          {!isMono && Math.abs(gapVal) <= 1e-4 && (
            <span className="sub">
              {' · '}
              <RichText text={v.closedGapNotice} />
            </span>
          )}
        </dd>

        <dt data-q="E">
          <RichText text={v.centerSep} />
        </dt>
        <dd data-q="E">
          <Tex tex="\htmlData{q=E}{\Delta E(0)}" /> = <Num value={model.centerSeparation} width={5} /> eV
        </dd>

        <dt data-q="k">{v.selection}</dt>
        <dd data-q="k">
          <Tex tex="\htmlData{q=k}{k}" /> = <Num value={sel.kFrac} width={5} /> π/a ·{' '}
          <RichText text={isMono ? v.stateBandMono(sel.band) : v.stateBandDiat(sel.band)} />
          <br />
          <Tex tex="\htmlData{q=E}{E}" /> = <Num value={sel.energy} digits={3} width={5} /> eV{' '}
          <span className="sub">· {s.scene.character(sel.character)}</span>
          {!isMono && (
            <>
              <br />
              <Tex tex="|\htmlData{q=psi}{b_A}|^2" /> = <Num value={model.diatomic.bA2} width={4} /> ·{' '}
              <Tex tex="|\htmlData{q=psi}{b_B}|^2" /> = <Num value={model.diatomic.bB2} width={4} />
            </>
          )}
        </dd>

        {model.probe && (
          <>
            <dt data-q="mstar">{v.massProbe}</dt>
            <dd data-q="mstar">
              <Tex tex="\htmlData{q=mstar}{m^*}/m_0" />{' '}
              <span className="num value-num" style={{ minWidth: '6ch' }}>
                {formatEffectiveMassRatio(model.probe.massRatio, { significant: 3, withEquals: true })}
              </span>
            </dd>

            <dt data-q="mstar">
              <RichText
                text={
                  isMono
                    ? sel.band === 0
                      ? v.massCompareMonoS
                      : v.massCompareMonoP
                    : v.massCompareDiat
                }
              />
            </dt>
            <dd data-q="mstar">
              {isMono ? (
                sel.band === 0 ? (
                  <>
                    <Tex tex="\htmlData{q=mstar}{m^*_{s,\text{fondo}}}/m_0" /> ={' '}
                    <span className="num">{formatSignificant(model.monoMassAnalytic.sBottom, 4)}</span>
                    <br />
                    <span className="sub">
                      <Tex tex="\htmlData{q=mstar}{m^*_{s,\text{cima}}}/m_0" /> ={' '}
                      <span className="num">{formatSignificant(model.monoMassAnalytic.sTop, 4)}</span>
                    </span>
                  </>
                ) : (
                  <>
                    <Tex tex="\htmlData{q=mstar}{m^*_{p,\text{fondo}}}/m_0" /> ={' '}
                    <span className="num">{formatSignificant(model.monoMassAnalytic.pBottom, 4)}</span>
                    <br />
                    <span className="sub">
                      <Tex tex="\htmlData{q=mstar}{m^*_{p,\text{cima}}}/m_0" /> ={' '}
                      <span className="num">{formatSignificant(model.monoMassAnalytic.pTop, 4)}</span>
                    </span>
                  </>
                )
              ) : (
                <>
                  <Tex tex="\htmlData{q=mstar}{m^*_c}/m_0" /> ={' '}
                  <span className="num">{formatSignificant(model.diatomic.massC, 4)}</span>
                  <span className="sub">
                    {' · '}
                    <Tex tex="\htmlData{q=mstar}{m^*_v}/m_0" /> ={' '}
                    <span className="num">{formatSignificant(model.diatomic.massV, 4)}</span>
                  </span>
                </>
              )}
            </dd>
          </>
        )}

        {model.filling && (
          <>
            <dt data-q="EF">{v.fermi}</dt>
            <dd data-q="EF">
              <Tex tex="\htmlData{q=EF}{E_F}" /> = <Num value={model.filling.fermiLevel} width={5} /> eV
              <span className="sub">
                {' · '}
                {model.filling.kind === 'insulator' ? s.scene.insulator : s.scene.metal}
              </span>
            </dd>
          </>
        )}
      </dl>
      {st.tools.compare && (
        <p className="tb-compare-notice">
          <RichText text={s.scene.compareNote} />
        </p>
      )}
    </>
  )
}

function Num({ value, digits = 2, width }: { value: number; digits?: number; width: number }): JSX.Element {
  return (
    <span className="num value-num" style={{ minWidth: `${width}ch` }}>
      {formatNumber(value, digits)}
    </span>
  )
}

function hoverTerm(
  e: PointerEvent,
  setHighlight: (q: QuantityId | null, target?: TightBindingHighlightTarget) => void
): void {
  const term = (e.target as Element).closest?.('[data-q]')
  const q = term?.getAttribute('data-q')
  if (!isQuantityId(q)) {
    setHighlight(null, null)
    return
  }
  const txt = (term?.textContent ?? '').replace(/\s+/g, '')
  let target: TightBindingHighlightTarget = null
  if (q === 't') {
    if (txt.includes('t_s') || txt === 'ts') target = 'tS'
    else if (txt.includes('t_p') || txt.includes('tp')) target = 'absTP'
  } else if (q === 'Ek') {
    if (txt.includes('Ēs') || txt.includes('Eˉs') || txt.endsWith('Es')) target = 'centerS'
    else if (txt.includes('Ēp') || txt.includes('Eˉp') || txt.endsWith('Ep')) target = 'centerP'
    else if (txt === 'EA') target = 'eA'
    else if (txt === 'EB') target = 'eB'
  }
  setHighlight(q, target)
}
