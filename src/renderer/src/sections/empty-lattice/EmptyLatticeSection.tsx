/**
 * Sezione «Reticolo vuoto e schemi di zona» (dispensa P3 §9 e §11.6, P4 §5.1):
 * spazio reale (parte reale dell'onda piana sopra gli ioni) e diagramma E(k)
 * animato nei tre schemi (estesa, ridotta, periodica), formula viva e valori.
 */
import { useCallback, type JSX, type PointerEvent } from 'react'
import { ParamSlider, Panel, Stepper, ToolToggle } from '../../ui/controls'
import { formatEffectiveMassRatio, formatNumber } from '../../ui/format'
import { FOLLOW, useTweened } from '../../ui/motion'
import { SceneView, SectionLayout } from '../../ui/shell'
import { RichText, Tex } from '../../ui/tex'
import { isQuantityId, type QuantityId } from '../../ui/theme'
import { LiveFormula } from '../../viz/LiveFormula'
import { EmptyLatticeRealSpace } from './EmptyLatticeRealSpace'
import { DEFINITIONS, MAIN_FORMULA } from './formulas'
import { NUMERICS, PARAMS, type ZoneScheme } from './manifest'
import { useEmptyLatticeModel, type EmptyLatticeModel } from './model'
import { useEmptyLatticeStore, type EmptyLatticeState, type HighlightTarget } from './store'
import { strings as s } from './strings'
import { ZoneSchemesPlot } from './ZoneSchemesPlot'
import './emptyLattice.css'

const SCHEMES: readonly { readonly id: ZoneScheme; readonly label: string; readonly title: string }[] = [
  { id: 'extended', label: s.schemes.extended, title: s.schemes.extendedTitle },
  { id: 'reduced', label: s.schemes.reduced, title: s.schemes.reducedTitle },
  { id: 'periodic', label: s.schemes.periodic, title: s.schemes.periodicTitle }
]

export function EmptyLatticeSection(): JSX.Element {
  const st = useEmptyLatticeStore()
  const shown = useTweened(st.params, FOLLOW)
  const model = useEmptyLatticeModel(shown, st.kFracReduced, st.branchN, {
    fill: st.tools.fill,
    electrons: st.electrons,
    mass: st.tools.mass,
    compare: st.tools.compare || st.highlight === 'VG'
  })

  const setHighlight = st.setHighlight
  const onPickBranch = useCallback(
    (kFrac: number, branchN: number) => useEmptyLatticeStore.getState().selectBranchState(kFrac, branchN),
    []
  )
  const onPickExtended = useCallback(
    (kExt: number) => useEmptyLatticeStore.getState().selectExtended(kExt),
    []
  )
  const onNudge = useCallback((dk: number, dBand: number) => useEmptyLatticeStore.getState().nudge(dk, dBand), [])

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

  const params = (
    <>
      {PARAMS.map((spec) => (
        <ParamSlider
          key={spec.id}
          quantity={spec.quantity}
          symbol={spec.symbol}
          label={s.params[spec.id]}
          value={st.params[spec.id]}
          min={spec.min}
          max={spec.max}
          step={spec.step}
          unit={spec.unit}
          digits={spec.digits}
          active={st.highlight === spec.quantity && st.highlightTarget !== 'G'}
          onChange={(v) => st.setParam(spec.id, v)}
          onHighlight={(q) => setHighlight(q, q === 'a' ? 'a' : null)}
        />
      ))}
      <div className="scheme-switch">
        <span>{s.schemes.label}</span>
        <div className="scheme-group" role="group" aria-label={s.schemes.label}>
          {SCHEMES.map((item) => (
            <button
              key={item.id}
              type="button"
              className="scheme-btn"
              aria-pressed={st.scheme === item.id}
              title={item.title}
              onClick={() => st.setScheme(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
      {st.tools.fill && (
        <Stepper
          label={s.electrons.label}
          value={st.electrons}
          min={NUMERICS.electrons.min}
          max={NUMERICS.electrons.max}
          onChange={st.setElectrons}
          decreaseLabel={s.electrons.decrease}
          increaseLabel={s.electrons.increase}
        />
      )}
    </>
  )

  const sel = model.selection
  const scene = (
    <>
      <SceneView
        tag={s.scene.realTag}
        hint={
          <>
            <span className="num">
              {s.scene.realHint(formatNumber(sel.kFracExtended, 2), formatNumber(sel.kFracReduced, 2), sel.n)}
            </span>
            <span className="view-note" data-q="psi">
              {' · '}
              <RichText text={s.scene.realNote} />
            </span>
          </>
        }
      >
        <EmptyLatticeRealSpace
          xs={model.xs}
          waveReal={model.waveReal}
          kReduced={sel.kReduced}
          a={shown.a}
          highlight={st.highlight}
          highlightTarget={st.highlightTarget}
          labels={{
            ariaLabel: s.scene.realAria,
            waveLabel: s.scene.waveLabel,
            densityLabel: s.scene.densityLabel,
            ions: s.scene.ions
          }}
        />
      </SceneView>
      <SceneView tag={s.scene.bandsTag} hint={s.scene.bandsHint}>
        <ZoneSchemesPlot
          scheme={st.scheme}
          a={shown.a}
          zoneEdge={model.zoneEdge}
          G1={model.G1}
          E0={model.E0}
          kRange={model.kRange}
          eRange={model.eRange}
          segments={model.segments}
          reducedBands={model.reducedBands}
          compare={
            model.compareBands
              ? {
                  bands: model.compareBands,
                  edgeGap: model.compareEdgeGap,
                  visible: st.tools.compare,
                  label: s.scene.compareLegend,
                  gapLabel: s.scene.gapG
                }
              : null
          }
          filling={
            model.filling
              ? {
                  fermiLevel: model.filling.fermiLevel,
                  label: s.scene.metal
                }
              : null
          }
          selection={sel}
          probe={
            model.probe
              ? {
                  slope: model.probe.slope,
                  curvature: model.probe.curvature,
                  label: s.scene.probe
                }
              : null
          }
          highlight={st.highlight}
          highlightTarget={st.highlightTarget}
          onPickBranch={onPickBranch}
          onPickExtended={onPickExtended}
          onNudge={onNudge}
          labels={{
            ariaLabel: s.scene.bandsAria,
            energyAxis: s.scene.energyAxis,
            kAxis: s.scene.kAxis,
            bandsLegend: s.scene.bandsLegend,
            e0: s.scene.e0
          }}
        />
      </SceneView>
    </>
  )

  const handleFormulaHover = (e: PointerEvent): void => {
    const term = (e.target as Element).closest?.('[data-q]')
    const q = term?.getAttribute('data-q')
    if (!isQuantityId(q)) {
      setHighlight(null, null)
      return
    }
    if (q === 'a') {
      const txt = term?.textContent?.trim() ?? ''
      setHighlight('a', txt === 'G' ? 'G' : 'a')
      return
    }
    setHighlight(q, null)
  }

  const aside = (
    <>
      <Panel title={s.formula.title} className="formula-panel">
        <div onPointerOver={handleFormulaHover} onPointerLeave={() => setHighlight(null, null)}>
          <LiveFormula
            tex={MAIN_FORMULA}
            highlight={st.highlight}
            pulse={st.pulse}
            ariaLabel={s.formula.aria}
            className="formula-main"
          />
          <div className="formula-defs">
            {DEFINITIONS.map((tex) => (
              <LiveFormula key={tex} tex={tex} display={false} highlight={st.highlight} pulse={st.pulse} />
            ))}
          </div>
        </div>
        <Values model={model} st={st} onHighlight={setHighlight} />
      </Panel>
      <Panel title={s.theory.title} className="theory">
        <div onPointerOver={(e) => hoverQuantity(e, setHighlight)} onPointerLeave={() => setHighlight(null, null)}>
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

function hoverQuantity(e: PointerEvent, setHighlight: (q: QuantityId | null, target?: HighlightTarget) => void): void {
  const term = (e.target as Element).closest?.('[data-q]')
  const q = term?.getAttribute('data-q')
  if (!isQuantityId(q)) {
    setHighlight(null, null)
    return
  }
  if (q === 'a') {
    const txt = term?.textContent?.trim() ?? ''
    setHighlight('a', txt === 'G' ? 'G' : 'a')
    return
  }
  setHighlight(q, null)
}

function Values({
  model,
  st,
  onHighlight
}: {
  model: EmptyLatticeModel
  st: EmptyLatticeState
  onHighlight: (q: QuantityId | null, target?: HighlightTarget) => void
}): JSX.Element {
  const v = s.values
  const sel = model.selection
  const c1 = model.crossings[0]
  const c2 = model.crossings[1]
  const c3 = model.crossings[2]
  const nFmt = sel.n > 0 ? `+${sel.n}` : sel.n < 0 ? `−${Math.abs(sel.n)}` : '0'

  return (
    <dl
      className="values"
      onPointerOver={(e) => hoverQuantity(e, onHighlight)}
      onPointerLeave={() => onHighlight(null, null)}
    >
      <dt>{v.zoneEdge}</dt>
      <dd>
        <Tex tex="\pi/\htmlData{q=a}{a}" /> = <Num value={model.zoneEdge} width={5} /> Å⁻¹
      </dd>

      <dt>{v.reciprocalG}</dt>
      <dd>
        <Tex tex="\htmlData{q=a}{G}" /> = <Num value={sel.G} width={5} signed /> Å⁻¹
        <span className="sub">
          {' · '}
          {v.branch} n = {nFmt}
        </span>
      </dd>

      <dt>{v.e0}</dt>
      <dd>
        <Tex tex="\htmlData{q=Ek}{E_0}" /> = <Num value={model.E0} width={5} /> eV
      </dd>

      <dt>{v.state}</dt>
      <dd>
        <Tex tex="\htmlData{q=k}{k}" /> ({v.kExtended}) = <Num value={sel.kFracExtended} width={5} /> π/a
        <span className="sub">
          {' '}
          (<Num value={sel.kExtended} width={5} /> Å⁻¹)
        </span>
        <br />
        <Tex tex="\htmlData{q=k}{k'}" /> ({v.kReduced}) = <Num value={sel.kFracReduced} width={5} /> π/a
        <span className="sub">
          {' '}
          (<Num value={sel.kReduced} width={5} /> Å⁻¹)
        </span>
        <br />
        <Tex tex="\htmlData{q=E}{E}" /> = <Num value={sel.energy} width={5} /> eV
        <span className="sub">
          {' · '}
          {v.band} {sel.band + 1}
        </span>
      </dd>

      <dt>{v.crossings}</dt>
      <dd>
        {v.crossEdge}: <Tex tex="\htmlData{q=Ek}{E_0}" /> = <Num value={c1.energy} width={5} /> eV,{' '}
        <span className="nowrap">
          <Tex tex="9\htmlData{q=Ek}{E_0}" /> = <Num value={c3.energy} width={5} /> eV
        </span>
        <br />
        {v.crossCenter}: <Tex tex="4\htmlData{q=Ek}{E_0}" /> = <Num value={c2.energy} width={5} /> eV
      </dd>

      {model.filling && (
        <>
          <dt>{v.fermi}</dt>
          <dd>
            <Tex tex="\htmlData{q=EF}{E_F}" /> = <Num value={model.filling.fermiLevel} width={5} /> eV
            <span className="sub">
              {' · '}
              {s.scene.metal} <span className="nowrap">({v.electrons(st.electrons)})</span>
            </span>
            {st.electrons === 2 && (
              <span className="sub note">
                <RichText text={v.fermiTwoNote} />
              </span>
            )}
          </dd>
        </>
      )}

      {model.probe && (
        <>
          <dt>{v.mass}</dt>
          <dd>
            <Tex tex="\htmlData{q=mstar}{m^*}/m_0" />{' '}
            <span className="num">{formatEffectiveMassRatio(model.probe.massRatio, { digits: 2, withEquals: true })}</span>
            <span className="sub note">
              <RichText text={v.massFreeNote} />
            </span>
          </dd>
          <dt>{v.velocity}</dt>
          <dd>
            <Tex tex="\htmlData{q=v}{v}" /> = <Num value={model.probe.velocity / 1e6} width={5} /> · 10⁶ m/s
          </dd>
        </>
      )}
    </dl>
  )
}

function Num({
  value,
  digits = 2,
  width,
  signed = false
}: {
  value: number
  digits?: number
  width: number
  signed?: boolean
}): JSX.Element {
  return (
    <span className="num value-num" style={{ minWidth: `${width}ch` }}>
      {formatNumber(value, digits, { signed })}
    </span>
  )
}
