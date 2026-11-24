/**
 * Sezione 3 — Rami 3D, polarizzazioni e cristalli reali
 * (dispensa Parte 6: Lezione 2 §§9–10, Fig. 13, §12; Lezione 3 §14, Tab. 1, Figg. 17–18, §19).
 *
 * Due viste principali collegate:
 * 1. Proiezione isometrica 3D animata dei piani atomici, di k e di εˢ(k) (oppure griglia 2D
 *    Born–von Kármán Fig. 17 + bilancio 3p·N_c e v_c = a³/4 quando è attivo lo strumento 1BZ).
 * 2. DispersionPlot in modalità 3D lungo Γ–X–K–Γ–L con degenerazioni etichettate, marcatori
 *    di Tab. 1 e unità commutabili meV / THz.
 */
import { useCallback, useMemo, type JSX, type PointerEvent } from 'react'
import { crystalBasisTau2, type BranchRole3D, type KVector } from '../../physics'
import { Panel, ParamSlider, PresetMenu, Stepper, ToolToggle } from '../../ui/controls'
import { formatNumber } from '../../ui/format'
import { FOLLOW, GLIDE, useTweened } from '../../ui/motion'
import { SceneView, SectionLayout } from '../../ui/shell'
import { RichText, Tex } from '../../ui/tex'
import { isQuantityId, type DerivedToneId, type QuantityId } from '../../ui/theme'
import type { LegendEntry } from '../../viz/ChartLegend'
import {
  DispersionPlot,
  type DispersionBranch,
  type DispersionPoint,
  type PathSymmetryTick
} from '../../viz/DispersionPlot'
import { LiveFormula } from '../../viz/LiveFormula'
import {
  branchCountFormulas,
  BVK_3D_FORMULAS,
  MAIN_FORMULA,
  SECULAR_FORMULAS
} from './formulas'
import { CRYSTAL_PRESETS, NUMERICS, PARAMS } from './manifest'
import { ModeCounting3DView } from './ModeCounting3DView'
import { usePhonon3DModel, type Phonon3DModel } from './model'
import { formatRoleUnicode, Polarization3DView } from './Polarization3DView'
import { usePhonon3DStore, type Phonon3DState } from './store'
import { strings as s } from './strings'
import './phonon-3d.css'

const CRYSTAL_OPTIONS = CRYSTAL_PRESETS.map((p) => ({
  id: p.id,
  label: `${p.name} — ${p.subtitle}`
}))

function roleVisualMeta(role: BranchRole3D): {
  quantity: QuantityId
  tone?: DerivedToneId
  style?: 'solid' | 'dashed'
} {
  switch (role) {
    case 'LA':
      return { quantity: 'omega' }
    case 'TA1':
      return { quantity: 'omega', tone: 'acousticTransverse' }
    case 'TA2':
      return { quantity: 'omega', tone: 'acousticTransverse', style: 'dashed' }
    case 'LO':
      return { quantity: 'omegaOpt' }
    case 'TO1':
      return { quantity: 'omegaOpt', tone: 'opticalTransverse' }
    case 'TO2':
      return { quantity: 'omegaOpt', tone: 'opticalTransverse', style: 'dashed' }
  }
}

function formatRoleTex(role: BranchRole3D): string {
  switch (role) {
    case 'TA1':
      return '\\text{TA}_1'
    case 'TA2':
      return '\\text{TA}_2'
    case 'TO1':
      return '\\text{TO}_1'
    case 'TO2':
      return '\\text{TO}_2'
    default:
      return `\\text{${role}}`
  }
}

export function Phonon3DSection(): JSX.Element {
  const st = usePhonon3DStore()
  const shown = useTweened(st.params, st.transition === 'glide' ? GLIDE : FOLLOW)
  const model = usePhonon3DModel(
    st.crystalId,
    shown,
    st.pointIndex,
    st.selectedRole,
    st.unit,
    st.bvkN,
    st.params
  )
  const setHighlight = st.setHighlight
  const p = model.material.basisCount

  const onCrystalChange = useCallback((id: string | null) => {
    if (id === 'aluminum' || id === 'diamond' || id === 'pbte') {
      usePhonon3DStore.getState().selectCrystal(id)
    }
  }, [])

  const onPick = useCallback(
    (distX: number, _branchIdx: number, branchId: string) => {
      const dist = model.dispersion.path.distance
      let bestIdx = 0
      let bestErr = Infinity
      for (let i = 0; i < dist.length; i++) {
        const err = Math.abs(dist[i] - distX)
        if (err < bestErr) {
          bestErr = err
          bestIdx = i
        }
      }
      const parts = branchId.split('-')
      const rawRole = parts[parts.length - 1] as BranchRole3D
      usePhonon3DStore.getState().selectState(bestIdx, rawRole)
    },
    [model.dispersion.path.distance]
  )

  const freqOrderedRolesAtPoint = useMemo<readonly BranchRole3D[]>(() => {
    const modesHere = model.dispersion.modesAtPoint[model.selection.pointIndex]
    return [...modesHere]
      .sort((a, b) => a.freqThz - b.freqThz)
      .map((m) => m.role)
  }, [model.dispersion.modesAtPoint, model.selection.pointIndex])

  const onNudge = useCallback(
    (dx: number, dBranch: number) => {
      usePhonon3DStore.getState().nudge(dx, dBranch, freqOrderedRolesAtPoint)
    },
    [freqOrderedRolesAtPoint]
  )

  const onQuickSelect = useCallback((pointIndex: number, role: BranchRole3D) => {
    usePhonon3DStore.getState().selectState(pointIndex, role)
  }, [])

  const pathTicks = useMemo<readonly PathSymmetryTick[]>(
    () =>
      model.dispersion.path.labels.map((lbl) => ({
        x: model.dispersion.path.distance[lbl.index],
        label: lbl.label
      })),
    [model.dispersion.path.labels, model.dispersion.path.distance]
  )

  // Rami per segmento (Γ–X, X–K, K–Γ, Γ–L) con etichette di degenerazione pulite su Γ–X e K–Γ
  const plotBranches = useMemo<readonly DispersionBranch[]>(() => {
    const out: DispersionBranch[] = []
    const useMev = st.unit === 'meV'
    for (const seg of model.dispersion.segments) {
      const isDegAxis = seg.symmetry === '100' || seg.symmetry === '111'
      for (const sbr of seg.branches) {
        const ys = useMev ? sbr.energyMev : sbr.freqThz
        const meta = roleVisualMeta(sbr.role)
        const isDuplicateDeg = isDegAxis && (sbr.role === 'TA2' || sbr.role === 'TO2')

        let tag: { readonly x: number; readonly y: number; readonly label: string } | undefined
        const mid = Math.floor(sbr.distance.length * 0.56)
        if (seg.index === 0) {
          if (sbr.role === 'LA') tag = { x: sbr.distance[mid], y: ys[mid], label: 'LA' }
          if (sbr.role === 'TA1') tag = { x: sbr.distance[mid], y: ys[mid], label: '2× TA' }
          if (sbr.role === 'LO') tag = { x: sbr.distance[mid], y: ys[mid], label: 'LO' }
          if (sbr.role === 'TO1') tag = { x: sbr.distance[mid], y: ys[mid], label: '2× TO' }
        } else if (seg.index === 2 && (sbr.role === 'TA1' || sbr.role === 'TA2')) {
          const pos =
            sbr.role === 'TA1'
              ? Math.floor(sbr.distance.length * 0.28)
              : Math.floor(sbr.distance.length * 0.68)
          tag = { x: sbr.distance[pos], y: ys[pos], label: sbr.role === 'TA1' ? 'TA₁' : 'TA₂' }
        }

        out.push({
          id: sbr.id,
          x: sbr.distance,
          y: ys,
          quantity: meta.quantity,
          tone: meta.tone,
          style: isDegAxis ? 'solid' : meta.style,
          lineWidth: isDuplicateDeg ? 1.0 : sbr.role === 'LA' || sbr.role === 'LO' ? 2.3 : 1.9,
          selectable: !isDuplicateDeg,
          tag
        })
      }
    }
    return out
  }, [model.dispersion.segments, st.unit])

  // Marcatori numerici sui punti di riferimento di Tab. 1
  const markers = useMemo<readonly DispersionPoint[]>(() => {
    const useMev = st.unit === 'meV'
    const labels = model.dispersion.path.labels
    const dist = model.dispersion.path.distance
    const xDist = dist[labels[1].index]
    const g0Dist = dist[labels[0].index]

    if (st.crystalId === 'aluminum') {
      const yLA = useMev ? model.tab1.laAtXMev : model.tab1.laAtXThz
      const yTA = useMev ? model.tab1.taAtXMev : model.tab1.taAtXThz
      return [
        {
          x: xDist,
          y: yLA,
          quantity: 'omega',
          radius: 3.6,
          label: `${formatNumber(yLA, useMev ? 0 : 1)} ${st.unit}`
        },
        {
          x: xDist,
          y: yTA,
          quantity: 'omega',
          tone: 'acousticTransverse',
          radius: 3.6,
          label: `${formatNumber(yTA, useMev ? 0 : 1)} ${st.unit}`
        }
      ]
    }
    if (st.crystalId === 'diamond') {
      const yOpt = useMev ? (model.tab1.loAtGammaMev ?? 160) : (model.tab1.loAtGammaThz ?? 39)
      return [
        {
          x: g0Dist,
          y: yOpt,
          quantity: 'omegaOpt',
          radius: 3.8,
          label: `${formatNumber(yOpt, useMev ? 0 : 1)} ${st.unit}`
        }
      ]
    }
    // PbTe: LO e TO a Γ
    const yLO = useMev ? (model.tab1.loAtGammaMev ?? 13.7) : (model.tab1.loAtGammaThz ?? 3.3)
    const yTO = useMev ? (model.tab1.toAtGammaMev ?? 4.5) : (model.tab1.toAtGammaThz ?? 1.1)
    return [
      {
        x: g0Dist,
        y: yLO,
        quantity: 'omegaOpt',
        radius: 3.8,
        label: `LO ${formatNumber(yLO, 1)} ${st.unit}`
      },
      {
        x: g0Dist,
        y: yTO,
        quantity: 'omegaOpt',
        tone: 'opticalTransverse',
        radius: 3.8,
        label: `TO ${formatNumber(yTO, 1)} ${st.unit}`
      }
    ]
  }, [model.dispersion.path.labels, model.dispersion.path.distance, model.tab1, st.crystalId, st.unit])

  const dispersionLegend = useMemo<readonly LegendEntry[]>(() => {
    const entries: LegendEntry[] = [
      { id: 'la', keyKind: 'solid', color: 'var(--q-omega)', label: s.scene.legendLA },
      { id: 'ta', keyKind: 'solid', color: 'var(--tone-acoustic-transverse)', label: s.scene.legendTA }
    ]
    if (p === 2) {
      entries.push(
        { id: 'lo', keyKind: 'solid', color: 'var(--q-omegaOpt)', label: s.scene.legendLO },
        { id: 'to', keyKind: 'solid', color: 'var(--tone-optical-transverse)', label: s.scene.legendTO }
      )
    }
    return entries
  }, [p])

  const tools = (
    <>
      <ToolToggle
        pressed={st.unit === 'meV'}
        onToggle={st.toggleUnit}
        quantity="omega"
        title={s.tools.unitTitle}
      >
        {s.tools.unitLabel(st.unit)}
      </ToolToggle>
      <ToolToggle
        pressed={st.showCounting}
        onToggle={st.toggleCounting}
        quantity="k"
        title={s.tools.countingTitle}
      >
        {s.tools.counting}
      </ToolToggle>
      {st.showCounting && (
        <div className="phonon-3d-stepper-wrap">
          <Stepper
            label={s.tools.bvkNLabel}
            value={st.bvkN}
            min={NUMERICS.minBvkN}
            max={NUMERICS.maxBvkN}
            onChange={st.setBvkN}
            decreaseLabel={s.tools.bvkNDecrease}
            increaseLabel={s.tools.bvkNIncrease}
          />
        </div>
      )}
    </>
  )

  const sliderValues = st.transition === 'glide' ? shown : st.params

  const params = (
    <>
      <PresetMenu
        label={s.params.crystalLabel}
        freeLabel={s.params.crystalFree}
        options={CRYSTAL_OPTIONS}
        value={st.presetId}
        onSelect={onCrystalChange}
        note={s.params.crystalNote}
      />
      {PARAMS.filter((spec) => !spec.requiresOptical || p === 2).map((spec) => (
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
    </>
  )

  const sel = model.selection
  const degNote = sel.isTriplyDegenerate
    ? s.scene.noteDegenerate3
    : sel.isDoublyDegenerate
      ? s.scene.noteDegenerate2
      : sel.symmetry === '110'
        ? s.scene.noteSplit110
        : sel.symmetry === 'generic'
          ? s.scene.noteMixed
          : null

  const topHint = st.showCounting ? (
    <span className="num">
      <RichText text={s.scene.countingHint(st.bvkN, model.counting.primitiveCellsFcc, p)} />
    </span>
  ) : (
    <>
      <span className="num">
        {s.scene.stateHint(
          formatRoleUnicode(sel.mode.role),
          sel.segmentLabel,
          formatNumber(sel.mode.longitudinalFraction * 100, 0)
        )}
      </span>
      {degNote && (
        <span className="view-note" data-q={sel.mode.isOptical ? 'omegaOpt' : 'omega'}>
          {' · '}
          {degNote}
        </span>
      )}
    </>
  )

  const maxOmegaRadS = model.dispersion.maxFreqThz * 2 * Math.PI * 1e12

  const scene = (
    <>
      <SceneView
        tag={st.showCounting ? s.scene.countingTag : s.scene.view3dTag}
        hint={topHint}
      >
        {st.showCounting ? (
          <ModeCounting3DView
            counting={model.counting}
            grid2D={model.grid2D}
            highlight={st.highlight}
          />
        ) : (
          <Polarization3DView
            material={model.material}
            k={sel.k}
            kHat={sel.kHat}
            mode={sel.mode}
            symmetry={sel.symmetry}
            atGamma={sel.atGamma}
            maxOmegaRadS={maxOmegaRadS}
            pointIndex={sel.pointIndex}
            highlight={st.highlight}
            onQuickSelect={onQuickSelect}
          />
        )}
      </SceneView>
      <SceneView tag={s.scene.dispersionTag(st.unit)} hint={s.scene.dispersionHint}>
        <DispersionPlot
          key={`${st.crystalId}-${st.unit}`}
          mode="3d"
          branches={plotBranches}
          xRange={model.xRange}
          yRange={model.yRange}
          pathTicks={pathTicks}
          markers={markers}
          selection={{
            x: sel.distance,
            y: sel.plotY,
            branchId: sel.activeSegmentBranchId
          }}
          highlight={st.highlight}
          yAxisQuantity="omega"
          onPick={onPick}
          onNudge={onNudge}
          legend={dispersionLegend}
          legendAriaLabel={s.scene.legendDispersionAria}
          labels={{
            ariaLabel: s.scene.dispersionAria,
            yAxis: st.unit === 'meV' ? s.scene.yAxisMev : s.scene.yAxisThz
          }}
        />
      </SceneView>
    </>
  )

  const aside = (
    <>
      <Panel title={s.formula.title} className="formula-panel phonon-3d-formula-panel">
        <LiveFormula
          tex={MAIN_FORMULA}
          highlight={st.highlight}
          onHighlight={setHighlight}
          pulse={st.pulse}
          ariaLabel={s.formula.aria}
          className="formula-main"
        />
        <div className="formula-defs">
          {SECULAR_FORMULAS.map((tex) => (
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
        <div className="formula-defs formula-edge">
          {branchCountFormulas(p).map((tex) => (
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
        {st.showCounting && (
          <div className="formula-defs formula-edge">
            {BVK_3D_FORMULAS.map((tex) => (
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
        )}
        <Values model={model} st={st} onHighlight={setHighlight} />
      </Panel>
      <Panel title={s.theory.title} className="theory">
        <div
          onPointerOver={(e) => hoverQuantity(e, setHighlight)}
          onPointerLeave={() => setHighlight(null)}
        >
          {s.theory.blocks.map((block) => (
            <div key={block.heading}>
              <h3>
                <RichText text={block.heading} />
              </h3>
              {block.paragraphs.map((para, i) => (
                <p key={i}>
                  <RichText text={para} />
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
                {block.paragraphs.map((para, i) => (
                  <p key={i}>
                    <RichText text={para} />
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

/** Applica il fattore geometrico e^{i k·τ₂} al vettore di spostamento del secondo atomo per mostrare la fase reale di cella. */
function cellPeriodicU2(
  uRe: KVector,
  uIm: KVector,
  k: KVector,
  tau2: KVector | null
): KVector {
  if (!tau2) return uRe
  const phi = k[0] * tau2[0] + k[1] * tau2[1] + k[2] * tau2[2]
  const c = Math.cos(phi)
  const sn = Math.sin(phi)
  return [
    uRe[0] * c - uIm[0] * sn,
    uRe[1] * c - uIm[1] * sn,
    uRe[2] * c - uIm[2] * sn
  ]
}

function Values({
  model,
  st,
  onHighlight
}: {
  model: Phonon3DModel
  st: Phonon3DState
  onHighlight: (q: QuantityId | null) => void
}): JSX.Element {
  const v = s.values
  const mat = model.material
  const sel = model.selection
  const mode = sel.mode
  const branchQ: QuantityId = mode.isOptical ? 'omegaOpt' : 'omega'
  const u1 = mode.displacementVectors[0]
  const tau2 = crystalBasisTau2(mat.id)
  const u2 =
    mat.basisCount === 2
      ? cellPeriodicU2(
          mode.displacementVectors[1],
          mode.displacementVectorsIm[1],
          sel.k,
          tau2
        )
      : null

  const hasOpt = mat.basisCount === 2
  const symNote =
    sel.symmetry === '100'
      ? v.sym100Note(hasOpt)
      : sel.symmetry === '111'
        ? v.sym111Note(hasOpt)
        : sel.symmetry === '110'
          ? v.sym110Note
          : v.symGenericNote

  const polKind =
    mode.longitudinalFraction > 0.98
      ? v.polarPureL
      : mode.longitudinalFraction < 0.02
        ? v.polarPureT
        : v.polarMixed(sel.symmetry)

  const hasSplit = Math.abs(model.tab1.loToSplitThz ?? 0) > 1e-3

  return (
    <dl
      className="values"
      onPointerOver={(e) => hoverQuantity(e, onHighlight)}
      onPointerLeave={() => onHighlight(null)}
    >
      <dt>{v.crystal}</dt>
      <dd>
        <span className="nowrap">
          <Tex tex="p" /> = {mat.basisCount}
        </span>
        {' · '}
        <span className="nowrap">
          <Tex tex="\htmlData{q=a}{a}" /> = {formatNumber(mat.a, 2)}
          {'\u00A0Å'}
        </span>
        {' · '}
        <span className="nowrap">
          <Tex tex="v_c = \htmlData{q=a}{a}^3/4" /> ={' '}
          {formatNumber(model.counting.primitiveCellVolumeFccAng3, 1)}
          {'\u00A0Å³'}
        </span>
        <span className="sub note">
          {mat.basisCount === 1 ? v.branchesP1 : v.branchesP2}
        </span>
      </dd>

      <dt>{v.state}</dt>
      <dd>
        <span className="nowrap">
          <Tex tex="\htmlData{q=k}{\mathbf{k}}" /> = ({formatNumber(sel.kDimless[0], 2)};{' '}
          {formatNumber(sel.kDimless[1], 2)}; {formatNumber(sel.kDimless[2], 2)})
          {'\u00A02π/a'}
        </span>
        <br />
        <span className="nowrap">
          <Tex tex={`\\htmlData{q=${branchQ}}{${formatRoleTex(mode.role)}}`} />:{' '}
          <Num value={mode.energyMev} digits={1} width={4} />
          {'\u00A0meV'}
        </span>
        {' · '}
        <span className="nowrap">
          <Num value={mode.freqThz} digits={2} width={4} />
          {'\u00A0THz'}
        </span>
      </dd>

      <dt>{v.polarization}</dt>
      <dd>
        <RichText text={polKind} />
        <br />
        <span className="sub nowrap">
          <Tex tex="\htmlData{q=u}{\mathbf{u}_1}" /> = ({formatNumber(u1[0], 2)};{' '}
          {formatNumber(u1[1], 2)}; {formatNumber(u1[2], 2)})
        </span>
        {u2 && (
          <>
            {' · '}
            <span className="sub nowrap">
              <Tex tex="\htmlData{q=u}{\mathbf{u}_2}" /> = ({formatNumber(u2[0], 2)};{' '}
              {formatNumber(u2[1], 2)}; {formatNumber(u2[2], 2)})
            </span>
          </>
        )}
        <br />
        <span className="sub nowrap">
          <Tex
            tex={
              mat.basisCount === 2
                ? '\\sum_\\alpha |\\hat{\\mathbf{k}}\\cdot\\boldsymbol{\\varepsilon}_\\alpha|^2'
                : '|\\hat{\\mathbf{k}}\\cdot\\boldsymbol{\\varepsilon}|^2'
            }
          />{' '}
          = {formatNumber(mode.longitudinalFraction * 100, 0)}%
        </span>
        <span className="sub note">
          <RichText text={symNote} />
        </span>
      </dd>

      <dt>{st.presetId === null ? v.tab1Model : v.tab1Ref}</dt>
      <dd>
        {st.crystalId === 'aluminum' ? (
          <>
            <span className="nowrap">
              <Tex tex="\htmlData{q=omega}{\text{LA}}(X)" /> ={' '}
              <Num value={model.tab1.laAtXMev} digits={1} width={4} />
              {'\u00A0meV'}
            </span>{' '}
            <span className="sub nowrap">
              ({formatNumber(model.tab1.laAtXThz, 1)}
              {'\u00A0THz)'}
            </span>
            <br />
            <span className="nowrap">
              <Tex tex="\htmlData{q=omega}{\text{TA}_{1,2}}(X)" /> ={' '}
              <Num value={model.tab1.taAtXMev} digits={1} width={4} />
              {'\u00A0meV'}
            </span>{' '}
            <span className="sub nowrap">
              ({formatNumber(model.tab1.taAtXThz, 1)}
              {'\u00A0THz)'}
            </span>
          </>
        ) : st.crystalId === 'diamond' ? (
          <>
            <span className="nowrap">
              <Tex tex="\htmlData{q=omegaOpt}{\text{LO}}(\Gamma)" /> ={' '}
              <Num value={model.tab1.loAtGammaMev ?? 0} digits={1} width={5} />
              {'\u00A0meV'}
            </span>{' '}
            <span className="sub nowrap">
              ({formatNumber(model.tab1.loAtGammaThz ?? 0, 1)}
              {'\u00A0THz)'}
            </span>
            <br />
            <span className="nowrap">
              <Tex tex="\htmlData{q=omegaOpt}{\text{TO}_{1,2}}(\Gamma)" /> ={' '}
              <Num value={model.tab1.toAtGammaMev ?? 0} digits={1} width={5} />
              {'\u00A0meV'}
            </span>
            <span className="sub note">
              <RichText text={hasSplit ? v.diamondSliderSplit : v.diamondNoSplit} />
            </span>
          </>
        ) : (
          <>
            <span className="nowrap">
              <Tex tex="\htmlData{q=omegaOpt}{\text{LO}}(\Gamma)" /> ={' '}
              <Num value={model.tab1.loAtGammaThz ?? 0} digits={2} width={4} />
              {'\u00A0THz'}
            </span>{' '}
            <span className="sub nowrap">
              ({formatNumber(model.tab1.loAtGammaMev ?? 0, 1)}
              {'\u00A0meV)'}
            </span>
            <br />
            <span className="nowrap">
              <Tex tex="\htmlData{q=omegaOpt}{\text{TO}_{1,2}}(\Gamma)" /> ={' '}
              <Num value={model.tab1.toAtGammaThz ?? 0} digits={2} width={4} />
              {'\u00A0THz'}
            </span>{' '}
            <span className="sub nowrap">
              ({formatNumber(model.tab1.toAtGammaMev ?? 0, 1)}
              {'\u00A0meV)'}
            </span>
            <span className="sub note">
              <RichText text={hasSplit ? v.pbteSplitNote : v.pbteZeroSplitNote} />
            </span>
          </>
        )}
      </dd>

      {st.showCounting && (
        <>
          <dt>
            <RichText text={v.counting} />
          </dt>
          <dd>
            <span className="nowrap">
              <Tex tex="N_c = 4N^3" /> = {model.counting.primitiveCellsFcc.toLocaleString('it-IT')}
            </span>
            {' · '}
            <span className="nowrap">
              <Tex tex="3pN_c" /> = {model.counting.totalModesFcc.toLocaleString('it-IT')}
            </span>
            <span className="sub note">
              <RichText
                text={`Cubo $L = ${st.bvkN}a$: $\\Delta k = 2\\pi/L = ${formatNumber(model.counting.deltaKAngInv, 3)}\\,\\text{Å}^{-1}$; 2D Fig. 17: $N^2 = ${model.counting.grid2DPoints}$ punti.`}
              />
            </span>
          </dd>

          <dt>{v.alMacro}</dt>
          <dd>
            <span className="nowrap">
              <Tex tex="N_c" /> ≈ {formatNumber(model.alEstimate.primitiveCells / 1e22, 1)}·10²²
            </span>
            {' · '}
            <span className="nowrap">
              <Tex tex="3N_c" /> ≈ {formatNumber(model.alEstimate.totalModes / 1e23, 1)}·10²³
            </span>
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
