/**
 * Sezione «Kronig–Penney» (dispensa Parte 3, §10):
 *  - due varianti animate: barriere a delta (a, P) e rettangolari (b, c, V₀ con a = b + c);
 *  - spazio reale (buche centrate sugli ioni, barriere, |ψ|² esatta);
 *  - condizione cos ka = L(E) e diagramma E(k) affiancati sullo stesso asse dell'energia,
 *    con livelli genitori della buca finita isolata e banda a coseno Ē ∓ 2t·cos ka;
 *  - formula viva, valori vivi e scheda teoria.
 */
import { useCallback, type JSX, type PointerEvent } from 'react'
import { Panel, ParamSlider, Stepper, ToolToggle } from '../../ui/controls'
import { formatNumber, formatSignificant } from '../../ui/format'
import { FOLLOW, useTweened } from '../../ui/motion'
import { SceneView, SectionLayout } from '../../ui/shell'
import { RichText, Tex } from '../../ui/tex'
import { isQuantityId, type QuantityId } from '../../ui/theme'
import { LiveFormula } from '../../viz/LiveFormula'
import {
  COSINE_FORMULA,
  DEFINITIONS_DELTA,
  DEFINITIONS_RECT,
  MAIN_FORMULA_DELTA,
  MAIN_FORMULA_RECT
} from './formulas'
import { KronigBandsAndConditionPlot } from './KronigBandsAndConditionPlot'
import { KronigRealSpace } from './KronigRealSpace'
import { DELTA_PARAMS, NUMERICS, RECT_PARAMS, type KronigVariant } from './manifest'
import { useKronigPenneyModel, type VariantModel } from './model'
import { useKronigPenneyStore, type HighlightTarget, type KronigPenneyState } from './store'
import { strings as s } from './strings'
import './kronigPenney.css'

export function KronigPenneySection(): JSX.Element {
  const st = useKronigPenneyStore()
  const shownDelta = useTweened(st.deltaParams, FOLLOW)
  const shownRect = useTweened(st.rectParams, FOLLOW)

  const model = useKronigPenneyModel(shownDelta, shownRect, st.kFrac, st.band, {
    fill: st.tools.fill,
    electrons: st.electrons,
    mass: st.tools.mass,
    compare: st.tools.compare
  })

  const activeModel = st.variant === 'rectangular' ? model.rect : model.delta
  const setHighlight = st.setHighlight

  const onSelect = useCallback(
    (kFrac: number, band: number) => useKronigPenneyStore.getState().select(kFrac, band),
    []
  )
  const onNudge = useCallback(
    (dk: number, dBand: number) => useKronigPenneyStore.getState().nudge(dk, dBand),
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
      <ToolToggle
        pressed={st.tools.cosine}
        onToggle={() => st.toggleTool('cosine')}
        quantity="v"
        title={s.tools.cosineTitle}
      >
        {s.tools.cosine}
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

  const variantSwitch = (
    <div className="kp-variant-switch" role="group" aria-label={s.variants.label}>
      <span>{s.variants.label}</span>
      <div className="kp-variant-group">
        {(['delta', 'rectangular'] as const).map((v: KronigVariant) => (
          <button
            key={v}
            type="button"
            className="kp-variant-btn"
            aria-pressed={st.variant === v}
            title={v === 'delta' ? s.variants.deltaTitle : s.variants.rectangularTitle}
            onClick={() => st.setVariant(v)}
          >
            {s.variants[v]}
          </button>
        ))}
      </div>
    </div>
  )

  const params = (
    <>
      {variantSwitch}
      {st.variant === 'delta'
        ? DELTA_PARAMS.map((spec) => (
            <ParamSlider
              key={spec.id}
              quantity={spec.quantity}
              symbol={spec.symbol}
              label={s.params[spec.id]}
              value={st.deltaParams[spec.id]}
              min={spec.min}
              max={spec.max}
              step={spec.step}
              unit={spec.unit}
              digits={spec.digits}
              active={st.highlight === spec.quantity}
              onChange={(v) => st.setDeltaParam(spec.id, v)}
              onHighlight={(q) => setHighlight(q, q === 'a' ? 'a' : null)}
            />
          ))
        : (
            <>
              {RECT_PARAMS.map((spec) => {
                const sub: HighlightTarget = spec.id === 'b' ? 'b' : spec.id === 'c' ? 'c' : null
                const isActive =
                  st.highlight === spec.quantity && (sub === null || st.highlightTarget === null || st.highlightTarget === sub)
                return (
                  <ParamSlider
                    key={spec.id}
                    quantity={spec.quantity}
                    symbol={spec.symbol}
                    label={s.params[spec.id]}
                    value={st.rectParams[spec.id]}
                    min={spec.min}
                    max={spec.max}
                    step={spec.step}
                    unit={spec.unit}
                    digits={spec.digits}
                    active={isActive}
                    onChange={(v) => st.setRectParam(spec.id, v)}
                    onHighlight={(q) => setHighlight(q, q ? sub : null)}
                  />
                )
              })}
              <div
                className="kp-period-pill"
                onPointerEnter={() => setHighlight('a', 'a')}
                onPointerLeave={() => setHighlight(null, null)}
              >
                <span>a = b + c =</span>
                <strong>{formatNumber(st.rectParams.b + st.rectParams.c, 2)} Å</strong>
              </div>
            </>
          )}
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

  const scene = (
    <>
      <SceneView
        tag={s.scene.realTag}
        hint={
          <span className="num">
            {s.scene.realHint(formatNumber(activeModel.selection.kFrac, 2), activeModel.selection.band + 1)}
          </span>
        }
      >
        <KronigRealSpace
          xs={model.xs}
          variant={st.variant}
          delta={model.delta}
          rect={model.rect}
          highlight={st.highlight}
          highlightTarget={st.highlightTarget}
          labels={{
            ariaLabel: s.scene.realAria,
            ions: s.scene.ions,
            density: s.scene.density,
            potentialDelta: s.scene.potentialDelta,
            potentialRect: s.scene.potentialRect
          }}
        />
      </SceneView>
      <SceneView tag={s.scene.bandsTag} hint={s.scene.bandsHint}>
        <KronigBandsAndConditionPlot
          variant={st.variant}
          delta={model.delta}
          rect={model.rect}
          showCosine={st.tools.cosine}
          showCompare={st.tools.compare}
          highlight={st.highlight}
          highlightTarget={st.highlightTarget}
          onSelect={onSelect}
          onNudge={onNudge}
          labels={{
            ariaLabel: s.scene.bandsAria,
            energyAxis: s.scene.energyAxis,
            kAxis: s.scene.kAxis,
            lAxisDelta: s.scene.lAxisDelta,
            lAxisRect: s.scene.lAxisRect,
            bandsLegend: s.scene.bandsLegend,
            cosineLegend: s.scene.cosineLegend,
            compareLegend: s.scene.compareLegend,
            gapLabel: s.scene.gapLabel,
            metal: s.scene.metal,
            insulator: s.scene.insulator,
            probe: s.scene.probe,
            wellLevelsBadge: s.scene.wellLevelsBadge
          }}
        />
      </SceneView>
    </>
  )

  const defs = st.variant === 'delta' ? DEFINITIONS_DELTA : DEFINITIONS_RECT
  const mainTex = st.variant === 'delta' ? MAIN_FORMULA_DELTA : MAIN_FORMULA_RECT
  const mainAria = st.variant === 'delta' ? s.formula.ariaDelta : s.formula.ariaRect

  const onFormulaHover = useCallback(
    (q: QuantityId | null, target: HighlightTarget = null) => setHighlight(q, target),
    [setHighlight]
  )

  const aside = (
    <>
      <Panel title={s.formula.title} className="formula-panel">
        <div
          className="kp-formula-box"
          onPointerOver={(e) => hoverTerm(e, onFormulaHover)}
          onPointerLeave={() => onFormulaHover(null, null)}
        >
          <LiveFormula
            tex={mainTex}
            highlight={st.highlight}
            pulse={st.pulse}
            ariaLabel={mainAria}
            className="formula-main"
          />
          <div className="formula-defs">
            {defs.map((tex) => (
              <LiveFormula key={tex} tex={tex} display={false} highlight={st.highlight} pulse={st.pulse} />
            ))}
          </div>
          {st.tools.cosine && (
            <div className="formula-defs formula-cosine">
              <LiveFormula tex={COSINE_FORMULA} display={false} highlight={st.highlight} pulse={st.pulse} />
            </div>
          )}
        </div>
        <Values model={activeModel} variant={st.variant} st={st} onHighlight={onFormulaHover} />
      </Panel>
      <Panel title={s.theory.title} className="theory">
        <div onPointerOver={(e) => hoverTerm(e, onFormulaHover)} onPointerLeave={() => onFormulaHover(null, null)}>
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

function hoverTerm(e: PointerEvent, setHighlight: (q: QuantityId | null, target?: HighlightTarget) => void): void {
  const term = (e.target as Element).closest?.('[data-q]')
  if (!term) {
    setHighlight(null, null)
    return
  }
  const q = term.getAttribute('data-q')
  if (!isQuantityId(q)) {
    setHighlight(null, null)
    return
  }
  const txt = (term.textContent ?? '').replace(/\s+/g, '')
  let target: HighlightTarget = null
  if (q === 'a') {
    if (txt === 'b') target = 'b'
    else if (txt === 'c') target = 'c'
    else if (txt === 'a') target = 'a'
  } else if (q === 'E' && (txt.startsWith('L') || txt.startsWith('f'))) {
    target = 'L'
  }
  setHighlight(q, target)
}

function Values({
  model,
  variant,
  st,
  onHighlight
}: {
  model: VariantModel
  variant: KronigVariant
  st: KronigPenneyState
  onHighlight: (q: QuantityId | null, target?: HighlightTarget) => void
}): JSX.Element {
  const v = s.values
  const sel = model.selection
  const edge = model.edges[sel.band]
  const firstGap = model.gaps[0]
  const bandWidth = edge ? edge.upper - edge.lower : 0

  return (
    <dl
      className="values"
      onPointerOver={(e) => hoverTerm(e, onHighlight)}
      onPointerLeave={() => onHighlight(null, null)}
    >
      <dt data-q="a">{v.period}</dt>
      <dd data-q="a">
        <Tex tex="\htmlData{q=a}{a}" /> = <span className="num">{formatNumber(model.a, 2)}</span> Å
        <span className="sub">
          {' · '}
          <Tex tex="\htmlData{q=Ek}{E_0}" /> = <span className="num">{formatNumber(model.E0, 2)}</span> eV
        </span>
      </dd>

      {variant === 'delta' ? (
        <>
          <dt data-q="VG">{v.opacity}</dt>
          <dd data-q="VG">
            <Tex tex="\htmlData{q=VG}{P}" /> = <span className="num">{formatNumber(model.effectiveP, 2)}</span>
            <br />
            <span className="sub">
              <Tex tex="a\htmlData{q=VG}{V_0}" /> = <span className="num">{formatNumber(model.barrierStrength, 2)}</span> eV·Å
              {model.deltaV0 !== null && (
                <>
                  {' · '}
                  <Tex tex="\htmlData{q=VG}{V_0}" /> = <span className="num">{formatNumber(model.deltaV0, 2)}</span> eV
                </>
              )}
            </span>
          </dd>
        </>
      ) : (
        <>
          <dt data-q="VG">{v.strength}</dt>
          <dd data-q="VG">
            <Tex tex="\htmlData{q=VG}{V_0}\,\htmlData{q=a}{c}" /> ={' '}
            <span className="num">{formatNumber(model.barrierStrength, 2)}</span> eV·Å
            <span className="sub">
              {' · '}
              <Tex tex="P_{\mathrm{eff}}" /> = <span className="num">{formatNumber(model.effectiveP, 2)}</span>
            </span>
          </dd>
        </>
      )}

      {edge && (
        <>
          <dt data-q="E">{v.bandRow(sel.band + 1)}</dt>
          <dd data-q="E">
            <span className="num">
              [{formatNumber(edge.lower, 2)}; {formatNumber(edge.upper, 2)}]
            </span>{' '}
            eV
            <span className="sub">
              {' · '}
              {bandWidth < 1e-4 ? (
                <>W &lt; 10⁻⁴ eV</>
              ) : (
                <>
                  W = <span className="num">{formatSignificant(bandWidth, 3)}</span> eV
                </>
              )}
            </span>
          </dd>
        </>
      )}

      {firstGap && (
        <>
          <dt data-q="VG">{v.gapRow}</dt>
          <dd data-q="VG">
            <Tex tex="\htmlData{q=VG}{E_g}" /> = <span className="num">{formatSignificant(firstGap.width, 3)}</span> eV
            <span className="sub">
              {' · '}
              <span className="num">
                [{formatNumber(firstGap.lower, 2)}; {formatNumber(firstGap.upper, 2)}]
              </span>{' '}
              eV
            </span>
          </dd>
        </>
      )}

      {variant === 'rectangular' && (
        <>
          <dt data-q="V2G">{v.parents}</dt>
          <dd data-q="V2G">
            {model.wellLevels.length === 0 ? (
              <span className="sub">{v.parentsNone}</span>
            ) : (
              <span className="num">
                {model.wellLevels.slice(0, 4).map((lv, idx) => (
                  <span key={lv.index}>
                    {idx > 0 && ' · '}
                    <Tex tex={`\\htmlData{q=V2G}{E_{${lv.index + 1}}}`} /> = {formatNumber(lv.energy, 2)}
                  </span>
                ))}{' '}
                eV
              </span>
            )}
          </dd>
        </>
      )}

      <dt data-q="k">{v.state}</dt>
      <dd data-q="k">
        <Tex tex="\htmlData{q=k}{k}" /> = <span className="num">{formatNumber(sel.kFrac, 2)}</span> π/a{' '}
        <span className="sub">
          (<span className="num">{formatNumber(sel.k, 2)}</span> Å⁻¹)
        </span>
        <br />
        <Tex tex="\htmlData{q=E}{E}" /> = <span className="num">{formatNumber(sel.energy, 3)}</span> eV
        <span className="sub">
          {' · '}L = <span className="num">{formatNumber(sel.L, 3)}</span> ({v.band} {sel.band + 1})
        </span>
      </dd>

      {st.tools.cosine && (
        <>
          <dt data-q="v">{v.cosine}</dt>
          <dd data-q="v">
            <Tex tex="\bar{E}" /> = <span className="num">{formatNumber(model.cosine.center, 3)}</span> eV
            <span className="sub">
              {' · '}
              <Tex tex="\htmlData{q=v}{t}" /> = <span className="num">{formatSignificant(model.cosine.t, 3)}</span> eV · W ={' '}
              <span className="num">{formatSignificant(model.cosine.width, 3)}</span> eV
            </span>
            <br />
            <span className="sub">
              <Tex tex="E_{\cos}" /> = <span className="num">{formatNumber(sel.cosineEnergy, 3)}</span> eV
            </span>
          </dd>
        </>
      )}

      {model.filling && (
        <>
          <dt data-q="EF">{v.fermi}</dt>
          <dd data-q="EF">
            <Tex tex="\htmlData{q=EF}{E_F}" /> = <span className="num">{formatNumber(model.filling.fermiLevel, 2)}</span> eV
            <span className="sub">
              {' · '}
              {model.filling.kind === 'insulator' ? s.scene.insulator : s.scene.metal} ({v.electrons(st.electrons)})
            </span>
          </dd>
        </>
      )}

      {model.probe && (
        <>
          <dt data-q="mstar">{v.mass}</dt>
          <dd data-q="mstar">
            <Tex tex="\htmlData{q=mstar}{m^*}/m_0" /> ={' '}
            <span className="num">
              {Number.isFinite(model.probe.massRatio) ? formatSignificant(model.probe.massRatio, 3) : '∞'}
            </span>
            <span className="sub">
              {' · '}
              <Tex tex="\htmlData{q=v}{v}" /> = <span className="num">{formatSignificant(model.probe.velocity / 1e6, 3)}</span> · 10⁶ m/s
            </span>
            <br />
            <span className="sub">
              {v.cosineMass}:{' '}
              <span className="num">
                {Number.isFinite(model.probe.cosineMassRatio)
                  ? formatSignificant(model.probe.cosineMassRatio, 3)
                  : '∞'}
              </span>{' '}
              ({v.cosineMassNote}:{' '}
              <span className="num">
                {Number.isFinite(model.probe.cosineMinMassRatio)
                  ? formatSignificant(model.probe.cosineMinMassRatio, 3)
                  : '∞'}
              </span>
              )
            </span>
          </dd>
        </>
      )}
    </dl>
  )
}
