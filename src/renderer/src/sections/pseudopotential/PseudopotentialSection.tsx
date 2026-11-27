/**
 * Sezione «Pseudopotenziale» (modello 1D esatto con stato di core, P4 §4):
 *  - Vista principale: Spazio reale su una cella [−a/2, a/2] centrata sullo ione
 *    in tre fasce (energie, funzioni d'onda, ortogonalità) + lettura guidata in 3 passi;
 *  - Onde piane: «Quante onde piane» (pesi |c_G|² per n = −4…4 ed errore vs N) e «Cancellazione»;
 *  - Bande 1D: core (nel tono del core), core spostato E_c + f, valenza e strumenti trasversali.
 */
import { useCallback, type CSSProperties, type JSX, type PointerEvent } from 'react'
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

function formatCrossingsText(crossings: readonly number[]): string {
  if (crossings.length === 0) return '0'
  if (crossings.length === 2 && Math.abs(crossings[0] + crossings[1]) < 0.004) {
    return `2 (x = ±${formatNumber(Math.abs(crossings[1]), 3)} Å)`
  }
  const coords = crossings.map((x) => `${formatNumber(x, 3)}`).join('; ')
  return `${crossings.length} (x = ${coords} Å)`
}

function formatOrthoOverlap(val: number): string {
  if (val < 1e-10) return '< 10⁻¹⁰'
  const exp = Math.floor(Math.log10(val))
  const mant = val / Math.pow(10, exp)
  return `${formatNumber(mant, 1)}·10^${exp}`
}

export function PseudopotentialSection(): JSX.Element {
  const st = usePseudoCoreStore()
  const navigateTo = useNavigationStore((nav) => nav.navigateTo)

  const model = usePseudoCoreModel(st.params, st.smoothLock, st.kIndex, st.bandIndex, st.tools)
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
    { id: 'pot', keyKind: 'solid', color: 'var(--q-VG)', label: <RichText text={s.scene.potentialLegend} /> },
    { id: 'coreE', keyKind: 'dashed', color: 'var(--tone-core-state)', label: <RichText text={s.scene.coreEnergyLegend} /> },
    { id: 'valE', keyKind: 'solid', color: 'var(--q-E)', label: <RichText text={s.scene.valEnergyLegend} /> },
    { id: 'coreW', keyKind: 'solid', color: 'var(--tone-core-state)', label: <RichText text={s.scene.psiCoreLegend} /> },
    { id: 'trueW', keyKind: 'solid', color: 'var(--q-psi)', label: <RichText text={s.scene.psiTrueLegend} /> },
    { id: 'smoothW', keyKind: 'dashed', color: 'var(--tone-smooth-wavefunction)', label: <RichText text={s.scene.psiSmoothLegend} /> }
  ]

  const recipLegend: LegendEntry[] =
    st.recipTab === 'convergence'
      ? [
          { id: 'wt', keyKind: 'solid', color: 'var(--q-psi)', label: <RichText text={s.scene.weightsTrueLegend} /> },
          { id: 'ws', keyKind: 'solid', color: 'var(--tone-smooth-wavefunction)', label: <RichText text={s.scene.weightsSmoothLegend} /> },
          { id: 'ct', keyKind: 'solid', color: 'var(--q-VG)', label: <RichText text={s.scene.convTrueLegend} /> },
          { id: 'cp', keyKind: 'solid', color: 'var(--tone-screened-potential)', label: <RichText text={s.scene.convPseudoLegend} /> }
        ]
      : [
          { id: 'mv', keyKind: 'solid', color: 'var(--q-VG)', label: <RichText text={s.scene.matVLegend} /> },
          { id: 'mvps', keyKind: 'solid', color: 'var(--tone-screened-potential)', label: <RichText text={s.scene.matVpsLegend} /> }
        ]

  const nTrueStr = model.convergence.nNeededTrue !== null ? String(model.convergence.nNeededTrue) : '> 21'
  const nPseudoStr = model.convergence.nNeededPseudo !== null ? String(model.convergence.nNeededPseudo) : '> 21'

  const guidedBannerText = s.guided.stepText(st.guidedStep, {
    signChanges: model.realSpace.signChanges.length,
    nTrue: nTrueStr,
    nPseudo: nPseudoStr,
    alphaStr: formatNumber(model.effectiveAlpha, 3, { signed: true }),
    betaStr: formatNumber(model.betaC, 3, { signed: true }),
    maxOutDiff: formatNumber(0.04, 2),
    eKinIon: formatNumber(model.realSpace.eKinIon, 1),
    eKinMid: formatNumber(model.realSpace.eKinMid, 2),
    isOdd: model.isOddState
  })

  const guidedSelector = (
    <div className="pseudo1d-seg" role="group" aria-label={s.guided.groupLabel}>
      {s.guided.steps.map((step) => (
        <button
          key={step.id}
          type="button"
          className="pseudo1d-seg-btn"
          aria-pressed={st.guidedStep === step.id}
          onClick={() => st.setGuidedStep(step.id)}
        >
          {step.label}
        </button>
      ))}
    </div>
  )

  const recipSelector = (
    <div className="pseudo1d-recip-head-right">
      <div className="pseudo1d-seg" role="group" aria-label={s.scene.recipTag}>
        <button
          type="button"
          className="pseudo1d-seg-btn"
          aria-pressed={st.recipTab === 'convergence'}
          onClick={() => st.setRecipTab('convergence')}
        >
          {s.scene.recipTabConvergence}
        </button>
        <button
          type="button"
          className="pseudo1d-seg-btn"
          aria-pressed={st.recipTab === 'cancellation'}
          onClick={() => st.setRecipTab('cancellation')}
        >
          {s.scene.recipTabCancellation}
        </button>
      </div>
    </div>
  )

  const scene = (
    <>
      <SceneView
        className="pseudo1d-view pseudo1d-scene pseudo1d-real-view"
        tag={s.scene.realTag}
        hint={guidedSelector}
      >
        <div className="pseudo1d-view-col">
          {st.guidedStep !== 0 && (
            <div className="pseudo1d-guided-banner">
              <RichText text={guidedBannerText} />
            </div>
          )}
          <ChartLegend entries={realLegend} ariaLabel={s.scene.realAria} />
          <div className="pseudo1d-canvas-box">
            <PseudoCoreRealSpaceCanvas
              model={model}
              highlight={st.highlight}
              guidedStep={st.guidedStep}
            />
          </div>
        </div>
      </SceneView>

      <div className="pseudo1d-bottom-row">
        <SceneView className="pseudo1d-view" tag={s.scene.recipTag} hint={recipSelector}>
          <div className="pseudo1d-view-col">
            <ChartLegend entries={recipLegend} ariaLabel={s.scene.recipAria} />
            <div className="pseudo1d-canvas-box">
              <PseudoCoreReciprocalCanvas
                model={model}
                tab={st.recipTab}
                highlight={st.highlight}
                guidedStep={st.guidedStep}
              />
            </div>
          </div>
        </SceneView>

        <SceneView
          className="pseudo1d-view"
          tag={s.scene.bandsTag}
          hint={<RichText text={s.scene.bandsHint} />}
        >
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
      </div>
    </>
  )

  const row1 = PARAMS.slice(0, 3) // a, v0, s
  const pF = PARAMS[3]
  const pAlpha = PARAMS[4]
  const fTickPct = Math.max(0, Math.min(100, ((model.eDiff - pF.min) / (pF.max - pF.min)) * 100))

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

      <div className="pseudo1d-params-cell is-stacked">
        <div className="pseudo1d-f-wrap" style={{ '--f-pct': `${fTickPct}%` } as CSSProperties}>
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
        </div>
        <button
          type="button"
          className="pseudo1d-f-jump num"
          title={s.params.fMarkerTitle}
          onClick={() => st.setParam('f', model.eDiff)}
        >
          <RichText text={s.params.fMarkerBtn(formatNumber(model.eDiff, 1))} />
        </button>
      </div>

      <div className="pseudo1d-params-cell is-span-2">
        <div className="pseudo1d-alpha-col">
          <ParamSlider
            quantity={pAlpha.quantity}
            symbol={pAlpha.symbol}
            label={s.params.alpha}
            value={model.effectiveAlpha}
            min={pAlpha.min}
            max={pAlpha.max}
            step={pAlpha.step}
            unit={pAlpha.unit}
            digits={pAlpha.digits}
            active={st.highlight === pAlpha.quantity}
            onChange={(v) => st.setParam('alpha', v)}
            onHighlight={setHighlight}
          />
          <div className="pseudo1d-alpha-zero-row" aria-hidden="true">
            <span className="pseudo1d-alpha-zero-label">
              <RichText text={s.params.alphaZeroMarker} />
            </span>
          </div>
        </div>
        <ToolToggle
          pressed={st.smoothLock}
          onToggle={() => st.toggleSmoothLock(model.alphaSmooth)}
          quantity="psi"
          title={s.params.smoothToggleTitle}
        >
          {s.params.smoothToggle}
        </ToolToggle>
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
            <span className="pseudo1d-core-tone">
              <Tex tex="E_c" />
            </span>{' '}
            = {formatNumber(model.eCore, 3)} eV
          </dd>

          <dt>{s.values.evLabel}</dt>
          <dd className="num">
            <Tex tex="\htmlData{q=E}{E}" /> = {formatNumber(model.eValence, 3)} eV
            <span className="note sub">
              <Tex tex="E - E_c" /> = {formatNumber(model.eDiff, 2)} eV
            </span>
          </dd>

          <dt>{s.values.orthoLabel}</dt>
          <dd className="num">
            <Tex tex="|\langle\psi_c|\psi_{\mathbf{k}}\rangle|" /> {formatOrthoOverlap(model.orthoOverlap)}
          </dd>

          <dt>{s.values.signChangesLabel}</dt>
          <dd className="num">{formatCrossingsText(model.realSpace.signChanges)}</dd>

          <dt>{s.values.alphaBetaLabel}</dt>
          <dd className="num">
            <Tex tex="\htmlData{q=psi}{\alpha}" /> = {formatNumber(model.effectiveAlpha, 3, { signed: true })} ·{' '}
            <Tex tex="\htmlData{q=psi}{\beta_c}" /> = {formatNumber(model.betaC, 3, { signed: true })}
            {!st.smoothLock && (
              <span className="note sub">
                parte liscia: {formatNumber(model.alphaSmooth, 3, { signed: true })}
              </span>
            )}
          </dd>

          <dt>{s.values.kineticMeanLabel}</dt>
          <dd className="num">
            <Tex tex="\psi_{\mathbf{k}}" />: {formatNumber(model.kineticTrue, 2)} eV ·{' '}
            <Tex tex="\psi^{\mathrm f}" />: {formatNumber(model.kineticSmooth, 2)} eV
          </dd>

          <dt>{s.values.domWaveLabel}</dt>
          <dd className="num">
            <Tex tex="\psi_{\mathbf{k}}" />: {formatNumber(model.dominantWeightTrue * 100, 1)} % ·{' '}
            <Tex tex="\psi^{\mathrm f}" />: {formatNumber(model.dominantWeightSmooth * 100, 1)} %
          </dd>

          <dt>{s.values.wavesNeededLabel}</dt>
          <dd className="num">
            <Tex tex="V" />: {nTrueStr} · <Tex tex="V + V'" />: {nPseudoStr}
          </dd>

          <dt>
            <RichText text={s.values.localKinLabel} />
          </dt>
          <dd className="num">
            ione: {formatNumber(model.realSpace.eKinIon, 1)} eV · tra ioni:{' '}
            {formatNumber(model.realSpace.eKinMid, 2)} eV
          </dd>

          <dt>{s.values.shiftedCoreLabel}</dt>
          <dd className="num">
            <Tex tex="\htmlData{q=V2G}{E_c + f}" /> = {formatNumber(model.shiftedCoreAtK, 3)} eV
          </dd>

          <dt>
            <RichText text={s.values.rcLabel} />
          </dt>
          <dd className="num">
            <Tex tex="r_c" /> = {formatNumber(model.realSpace.rc, 3)} Å
          </dd>

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

        {model.isOddState && (
          <p className="pseudo1d-callout">
            <RichText text={s.values.oddStateNote} />
          </p>
        )}

        <p className="pseudo1d-callout">
          <RichText text={s.params.gaugeNote} />
        </p>

        {st.tools.fill && (
          <p className="pseudo1d-callout" onPointerOver={over} onPointerLeave={leave}>
            <RichText text={s.values.fillNote} />
          </p>
        )}

        {st.tools.compare && (
          <p className="pseudo1d-callout" onPointerOver={over} onPointerLeave={leave}>
            <RichText text={s.values.compareNote} />
          </p>
        )}
      </Panel>

      <Panel title={s.theory.title} className="theory">
        <div onPointerOver={over} onPointerLeave={leave}>
          {s.theory.sections.map((sec) => (
            <div key={sec.heading}>
              <h3>
                <RichText text={sec.heading} />
              </h3>
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
