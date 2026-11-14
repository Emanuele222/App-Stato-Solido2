import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// Costanti fisiche dalla dispensa / progetto.md e CODATA 2018/2022 SI
export const HBAR2_OVER_2M0 = 3.80998; // eV * A^2 (valore di progetto.md / AGENTS.md)
export const HBAR_SI = 1.054571817e-34; // J * s
export const E_CHARGE_SI = 1.602176634e-19; // C
export const M0_SI = 9.1093837015e-31; // kg
export const ANGSTROM_TO_M = 1e-10;
// Fattore per v = (1/hbar) * (dE/dk) con dE/dk in eV*A -> m/s
export const EV_ANGSTROM_OVER_HBAR_TO_MS = (E_CHARGE_SI * ANGSTROM_TO_M) / HBAR_SI;

/**
 * Diagonalizzazione di una matrice reale simmetrica N x N con algoritmo di Jacobi.
 * Restituisce { eigenvalues, eigenvectors } ordinati per autovalore crescente.
 * eigenvectors[b][i] è la componente i-esima dell'autovettore b-esimo.
 */
export function jacobiSymmetricEigen(matrix, tol = 1e-15, maxSweeps = 150) {
  const n = matrix.length;
  const A = matrix.map((row) => Float64Array.from(row));
  const V = Array.from({ length: n }, (_, i) => {
    const row = new Float64Array(n);
    row[i] = 1.0;
    return row;
  });

  let scale = 0;
  for (let i = 0; i < n; i++) {
    for (let j = i; j < n; j++) {
      scale = Math.max(scale, Math.abs(A[i][j]));
    }
  }
  const absTol = tol * Math.max(scale, 1);

  for (let sweep = 0; sweep < maxSweeps; sweep++) {
    let maxOffDiag = 0;
    for (let p = 0; p < n; p++) {
      for (let q = p + 1; q < n; q++) {
        const absVal = Math.abs(A[p][q]);
        if (absVal > maxOffDiag) maxOffDiag = absVal;
      }
    }
    if (maxOffDiag <= absTol) break;

    for (let p = 0; p < n; p++) {
      for (let q = p + 1; q < n; q++) {
        const apq = A[p][q];
        if (Math.abs(apq) <= absTol * 0.1) continue;

        const app = A[p][p];
        const aqq = A[q][q];
        const tau = (aqq - app) / (2.0 * apq);
        const t =
          tau >= 0
            ? 1.0 / (tau + Math.sqrt(1.0 + tau * tau))
            : -1.0 / (-tau + Math.sqrt(1.0 + tau * tau));
        const c = 1.0 / Math.sqrt(1.0 + t * t);
        const s = t * c;

        A[p][p] = app - t * apq;
        A[q][q] = aqq + t * apq;
        A[p][q] = 0.0;
        A[q][p] = 0.0;

        for (let r = 0; r < n; r++) {
          if (r === p || r === q) continue;
          const arp = A[r][p];
          const arq = A[r][q];
          const nrp = c * arp - s * arq;
          const nrq = s * arp + c * arq;
          A[r][p] = nrp;
          A[p][r] = nrp;
          A[r][q] = nrq;
          A[q][r] = nrq;
        }

        for (let r = 0; r < n; r++) {
          const vrp = V[r][p];
          const vrq = V[r][q];
          V[r][p] = c * vrp - s * vrq;
          V[r][q] = s * vrp + c * vrq;
        }
      }
    }
  }

  const indices = Array.from({ length: n }, (_, i) => i);
  indices.sort((i, j) => A[i][i] - A[j][j]);

  const eigenvalues = indices.map((idx) => A[idx][idx]);
  const eigenvectors = indices.map((idx) => {
    const vec = new Array(n);
    for (let r = 0; r < n; r++) vec[r] = V[r][idx];
    return vec;
  });

  // Verifica residuo massimo ||H v - lambda v||_inf
  let maxResidual = 0;
  for (let b = 0; b < n; b++) {
    const lambda = eigenvalues[b];
    const v = eigenvectors[b];
    for (let i = 0; i < n; i++) {
      let hv = 0;
      for (let j = 0; j < n; j++) hv += matrix[i][j] * v[j];
      const err = Math.abs(hv - lambda * v[i]);
      if (err > maxResidual) maxResidual = err;
    }
  }

  return { eigenvalues, eigenvectors, maxResidual };
}

/**
 * Costruisce e risolve l'equazione centrale 1D al vettore d'onda k (in 1/A).
 * V(x) = sum_G V_G e^{i G x}, con V_0 = v0, V_{+/- 2pi/a} = vG, V_{+/- 4pi/a} = v2G.
 */
export function solveCentral1D({
  a,
  k,
  vG = 0,
  v2G = 0,
  v0 = 0,
  nPW = 15,
  hbar2Over2m0 = HBAR2_OVER_2M0,
}) {
  if (nPW % 2 !== 1) throw new Error('nPW deve essere dispari');
  const half = (nPW - 1) / 2;
  const gUnit = (2 * Math.PI) / a;
  const gIndices = Array.from({ length: nPW }, (_, i) => i - half);

  const H = Array.from({ length: nPW }, () => new Array(nPW).fill(0));
  for (let i = 0; i < nPW; i++) {
    const ni = gIndices[i];
    const kg = k + ni * gUnit;
    H[i][i] = hbar2Over2m0 * kg * kg + v0;
    for (let j = i + 1; j < nPW; j++) {
      const diff = Math.abs(ni - gIndices[j]);
      let val = 0;
      if (diff === 1) val = vG;
      else if (diff === 2) val = v2G;
      H[i][j] = val;
      H[j][i] = val;
    }
  }

  const { eigenvalues, eigenvectors, maxResidual } = jacobiSymmetricEigen(H);
  return { eigenvalues, eigenvectors, gIndices, gUnit, maxResidual };
}

/**
 * Calcola |psi(x)|^2 normalizzata a media 1 sulla cella [0, a].
 * Poiché sum_G |c_G|^2 = 1, (1/a) int_0^a |psi(x)|^2 dx = 1 automaticamente.
 */
export function probabilityDensity(eigenvector, gIndices, a, k, x) {
  const gUnit = (2 * Math.PI) / a;
  let re = 0;
  let im = 0;
  for (let i = 0; i < eigenvector.length; i++) {
    const phase = (k + gIndices[i] * gUnit) * x;
    const c = eigenvector[i];
    re += c * Math.cos(phase);
    im += c * Math.sin(phase);
  }
  return re * re + im * im;
}

/**
 * Velocità v = (1/hbar) dE/dk in m/s via differenze finite centrate e Hellmann-Feynman.
 */
export function velocityAtK(params, bandIndex, dk = 1e-5) {
  const resPlus = solveCentral1D({ ...params, k: params.k + dk });
  const resMinus = solveCentral1D({ ...params, k: params.k - dk });
  const dEdkFD = (resPlus.eigenvalues[bandIndex] - resMinus.eigenvalues[bandIndex]) / (2 * dk);

  const res0 = solveCentral1D(params);
  const c = res0.eigenvectors[bandIndex];
  const hbar2Over2m0 = params.hbar2Over2m0 ?? HBAR2_OVER_2M0;
  let dEdkHF = 0;
  for (let i = 0; i < c.length; i++) {
    const kg = params.k + res0.gIndices[i] * res0.gUnit;
    dEdkHF += c[i] * c[i] * 2 * hbar2Over2m0 * kg;
  }

  return {
    dEdk_eVA_FD: dEdkFD,
    dEdk_eVA_HF: dEdkHF,
    v_ms_FD: dEdkFD * EV_ANGSTROM_OVER_HBAR_TO_MS,
    v_ms_HF: dEdkHF * EV_ANGSTROM_OVER_HBAR_TO_MS,
  };
}

/**
 * Rapporto m0 / m* = (m0 / hbar^2) * d^2E/dk^2 = (1 / (2 * hbar2Over2m0)) * d^2E/dk^2
 * Calcolato sia con differenze finite centrate a 5 punti sia con somma perturbativa k.p.
 */
export function effectiveMassRatioAtK(params, bandIndex, dk = 1e-4) {
  const hbar2Over2m0 = params.hbar2Over2m0 ?? HBAR2_OVER_2M0;
  const e0 = solveCentral1D(params).eigenvalues[bandIndex];
  const ep1 = solveCentral1D({ ...params, k: params.k + dk }).eigenvalues[bandIndex];
  const em1 = solveCentral1D({ ...params, k: params.k - dk }).eigenvalues[bandIndex];
  const ep2 = solveCentral1D({ ...params, k: params.k + 2 * dk }).eigenvalues[bandIndex];
  const em2 = solveCentral1D({ ...params, k: params.k - 2 * dk }).eigenvalues[bandIndex];

  // Stencil 3 punti e 5 punti
  const d2_3pt = (ep1 - 2 * e0 + em1) / (dk * dk);
  const d2_5pt = (-ep2 + 16 * ep1 - 30 * e0 + 16 * em1 - em2) / (12 * dk * dk);

  const m0OverM_FD3 = d2_3pt / (2 * hbar2Over2m0);
  const m0OverM_FD5 = d2_5pt / (2 * hbar2Over2m0);

  // Somma k.p al secondo ordine sulle altre bande dello stesso k
  const res0 = solveCentral1D(params);
  const eb = res0.eigenvalues[bandIndex];
  const cb = res0.eigenvectors[bandIndex];
  let kpSum = 0;
  for (let b2 = 0; b2 < res0.eigenvalues.length; b2++) {
    if (b2 === bandIndex) continue;
    const dE = eb - res0.eigenvalues[b2];
    if (Math.abs(dE) < 1e-12) continue;
    const cb2 = res0.eigenvectors[b2];
    let pMat = 0;
    for (let i = 0; i < cb.length; i++) {
      const kg = params.k + res0.gIndices[i] * res0.gUnit;
      pMat += cb[i] * cb2[i] * kg;
    }
    kpSum += (pMat * pMat) / dE;
  }
  const m0OverM_kp = 1 + 4 * hbar2Over2m0 * kpSum;

  return {
    m0OverM_FD3,
    m0OverM_FD5,
    m0OverM_kp,
    mStarOverM0_kp: 1 / m0OverM_kp,
  };
}

/**
 * Calcola livello di Fermi e classificazione metallo/isolante in 1D
 * per nElectronsPerCell elettroni per cella primitiva.
 */
export function computeFermi1D({ a, vG, v2G = 0, nPW = 41, nElectronsPerCell, nK = 1000 }) {
  // Campiono la metà positiva della zona [0, pi/a] (simmetria E(-k) = E(k)).
  // Con la regola del punto medio k_j = (j + 0.5) * (pi/a) / nK,
  // ogni punto k in [0, pi/a] (che rappresenta +-k in [-pi/a, pi/a]) porta 2 / nK elettroni.
  const kMax = Math.PI / a;
  const numBandsKeep = Math.min(nPW, Math.ceil(nElectronsPerCell / 2) + 4);
  const allEnergies = [];
  const bandMin = new Array(numBandsKeep).fill(Infinity);
  const bandMax = new Array(numBandsKeep).fill(-Infinity);

  for (let j = 0; j < nK; j++) {
    const k = ((j + 0.5) * kMax) / nK;
    const { eigenvalues } = solveCentral1D({ a, k, vG, v2G, nPW });
    for (let b = 0; b < numBandsKeep; b++) {
      const e = eigenvalues[b];
      allEnergies.push(e);
      if (e < bandMin[b]) bandMin[b] = e;
      if (e > bandMax[b]) bandMax[b] = e;
    }
  }

  allEnergies.sort((x, y) => x - y);
  const electronsPerState = 2 / nK;
  const exactIndex = nElectronsPerCell / electronsPerState; // numero di stati k occupati

  // Controllo di riempimento intero (nElectronsPerCell pari) vs parziale
  const isEven = nElectronsPerCell % 2 === 0;
  let classification;
  let fermiEnergy;
  let gap = null;
  let vbm = null;
  let cbm = null;

  if (isEven) {
    const fullBands = nElectronsPerCell / 2;
    // Calcolo esatto ai punti critici (k=0 e k=pi/a) per trovare VBM e CBM delle bande fullBands-1 e fullBands
    const resGamma = solveCentral1D({ a, k: 0, vG, v2G, nPW });
    const resEdge = solveCentral1D({ a, k: Math.PI / a, vG, v2G, nPW });
    const topValence = Math.max(
      bandMax[fullBands - 1],
      resGamma.eigenvalues[fullBands - 1],
      resEdge.eigenvalues[fullBands - 1]
    );
    const botConduction = Math.min(
      bandMin[fullBands],
      resGamma.eigenvalues[fullBands],
      resEdge.eigenvalues[fullBands]
    );
    gap = botConduction - topValence;
    vbm = topValence;
    cbm = botConduction;
    if (gap > 1e-6) {
      classification = 'isolante';
      fermiEnergy = 0.5 * (topValence + botConduction);
    } else {
      classification = 'metallo';
      fermiEnergy = 0.5 * (topValence + botConduction);
    }
  } else {
    classification = 'metallo';
    // Per elettroni dispari in 1D con bande ordinate e monotone, k_F è esatto:
    // n = 1 -> metà banda 1 (k_F = pi/(2a))
    // n = 3 -> banda 1 piena + metà banda 2 (k_F = pi/(2a), perché la metà bassa della banda 2 è pi/(2a) <= k <= pi/a)
    const bandIdx = Math.floor(nElectronsPerCell / 2); // 0 per n=1, 1 per n=3
    const frac = (nElectronsPerCell % 2) / 2; // 0.5
    // Se banda crescente (indice pari: 0, 2, ...): occupati [0, frac * pi/a] -> k_F = frac * pi/a
    // Se banda decrescente (indice dispari: 1, 3, ...): occupati [(1-frac)*pi/a, pi/a] -> k_F = (1-frac)*pi/a
    // Per frac = 0.5 entrambi danno k_F = pi/(2a)!
    const kF = bandIdx % 2 === 0 ? frac * kMax : (1 - frac) * kMax;
    fermiEnergy = solveCentral1D({ a, k: kF, vG, v2G, nPW }).eigenvalues[bandIdx];
    const gridIdx = Math.round(exactIndex);
    const gridEf = 0.5 * (allEnergies[gridIdx - 1] + allEnergies[gridIdx]);
    gap = 0;
    return {
      nElectronsPerCell,
      classification,
      fermiEnergy_exact_kF: fermiEnergy,
      fermiEnergy_grid: gridEf,
      kF_in_pi_over_a: kF / kMax,
      gap,
    };
  }

  return {
    nElectronsPerCell,
    classification,
    fermiEnergy,
    vbm,
    cbm,
    gap,
  };
}

function main() {
  const a = 3.0; // Angstrom
  const vG = -0.5; // eV
  const E0 = HBAR2_OVER_2M0 * Math.pow(Math.PI / a, 2);

  // 1. Prime quattro bande in k = 0, pi/(2a), pi/a con 15 e 41 onde piane
  const kPoints = {
    '0': 0,
    'pi_over_2a': Math.PI / (2 * a),
    'pi_over_a': Math.PI / a,
  };

  const bands_15pw = {};
  const bands_41pw = {};
  for (const [label, k] of Object.entries(kPoints)) {
    const r15 = solveCentral1D({ a, k, vG, v2G: 0, nPW: 15 });
    const r41 = solveCentral1D({ a, k, vG, v2G: 0, nPW: 41 });
    bands_15pw[label] = {
      bands_1_to_4_eV: r15.eigenvalues.slice(0, 4),
      maxResidual: r15.maxResidual,
    };
    bands_41pw[label] = {
      bands_1_to_4_eV: r41.eigenvalues.slice(0, 4),
      maxResidual: r41.maxResidual,
    };
  }

  // 2. Gap in pi/a confrontato con 2|V_G|
  const edge15 = bands_15pw['pi_over_a'].bands_1_to_4_eV;
  const edge41 = bands_41pw['pi_over_a'].bands_1_to_4_eV;
  const gapEdge15 = edge15[1] - edge15[0];
  const gapEdge41 = edge41[1] - edge41[0];
  const gapAnalytical2Band = 2 * Math.abs(vG);

  // 3. m0/m* al bordo di zona per banda superiore (bandIdx=1) e inferiore (bandIdx=0)
  const effMassUpper41 = effectiveMassRatioAtK(
    { a, k: Math.PI / a, vG, v2G: 0, nPW: 41 },
    1
  );
  const effMassLower41 = effectiveMassRatioAtK(
    { a, k: Math.PI / a, vG, v2G: 0, nPW: 41 },
    0
  );
  const effMassUpper15 = effectiveMassRatioAtK(
    { a, k: Math.PI / a, vG, v2G: 0, nPW: 15 },
    1
  );
  const effMassLower15 = effectiveMassRatioAtK(
    { a, k: Math.PI / a, vG, v2G: 0, nPW: 15 },
    0
  );
  const effMass2BandUpper = 1 + (2 * E0) / Math.abs(vG);
  const effMass2BandLower = 1 - (2 * E0) / Math.abs(vG);

  // 4. |psi|^2 in x=0 e x=a/2 per le due bande al bordo, normalizzata a media 1, con V_G < 0 e V_G > 0
  function computeBorderDensities(vGSign, nPW) {
    const k = Math.PI / a;
    const res = solveCentral1D({ a, k, vG: vGSign, v2G: 0, nPW });
    const psi2 = (bandIdx, x) =>
      probabilityDensity(res.eigenvectors[bandIdx], res.gIndices, a, k, x);

    // Verifica numerica della media sulla cella [0, a] (regola dei trapezi / punti medi)
    const nGrid = 1000;
    let meanLower = 0;
    let meanUpper = 0;
    for (let j = 0; j < nGrid; j++) {
      const x = ((j + 0.5) * a) / nGrid;
      meanLower += psi2(0, x);
      meanUpper += psi2(1, x);
    }
    meanLower /= nGrid;
    meanUpper /= nGrid;

    return {
      vG: vGSign,
      nPW,
      band1_lower: {
        E_eV: res.eigenvalues[0],
        psi2_at_0: psi2(0, 0),
        psi2_at_a_over_2: psi2(0, a / 2),
        mean_over_cell: meanLower,
      },
      band2_upper: {
        E_eV: res.eigenvalues[1],
        psi2_at_0: psi2(1, 0),
        psi2_at_a_over_2: psi2(1, a / 2),
        mean_over_cell: meanUpper,
      },
    };
  }

  const densities = {
    vG_neg_41pw: computeBorderDensities(-0.5, 41),
    vG_pos_41pw: computeBorderDensities(+0.5, 41),
    vG_neg_15pw: computeBorderDensities(-0.5, 15),
    vG_pos_15pw: computeBorderDensities(+0.5, 15),
  };

  // 5. Velocità v = (1/hbar) dE/dk in m/s al bordo di zona e, per elettrone libero, in k = 1 A^-1
  const velEdgeLower = velocityAtK({ a, k: Math.PI / a, vG, v2G: 0, nPW: 41 }, 0);
  const velEdgeUpper = velocityAtK({ a, k: Math.PI / a, vG, v2G: 0, nPW: 41 }, 1);
  const velFreeAt1 = velocityAtK({ a, k: 1.0, vG: 0, v2G: 0, nPW: 41 }, 0);
  const velFreeAnalytical =
    2 * HBAR2_OVER_2M0 * 1.0 * EV_ANGSTROM_OVER_HBAR_TO_MS;

  // 6. Livello di Fermi e classificazione metallo/isolante per 1, 2, 3, 4 elettroni per cella
  const fermiLevels = {};
  for (const nEl of [1, 2, 3, 4]) {
    fermiLevels[`n_${nEl}`] = computeFermi1D({
      a,
      vG,
      v2G: 0,
      nPW: 41,
      nElectronsPerCell: nEl,
      nK: 2000,
    });
  }

  // 7. Due armoniche: V_G = 0.45 * E0, V_2G = 0.3 * E0
  const vG_two = 0.45 * E0;
  const v2G_two = 0.3 * E0;
  const twoHarm_edge_15 = solveCentral1D({
    a,
    k: Math.PI / a,
    vG: vG_two,
    v2G: v2G_two,
    nPW: 15,
  }).eigenvalues;
  const twoHarm_gamma_15 = solveCentral1D({
    a,
    k: 0,
    vG: vG_two,
    v2G: v2G_two,
    nPW: 15,
  }).eigenvalues;
  const twoHarm_edge_41 = solveCentral1D({
    a,
    k: Math.PI / a,
    vG: vG_two,
    v2G: v2G_two,
    nPW: 41,
  }).eigenvalues;
  const twoHarm_gamma_41 = solveCentral1D({
    a,
    k: 0,
    vG: vG_two,
    v2G: v2G_two,
    nPW: 41,
  }).eigenvalues;

  const twoHarmonics = {
    E0_eV: E0,
    vG_eV: vG_two,
    v2G_eV: v2G_two,
    nPW_15: {
      gap_at_pi_over_a_eV: twoHarm_edge_15[1] - twoHarm_edge_15[0],
      gap_at_pi_over_a_over_E0: (twoHarm_edge_15[1] - twoHarm_edge_15[0]) / E0,
      gap_at_k0_bands_2_3_eV: twoHarm_gamma_15[2] - twoHarm_gamma_15[1],
      gap_at_k0_bands_2_3_over_E0: (twoHarm_gamma_15[2] - twoHarm_gamma_15[1]) / E0,
      bands_edge_eV: twoHarm_edge_15.slice(0, 4),
      bands_gamma_eV: twoHarm_gamma_15.slice(0, 4),
    },
    nPW_41: {
      gap_at_pi_over_a_eV: twoHarm_edge_41[1] - twoHarm_edge_41[0],
      gap_at_pi_over_a_over_E0: (twoHarm_edge_41[1] - twoHarm_edge_41[0]) / E0,
      gap_at_k0_bands_2_3_eV: twoHarm_gamma_41[2] - twoHarm_gamma_41[1],
      gap_at_k0_bands_2_3_over_E0: (twoHarm_gamma_41[2] - twoHarm_gamma_41[1]) / E0,
      bands_edge_eV: twoHarm_edge_41.slice(0, 4),
      bands_gamma_eV: twoHarm_gamma_41.slice(0, 4),
    },
  };

  // 8. Esempi numerici svolti nel §11 della dispensa
  // 8a. Approfondimento §11.2: hbar^2/m0 = 1 -> hbar^2/2m0 = 0.5, a = 1, V_G = -0.3
  const res11_2_2pw = {
    E0: 0.5 * Math.PI * Math.PI,
    E_minus: 0.5 * Math.PI * Math.PI - 0.3,
    E_plus: 0.5 * Math.PI * Math.PI + 0.3,
    gap: 0.6,
  };
  const res11_2_15pw_full = solveCentral1D({
    a: 1.0,
    k: Math.PI,
    vG: -0.3,
    v2G: 0,
    nPW: 15,
    hbar2Over2m0: 0.5,
  }).eigenvalues;

  // 8b. §11.3 "Lontano dal bordo": |V_G| = 0.1 E0, k = pi/(2a)
  const vG_11_3 = -0.1 * E0;
  const k_half = Math.PI / (2 * a);
  const Ek_half = HBAR2_OVER_2M0 * k_half * k_half; // 0.25 E0
  const Ekp_half = HBAR2_OVER_2M0 * Math.pow(k_half - (2 * Math.PI) / a, 2); // 2.25 E0
  const shift_2ndOrder_over_E0 = Math.pow(0.1, 2) / (0.25 - 2.25); // -0.005
  const exact_half_2band =
    0.5 * (Ek_half + Ekp_half) -
    Math.sqrt(0.25 * Math.pow(Ekp_half - Ek_half, 2) + vG_11_3 * vG_11_3);
  const exact_half_15pw = solveCentral1D({
    a,
    k: k_half,
    vG: vG_11_3,
    v2G: 0,
    nPW: 15,
  }).eigenvalues[0];

  // 8c. §11.3 Fig. qf_bordo (Kittel fig. 9): |V_G| = 0.45, G = 2 (a = pi), hbar^2/m0 = 1 (hbar2Over2m0 = 0.5)
  const kittelRes15 = solveCentral1D({
    a: Math.PI,
    k: 1.0, // pi / a = 1
    vG: -0.45,
    v2G: 0,
    nPW: 15,
    hbar2Over2m0: 0.5,
  }).eigenvalues;

  // 8d. §11.4 Dalla scatola all'atomo, alla molecola, al metallo
  function boxLevels(L, hbar2Over2m) {
    const E1 = hbar2Over2m * Math.pow(Math.PI / L, 2);
    return {
      L_A: L,
      hbar2Over2m,
      E1_eV: E1,
      E2_eV: 4 * E1,
      E3_eV: 9 * E1,
      excitation_E2_minus_E1_eV: 3 * E1,
      excitation_E3_minus_E2_eV: 5 * E1,
    };
  }
  const N_metal = 1e7; // L = 3 mm = 3e7 A, a = 3 A
  const L_metal = 3e7;
  const E1_metal_38 = 3.8 * Math.pow(Math.PI / L_metal, 2);
  const E1_metal_exact = HBAR2_OVER_2M0 * Math.pow(Math.PI / L_metal, 2);
  const kF_metal = (N_metal * Math.PI) / L_metal; // pi / a
  const EF_metal_38 = 3.8 * kF_metal * kF_metal;
  const EF_metal_exact = HBAR2_OVER_2M0 * kF_metal * kF_metal;

  const dispensaExamples = {
    sec11_2_two_wave_truncation: {
      two_band: res11_2_2pw,
      nPW_15: {
        E_minus: res11_2_15pw_full[0],
        E_plus: res11_2_15pw_full[1],
        gap: res11_2_15pw_full[1] - res11_2_15pw_full[0],
        border_shift_approx: -(0.3 * 0.3) / (8 * res11_2_2pw.E0),
        border_shift_exact: res11_2_15pw_full[0] - res11_2_2pw.E_minus,
      },
      dispensa_ref: { E_minus: 4.6325, E_plus: 5.2325, gap: 0.59997 },
    },
    sec11_3_far_from_edge: {
      shift_2nd_order_over_E0: shift_2ndOrder_over_E0,
      shift_2band_exact_over_E0: (exact_half_2band - Ek_half) / E0,
      shift_15pw_over_E0: (exact_half_15pw - Ek_half) / E0,
    },
    sec11_3_kittel_fig9: {
      E_minus: kittelRes15[0],
      E_plus: kittelRes15[1],
      gap: kittelRes15[1] - kittelRes15[0],
      two_band_E0: 0.5,
      two_band_gap: 0.9,
    },
    sec11_4_box_to_metal: {
      atom_3A_dispensa_3_8: boxLevels(3.0, 3.8),
      atom_3A_exact_3_80998: boxLevels(3.0, HBAR2_OVER_2M0),
      molecule_15A_dispensa_3_8: boxLevels(15.0, 3.8),
      molecule_15A_exact_3_80998: boxLevels(15.0, HBAR2_OVER_2M0),
      metal_3mm_dispensa_3_8: {
        N_atoms: N_metal,
        N_electrons: 2 * N_metal,
        E1_eV: E1_metal_38,
        E2_eV: 4 * E1_metal_38,
        E3_eV: 9 * E1_metal_38,
        kF_invA: kF_metal,
        EF_eV: EF_metal_38,
        deltaE_at_EF_eV: 2 * N_metal * E1_metal_38,
      },
      metal_3mm_exact_3_80998: {
        E1_eV: E1_metal_exact,
        E2_eV: 4 * E1_metal_exact,
        E3_eV: 9 * E1_metal_exact,
        kF_invA: kF_metal,
        EF_eV: EF_metal_exact,
        deltaE_at_EF_eV: 2 * N_metal * E1_metal_exact,
      },
    },
  };

  const results = {
    parameters: {
      a_A: a,
      vG_eV: vG,
      v2G_eV: 0,
      hbar2_over_2m0_eVA2: HBAR2_OVER_2M0,
      E0_eV: E0,
    },
    item1_first_four_bands: {
      nPW_15: bands_15pw,
      nPW_41: bands_41pw,
    },
    item2_gap_at_edge: {
      nPW_15_eV: gapEdge15,
      nPW_41_eV: gapEdge41,
      two_band_2absVG_eV: gapAnalytical2Band,
      diff_41pw_vs_2absVG_eV: gapEdge41 - gapAnalytical2Band,
    },
    item3_effective_mass_at_edge: {
      band1_lower_nPW_15: effMassLower15,
      band2_upper_nPW_15: effMassUpper15,
      band1_lower_nPW_41: effMassLower41,
      band2_upper_nPW_41: effMassUpper41,
      two_band_formula_m0_over_m_lower: effMass2BandLower,
      two_band_formula_m0_over_m_upper: effMass2BandUpper,
      dispensa_parte4_sec3_2_ref_upper: 17.731,
    },
    item4_psi2_at_edge: densities,
    item5_velocity: {
      edge_band1_lower_ms: velEdgeLower,
      edge_band2_upper_ms: velEdgeUpper,
      free_electron_k1_ms: velFreeAt1,
      free_electron_k1_analytical_ms: velFreeAnalytical,
    },
    item6_fermi_levels: fermiLevels,
    item7_two_harmonics: twoHarmonics,
    item8_dispensa_sec11_examples: dispensaExamples,
  };

  const outDir = dirname(fileURLToPath(import.meta.url));
  const outPath = join(outDir, 'risultati.json');
  writeFileSync(outPath, JSON.stringify(results, null, 2) + '\n', 'utf8');
  console.log('Risultati salvati in', outPath);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
