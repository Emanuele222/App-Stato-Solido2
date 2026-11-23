/**
 * Sezione «Pseudopotenziale» (modello 1D esatto con stato di core, P4 §4):
 *  - Bande 1D (core + valenza) con livello di core spostato E_c + f;
 *  - Spazio reale: V(x), ψ_c, ψ_k vera e pseudo-funzione ψ^f con raggio di core r_c;
 *  - Spazio reciproco: pesi |c_G|² e cancellazione ⟨k+G|V|k⟩ contro ⟨k+G|V+V′|k⟩;
 *  - Pulsante «più liscia» per α e rimando «Bande dei materiali veri →».
 */
import { useCallback, type JSX, type PointerEvent } from 'react'
import { ParamSlider, Panel, ToolToggle } from '../../ui/controls'
import { formatEffectiveMassRatio, formatNumber } from '../../ui/format'
import { useNavigationStore } from '../../ui/navigation'
import { SceneView, SectionLayout } from '../../ui/shell'
import { RichText, Tex } from '../../ui/tex'
import { isQuantityId } from '../../ui/theme'
import { ChartLegend, type LegendEntry } from '../../viz/ChartLegend'
import { LiveFormula } from '../../viz/LiveFormula'
import { NON_UNIQUENESS_FORMULA, OPW_EXPANSION_FORMULA, PSEUDO_SCHRODINGER_FORMULA } from './formulas'
import { PARAMS } from './manifest'
import { usePseudoCoreModel, type BareIonRow } from './model'
import { PseudoCoreBandPlot } from './PseudoCoreBandPlot'
import { PseudoCoreRealSpaceCanvas } from './PseudoCoreRealSpaceCanvas'
import { PseudoCoreReciprocalCanvas } from './PseudoCoreReciprocalCanvas'
import { usePseudoCoreStore } from './store'
import { strings as s } from './strings'
import './pseudopotential.css'

function HintLine({ text }: { readonly text: string }): JSX.Element {
  return (
    <span className="pseudo1d-hint" title={text}>
      {text}
    </span>
  )
}

export function PseudopotentialSection(): JSX.Element {
  const st = usePseudoCoreStore()
  const navigateTo = useNavigationStore((nav) => nav.navigateTo)

  const model = usePseudoCoreModel(st.params, st.kIndex, st.bandIndex, st.tools)
  const setHighlight = st.setHighlight

  const over = useCallback(
    (e: PointerEvent<HTMLElement>) => {
      const t = (e.target as Element).closest?.('[data-q]')
      const q = t ? t.getAttribute('data-q') : null
      setHighlight(isQuantityId(q) ? q : null)
    },
    [setHighlight]
  )
  const leave = useCallback(() => setHighlight(null), [setHighlight])

  const onPickState = useCallback(
    (kIndex: number, bandIndex: number) => usePseudoCoreStore.getState().selectState(kIndex, bandIndex),
    []
  )
  const onNudgeState = useCallback(
    (dk: number, dBand: number) => usePseudoCoreStore.getState().nudgeState(dk, dBand),
    []
  )

  const tools = (
    <>
      <ToolToggle pressed={st.tools.fill} onToggle={() => st.toggleTool('fill')} quantity="EF" title={s.tools.fillTitle}>
        {s.tools.fill}
      </ToolToggle>
      <ToolToggle pressed={st.tools.mass} onToggle={() => st.toggleTool('mass')} quantity="mstar" title={s.tools.massTitle}>
        {s.tools.mass}
      </ToolToggle>
      <ToolToggle pressed={st.tools.compare} onToggle={() => st.toggleTool('compare')} quantity="Ek" title={s.tools.compareTitle}>
        {s.tools.compare}
      </ToolToggle>
      <button type="button" className="pseudo1d-cross-link" onClick={() => navigateTo('real-bands')}>
        {s.goToRealBands}
      </button>
    </>
  )

  const realLegend: LegendEntry[] = [
    { id: 'pot', keyKind: 'solid', color: 'var(--q-VG)', label: s.scene.potentialLegend },
    { id: 'core', keyKind: 'dotted', color: 'var(--q-VG)', label: s.scene.psiCoreLegend },
    { id: 'true', keyKind: 'solid', color: 'var(--q-psi)', label: s.scene.psiTrueLegend },
    { id: 'smooth', keyKind: 'dashed', color: 'var(--tone-smooth-wavefunction)', label: s.scene.psiSmoothLegend }
  ]

  const recipLegend: LegendEntry[] = [
    { id: 'wt', keyKind: 'solid', color: 'var(--q-psi)', label: s.scene.weightsTrueLegend },
    { id: 'ws', keyKind: 'solid', color: 'var(--tone-smooth-wavefunction)', label: s.scene.weightsSmoothLegend },
    { id: 'mv', keyKind: 'solid', color: 'var(--q-VG)', label: s.scene.matVLegend },
    { id: 'mvps', keyKind: 'solid', color: 'var(--q-E)', label: s.scene.matVpsLegend }
  ]

  const scene = (
    <>
      <SceneView className="pseudo1d-view pseudo1d-scene" tag={s.scene.bandsTag} hint={<HintLine text={s.scene.bandsHint} />}>
        <PseudoCoreBandPlot
          model={model}
          highlight={st.highlight}
          showFill={st.tools.fill}
          showMass={st.tools.mass}
          showCompare={st.tools.compare}
          onPick={onPickState}
          onNudge={onNudgeState}
        />
      </SceneView>

      <div className="pseudo1d-bottom-row">
        <SceneView className="pseudo1d-view" tag={s.scene.realTag} hint={<HintLine text={s.scene.realHint} />}>
          <div className="pseudo1d-view-col">
            <ChartLegend entries={realLegend} ariaLabel={s.scene.realAria} />
            <div className="pseudo1d-canvas-box">
              <PseudoCoreRealSpaceCanvas model={model} highlight={st.highlight} />
            </div>
          </div>
        </SceneView>

        <SceneView className="pseudo1d-view" tag={s.scene.recipTag} hint={<HintLine text={s.scene.recipHint} />}>
          <div className="pseudo1d-view-col">
            <ChartLegend entries={recipLegend} ariaLabel={s.scene.recipAria} />
            <div className="pseudo1d-canvas-box">
              <PseudoCoreReciprocalCanvas model={model} highlight={st.highlight} />
            </div>
          </div>
        </SceneView>
      </div>
    </>
  )

  const row1 = PARAMS.slice(0, 3) // a, v0, s
  const pF = PARAMS[3]
  const pAlpha = PARAMS[4]

  const params = (
    <div className="pseudo1d-params-grid" role="group" aria-label={s.params.group}>
      {row1.map((p) => (
        <div key={p.id} className="pseudo1d-params-cell">
          <ParamSlider
            quantity={p.quantity}
            symbol={p.symbol}
            label={s.params[p.id]}
            value={st.params[p.id]}
            min={p.min}
            max={p.max}
            step={p.step}
            unit={p.unit}
            digits={p.digits}
            active={st.highlight === p.quantity}
            onChange={(v) => st.setParam(p.id, v)}
            onHighlight={setHighlight}
          />
        </div>
      ))}

      <div className="pseudo1d-params-cell">
        <ParamSlider
          quantity={pF.quantity}
          symbol={pF.symbol}
          label={s.params.f}
          value={st.params.f}
          min={pF.min}
          max={pF.max}
          step={pF.step}
          unit={pF.unit}
          digits={pF.digits}
          active={st.highlight === pF.quantity}
          onChange={(v) => st.setParam('f', v)}
          onHighlight={setHighlight}
        />
        <span className="pseudo1d-f-badge num" title={s.params.fMarkerNote(formatNumber(model.eDiff, 2))}>
          E−E_c = {formatNumber(model.eDiff, 1)}
        </span>
      </div>

      <div className="pseudo1d-params-cell is-span-2">
        <ParamSlider
          quantity={pAlpha.quantity}
          symbol={pAlpha.symbol}
          label={s.params.alpha}
          value={st.params.alpha}
          min={pAlpha.min}
          max={pAlpha.max}
          step={pAlpha.step}
          unit={pAlpha.unit}
          digits={pAlpha.digits}
          active={st.highlight === pAlpha.quantity}
          onChange={(v) => st.setParam('alpha', v)}
          onHighlight={setHighlight}
        />
        <button
          type="button"
          className="pseudo1d-smooth-btn"
          title={s.params.smoothestTitle}
          onClick={() => st.setParam('alpha', model.alphaSmooth)}
        >
          {s.params.smoothestBtn}
        </button>
      </div>
    </div>
  )

  const aside = (
    <>
      <Panel title={s.formula.title} className="pseudo1d-formula-panel">
        <div className="pseudo1d-formula-block">
          <div className="pseudo1d-formula-subhead">{s.formula.opwTitle}</div>
          <LiveFormula
            className="formula-main"
            tex={OPW_EXPANSION_FORMULA}
            highlight={st.highlight}
            onHighlight={setHighlight}
            pulse={st.pulse}
          />
        </div>

        <div className="pseudo1d-formula-block">
          <div className="pseudo1d-formula-subhead">{s.formula.pseudoTitle}</div>
          <LiveFormula
            className="formula-main"
            tex={PSEUDO_SCHRODINGER_FORMULA}
            highlight={st.highlight}
            onHighlight={setHighlight}
            pulse={st.pulse}
          />
        </div>

        <div className="pseudo1d-formula-block">
          <div className="pseudo1d-formula-subhead">{s.formula.nonUniqTitle}</div>
          <LiveFormula
            className="formula-main"
            tex={NON_UNIQUENESS_FORMULA}
            highlight={st.highlight}
            onHighlight={setHighlight}
            pulse={st.pulse}
          />
        </div>

        <dl className="values pseudo1d-values" onPointerOver={over} onPointerLeave={leave}>
          <dt>{s.values.ecLabel}</dt>
          <dd className="num">
            <Tex tex="\htmlData{q=VG}{E_c}" /> = {formatNumber(model.eCore, 3)} eV
          </dd>

          <dt>{s.values.evLabel}</dt>
          <dd className="num">
            <Tex tex="\htmlData{q=E}{E_v}" /> = {formatNumber(model.eValence, 3)} eV
          </dd>

          <dt>{s.values.diffLabel}</dt>
          <dd className="num">{formatNumber(model.eDiff, 3)} eV</dd>

          <dt>{s.values.orthoLabel}</dt>
          <dd className="num">{model.orthoOverlap.toExponential(1)}</dd>

          <dt>{s.values.shiftedCoreLabel}</dt>
          <dd className="num">
            <Tex tex="\htmlData{q=V2G}{E_c + f}" /> = {formatNumber(model.shiftedCoreAtK, 3)} eV
          </dd>

          <dt>{s.values.alphaLabel}</dt>
          <dd className="num">
            <Tex tex="\htmlData{q=psi}{\alpha}" /> = {formatNumber(st.params.alpha, 2)} /{' '}
            {formatNumber(model.alphaSmooth, 2)}
            <span className="note sub">{s.params.smoothestNote}</span>
          </dd>

          <dt>{s.values.lowWavesLabel}</dt>
          <dd className="num">
            {formatNumber(model.lowWaveWeightTrue * 100, 2)}% vs {formatNumber(model.lowWaveWeightSmooth * 100, 2)}%
          </dd>

          <dt>{s.values.rcLabel}</dt>
          <dd className="num">{formatNumber(model.realSpace.rc, 2)} Å</dd>

          {st.tools.mass && model.massProbe && (
            <>
              <dt>{s.values.massLabel}</dt>
              <dd className="num">
                <Tex tex="\htmlData{q=mstar}{m^*}/m_0" />{' '}
                {formatEffectiveMassRatio(model.massProbe.effectiveMassRatio, { digits: 2, withEquals: true })}
              </dd>
            </>
          )}
        </dl>

        <p className="pseudo1d-callout">{s.params.gaugeNote}</p>

        {st.tools.fill && (
          <p className="pseudo1d-callout" onPointerOver={over} onPointerLeave={leave}>
            {s.values.fillNote}
          </p>
        )}

        {st.tools.compare && (
          <p className="pseudo1d-callout" onPointerOver={over} onPointerLeave={leave}>
            {s.values.compareNote}
          </p>
        )}
      </Panel>

      <Panel title={s.theory.title} className="theory">
        <div onPointerOver={over} onPointerLeave={leave}>
          {s.theory.sections.map((sec) => (
            <div key={sec.heading}>
              <h3>{sec.heading}</h3>
              <p>
                <RichText text={sec.body} />
              </p>
            </div>
          ))}
          <details className="panel-details">
            <summary>{s.values.bareIonTitle}</summary>
            <BareIonCard rows={model.bareIonRows} />
          </details>
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

function BareIonCard({ rows }: { readonly rows: readonly BareIonRow[] }): JSX.Element {
  return (
    <div className="pseudo1d-verify-card">
      <div className="pseudo1d-verify-sub">
        <RichText text={s.values.bareIonSub} />
      </div>
      <dl className="values">
        {rows.map((r) => (
          <div key={r.gSq} style={{ display: 'contents' }}>
            <dt className="num">
              <RichText text={s.values.bareIonRow(r.gSq)} />
            </dt>
            <dd className="num">
              <RichText
                text={s.values.bareIonValue(
                  formatNumber(r.bareEv, 2),
                  r.siPseudoEv !== null ? formatNumber(r.siPseudoEv, 2) : undefined
                )}
              />
            </dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
