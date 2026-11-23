/**
 * Sezione «Bande dei materiali veri» (dispensa P4 §5):
 *  - Materiali: Al (reticolo vuoto fcc, 3 o 1 e⁻/cella), Si, Ge, GaAs;
 *  - Tre viste: fattore di forma v(q), pesi per guscio |c_G|² e bande lungo L–Γ–X–W–K–Γ;
 *  - Rimando alla sezione «Pseudopotenziale» («← Da dove viene V_ps»).
 */
import { useCallback, type JSX, type PointerEvent } from 'react'
import { type KPath } from '../../physics'
import { ParamSlider, Panel, PresetMenu, ToolToggle } from '../../ui/controls'
import { formatEffectiveMassRatio, formatNumber } from '../../ui/format'
import { FOLLOW, GLIDE, useTweened } from '../../ui/motion'
import { useNavigationStore } from '../../ui/navigation'
import { SceneView, SectionLayout } from '../../ui/shell'
import { RichText, Tex } from '../../ui/tex'
import { isQuantityId, type QuantityId } from '../../ui/theme'
import { ChartLegend, type LegendEntry } from '../../viz/ChartLegend'
import { LiveFormula } from '../../viz/LiveFormula'
import { EpmBandPlot } from './EpmBandPlot'
import { FormFactorCanvas } from './FormFactorCanvas'
import { CENTRAL_EPM_FORMULA, LIMIT_V0_FORMULA, PSEUDO_EQ_FORMULA } from './formulas'
import { PARAMS, PRESETS, type EpmParamId, type FormFactorId } from './manifest'
import { useRealBandsModel, type BareIonRow, type RealBandsModel } from './model'
import { ShellWeightsBar } from './ShellWeightsBar'
import { useRealBandsStore } from './store'
import { strings as s } from './strings'
import './realBands.css'

const PRESET_OPTIONS = PRESETS.map((p) => ({
  id: p.id,
  label: s.presets.item(p.name, formatNumber(p.params.a, 2), p.structureTag)
}))

const FACTOR_CHIPS: readonly { readonly id: FormFactorId; readonly tex: string }[] = [
  { id: 'v3s', tex: 'V_3^s' },
  { id: 'v8s', tex: 'V_8^s' },
  { id: 'v11s', tex: 'V_{11}^s' }
]

function HintLine({ text }: { readonly text: string }): JSX.Element {
  return (
    <span className="pseudo-hint" title={text}>
      {text}
    </span>
  )
}

function isFormFactorId(id: EpmParamId): id is FormFactorId {
  return id === 'v3s' || id === 'v8s' || id === 'v11s'
}

export function RealBandsSection(): JSX.Element {
  const st = useRealBandsStore()
  const navigateTo = useNavigationStore((nav) => nav.navigateTo)
  const shown = useTweened(st.params, st.transition === 'glide' ? GLIDE : FOLLOW)
  const { vaMix } = useTweened({ vaMix: st.antisymmetricOn ? 1 : 0 }, GLIDE)
  const activePreset = PRESETS.find((p) => p.id === st.presetId) ?? null

  const model = useRealBandsModel(
    shown,
    st.params,
    st.antisymmetric,
    st.antisymmetricOn,
    vaMix,
    st.transition,
    st.pointIndex,
    st.bandIndex,
    st.tools,
    activePreset,
    st.alElectrons
  )

  const sliderValues = st.transition === 'glide' ? shown : st.params
  const setHighlight = st.setHighlight
  const setActiveFactor = st.setActiveFactor

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
    (pointIndex: number, bandIndex: number) => useRealBandsStore.getState().selectState(pointIndex, bandIndex),
    []
  )
  const onNudgeState = useCallback(
    (dPoint: number, dBand: number) => useRealBandsStore.getState().nudgeState(dPoint, dBand),
    []
  )
  const onDragFormFactor = useCallback(
    (id: FormFactorId, value: number) => useRealBandsStore.getState().setParam(id, value),
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
      <button type="button" className="section-cross-link" onClick={() => navigateTo('pseudopotential')}>
        {s.backToPseudo}
      </button>
    </>
  )

  const showVa = !model.isAluminum && st.antisymmetricOn && st.antisymmetric !== null

  const formLegend: LegendEntry[] = [
    { id: 'curve', keyKind: 'dashed', color: 'var(--text-soft)', label: s.scene.formCurveLegend },
    { id: 'points', keyKind: 'dot', color: 'var(--q-VG)', label: <RichText text={s.scene.formPointsLegend} /> },
    ...(showVa
      ? [{ id: 'va', keyKind: 'diamond' as const, color: 'var(--q-V2G)', label: <RichText text={s.scene.formVaLegend} /> }]
      : [])
  ]

  const scene = (
    <>
      <div className="pseudo-top-row realbands-scene">
        <SceneView className="pseudo-top-view" tag={s.scene.formTag} hint={<HintLine text={s.scene.formHint} />}>
          <div className="pseudo-view-col">
            <ChartLegend entries={formLegend} ariaLabel={s.scene.formLegendAria} />
            <div className={'pseudo-canvas-box' + (model.isAluminum ? ' is-locked' : '')}>
              <FormFactorCanvas
                curve={model.formFactorCurve}
                formFactors={model.formFactors}
                antisymmetricOn={showVa}
                highlight={st.highlight}
                activeFactor={st.activeFactor}
                onDragParam={onDragFormFactor}
                onActiveFactor={setActiveFactor}
              />
            </div>
          </div>
        </SceneView>
        <SceneView className="pseudo-top-view" tag={s.scene.shellsTag} hint={<HintLine text={s.scene.shellsHint} />}>
          <div className="pseudo-view-col">
            <div className="pseudo-shells-box">
              <ShellWeightsBar shellWeights={model.stateBreakdown.shellWeights} highlight={st.highlight} />
            </div>
          </div>
        </SceneView>
      </div>

      <SceneView className="pseudo-bands-view" tag={s.scene.bandsTag} hint={<HintLine text={s.scene.bandsHint} />}>
        <div className="pseudo-bands-wrap">
          <EpmBandPlot
            model={model}
            highlight={st.highlight}
            showProbe={st.tools.mass}
            showCompare={st.tools.compare}
            onPick={onPickState}
            onNudge={onNudgeState}
          />
        </div>
      </SceneView>
    </>
  )

  const litBy = (quantity: QuantityId, factorId: FormFactorId | null): boolean =>
    st.activeFactor !== null ? factorId === st.activeFactor : st.highlight === quantity

  const params = (
    <div className="pseudo-params-grid" role="group" aria-label={s.params.group}>
      <div className="pseudo-params-cell">
        <PresetMenu
          label={s.presets.label}
          freeLabel={s.presets.free}
          options={PRESET_OPTIONS}
          value={st.presetId}
          onSelect={st.applyPreset}
        />
      </div>

      <div className="pseudo-params-cell">
        {model.isAluminum ? (
          st.tools.fill ? (
            <div className="al-electrons-group">
              <span className="al-electrons-label">{s.params.alElectronsLabel}</span>
              <div className="al-electrons-pills">
                {([3, 1] as const).map((n) => (
                  <button
                    key={n}
                    type="button"
                    className="al-electrons-pill"
                    aria-pressed={st.alElectrons === n}
                    onClick={() => st.setAlElectrons(n)}
                  >
                    {s.params.alElectronsOption(n)}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <span className="pseudo-preset-source" title={s.presets.alLockedNote}>
              {s.presets.alShortNote}
            </span>
          )
        ) : st.antisymmetric !== null ? (
          <button
            type="button"
            className={'pseudo-antisym-btn' + (st.highlight === 'V2G' ? ' is-active' : '')}
            data-q="V2G"
            aria-pressed={st.antisymmetricOn}
            title={
              st.antisymmetricOn
                ? `${s.antisymmetric.label} · ${s.antisymmetric.activeValues(
                    formatNumber(st.antisymmetric.v3a, 3),
                    formatNumber(st.antisymmetric.v4a, 3),
                    formatNumber(st.antisymmetric.v11a, 3)
                  )}`
                : `${s.antisymmetric.label} · ${s.antisymmetric.diamondHint}`
            }
            onClick={st.toggleAntisymmetric}
            onPointerEnter={() => setHighlight('V2G')}
            onPointerLeave={() => setHighlight(null)}
          >
            <span className="pseudo-antisym-swatch" aria-hidden="true" />
            <span>{s.antisymmetric.shortLabel}</span>
          </button>
        ) : activePreset?.factorsSource === 'esterni' ? (
          <span className="pseudo-preset-source" title={s.presets.geNote}>
            {s.presets.geShortNote}
          </span>
        ) : null}
      </div>

      {PARAMS.map((p) => {
        const factorId = isFormFactorId(p.id) ? p.id : null
        return (
          <div
            key={p.id}
            className={'pseudo-params-cell' + (model.isAluminum ? ' is-locked' : '')}
            onMouseEnter={!model.isAluminum && factorId ? () => setActiveFactor(factorId) : undefined}
            onMouseLeave={!model.isAluminum && factorId ? () => setActiveFactor(null) : undefined}
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
              active={litBy(p.quantity, factorId)}
              onChange={(v) => st.setParam(p.id, v)}
              onHighlight={(q) => setHighlight(q ?? (factorId && st.activeFactor === factorId ? 'VG' : null))}
            />
          </div>
        )
      })}
    </div>
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

        <RealBandsValues
          model={model}
          activePreset={activePreset}
          antisymmetricOn={showVa}
          showMass={st.tools.mass}
          showFill={st.tools.fill}
          onHighlight={setHighlight}
        />

        {model.isAluminum && (
          <p className="pseudo-callout pseudo-callout-source">
            <RichText text={s.presets.alLockedNote} />
          </p>
        )}

        {activePreset?.factorsSource === 'esterni' && (
          <p className="pseudo-callout pseudo-callout-source">
            <RichText text={s.presets.geNote} />
          </p>
        )}

        {st.tools.fill && (
          <p className="pseudo-callout" onPointerOver={over} onPointerLeave={leave}>
            <RichText
              text={
                model.isAluminum && model.aluminum
                  ? model.aluminum.electronsPerCell === 3
                    ? s.values.alFermiNote3
                    : s.values.alFermiNote1
                  : model.chemicalPotential !== null
                    ? s.values.fillNote
                    : s.values.metalNoMuNote
              }
            />
          </p>
        )}

        {st.tools.compare && (
          <p className="pseudo-callout" onPointerOver={over} onPointerLeave={leave}>
            <RichText text={s.values.compareNote} />
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
          <h3>{s.presets.controlsHeading}</h3>
          <p>{s.presets.note}</p>
          <p>
            <RichText text={s.antisymmetric.basisNote} />
          </p>
          <p>
            <RichText text={s.params.shellsNote} />
          </p>
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

function RealBandsValues({
  model,
  activePreset,
  antisymmetricOn,
  showMass,
  showFill,
  onHighlight
}: {
  readonly model: RealBandsModel
  readonly activePreset: (typeof PRESETS)[number] | null
  readonly antisymmetricOn: boolean
  readonly showMass: boolean
  readonly showFill: boolean
  readonly onHighlight: (q: QuantityId | null) => void
}): JSX.Element {
  const { summary, formFactors, formFactorsEv, stateBreakdown } = model
  const topShells = [...stateBreakdown.shellWeights]
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 2)
    .filter((sw) => sw.weight >= 0.01)

  const pointLabel = describePathPoint(model.path, model.pointIndex)
  const bandLabel = model.isAluminum
    ? s.values.selectedBandGeneric(model.bandIndex + 1)
    : model.bandIndex < 4
      ? s.values.selectedBandValence(model.bandIndex + 1)
      : s.values.selectedBandConduction(model.bandIndex - 3)

  const cbmText =
    summary.cbmDescription === 'ΓX'
      ? `${formatNumber(summary.cbmSegmentFraction, 2)} ΓX`
      : summary.cbmDescription

  const over = (e: PointerEvent<HTMLElement>): void => {
    const t = (e.target as Element).closest?.('[data-q]')
    const q = t ? t.getAttribute('data-q') : null
    onHighlight(isQuantityId(q) ? q : null)
  }

  return (
    <dl className="values pseudo-values" onPointerOver={over} onPointerLeave={() => onHighlight(null)}>
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

      {!model.isAluminum && (
        <>
          <dt>{s.values.formFactorsLabel}</dt>
          <dd className="num">
            <span>
              <Tex tex="\htmlData{q=VG}{V^s}" /> = {formatNumber(formFactors.v3s, 3)} / {formatNumber(formFactors.v8s, 3)} /{' '}
              {formatNumber(formFactors.v11s, 3)} Ry
            </span>
            <span className="note sub">
              ({formatNumber(formFactorsEv.v3s, 2)} / {formatNumber(formFactorsEv.v8s, 2)} /{' '}
              {formatNumber(formFactorsEv.v11s, 2)} eV)
            </span>
          </dd>
        </>
      )}

      {antisymmetricOn && (
        <>
          <dt>{s.values.antisymLabel}</dt>
          <dd className="num">
            <Tex tex="\htmlData{q=V2G}{V^a}" /> = {formatNumber(formFactors.v3a, 3)} / {formatNumber(formFactors.v4a, 3)} /{' '}
            {formatNumber(formFactors.v11a, 3)} Ry
          </dd>
        </>
      )}

      {model.isAluminum ? (
        <>
          <dt>{s.values.gapLabel}</dt>
          <dd>
            <span>{s.values.alMetalValue}</span>
            <span className="note sub">{s.values.alZeroNote}</span>
          </dd>
          {showFill && model.aluminum && (
            <>
              <dt>{s.values.alFermiLabel}</dt>
              <dd className="num">
                <Tex tex="\htmlData{q=k}{k_F}" /> = {formatNumber(model.aluminum.fermi.kFAngInv, 2)} Å⁻¹ ={' '}
                {formatNumber(model.aluminum.fermi.kFDimless, 3)}·(2π/a)
                <br />
                <Tex tex="\htmlData{q=EF}{E_F}" /> = {formatNumber(model.aluminum.fermi.eFEv, 2)} eV
              </dd>
              <dt>{s.values.alCrossingsLabel}</dt>
              <dd className="num">
                {s.values.alCrossingsValue(
                  model.aluminum.crossingCount,
                  model.aluminum.crossingBandNumbers.join(', ')
                )}
              </dd>
            </>
          )}
        </>
      ) : (
        <>
          <dt>{s.values.gapLabel}</dt>
          <dd>
            {model.isProvisional ? (
              <>
                <Tex tex="\htmlData{q=VG}{E_g}" /> <span className="num">≈ {formatNumber(summary.gap, 2)} eV</span>{' '}
                <span className="sub">({s.scene.refining})</span>
              </>
            ) : (
              <>
                <Tex tex="\htmlData{q=VG}{E_g}" /> = <span className="num">{formatNumber(summary.gap, 2)} eV</span> ·{' '}
                <span className="sub">{summary.isDirect ? s.scene.directGap : s.scene.indirectGap}</span>
              </>
            )}
            <span className="note sub">
              {activePreset && antisymmetricOn === (activePreset.antisymmetric !== null) && activePreset.measuredGapEv !== null
                ? s.values.gapIndicative(formatNumber(activePreset.measuredGapEv, 2), activePreset.measuredGapKind ?? '')
                : s.values.gapGenericNote}
            </span>
          </dd>

          <dt>{s.values.cbmPosLabel}</dt>
          <dd className={model.isProvisional ? 'sub' : 'num'}>
            {model.isProvisional ? s.scene.refining : cbmText}
          </dd>

          <dt>{s.values.ecPointsLabel}</dt>
          <dd className="num">
            {formatNumber(summary.ecGamma, 2)} / {formatNumber(summary.ecX, 2)} / {formatNumber(summary.ecL, 2)} eV
          </dd>

          <dt>{s.values.valenceSpanLabel}</dt>
          <dd className="num">
            {formatNumber(summary.valenceBottom, 2)} eV · larghezza {formatNumber(summary.valenceWidth, 2)} eV
          </dd>
        </>
      )}

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
            <Tex tex="\htmlData{q=mstar}{m^*}/m_0" />{' '}
            <span className="num">
              {formatEffectiveMassRatio(model.massProbe.effectiveMassRatio, { digits: 3, withEquals: true })}
            </span>
            <span className="note sub">{s.values.massDirection(model.segmentLabel)}</span>
            {model.gaasGammaCompare && (
              <span className="note sub num">
                <RichText
                  text={s.values.massGaAsCompare(
                    formatNumber(model.gaasGammaCompare.calculatedMassRatio, 3),
                    formatNumber(model.gaasGammaCompare.measuredMassRatio, 3),
                    formatNumber(model.gaasGammaCompare.kpEstimateRatio, 3)
                  )}
                />
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
      <div className="pseudo-verify-sub">
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
