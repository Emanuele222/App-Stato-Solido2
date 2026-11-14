/**
 * Sezione «Pseudopotenziale» (dispensa P4 §4, §5.4):
 *  - tre viste collegate: spazio reale (curve indicative ione nudo vs V_ps e ψ vs ψᶠ),
 *    fattore di forma v(q) (Ashcroft + Thomas–Fermi indicativo + 3 parametri trascinabili),
 *    bande lungo L–Γ–X–W–K–Γ (113 onde piane in Web Worker con anteprima rapida a 51 onde)
 *    e istogramma dei pesi |c_G|² per guscio di |G|² nello stato selezionato;
 *  - preset Si e GaAs (con toggle antisimmetrico Vᵃ ↔ «tipo diamante»);
 *  - strumenti trasversali: Riempimento (8 e/cella, μ nel gap), Massa efficace direzionale
 *    (+ confronto GaAs in Γ con 0,067 m₀ e stima k·p E_g/E_P) e Confronto (reticolo vuoto fcc);
 *  - Formula viva con termini V₃ˢ, V₈ˢ, V₁₁ˢ collegati a curva e slider, confronto ione nudo
 *    vs fattori di forma nel Si e scheda teoria con chiarimento su ψ_c.
 */
import { useCallback, type JSX } from 'react'
import { RYDBERG_EV, type KPath } from '../../physics'
import { ParamSlider, Panel, PresetMenu, ToolToggle } from '../../ui/controls'
import { formatNumber } from '../../ui/format'
import { FOLLOW, GLIDE, useTweened } from '../../ui/motion'
import { SceneView, SectionLayout } from '../../ui/shell'
import { RichText, Tex } from '../../ui/tex'
import { LiveFormula } from '../../viz/LiveFormula'
import { EpmBandPlot } from './EpmBandPlot'
import { FormFactorCanvas } from './FormFactorCanvas'
import { CENTRAL_EPM_FORMULA, LIMIT_V0_FORMULA, PSEUDO_EQ_FORMULA } from './formulas'
import { PARAMS, PRESETS, type EpmParamId, type FormFactorId } from './manifest'
import { usePseudopotentialModel, type BareIonRow, type PseudopotentialModel } from './model'
import { RealSpacePseudoCanvas } from './RealSpacePseudoCanvas'
import { ShellWeightsBar } from './ShellWeightsBar'
import { usePseudopotentialStore } from './store'
import { strings as s } from './strings'
import './pseudopotential.css'

const PRESET_OPTIONS = PRESETS.map((p) => ({
  id: p.id,
  label: s.presets.item(p.name, formatNumber(p.params.a, 2), p.antisymmetric ? 'zincoblenda' : 'diamante')
}))

const FACTOR_CHIPS: readonly { readonly id: FormFactorId; readonly tex: string }[] = [
  { id: 'v3s', tex: 'V_3^s' },
  { id: 'v8s', tex: 'V_8^s' },
  { id: 'v11s', tex: 'V_{11}^s' }
]

function isFormFactorId(id: EpmParamId): id is FormFactorId {
  return id === 'v3s' || id === 'v8s' || id === 'v11s'
}

export function PseudopotentialSection(): JSX.Element {
  const st = usePseudopotentialStore()
  const shown = useTweened(st.params, st.transition === 'glide' ? GLIDE : FOLLOW)
  const { vaMix } = useTweened({ vaMix: st.antisymmetricOn ? 1 : 0 }, GLIDE)
  const activePreset = PRESETS.find((p) => p.id === st.presetId) ?? null

  const model = usePseudopotentialModel(
    shown,
    st.params,
    st.antisymmetric,
    st.antisymmetricOn,
    vaMix,
    st.transition,
    st.pointIndex,
    st.bandIndex,
    st.tools,
    activePreset
  )

  const sliderValues = st.transition === 'glide' ? shown : st.params
  const setHighlight = st.setHighlight
  const setActiveFactor = st.setActiveFactor

  const onPickState = useCallback(
    (pointIndex: number, bandIndex: number) => usePseudopotentialStore.getState().selectState(pointIndex, bandIndex),
    []
  )
  const onNudgeState = useCallback(
    (dPoint: number, dBand: number) => usePseudopotentialStore.getState().nudgeState(dPoint, dBand),
    []
  )
  const onDragFormFactor = useCallback(
    (id: FormFactorId, value: number) => usePseudopotentialStore.getState().setParam(id, value),
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
    </>
  )

  const scene = (
    <>
      <div className="pseudo-top-row">
        <SceneView tag={s.scene.realTag} hint={s.scene.realHint}>
          <RealSpacePseudoCanvas curves={model.realSpace} highlight={st.highlight} />
        </SceneView>
        <SceneView tag={s.scene.formTag} hint={s.scene.formHint}>
          <FormFactorCanvas
            curve={model.formFactorCurve}
            formFactors={model.formFactors}
            antisymmetricOn={st.antisymmetricOn && st.antisymmetric !== null}
            highlight={st.highlight}
            activeFactor={st.activeFactor}
            onDragParam={onDragFormFactor}
            onActiveFactor={setActiveFactor}
          />
        </SceneView>
      </div>

      <SceneView className="pseudo-bands-view" tag={s.scene.bandsTag} hint={s.scene.bandsHint}>
        <div className="pseudo-bands-wrap">
          <EpmBandPlot
            model={model}
            highlight={st.highlight}
            showProbe={st.tools.mass}
            showCompare={st.tools.compare}
            onPick={onPickState}
            onNudge={onNudgeState}
          />
          <ShellWeightsBar shellWeights={model.stateBreakdown.shellWeights} highlight={st.highlight} />
        </div>
      </SceneView>
    </>
  )

  const params = (
    <>
      <div className="preset-row pseudo-preset-bar">
        <PresetMenu
          label={s.presets.label}
          freeLabel={s.presets.free}
          options={PRESET_OPTIONS}
          value={st.presetId}
          onSelect={st.applyPreset}
          note={s.presets.note}
        />

        {st.antisymmetric !== null && (
          <div className="pseudo-antisym-wrap">
            <button
              type="button"
              className="pseudo-antisym-btn"
              aria-pressed={st.antisymmetricOn}
              onClick={st.toggleAntisymmetric}
            >
              <span className="pseudo-antisym-swatch" aria-hidden="true" />
              <span>{s.antisymmetric.label}</span>
            </button>
            <span className="pseudo-antisym-note num">
              {st.antisymmetricOn
                ? s.antisymmetric.activeValues(
                    formatNumber(st.antisymmetric.v3a, 3),
                    formatNumber(st.antisymmetric.v4a, 3),
                    formatNumber(st.antisymmetric.v11a, 3)
                  )
                : s.antisymmetric.diamondHint}
            </span>
          </div>
        )}
      </div>

      <div className="pseudo-sliders-row" role="group" aria-label={s.params.group}>
        {PARAMS.map((p) => {
          const factorId = isFormFactorId(p.id) ? p.id : null
          return (
            <div
              key={p.id}
              onMouseEnter={factorId ? () => setActiveFactor(factorId) : undefined}
              onMouseLeave={factorId ? () => setActiveFactor(null) : undefined}
            >
              <ParamSlider
                quantity={p.quantity}
                symbol={p.symbol}
                label={s.params[p.id]}
                value={sliderValues[p.id]}
                min={p.min}
                max={p.max}
                step={p.step}
                unit={p.unit}
                digits={p.digits}
                active={factorId !== null && st.activeFactor === factorId}
                onChange={(v) => st.setParam(p.id, v)}
                onHighlight={setHighlight}
              />
            </div>
          )
        })}
      </div>
    </>
  )

  const aside = (
    <>
      <Panel title={s.formula.title} className="pseudo-formula-panel">
        <div className="pseudo-formula-block">
          <div className="pseudo-formula-subhead">{s.formula.pseudoTitle}</div>
          <LiveFormula
            className="formula-main"
            tex={PSEUDO_EQ_FORMULA}
            highlight={st.highlight}
            onHighlight={setHighlight}
            pulse={st.pulse}
            ariaLabel={s.formula.pseudoAria}
          />
        </div>

        <div className="pseudo-formula-block">
          <div className="pseudo-formula-subhead">{s.formula.centralTitle}</div>
          <LiveFormula
            className="formula-main"
            tex={CENTRAL_EPM_FORMULA}
            highlight={st.highlight}
            onHighlight={setHighlight}
            pulse={st.pulse}
            ariaLabel={s.formula.centralAria}
          />
        </div>

        <div className="pseudo-formula-block">
          <div className="pseudo-formula-subhead">{s.formula.factorsTitle}</div>
          <div className="pseudo-factor-chips" role="group" aria-label={s.formula.factorsTitle}>
            {FACTOR_CHIPS.map((chip) => (
              <button
                key={chip.id}
                type="button"
                className={'pseudo-factor-chip' + (st.activeFactor === chip.id ? ' is-active' : '')}
                onMouseEnter={() => setActiveFactor(chip.id)}
                onMouseLeave={() => setActiveFactor(null)}
                onFocus={() => setActiveFactor(chip.id)}
                onBlur={() => setActiveFactor(null)}
                onClick={() => setActiveFactor(st.activeFactor === chip.id ? null : chip.id)}
              >
                <Tex tex={`\\htmlData{q=VG}{${chip.tex}}`} />
                <span className="num">{formatNumber(model.formFactors[chip.id], 3)} Ry</span>
              </button>
            ))}
          </div>
          <LiveFormula
            className="formula-main"
            tex={LIMIT_V0_FORMULA}
            highlight={st.highlight}
            onHighlight={setHighlight}
            pulse={st.pulse}
          />
        </div>

        <PseudopotentialValues
          model={model}
          activePreset={activePreset}
          antisymmetricOn={st.antisymmetricOn && st.antisymmetric !== null}
          showMass={st.tools.mass}
        />

        {st.tools.fill && (
          <p className="pseudo-callout">
            <RichText text={s.values.fillNote} />
          </p>
        )}

        {st.tools.compare && (
          <p className="pseudo-callout">
            <RichText text={s.values.compareNote} />
          </p>
        )}

        <BareIonCard rows={model.bareIonRows} />
      </Panel>

      <Panel title={s.theory.title} className="theory">
        {s.theory.sections.map((sec) => (
          <div key={sec.heading}>
            <h3>{sec.heading}</h3>
            <p>
              <RichText text={sec.body} />
            </p>
          </div>
        ))}
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

function PseudopotentialValues({
  model,
  activePreset,
  antisymmetricOn,
  showMass
}: {
  readonly model: PseudopotentialModel
  readonly activePreset: (typeof PRESETS)[number] | null
  readonly antisymmetricOn: boolean
  readonly showMass: boolean
}): JSX.Element {
  const { summary, formFactors, stateBreakdown } = model
  const topShells = [...stateBreakdown.shellWeights]
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 2)
    .filter((sw) => sw.weight >= 0.01)

  const pointLabel = describePathPoint(model.path, model.pointIndex)
  const bandLabel =
    model.bandIndex < 4 ? s.values.selectedBandValence(model.bandIndex + 1) : s.values.selectedBandConduction(model.bandIndex - 3)

  const cbmText =
    summary.cbmDescription === 'ΓX'
      ? `${formatNumber(summary.cbmSegmentFraction, 2)} ΓX`
      : summary.cbmDescription

  return (
    <dl className="values pseudo-values">
      <dt>{s.values.aLabel}</dt>
      <dd className="num">
        <Tex tex="\htmlData{q=a}{a}" /> = {formatNumber(model.a, 2)} Å
      </dd>

      <dt>{s.values.planeWavesLabel}</dt>
      <dd>
        <span className="num">{summary.planeWaves}</span>
        {model.refining ? (
          <span className="note sub">{s.values.refiningNote}</span>
        ) : model.lastWorkerMs !== null ? (
          <span className="note sub num">{formatNumber(model.lastWorkerMs, 0)} ms (worker)</span>
        ) : null}
      </dd>

      <dt>{s.values.formFactorsLabel}</dt>
      <dd className="num">
        <span>
          {formatNumber(formFactors.v3s, 3)} / {formatNumber(formFactors.v8s, 3)} / {formatNumber(formFactors.v11s, 3)} Ry
        </span>
        <span className="note sub">
          ({formatNumber(formFactors.v3s * RYDBERG_EV, 2)} / {formatNumber(formFactors.v8s * RYDBERG_EV, 2)} /{' '}
          {formatNumber(formFactors.v11s * RYDBERG_EV, 2)} eV)
        </span>
      </dd>

      {antisymmetricOn && (
        <>
          <dt>{s.values.antisymLabel}</dt>
          <dd className="num">
            {formatNumber(formFactors.v3a, 3)} / {formatNumber(formFactors.v4a, 3)} / {formatNumber(formFactors.v11a, 3)} Ry
          </dd>
        </>
      )}

      <dt>{s.values.gapLabel}</dt>
      <dd>
        <span className="num">{formatNumber(summary.gap, 2)} eV</span> ·{' '}
        <span className="sub">{summary.isDirect ? s.scene.directGap : s.scene.indirectGap}</span>
        <span className="note sub">
          {activePreset && antisymmetricOn === (activePreset.antisymmetric !== null)
            ? s.values.gapIndicative(formatNumber(activePreset.measuredGapEv, 2), activePreset.measuredGapKind)
            : s.values.gapGenericNote}
        </span>
      </dd>

      <dt>{s.values.cbmPosLabel}</dt>
      <dd className="num">{cbmText}</dd>

      <dt>{s.values.ecPointsLabel}</dt>
      <dd className="num">
        {formatNumber(summary.ecGamma, 2)} / {formatNumber(summary.ecX, 2)} / {formatNumber(summary.ecL, 2)} eV
      </dd>

      <dt>{s.values.valenceSpanLabel}</dt>
      <dd className="num">
        {formatNumber(summary.valenceBottom, 2)} eV · larghezza {formatNumber(summary.valenceWidth, 2)} eV
      </dd>

      <dt>{s.values.selectedLabel}</dt>
      <dd>
        <Tex tex="\htmlData{q=k}{k}" /> = <span className="num">{pointLabel}</span> · <span className="sub">{bandLabel}</span>
        <br />
        <Tex tex="\htmlData{q=E}{E}" /> = <span className="num">{formatNumber(model.selectedEnergy, 3)} eV</span>
        {topShells.length > 0 && (
          <span className="note sub num">
            {topShells.map((sw) => `|G|²=${sw.gSq} (${formatNumber(sw.weight * 100, 0)}%)`).join(' · ')}
          </span>
        )}
      </dd>

      {showMass && model.massProbe && (
        <>
          <dt>{s.values.massToolLabel}</dt>
          <dd>
            <Tex tex="\htmlData{q=mstar}{m^*}/m_0" /> ={' '}
            <span className="num">
              {Number.isFinite(model.massProbe.effectiveMassRatio) ? formatNumber(model.massProbe.effectiveMassRatio, 3) : '∞'}
            </span>
            <span className="note sub">{s.values.massDirectionNote}</span>
            {model.gaasGammaCompare && (
              <span className="note sub num">
                {s.values.massGaAsCompare(
                  formatNumber(model.gaasGammaCompare.calculatedMassRatio, 3),
                  formatNumber(model.gaasGammaCompare.measuredMassRatio, 3),
                  formatNumber(model.gaasGammaCompare.kpEstimateRatio, 3)
                )}
              </span>
            )}
          </dd>
        </>
      )}
    </dl>
  )
}

function BareIonCard({ rows }: { readonly rows: readonly BareIonRow[] }): JSX.Element {
  return (
    <div className="pseudo-verify-card">
      <div className="pseudo-verify-title">{s.values.bareIonTitle}</div>
      <div className="pseudo-verify-sub">{s.values.bareIonSub}</div>
      <dl className="values">
        {rows.map((r) => (
          <div key={r.gSq} style={{ display: 'contents' }}>
            <dt className="num">{s.values.bareIonRow(r.gSq)}</dt>
            <dd className="num">
              {s.values.bareIonValue(
                formatNumber(r.bareEv, 2),
                r.siPseudoEv !== null ? formatNumber(r.siPseudoEv, 2) : undefined
              )}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

function describePathPoint(path: KPath, index: number): string {
  for (const lbl of path.labels) {
    if (lbl.index === index) return lbl.label
  }
  for (let i = 0; i < path.labels.length - 1; i++) {
    const a = path.labels[i]
    const b = path.labels[i + 1]
    if (index > a.index && index < b.index) {
      const frac = (index - a.index) / (b.index - a.index)
      return `${formatNumber(frac, 2)} ${a.label}${b.label}`
    }
  }
  return String(index)
}
