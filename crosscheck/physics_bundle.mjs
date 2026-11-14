// src/renderer/src/physics/constants.ts
/**
* Costanti fisiche: unico file dell'app che le definisce.
* Unità di lavoro: lunghezze in Å, numeri d'onda in Å⁻¹, energie in eV.
*/
/** ħ²/2m₀ in eV·Å² (progetto.md «Notazione»; dispensa P3 formulario, «Scatola 1D»: 3,81). */
const HBAR2_OVER_2M0 = 3.80998;
/** ħ²/m₀ in eV·Å² (= 2 · ħ²/2m₀). */
const HBAR2_OVER_M0 = 2 * HBAR2_OVER_2M0;
/** Rydberg in eV (progetto.md «Notazione»). */
const RYDBERG_EV = 13.6057;
/**
* ħ in eV·s (CODATA 2018, 6,582119569·10⁻¹⁶). Serve solo per convertire
* v = (1/ħ)·dE/dk in m/s; è coerente con ħ²/2m₀ = 3,80998 eV·Å² entro 1 su 10⁶.
*/
const HBAR_EV_S = 6582119569e-25;
/** 1 Å in metri. */
const ANGSTROM_IN_M = 1e-10;
// src/renderer/src/physics/linalg.ts
/** Matrice reale simmetrica n×n di zeri. */
function realSymmetricMatrix(n) {
	if (!Number.isInteger(n) || n < 0) throw new RangeError(`dimensione non valida: ${n}`);
	return {
		kind: "real-symmetric",
		n,
		data: new Float64Array(n * n)
	};
}
/** Matrice hermitiana complessa n×n di zeri. */
function complexHermitianMatrix(n) {
	if (!Number.isInteger(n) || n < 0) throw new RangeError(`dimensione non valida: ${n}`);
	return {
		kind: "complex-hermitian",
		n,
		re: new Float64Array(n * n),
		im: new Float64Array(n * n)
	};
}
/** Vista sull'autovettore j (sottoarray, senza copia). */
function eigenvector(vectors, j) {
	if (!Number.isInteger(j) || j < 0 || j >= vectors.count) throw new RangeError(`indice di autovettore fuori intervallo: ${j}`);
	const start = j * vectors.n;
	const end = start + vectors.n;
	return {
		re: vectors.re.subarray(start, end),
		im: vectors.im ? vectors.im.subarray(start, end) : null
	};
}
/** Autovalori (crescenti) e autovettori di una matrice hermitiana. */
function eigh(matrix, options = {}) {
	const wantVectors = options.vectors ?? true;
	switch (matrix.kind) {
		case "real-symmetric": return eighRealSymmetric(matrix, wantVectors);
		case "complex-hermitian": return eighComplexHermitian(matrix, wantVectors);
	}
}
const MAX_QL_ITERATIONS = 100;
function eighRealSymmetric(matrix, wantVectors) {
	const n = matrix.n;
	if (matrix.data.length !== n * n) throw new RangeError("eigh: dati della matrice di lunghezza errata");
	checkSymmetric(matrix);
	if (n === 0) return {
		values: /* @__PURE__ */ new Float64Array(0),
		vectors: wantVectors ? {
			n: 0,
			count: 0,
			re: /* @__PURE__ */ new Float64Array(0),
			im: null
		} : null
	};
	const V = Float64Array.from(matrix.data);
	const d = new Float64Array(n);
	const e = new Float64Array(n);
	tred2(n, V, d, e);
	tql2(n, V, d, e, wantVectors);
	if (!wantVectors) return {
		values: d,
		vectors: null
	};
	const re = new Float64Array(n * n);
	for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) re[j * n + i] = V[i * n + j];
	return {
		values: d,
		vectors: {
			n,
			count: n,
			re,
			im: null
		}
	};
}
function checkSymmetric(matrix) {
	const { n, data } = matrix;
	let scale = 0;
	for (let i = 0; i < n * n; i++) scale = Math.max(scale, Math.abs(data[i]));
	const tol = 1e-12 * Math.max(scale, Number.MIN_VALUE);
	for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) if (Math.abs(data[i * n + j] - data[j * n + i]) > tol) throw new Error(`eigh: matrice non simmetrica in (${i}, ${j})`);
}
/** Householder: riduce V (simmetrica) a tridiagonale; d diagonale, e sottodiagonale. */
function tred2(n, V, d, e) {
	for (let j = 0; j < n; j++) d[j] = V[(n - 1) * n + j];
	for (let i = n - 1; i > 0; i--) {
		let scale = 0;
		let h = 0;
		for (let k = 0; k < i; k++) scale += Math.abs(d[k]);
		if (scale === 0) {
			e[i] = d[i - 1];
			for (let j = 0; j < i; j++) {
				d[j] = V[(i - 1) * n + j];
				V[i * n + j] = 0;
				V[j * n + i] = 0;
			}
		} else {
			for (let k = 0; k < i; k++) {
				d[k] /= scale;
				h += d[k] * d[k];
			}
			let f = d[i - 1];
			let g = Math.sqrt(h);
			if (f > 0) g = -g;
			e[i] = scale * g;
			h -= f * g;
			d[i - 1] = f - g;
			for (let j = 0; j < i; j++) e[j] = 0;
			for (let j = 0; j < i; j++) {
				f = d[j];
				V[j * n + i] = f;
				g = e[j] + V[j * n + j] * f;
				for (let k = j + 1; k <= i - 1; k++) {
					g += V[k * n + j] * d[k];
					e[k] += V[k * n + j] * f;
				}
				e[j] = g;
			}
			f = 0;
			for (let j = 0; j < i; j++) {
				e[j] /= h;
				f += e[j] * d[j];
			}
			const hh = f / (h + h);
			for (let j = 0; j < i; j++) e[j] -= hh * d[j];
			for (let j = 0; j < i; j++) {
				f = d[j];
				g = e[j];
				for (let k = j; k <= i - 1; k++) V[k * n + j] -= f * e[k] + g * d[k];
				d[j] = V[(i - 1) * n + j];
				V[i * n + j] = 0;
			}
		}
		d[i] = h;
	}
	for (let i = 0; i < n - 1; i++) {
		V[(n - 1) * n + i] = V[i * n + i];
		V[i * n + i] = 1;
		const h = d[i + 1];
		if (h !== 0) {
			for (let k = 0; k <= i; k++) d[k] = V[k * n + i + 1] / h;
			for (let j = 0; j <= i; j++) {
				let g = 0;
				for (let k = 0; k <= i; k++) g += V[k * n + i + 1] * V[k * n + j];
				for (let k = 0; k <= i; k++) V[k * n + j] -= g * d[k];
			}
		}
		for (let k = 0; k <= i; k++) V[k * n + i + 1] = 0;
	}
	for (let j = 0; j < n; j++) {
		d[j] = V[(n - 1) * n + j];
		V[(n - 1) * n + j] = 0;
	}
	V[(n - 1) * n + (n - 1)] = 1;
	e[0] = 0;
}
/** QL implicito sulla tridiagonale (d, e); ordina autovalori (e autovettori) in modo crescente. */
function tql2(n, V, d, e, wantVectors) {
	for (let i = 1; i < n; i++) e[i - 1] = e[i];
	e[n - 1] = 0;
	let f = 0;
	let tst1 = 0;
	const eps = Number.EPSILON;
	for (let l = 0; l < n; l++) {
		tst1 = Math.max(tst1, Math.abs(d[l]) + Math.abs(e[l]));
		let m = l;
		while (m < n) {
			if (Math.abs(e[m]) <= eps * tst1) break;
			m++;
		}
		if (m === n) m = n - 1;
		if (m > l) {
			let iter = 0;
			do {
				if (++iter > MAX_QL_ITERATIONS) throw new Error("eigh: QL non converge");
				let g = d[l];
				let p = (d[l + 1] - g) / (2 * e[l]);
				let r = Math.hypot(p, 1);
				if (p < 0) r = -r;
				d[l] = e[l] / (p + r);
				d[l + 1] = e[l] * (p + r);
				const dl1 = d[l + 1];
				let h = g - d[l];
				for (let i = l + 2; i < n; i++) d[i] -= h;
				f += h;
				p = d[m];
				let c = 1;
				let c2 = c;
				let c3 = c;
				const el1 = e[l + 1];
				let s = 0;
				let s2 = 0;
				for (let i = m - 1; i >= l; i--) {
					c3 = c2;
					c2 = c;
					s2 = s;
					g = c * e[i];
					h = c * p;
					r = Math.hypot(p, e[i]);
					e[i + 1] = s * r;
					s = e[i] / r;
					c = p / r;
					p = c * d[i] - s * g;
					d[i + 1] = h + s * (c * g + s * d[i]);
					if (wantVectors) for (let k = 0; k < n; k++) {
						const row = k * n;
						h = V[row + i + 1];
						V[row + i + 1] = s * V[row + i] + c * h;
						V[row + i] = c * V[row + i] - s * h;
					}
				}
				p = -s * s2 * c3 * el1 * e[l] / dl1;
				e[l] = s * p;
				d[l] = c * p;
			} while (Math.abs(e[l]) > eps * tst1);
		}
		d[l] += f;
		e[l] = 0;
	}
	for (let i = 0; i < n - 1; i++) {
		let k = i;
		let p = d[i];
		for (let j = i + 1; j < n; j++) if (d[j] < p) {
			k = j;
			p = d[j];
		}
		if (k !== i) {
			d[k] = d[i];
			d[i] = p;
			if (wantVectors) for (let j = 0; j < n; j++) {
				const row = j * n;
				const tmp = V[row + i];
				V[row + i] = V[row + k];
				V[row + k] = tmp;
			}
		}
	}
}
function checkHermitian(matrix) {
	const { n, re, im } = matrix;
	let scale = 0;
	for (let i = 0; i < n * n; i++) scale = Math.max(scale, Math.abs(re[i]), Math.abs(im[i]));
	const tol = 1e-12 * Math.max(scale, Number.MIN_VALUE);
	for (let i = 0; i < n; i++) {
		if (Math.abs(im[i * n + i]) > tol) throw new Error(`eigh: parte immaginaria non nulla sulla diagonale in (${i}, ${i})`);
		for (let j = i + 1; j < n; j++) {
			const a = i * n + j;
			const b = j * n + i;
			if (Math.abs(re[a] - re[b]) > tol || Math.abs(im[a] + im[b]) > tol) throw new Error(`eigh: matrice non hermitiana in (${i}, ${j})`);
		}
	}
}
function eighComplexHermitian(matrix, wantVectors) {
	const n = matrix.n;
	if (matrix.re.length !== n * n || matrix.im.length !== n * n) throw new RangeError("eigh: dati della matrice di lunghezza errata");
	checkHermitian(matrix);
	if (n === 0) return {
		values: /* @__PURE__ */ new Float64Array(0),
		vectors: wantVectors ? {
			n: 0,
			count: 0,
			re: /* @__PURE__ */ new Float64Array(0),
			im: /* @__PURE__ */ new Float64Array(0)
		} : null
	};
	if (n === 1) return {
		values: Float64Array.of(matrix.re[0]),
		vectors: wantVectors ? {
			n: 1,
			count: 1,
			re: Float64Array.of(1),
			im: Float64Array.of(0)
		} : null
	};
	const Ar = Float64Array.from(matrix.re);
	const Ai = Float64Array.from(matrix.im);
	const d = new Float64Array(n);
	const e = new Float64Array(n);
	const uStoreRe = wantVectors ? new Float64Array(n * n) : null;
	const uStoreIm = wantVectors ? new Float64Array(n * n) : null;
	const hStore = wantVectors ? new Float64Array(n) : null;
	const ur = new Float64Array(n);
	const ui = new Float64Array(n);
	const pr = new Float64Array(n);
	const pi = new Float64Array(n);
	for (let i = n - 1; i > 0; i--) {
		const l = i - 1;
		let scale = 0;
		for (let k = 0; k <= l; k++) scale += Math.abs(Ar[k * n + i]) + Math.abs(Ai[k * n + i]);
		if (scale === 0) {
			e[i] = 0;
			continue;
		}
		let h = 0;
		for (let k = 0; k <= l; k++) {
			const vr = Ar[k * n + i] / scale;
			const vi = Ai[k * n + i] / scale;
			ur[k] = vr;
			ui[k] = vi;
			h += vr * vr + vi * vi;
		}
		if (h === 0) {
			e[i] = 0;
			continue;
		}
		const g = Math.sqrt(h);
		const fRe = ur[l];
		const fIm = ui[l];
		const rL = Math.hypot(fRe, fIm);
		let alphaRe;
		let alphaIm;
		if (rL > 0) {
			alphaRe = -g * fRe / rL;
			alphaIm = -g * fIm / rL;
		} else {
			alphaRe = -g;
			alphaIm = 0;
		}
		ur[l] = fRe - alphaRe;
		ui[l] = fIm - alphaIm;
		const hDenom = h + g * rL;
		Ar[i * n + l] = scale * alphaRe;
		Ai[i * n + l] = -scale * alphaIm;
		if (wantVectors && uStoreRe && uStoreIm && hStore) {
			hStore[i] = hDenom;
			const base = i * n;
			for (let k = 0; k <= l; k++) {
				uStoreRe[base + k] = ur[k];
				uStoreIm[base + k] = ui[k];
			}
		}
		for (let r = 0; r <= l; r++) {
			let sumRe = 0;
			let sumIm = 0;
			const rowOff = r * n;
			for (let c = 0; c <= l; c++) {
				const ar = Ar[rowOff + c];
				const ai = Ai[rowOff + c];
				const xr = ur[c];
				const xi = ui[c];
				sumRe += ar * xr - ai * xi;
				sumIm += ar * xi + ai * xr;
			}
			pr[r] = sumRe / hDenom;
			pi[r] = sumIm / hDenom;
		}
		let uDotP = 0;
		for (let k = 0; k <= l; k++) uDotP += ur[k] * pr[k] + ui[k] * pi[k];
		const kScalar = uDotP / (2 * hDenom);
		for (let k = 0; k <= l; k++) {
			pr[k] -= kScalar * ur[k];
			pi[k] -= kScalar * ui[k];
		}
		for (let r = 0; r <= l; r++) {
			const urr = ur[r];
			const uir = ui[r];
			const qrr = pr[r];
			const qir = pi[r];
			const rowOff = r * n;
			for (let c = 0; c <= r; c++) {
				const urc = ur[c];
				const uic = ui[c];
				const qrc = pr[c];
				const qic = pi[c];
				const subRe = urr * qrc + uir * qic + (qrr * urc + qir * uic);
				const subIm = uir * qrc - urr * qic + (qir * urc - qrr * uic);
				const nr = Ar[rowOff + c] - subRe;
				const ni = r === c ? 0 : Ai[rowOff + c] - subIm;
				Ar[rowOff + c] = nr;
				Ai[rowOff + c] = ni;
				if (r !== c) {
					Ar[c * n + r] = nr;
					Ai[c * n + r] = -ni;
				}
			}
		}
	}
	for (let i = 0; i < n; i++) d[i] = Ar[i * n + i];
	const tauRe = wantVectors ? new Float64Array(n) : null;
	const tauIm = wantVectors ? new Float64Array(n) : null;
	if (tauRe && tauIm) tauRe[0] = 1;
	let prevTauRe = 1;
	let prevTauIm = 0;
	for (let i = 1; i < n; i++) {
		const cr = Ar[i * n + (i - 1)];
		const ci = Ai[i * n + (i - 1)];
		const mod = Math.hypot(cr, ci);
		e[i] = mod;
		if (wantVectors && tauRe && tauIm) {
			if (mod > 0) {
				const nr = (cr * prevTauRe - ci * prevTauIm) / mod;
				const ni = (cr * prevTauIm + ci * prevTauRe) / mod;
				tauRe[i] = nr;
				tauIm[i] = ni;
				prevTauRe = nr;
				prevTauIm = ni;
			} else {
				tauRe[i] = 1;
				tauIm[i] = 0;
				prevTauRe = 1;
				prevTauIm = 0;
			}
		}
	}
	const Z = wantVectors ? new Float64Array(n * n) : /* @__PURE__ */ new Float64Array(0);
	if (wantVectors) for (let i = 0; i < n; i++) Z[i * n + i] = 1;
	tql2(n, Z, d, e, wantVectors);
	if (!wantVectors) return {
		values: d,
		vectors: null
	};
	const outRe = new Float64Array(n * n);
	const outIm = new Float64Array(n * n);
	if (tauRe && tauIm) for (let j = 0; j < n; j++) {
		const colOff = j * n;
		for (let i = 0; i < n; i++) {
			const zij = Z[i * n + j];
			outRe[colOff + i] = tauRe[i] * zij;
			outIm[colOff + i] = tauIm[i] * zij;
		}
	}
	if (uStoreRe && uStoreIm && hStore) for (let i = 1; i < n; i++) {
		const hDenom = hStore[i];
		if (hDenom === 0) continue;
		const base = i * n;
		for (let j = 0; j < n; j++) {
			const vecOff = j * n;
			let dotRe = 0;
			let dotIm = 0;
			for (let k = 0; k < i; k++) {
				const ukR = uStoreRe[base + k];
				const ukI = uStoreIm[base + k];
				const wkR = outRe[vecOff + k];
				const wkI = outIm[vecOff + k];
				dotRe += ukR * wkR + ukI * wkI;
				dotIm += ukR * wkI - ukI * wkR;
			}
			const sRe = dotRe / hDenom;
			const sIm = dotIm / hDenom;
			for (let k = 0; k < i; k++) {
				const ukR = uStoreRe[base + k];
				const ukI = uStoreIm[base + k];
				outRe[vecOff + k] -= sRe * ukR - sIm * ukI;
				outIm[vecOff + k] -= sRe * ukI + sIm * ukR;
			}
		}
	}
	return {
		values: d,
		vectors: {
			n,
			count: n,
			re: outRe,
			im: outIm
		}
	};
}
// src/renderer/src/physics/bandStructure.ts
/**
* Cammino a tratti rettilinei tra punti notevoli (es. L–Γ–X in 3D).
* `pointsPerSegment` punti per tratto, estremo iniziale incluso; l'ultimo
* vertice è aggiunto in fondo. I vertici non sono duplicati.
*/
function kPathFromVertices(vertices, pointsPerSegment, dimension) {
	if (vertices.length < 2) throw new RangeError("servono almeno due vertici");
	if (!Number.isInteger(pointsPerSegment) || pointsPerSegment < 1) throw new RangeError(`pointsPerSegment non valido: ${pointsPerSegment}`);
	const points = [];
	const labels = [];
	for (let s = 0; s < vertices.length - 1; s++) {
		const from = vertices[s].k;
		const to = vertices[s + 1].k;
		labels.push({
			index: points.length,
			label: vertices[s].label
		});
		for (let i = 0; i < pointsPerSegment; i++) {
			const t = i / pointsPerSegment;
			points.push([
				from[0] + t * (to[0] - from[0]),
				from[1] + t * (to[1] - from[1]),
				from[2] + t * (to[2] - from[2])
			]);
		}
	}
	const last = vertices[vertices.length - 1];
	labels.push({
		index: points.length,
		label: last.label
	});
	points.push([
		last.k[0],
		last.k[1],
		last.k[2]
	]);
	return {
		dimension,
		points,
		distance: cumulativeDistance(points),
		labels
	};
}
/**
* Prima zona di Brillouin in 1D, −π/a ≤ k ≤ π/a, con `nPoints` punti
* equispaziati (dispari, così k = 0 è incluso). I pesi (regola dei trapezi,
* metà peso ai due estremi equivalenti) sommano a 1.
*/
function zonePath1D(a, nPoints) {
	if (!(a > 0)) throw new RangeError(`passo reticolare non valido: ${a}`);
	if (!Number.isInteger(nPoints) || nPoints < 3 || nPoints % 2 === 0) throw new RangeError(`nPoints deve essere un intero dispari ≥ 3: ${nPoints}`);
	const kMax = Math.PI / a;
	const intervals = nPoints - 1;
	const points = [];
	const weights = new Float64Array(nPoints);
	for (let i = 0; i < nPoints; i++) {
		const k = i === intervals / 2 ? 0 : -kMax + 2 * kMax * i / intervals;
		points.push([
			k,
			0,
			0
		]);
		weights[i] = (i === 0 || i === intervals ? .5 : 1) / intervals;
	}
	points[0] = [
		-kMax,
		0,
		0
	];
	points[intervals] = [
		kMax,
		0,
		0
	];
	return {
		dimension: 1,
		points,
		distance: cumulativeDistance(points),
		labels: [
			{
				index: 0,
				label: "−π/a"
			},
			{
				index: intervals / 2,
				label: "0"
			},
			{
				index: intervals,
				label: "π/a"
			}
		],
		weights
	};
}
/** Numero di bande di una struttura. */
function bandCount(bands) {
	return bands.energies.length;
}
function cumulativeDistance(points) {
	const distance = new Float64Array(points.length);
	for (let i = 1; i < points.length; i++) {
		const p = points[i];
		const q = points[i - 1];
		distance[i] = distance[i - 1] + Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]);
	}
	return distance;
}
// src/renderer/src/physics/freeElectron.ts
/** Parabola libera E_k = ħ²k²/2m₀ (eV), k in Å⁻¹. */
function freeElectronEnergy(k) {
	return HBAR2_OVER_2M0 * k * k;
}
/** Energia libera al bordo di zona E₀ = ħ²π²/2m₀a² (eV), a in Å (P3 §11.4). */
function zoneBoundaryEnergy(a) {
	if (!(a > 0)) throw new RangeError(`passo reticolare non valido: ${a}`);
	return freeElectronEnergy(Math.PI / a);
}
/** Modulo del vettore reciproco più corto, G = 2π/a (Å⁻¹). */
function reciprocalVector1D(a) {
	if (!(a > 0)) throw new RangeError(`passo reticolare non valido: ${a}`);
	return 2 * Math.PI / a;
}
/**
* Reticolo vuoto (zona ridotta): le `nBands` energie più basse fra
* E = ħ²(k+G)²/2m₀, G = 2πn/a, in ordine crescente (P3 formulario «Zona ridotta»).
*/
function emptyLatticeEnergies(k, a, nBands) {
	if (!Number.isInteger(nBands) || nBands < 1) throw new RangeError(`nBands non valido: ${nBands}`);
	const G = reciprocalVector1D(a);
	const n0 = -Math.round(k / G);
	const values = [];
	for (let n = n0 - nBands; n <= n0 + nBands; n++) values.push(freeElectronEnergy(k + n * G));
	values.sort((x, y) => x - y);
	return Float64Array.from(values.slice(0, nBands));
}
/**
* Reticolo vuoto lungo un cammino 1D, in forma chiusa (zona ridotta): stesse
* energie di `nearlyFreeBands` con potenziale nullo, senza diagonalizzare.
* Serve allo strumento «Confronto» (P3 §11.5: per V_G → 0 si hanno le parabole libere).
*/
function emptyLatticeBands(a, path, nBands) {
	if (path.dimension !== 1) throw new RangeError("emptyLatticeBands: serve un cammino 1D");
	const energies = Array.from({ length: nBands }, () => new Float64Array(path.points.length));
	path.points.forEach((point, i) => {
		const e = emptyLatticeEnergies(point[0], a, nBands);
		for (let n = 0; n < nBands; n++) energies[n][i] = e[n];
	});
	return {
		method: "empty-lattice",
		path,
		energies
	};
}
/**
* Modello a due onde (P3 eq. dueonde; formulario «Due onde, k′ = k − G»):
* E± = ½(E_k + E_k′) ± [¼(E_k′ − E_k)² + V_G²]^½.
* `kPrime` è l'onda partner (di solito k − G con G = 2π/a, per k vicino a π/a);
* `vG` è il coefficiente che accoppia le due onde (eV, con segno: conta solo |V_G|).
*/
function twoWaveEnergies(k, kPrime, vG) {
	const ek = freeElectronEnergy(k);
	const ekp = freeElectronEnergy(kPrime);
	const mean = .5 * (ek + ekp);
	const half = .5 * (ekp - ek);
	const root = Math.sqrt(half * half + vG * vG);
	return {
		lower: mean - root,
		upper: mean + root
	};
}
// src/renderer/src/physics/centralEquation1d.ts
/** V(x) in eV, x in Å: V̄ + 2 Σ_n V_nG cos(2πnx/a). */
function potentialAt(potential, x) {
	const { a, fourier } = potential;
	let v = potential.mean ?? 0;
	for (let n = 1; n <= fourier.length; n++) v += 2 * fourier[n - 1] * Math.cos(2 * Math.PI * n * x / a);
	return v;
}
/**
* Base di `count` onde piane per il punto k: i G = 2πn/a con |k + G| più
* piccolo (cioè energia cinetica più bassa). Per k nella prima zona e `count`
* dispari è la base simmetrica n = −M…M; con `count` = 2 e k vicino a π/a è
* {−1, 0}, le due onde del modello a due onde. A parità di |k + G| vince |n|
* minore. Restituisce gli n in ordine crescente.
*/
function planeWaveBasis1D(k, a, count) {
	if (!(a > 0)) throw new RangeError(`passo reticolare non valido: ${a}`);
	if (!Number.isInteger(count) || count < 1) throw new RangeError(`numero di onde piane non valido: ${count}`);
	const G = 2 * Math.PI / a;
	const n0 = -Math.round(k / G);
	const candidates = [];
	for (let n = n0 - count - 1; n <= n0 + count + 1; n++) candidates.push(n);
	const tol = 1e-9 * G;
	candidates.sort((n1, n2) => {
		const d = Math.abs(k + n1 * G) - Math.abs(k + n2 * G);
		if (Math.abs(d) > tol) return d;
		if (Math.abs(n1) !== Math.abs(n2)) return Math.abs(n1) - Math.abs(n2);
		return n1 - n2;
	});
	const chosen = candidates.slice(0, count).sort((x, y) => x - y);
	return Int32Array.from(chosen);
}
/** Matrice H_{GG'} = E_{k+G} δ_{GG'} + V_{G−G'} sulla base `g` (indici n). */
function centralEquationMatrix1D(potential, k, g) {
	const { a, fourier } = potential;
	const mean = potential.mean ?? 0;
	const G = 2 * Math.PI / a;
	const size = g.length;
	const H = realSymmetricMatrix(size);
	for (let i = 0; i < size; i++) {
		const q = k + g[i] * G;
		H.data[i * size + i] = HBAR2_OVER_2M0 * q * q + mean;
		for (let j = i + 1; j < size; j++) {
			const m = Math.abs(g[i] - g[j]);
			const v = m <= fourier.length ? fourier[m - 1] : 0;
			H.data[i * size + j] = v;
			H.data[j * size + i] = v;
		}
	}
	return H;
}
/** Risolve l'equazione centrale nel punto k (Å⁻¹). */
function solveCentralEquation1D(potential, k, options) {
	validatePotential(potential);
	if (!Number.isFinite(k)) throw new RangeError(`k non valido: ${k}`);
	const g = planeWaveBasis1D(options.basisK ?? k, potential.a, options.planeWaves);
	const { values, vectors } = eigh(centralEquationMatrix1D(potential, k, g), { vectors: options.coefficients ?? true });
	if (vectors) fixPhases(vectors);
	return {
		k,
		a: potential.a,
		g,
		energies: values,
		coefficients: vectors
	};
}
/**
* La banda `band` (0 = la più bassa) come funzione E(k), calcolata con una base
* fissa scelta in `basisK`: adatta a derivate numeriche (velocità, massa efficace).
*/
function centralEquationBand(potential, band, options) {
	validatePotential(potential);
	if (!Number.isInteger(band) || band < 0 || band >= options.planeWaves) throw new RangeError(`indice di banda fuori intervallo: ${band}`);
	const g = planeWaveBasis1D(options.basisK, potential.a, options.planeWaves);
	return (k) => eigh(centralEquationMatrix1D(potential, k, g), { vectors: false }).values[band];
}
/**
* Bande degli elettroni quasi liberi lungo un cammino 1D (si usa la prima
* componente dei punti del cammino). Con `fourier` tutti nulli è il reticolo vuoto.
*/
function nearlyFreeBands(potential, path, options) {
	if (path.dimension !== 1) throw new RangeError("nearlyFreeBands: serve un cammino 1D");
	const nBands = options.bands ?? options.planeWaves;
	if (!Number.isInteger(nBands) || nBands < 1 || nBands > options.planeWaves) throw new RangeError(`numero di bande non valido: ${nBands}`);
	const wantStates = options.states ?? false;
	const energies = Array.from({ length: nBands }, () => new Float64Array(path.points.length));
	const states = [];
	path.points.forEach((point, i) => {
		const solution = solveCentralEquation1D(potential, point[0], {
			planeWaves: options.planeWaves,
			coefficients: wantStates
		});
		for (let n = 0; n < nBands; n++) energies[n][i] = solution.energies[n];
		if (wantStates) states.push(solution);
	});
	return {
		method: potential.fourier.every((v) => v === 0) ? "empty-lattice" : "nearly-free",
		path,
		energies,
		...wantStates ? { states } : {}
	};
}
/** Coefficienti c_G della banda `band` nello stato `solution`, con gli indici n delle onde. */
function blochCoefficients(solution, band) {
	if (!solution.coefficients) throw new Error("coefficienti non calcolati (opzione coefficients: false)");
	const v = eigenvector(solution.coefficients, band);
	return {
		g: solution.g,
		re: v.re,
		im: v.im
	};
}
function validatePotential(potential) {
	if (!(potential.a > 0)) throw new RangeError(`passo reticolare non valido: ${potential.a}`);
	for (const v of potential.fourier) if (!Number.isFinite(v)) throw new RangeError(`coefficiente di Fourier non valido: ${v}`);
	if (potential.mean !== void 0 && !Number.isFinite(potential.mean)) throw new RangeError(`media del potenziale non valida: ${potential.mean}`);
}
/** Fissa la fase arbitraria di ogni autovettore: componente di modulo massimo reale positiva. */
function fixPhases(vectors) {
	const { n, count, re, im } = vectors;
	for (let j = 0; j < count; j++) {
		let best = 0;
		let bestAbs = -1;
		for (let i = 0; i < n; i++) {
			const abs = Math.hypot(re[j * n + i], im ? im[j * n + i] : 0);
			if (abs > bestAbs * (1 + 1e-12)) {
				best = i;
				bestAbs = abs;
			}
		}
		if (bestAbs <= 0) continue;
		const cr = re[j * n + best] / bestAbs;
		const ci = im ? -im[j * n + best] / bestAbs : 0;
		for (let i = 0; i < n; i++) {
			const xr = re[j * n + i];
			const xi = im ? im[j * n + i] : 0;
			re[j * n + i] = xr * cr - xi * ci;
			if (im) im[j * n + i] = xr * ci + xi * cr;
		}
	}
}
// src/renderer/src/physics/density.ts
/**
* Densità di probabilità degli stati di Bloch dei quasi liberi.
* ψ_k(x) = Σ_G c_G e^{i(k+G)x} = e^{ikx} u_k(x)  (P3 §11.3, «è già la forma di Bloch»),
* quindi |ψ_k(x)|² = |u_k(x)|² = |Σ_G c_G e^{iGx}|², periodica di passo a.
*/
/**
* |ψ(x)|² dello stato (k, banda) nei punti `xs` (Å), normalizzata a media 1 su
* una cella (con questa normalizzazione un'onda piana ha densità 1 e le onde
* stazionarie al bordo 1 ± cos(2πx/a), come in P3 §11.5).
*/
function blochDensity1D(solution, band, xs) {
	const { g, re, im } = blochCoefficients(solution, band);
	const G = 2 * Math.PI / solution.a;
	let norm = 0;
	for (let j = 0; j < g.length; j++) norm += re[j] * re[j] + (im ? im[j] * im[j] : 0);
	if (!(norm > 0)) throw new Error("stato nullo");
	const out = new Float64Array(xs.length);
	for (let p = 0; p < xs.length; p++) {
		const x = xs[p];
		let ur = 0;
		let ui = 0;
		for (let j = 0; j < g.length; j++) {
			const phase = g[j] * G * x;
			const c = Math.cos(phase);
			const s = Math.sin(phase);
			const cr = re[j];
			const ci = im ? im[j] : 0;
			ur += cr * c - ci * s;
			ui += cr * s + ci * c;
		}
		out[p] = (ur * ur + ui * ui) / norm;
	}
	return out;
}
/**
* Riconosce se lo stato (k = ±π/a, banda `band`) è l'onda stazionaria ψ_c ∝
* cos(πx/a), con la carica sugli ioni (x = n·a), o ψ_s ∝ sin(πx/a), con la
* carica fra gli ioni. Si usa il rapporto fra i pesi delle due onde degeneri
* e^{±iπx/a} (formulario «gap»: c_{−G}/c₀ = ±1, + per ψ_c, − per ψ_s); con
* più onde piane il segno resta quello, perché un potenziale pari separa gli
* stati al bordo in pari e dispari.
* Restituisce null se k non è sul bordo di zona o se lo stato è degenere
* (V_G = 0: qualunque combinazione è autostato).
*/
function zoneEdgeStandingWave(solution, band) {
	const G = 2 * Math.PI / solution.a;
	const edge = G / 2;
	if (Math.abs(Math.abs(solution.k) - edge) > 1e-9 * G) return null;
	const e = solution.energies;
	const scale = Math.max(1, Math.abs(e[band]));
	if (band > 0 && Math.abs(e[band] - e[band - 1]) < 1e-9 * scale || band + 1 < e.length && Math.abs(e[band + 1] - e[band]) < 1e-9 * scale) return null;
	const { g, re, im } = blochCoefficients(solution, band);
	const mirror = solution.k > 0 ? -1 : 1;
	let projection = 0;
	for (let i = 0; i < g.length; i++) {
		const j = indexOf(g, mirror - g[i]);
		if (j < 0) continue;
		projection += re[i] * re[j] + (im ? im[i] * im[j] : 0);
	}
	if (Math.abs(projection) < 1e-6) return null;
	return projection > 0 ? "c" : "s";
}
function indexOf(g, n) {
	for (let i = 0; i < g.length; i++) if (g[i] === n) return i;
	return -1;
}
// src/renderer/src/physics/gaps1d.ts
/**
* Gap diretti delle bande 1D calcolate con l'equazione centrale.
* Dispensa P3 §11.4 («Il gap dal calcolo»): al bordo di zona k = ±π/a il gap
* fra la prima e la seconda banda è 2|V_G|; per k = ±nπ/a è 2|V_nG|, quindi
* il secondo gap (n = 2) cade in k = 0 del ridotto (2π/a ≡ 0) ed è ≃ 2|V_2G|.
*/
/**
* Separazione verticale fra le bande `lowerBand` e `lowerBand + 1` nel punto k.
* In 1D, per i quasi liberi, massimo della banda inferiore e minimo della
* superiore cadono nello stesso k (P3 §11.5, «il gap è un intervallo proibito
* per ogni k»): in π/a e in 0 questa separazione è il gap E_g.
*/
function directGap1D(potential, k, lowerBand, options) {
	if (!Number.isInteger(lowerBand) || lowerBand < 0 || lowerBand + 1 >= options.planeWaves) throw new RangeError(`indice di banda fuori intervallo: ${lowerBand}`);
	const { energies } = solveCentralEquation1D(potential, k, {
		planeWaves: options.planeWaves,
		coefficients: false
	});
	const lower = energies[lowerBand];
	const upper = energies[lowerBand + 1];
	return {
		k,
		lowerBand,
		lower,
		upper,
		width: upper - lower
	};
}
// src/renderer/src/physics/semiclassical.ts
/**
* Grandezze semiclassiche da una banda E(k) qualunque (P3 §13; formulario
* «Velocità» e «Massa efficace»), con derivate per differenze finite centrate.
* Le funzioni accettano una E(k) generica: valgono per ogni metodo.
* Unità: k in Å⁻¹, E in eV.
*/
/** Passo di default delle differenze finite (Å⁻¹). */
const DEFAULT_K_STEP = 1e-4;
/** dE/dk in eV·Å (differenza centrata). */
function bandSlope(energy, k, h = DEFAULT_K_STEP) {
	checkStep(h);
	return (energy(k + h) - energy(k - h)) / (2 * h);
}
/** d²E/dk² in eV·Å² (differenza seconda centrata). */
function bandCurvature(energy, k, h = DEFAULT_K_STEP) {
	checkStep(h);
	return (energy(k + h) - 2 * energy(k) + energy(k - h)) / (h * h);
}
/** Velocità di gruppo v = (1/ħ)·dE/dk, in m/s. */
function groupVelocity(energy, k, h = DEFAULT_K_STEP) {
	return bandSlope(energy, k, h) / HBAR_EV_S * ANGSTROM_IN_M;
}
/**
* m₀/m* = (d²E/dk²)/(ħ²/m₀): inverso della massa efficace in unità di m₀.
* È la grandezza regolare (si annulla nei flessi, dove m* diverge).
*/
function inverseEffectiveMassRatio(energy, k, h = DEFAULT_K_STEP) {
	return bandCurvature(energy, k, h) / HBAR2_OVER_M0;
}
/**
* m* / m₀ = (ħ²/m₀)/(d²E/dk²). Negativa dove la banda è concava (cima di banda);
* ±Infinity in un flesso.
*/
function effectiveMassRatio(energy, k, h = DEFAULT_K_STEP) {
	return 1 / inverseEffectiveMassRatio(energy, k, h);
}
function checkStep(h) {
	if (!(h > 0) || !Number.isFinite(h)) throw new RangeError(`passo di derivazione non valido: ${h}`);
}
// src/renderer/src/physics/filling.ts
/**
* Riempie le bande con `electronsPerCell` elettroni per cella (intero ≥ 1).
* Richiede un cammino che campiona l'intera zona (`path.weights`, ad es. da
* `zonePath1D`) e almeno ⌊N/2⌋ + 1 bande.
*/
function fillBands(bands, electronsPerCell, options = {}) {
	const weights = bands.path.weights;
	if (!weights) throw new Error("fillBands: il cammino non campiona la zona (mancano i pesi)");
	const N = electronsPerCell;
	if (!Number.isInteger(N) || N < 1) throw new RangeError(`elettroni per cella non validi: ${N}`);
	const nBands = bands.energies.length;
	if (nBands < Math.floor(N / 2) + 1) throw new RangeError(`servono almeno ${Math.floor(N / 2) + 1} bande per ${N} elettroni per cella`);
	const tol = options.gapTolerance ?? 1e-6;
	const nk = weights.length;
	if (N % 2 === 0) {
		const top = max(bands.energies[N / 2 - 1]);
		const bottom = min(bands.energies[N / 2]);
		if (bottom - top > tol) {
			const occupations = new Float64Array(nBands);
			occupations.fill(1, 0, N / 2);
			return {
				electronsPerCell: N,
				kind: "insulator",
				fermiLevel: .5 * (top + bottom),
				gap: bottom - top,
				occupations,
				highestOccupied: top,
				lowestUnoccupied: bottom
			};
		}
	}
	const levels = [];
	for (let n = 0; n < nBands; n++) for (let i = 0; i < nk; i++) if (weights[i] > 0) levels.push({
		e: bands.energies[n][i],
		w: weights[i],
		band: n
	});
	levels.sort((p, q) => p.e - q.e || p.band - q.band);
	const occupations = new Float64Array(nBands);
	let remaining = N;
	let last = -1;
	for (let i = 0; i < levels.length && remaining > 1e-12; i++) {
		const take = Math.min(2 * levels[i].w, remaining);
		occupations[levels[i].band] += take / 2;
		remaining -= take;
		last = i;
	}
	const highestOccupied = levels[last].e;
	const lowestUnoccupied = last + 1 < levels.length ? levels[last + 1].e : Number.POSITIVE_INFINITY;
	return {
		electronsPerCell: N,
		kind: "metal",
		fermiLevel: .5 * (highestOccupied + lowestUnoccupied),
		gap: null,
		occupations,
		highestOccupied,
		lowestUnoccupied
	};
}
function max(values) {
	let m = Number.NEGATIVE_INFINITY;
	for (const v of values) if (v > m) m = v;
	return m;
}
function min(values) {
	let m = Number.POSITIVE_INFINITY;
	for (const v of values) if (v < m) m = v;
	return m;
}
// src/renderer/src/physics/emptyLattice.ts
/**
* Reticolo vuoto e schemi di zona in 1D (dispensa P3 §9.3, §11.6 e P4 §5.1):
* ripiegamento nella prima zona, corrispondenza tra zona estesa, ridotta e
* periodica, incroci dei rami e parte reale dell'onda piana sugli ioni.
* Unità: Å, Å⁻¹, eV.
*/
/**
* Ripiega un vettore d'onda esteso `kExtended` (Å⁻¹) nella prima zona
* −π/a < k′ ≤ π/a tramite k = k′ + G con G = 2πn/a (P3 §9.3, P4 §5.1).
*/
function foldToFirstZone1D(kExtended, a) {
	if (!(a > 0)) throw new RangeError(`passo reticolare non valido: ${a}`);
	if (!Number.isFinite(kExtended)) throw new RangeError(`k non valido: ${kExtended}`);
	const G1 = reciprocalVector1D(a);
	const edge = Math.PI / a;
	let n = Math.round(kExtended / G1);
	let kReduced = kExtended - n * G1;
	if (kReduced <= -edge * (1 - 1e-12)) {
		n -= 1;
		kReduced += G1;
	} else if (kReduced > edge * (1 + 1e-12)) {
		n += 1;
		kReduced -= G1;
	}
	if (Math.abs(kReduced - edge) <= 1e-12 * edge) kReduced = edge;
	if (Math.abs(kReduced) <= 1e-13 * edge) kReduced = 0;
	n = n === 0 ? 0 : n;
	const G = n * G1;
	const zone = Math.max(1, Math.ceil(Math.abs(kExtended) / edge - 1e-12));
	return {
		kExtended,
		kReduced,
		n,
		G,
		zone,
		band: zone - 1,
		energy: freeElectronEnergy(kExtended)
	};
}
/**
* Indice intero n del ramo G = 2πn/a che realizza la banda `band` (0-based)
* nel punto `kReduced` della prima zona [−π/a, π/a].
*/
function emptyLatticeBranchIndex(kReduced, band, a) {
	if (!(a > 0)) throw new RangeError(`passo reticolare non valido: ${a}`);
	if (!Number.isInteger(band) || band < 0) throw new RangeError(`indice di banda non valido: ${band}`);
	const edge = Math.PI / a;
	if (!Number.isFinite(kReduced) || Math.abs(kReduced) > edge * (1 + 1e-9)) throw new RangeError(`kReduced fuori prima zona: ${kReduced}`);
	if (band === 0) return 0;
	const m = band + 1;
	const mag = Math.floor(m / 2);
	const neg = kReduced < -1e-12 * edge;
	if (m % 2 === 0) return neg ? mag : -mag;
	return neg ? -mag : mag;
}
/**
* Stato del reticolo vuoto sul ramo `branchN` (G = 2π·branchN/a) nel punto
* `kReduced` ∈ [−π/a, π/a].
*/
function emptyLatticeBranchState1D(kReduced, branchN, a) {
	if (!(a > 0)) throw new RangeError(`passo reticolare non valido: ${a}`);
	if (!Number.isInteger(branchN)) throw new RangeError(`indice di ramo non valido: ${branchN}`);
	const edge = Math.PI / a;
	if (!Number.isFinite(kReduced) || Math.abs(kReduced) > edge * (1 + 1e-9)) throw new RangeError(`kReduced fuori prima zona: ${kReduced}`);
	const G1 = reciprocalVector1D(a);
	const n = branchN === 0 ? 0 : branchN;
	const G = n * G1;
	const kExtended = kReduced + G;
	const zone = Math.max(1, Math.ceil(Math.abs(kExtended) / edge - 1e-12));
	return {
		kExtended,
		kReduced: Math.abs(kReduced) <= 1e-13 * edge ? 0 : kReduced,
		n,
		G,
		zone,
		band: zone - 1,
		energy: freeElectronEnergy(kExtended)
	};
}
/**
* Energia E(k) lungo il singolo ramo `branchN` (parabola liscia centrata in
* −2π·branchN/a), adatta alle derivate numeriche di `semiclassical.ts` anche
* in corrispondenza degli incroci.
*/
function emptyLatticeBranchFunction(branchN, a) {
	if (!(a > 0)) throw new RangeError(`passo reticolare non valido: ${a}`);
	if (!Number.isInteger(branchN)) throw new RangeError(`indice di ramo non valido: ${branchN}`);
	const G = branchN * reciprocalVector1D(a);
	return (k) => freeElectronEnergy(k + G);
}
/**
* Incroci fra bande successive nello schema ridotto (P3 §9.3, tabella gap ed
* esempio): dispari al bordo ±π/a (E₀, 9E₀, …), pari al centro k = 0 (4E₀, 16E₀, …).
*/
function emptyLatticeCrossings1D(a, count = 3) {
	if (!Number.isInteger(count) || count < 1) throw new RangeError(`count non valido: ${count}`);
	const edge = Math.PI / a;
	const E0 = zoneBoundaryEnergy(a);
	const out = [];
	for (let m = 1; m <= count; m++) {
		const odd = m % 2 === 1;
		out.push({
			order: m,
			lowerBand: m - 1,
			kExtended: m * edge,
			kReduced: odd ? edge : 0,
			location: odd ? "edge" : "center",
			energy: m * m * E0
		});
	}
	return out;
}
/**
* Tratti della parabola della zona estesa da traslare di −G per ottenere lo
* schema a zona ridotta, per zone 1…`maxZone` su entrambi i semiassi.
*/
function zoneFoldingSegments1D(a, maxZone) {
	if (!(a > 0)) throw new RangeError(`passo reticolare non valido: ${a}`);
	if (!Number.isInteger(maxZone) || maxZone < 1) throw new RangeError(`maxZone non valido: ${maxZone}`);
	const edge = Math.PI / a;
	const G1 = reciprocalVector1D(a);
	const out = [];
	for (let zone = 1; zone <= maxZone; zone++) for (const side of [-1, 1]) {
		const n = side * Math.floor(zone / 2);
		const G = n * G1;
		const kExtStart = side * (zone - 1) * edge;
		const kExtEnd = side * zone * edge;
		out.push({
			zone,
			side,
			n: n === 0 ? 0 : n,
			G,
			kExtStart,
			kExtEnd,
			kRedStart: kExtStart - G,
			kRedEnd: kExtEnd - G,
			band: zone - 1
		});
	}
	return out;
}
/** Bordo della prima zona di Brillouin in 1D, π/a (Å⁻¹), a in Å (P3 §9.3). */
function zoneEdge1D(a) {
	if (!(a > 0)) throw new RangeError(`passo reticolare non valido: ${a}`);
	return Math.PI / a;
}
/**
* Inversione della parabola libera E = ħ²k²/2m₀: |k| = √(2m₀E)/ħ (Å⁻¹) per
* E ≥ 0 (eV); per E < 0 non c'è onda piana libera e si restituisce 0.
*/
function freeElectronWaveNumber(energy) {
	if (!Number.isFinite(energy)) throw new RangeError(`energia non valida: ${energy}`);
	return energy > 0 ? Math.sqrt(energy / HBAR2_OVER_2M0) : 0;
}
/**
* Coordinate di ramo (k′, n) di un vettore d'onda esteso (Å⁻¹): ripiegamento
* k = k′ + G con G = 2πn/a. Se il ramo richiesto supera `maxBranchN` si usa il
* ramo estremo e k′ si ferma al bordo ±π/a (la parabola mostrata finisce lì).
*/
function branchCoordinates1D(kExtended, a, maxBranchN) {
	if (!Number.isInteger(maxBranchN) || maxBranchN < 0) throw new RangeError(`maxBranchN non valido: ${maxBranchN}`);
	const folded = foldToFirstZone1D(kExtended, a);
	const n = Math.max(-maxBranchN, Math.min(maxBranchN, folded.n));
	const edge = zoneEdge1D(a);
	const kFracReduced = Math.max(-1, Math.min(1, (kExtended - n * reciprocalVector1D(a)) / edge));
	return {
		kFracReduced,
		branchN: n === 0 ? 0 : n,
		kFracExtended: kFracReduced + 2 * n
	};
}
/** Parte reale dell'onda piana Re(e^{i(k′+G)x}) = cos(k_ext · x) nei punti `xs` (Å). */
function planeWaveRealPart1D(kExtended, xs) {
	const out = new Float64Array(xs.length);
	for (let i = 0; i < xs.length; i++) out[i] = Math.cos(kExtended * xs[i]);
	return out;
}
/** Fase k′·a (rad) accumulata da uno ione al successivo: e^{i(k′+G)a} = e^{ik′a}. */
function planeWaveIonPhaseAngle(kReduced, a) {
	if (!(a > 0)) throw new RangeError(`passo reticolare non valido: ${a}`);
	return kReduced * a;
}
/**
* Parte reale dell'onda piana sullo ione m-esimo in x = m·a:
* Re(e^{i(k′+G)·m·a}) = cos(k′·m·a), identica per tutti i rami G = 2πn/a.
*/
function planeWaveRealPartAtIon(kReduced, a, ionIndex) {
	return Math.cos(ionIndex * planeWaveIonPhaseAngle(kReduced, a));
}
// src/renderer/src/physics/kronigPenney.ts
function sinc(x) {
	if (Math.abs(x) < 1e-4) {
		const x2 = x * x;
		return 1 - x2 / 6 + x2 * x2 / 120;
	}
	return Math.sin(x) / x;
}
function sinhc(x) {
	if (Math.abs(x) < 1e-4) {
		const x2 = x * x;
		return 1 + x2 / 6 + x2 * x2 / 120;
	}
	return Math.sinh(x) / x;
}
/** Periodo reticolare a (Å) del modello Kronig–Penney. */
function kronigPenneyPeriod(spec) {
	if (spec.variant === "delta") {
		if (!(spec.a > 0)) throw new RangeError(`passo a non valido: ${spec.a}`);
		if (!(spec.P >= 0) || !Number.isFinite(spec.P)) throw new RangeError(`P non valido: ${spec.P}`);
		return spec.a;
	}
	if (!(spec.b > 0) || !(spec.c >= 0) || !(spec.v0 >= 0)) throw new RangeError(`parametri rettangolari non validi: b=${spec.b}, c=${spec.c}, V₀=${spec.v0}`);
	return spec.b + spec.c;
}
/**
* Altezza ausiliaria V₀ (eV) definita da P = m₀a²V₀/ħ² nel modello a delta
* (così l'intensità della delta è a·V₀ in eV·Å).
*/
function deltaPotentialScaleV0(a, P) {
	if (!(a > 0)) throw new RangeError(`passo a non valido: ${a}`);
	if (!(P >= 0)) throw new RangeError(`P non valido: ${P}`);
	return 2 * HBAR2_OVER_2M0 * P / (a * a);
}
/**
* Intensità effettiva della barriera (eV·Å): a·V₀ nel caso a delta,
* V₀·c nel caso rettangolare (nel limite a delta c → 0 con V₀·c fisso coincidono).
*/
function kronigBarrierStrength(spec) {
	if (spec.variant === "delta") return spec.a * deltaPotentialScaleV0(spec.a, spec.P);
	return spec.v0 * spec.c;
}
/** Parametro adimensionale effettivo P_eff = m₀·a·(V₀c)/ħ² per il confronto con il delta. */
function kronigEffectiveP(spec) {
	if (spec.variant === "delta") return spec.P;
	return (spec.b + spec.c) * spec.v0 * spec.c / (2 * HBAR2_OVER_2M0);
}
/**
* Funzione L_δ(E) = cos(αa) + P·sin(αa)/(αa) del modello a delta (P3 §10.3),
* regolare anche in E = 0 (dove vale 1 + P) e per E < 0.
*/
function kronigPenneyDeltaL(energy, a, P) {
	if (!(a > 0)) throw new RangeError(`passo a non valido: ${a}`);
	if (!(P >= 0)) throw new RangeError(`P non valido: ${P}`);
	if (energy >= 0) {
		const x = a * Math.sqrt(energy / HBAR2_OVER_2M0);
		return Math.cos(x) + P * sinc(x);
	}
	const x = a * Math.sqrt(-energy / HBAR2_OVER_2M0);
	return Math.cosh(x) + P * sinhc(x);
}
/**
* Funzione L(E) del modello a barriere rettangolari (P3 §10.5, eq. rettangolare):
* L = cos(αb)cosh(βc) + [(β²−α²)/2αβ]·sin(αb)sinh(βc) per 0 ≤ E ≤ V₀,
* con prolungamento analitico continuo per E > V₀ (β → iβ′) ed E ≤ 0.
*/
function kronigPenneyRectangularL(energy, b, c, v0) {
	if (!(b > 0) || !(c >= 0) || !(v0 >= 0)) throw new RangeError(`parametri non validi: b=${b}, c=${c}, V₀=${v0}`);
	const alpha2 = energy / HBAR2_OVER_2M0;
	const beta2 = (v0 - energy) / HBAR2_OVER_2M0;
	let cosA;
	let sincA;
	if (alpha2 >= 0) {
		const ab = b * Math.sqrt(alpha2);
		cosA = Math.cos(ab);
		sincA = sinc(ab);
	} else {
		const kb = b * Math.sqrt(-alpha2);
		cosA = Math.cosh(kb);
		sincA = sinhc(kb);
	}
	let coshB;
	let sinhcB;
	if (beta2 >= 0) {
		const bc = c * Math.sqrt(beta2);
		coshB = Math.cosh(bc);
		sinhcB = sinhc(bc);
	} else {
		const bpc = c * Math.sqrt(-beta2);
		coshB = Math.cos(bpc);
		sinhcB = sinc(bpc);
	}
	return cosA * coshB + .5 * (beta2 - alpha2) * b * c * sincA * sinhcB;
}
/** Valuta L(E) per uno dei due modelli. */
function kronigPenneyL(spec, energy) {
	return spec.variant === "delta" ? kronigPenneyDeltaL(energy, spec.a, spec.P) : kronigPenneyRectangularL(energy, spec.b, spec.c, spec.v0);
}
/**
* Ricerca di radice con brent/bisezione garantita su [lo, hi] con f(lo)·f(hi) ≤ 0.
* Tolleranza relativa e assoluta vicine alla precisione macchina.
*/
function findRoot(fn, lo, hi, tol = 1e-13) {
	let a = lo;
	let b = hi;
	let fa = fn(a);
	let fb = fn(b);
	if (Math.abs(fa) === 0) return a;
	if (Math.abs(fb) === 0) return b;
	if (fa * fb > 0) return Math.abs(fa) < Math.abs(fb) ? a : b;
	let c = a;
	let fc = fa;
	let d = b - a;
	let e = d;
	for (let iter = 0; iter < 90; iter++) {
		if (fb > 0 && fc > 0 || fb < 0 && fc < 0) {
			c = a;
			fc = fa;
			d = b - a;
			e = d;
		}
		if (Math.abs(fc) < Math.abs(fb)) {
			a = b;
			b = c;
			c = a;
			fa = fb;
			fb = fc;
			fc = fa;
		}
		const tolAct = 2e-15 * Math.abs(b) + .5 * tol;
		const m = .5 * (c - b);
		if (Math.abs(m) <= tolAct || fb === 0) return b;
		if (Math.abs(e) >= tolAct && Math.abs(fa) > Math.abs(fb)) {
			const s = fb / fa;
			let p;
			let q;
			if (a === c) {
				p = 2 * m * s;
				q = 1 - s;
			} else {
				q = fa / fc;
				const r = fb / fc;
				p = s * (2 * m * q * (q - r) - (b - a) * (r - 1));
				q = (q - 1) * (r - 1) * (s - 1);
			}
			if (p > 0) q = -q;
			else p = -p;
			if (2 * p < Math.min(3 * m * q - Math.abs(tolAct * q), Math.abs(e * q))) {
				e = d;
				d = p / q;
			} else {
				d = m;
				e = d;
			}
		} else {
			d = m;
			e = d;
		}
		a = b;
		fa = fb;
		b += Math.abs(d) > tolAct ? d : m > 0 ? tolAct : -tolAct;
		fb = fn(b);
	}
	return b;
}
/**
* Livelli legati della buca finita isolata di larghezza `b` (Å) e profondità
* `v0` (eV) (P3 §10.2, soluzione grafica senza singolarità di tan/cot).
*/
function finiteWellLevels1D(b, v0) {
	if (!(b > 0)) throw new RangeError(`larghezza b non valida: ${b}`);
	if (!(v0 >= 0)) throw new RangeError(`V₀ non valido: ${v0}`);
	if (v0 === 0) return [];
	const rho = .5 * b * Math.sqrt(v0 / HBAR2_OVER_2M0);
	const count = Math.floor(2 * rho / Math.PI) + 1;
	const out = [];
	for (let j = 0; j < count; j++) {
		const even = j % 2 === 0;
		const lo = j * Math.PI / 2;
		const hi = Math.min(rho, (j + 1) * Math.PI / 2);
		if (hi <= lo) continue;
		const xi = findRoot(even ? (xi) => Math.sqrt(Math.max(0, rho * rho - xi * xi)) * Math.cos(xi) - xi * Math.sin(xi) : (xi) => Math.sqrt(Math.max(0, rho * rho - xi * xi)) * Math.sin(xi) + xi * Math.cos(xi), lo, hi, 1e-13);
		const eta = Math.sqrt(Math.max(0, rho * rho - xi * xi));
		const alpha = 2 * xi / b;
		const energy = HBAR2_OVER_2M0 * alpha * alpha;
		out.push({
			index: j,
			parity: even ? "even" : "odd",
			xi,
			eta,
			energy
		});
	}
	return out;
}
/**
* Bordi delle prime `nBands` bande permesse nel caso a delta (P3 §10.4):
* ogni banda n (0-based) sta esattamente in αa ∈ [nπ, (n+1)π], con bordo
* superiore (nel caso di αa crescente) esattamente in αa = (n+1)π.
*/
function kronigPenneyDeltaBandEdges(a, P, nBands) {
	if (!(a > 0)) throw new RangeError(`passo a non valido: ${a}`);
	if (!(P >= 0)) throw new RangeError(`P non valido: ${P}`);
	if (!Number.isInteger(nBands) || nBands < 1) throw new RangeError(`nBands non valido: ${nBands}`);
	const toE = (x) => HBAR2_OVER_2M0 * (x / a) * (x / a);
	const out = [];
	for (let n = 0; n < nBands; n++) {
		const xMin = n * Math.PI;
		const xMax = (n + 1) * Math.PI;
		const targetLo = n % 2 === 0 ? 1 : -1;
		let xLo;
		if (P === 0) xLo = xMin;
		else {
			const f = (x) => Math.cos(x) + P * sinc(x) - targetLo;
			xLo = findRoot(f, xMin + (n === 0 ? 0 : Math.min(1e-7, 1e-4 / (1 + P))), xMax, 1e-13);
		}
		const lower = toE(xLo);
		const upper = toE(xMax);
		out.push({
			band: n,
			lower,
			upper,
			width: upper - lower,
			lowerAt: n % 2 === 0 ? "center" : "edge",
			upperAt: n % 2 === 0 ? "edge" : "center"
		});
	}
	return out;
}
function goldenExtremum(fn, a, b, findMax) {
	const phi = .5 * (Math.sqrt(5) - 1);
	let lo = a;
	let hi = b;
	let x1 = hi - phi * (hi - lo);
	let x2 = lo + phi * (hi - lo);
	let f1 = fn(x1);
	let f2 = fn(x2);
	for (let i = 0; i < 48; i++) if (findMax ? f1 > f2 : f1 < f2) {
		hi = x2;
		x2 = x1;
		f2 = f1;
		x1 = hi - phi * (hi - lo);
		f1 = fn(x1);
	} else {
		lo = x1;
		x1 = x2;
		f1 = f2;
		x2 = lo + phi * (hi - lo);
		f2 = fn(x2);
	}
	const xm = .5 * (lo + hi);
	return {
		x: xm,
		val: fn(xm)
	};
}
/**
* Bordi delle prime `nBands` bande permesse nel caso a barriere rettangolari.
* Combina una griglia in α = √(E/(ħ²/2m₀)) con un raffinamento multiscala attorno
* ai livelli genitori della buca isolata, così nessuna banda stretta (es. W ~ 10⁻¹¹ eV)
* può essere saltata.
*/
function kronigPenneyRectangularBandEdges(b, c, v0, nBands) {
	if (!(b > 0) || !(c >= 0) || !(v0 >= 0)) throw new RangeError(`parametri non validi: b=${b}, c=${c}, V₀=${v0}`);
	if (!Number.isInteger(nBands) || nBands < 1) throw new RangeError(`nBands non valido: ${nBands}`);
	if (c === 0 || v0 === 0) return kronigPenneyDeltaBandEdges(b + c, 0, nBands);
	const a = b + c;
	const eMaxSearch = (nBands + 1) * (nBands + 1) * zoneBoundaryEnergy(a) + v0 + 1;
	const alphaMax = Math.sqrt(eMaxSearch / HBAR2_OVER_2M0);
	const wellLevels = finiteWellLevels1D(b, v0);
	const nGrid = Math.max(700, 140 * nBands);
	const alphas = [];
	for (let i = 0; i <= nGrid; i++) alphas.push(alphaMax * i / nGrid);
	for (let j = 0; j < wellLevels.length; j++) {
		const aj = Math.sqrt(wellLevels[j].energy / HBAR2_OVER_2M0);
		alphas.push(aj);
		const prev = j > 0 ? Math.sqrt(wellLevels[j - 1].energy / HBAR2_OVER_2M0) : 0;
		const next = j + 1 < wellLevels.length ? Math.sqrt(wellLevels[j + 1].energy / HBAR2_OVER_2M0) : alphaMax;
		const spanL = .45 * (aj - prev);
		const spanR = .45 * (next - aj);
		for (let m = 0; m <= 36; m++) {
			const scale = Math.pow(2, -m);
			alphas.push(aj - spanL * scale);
			alphas.push(aj + spanR * scale);
		}
	}
	alphas.sort((x, y) => x - y);
	const uniq = [];
	for (const al of alphas) if (uniq.length === 0 || al - uniq[uniq.length - 1] > 1e-13 * (1 + al)) uniq.push(al);
	const Lalpha = (al) => kronigPenneyRectangularL(HBAR2_OVER_2M0 * al * al, b, c, v0);
	const Ls = uniq.map(Lalpha);
	const rawBands = [];
	let inBand = Math.abs(Ls[0]) <= 1;
	let curStart = inBand ? uniq[0] : 0;
	for (let i = 0; i < uniq.length - 1; i++) {
		const l0 = Ls[i];
		const l1 = Ls[i + 1];
		const in0 = Math.abs(l0) <= 1;
		const in1 = Math.abs(l1) <= 1;
		if (!in0 && !in1) {
			if (l0 * l1 < 0) {
				const s = l0 > 0 ? 1 : -1;
				const r1 = findRoot((al) => Lalpha(al) - s, uniq[i], uniq[i + 1], 1e-13);
				const r2 = findRoot((al) => Lalpha(al) + s, r1, uniq[i + 1], 1e-13);
				rawBands.push({
					lo: r1,
					hi: r2
				});
			}
			continue;
		}
		if (!in0 && in1) {
			const target = l0 > 1 ? 1 : -1;
			curStart = findRoot((al) => Lalpha(al) - target, uniq[i], uniq[i + 1], 1e-13);
			inBand = true;
			continue;
		}
		if (in0 && !in1) {
			const target = l1 > 1 ? 1 : -1;
			const end = findRoot((al) => Lalpha(al) - target, uniq[i], uniq[i + 1], 1e-13);
			rawBands.push({
				lo: curStart,
				hi: end
			});
			inBand = false;
			continue;
		}
		if (Math.abs(l0) > .85 || Math.abs(l1) > .85) {
			if ((i > 0 ? l0 - Ls[i - 1] : l1 - l0) * (i + 2 < uniq.length ? Ls[i + 2] - l1 : l1 - l0) < 0) {
				const findMax = l0 + l1 > 0;
				const ext = goldenExtremum(Lalpha, uniq[i], uniq[i + 1], findMax);
				if (Math.abs(ext.val) >= 1 - 1e-10) {
					const target = findMax ? 1 : -1;
					if (Math.abs(ext.val) > 1 + 1e-13) {
						const end1 = findRoot((al) => Lalpha(al) - target, uniq[i], ext.x, 1e-13);
						const start2 = findRoot((al) => Lalpha(al) - target, ext.x, uniq[i + 1], 1e-13);
						rawBands.push({
							lo: curStart,
							hi: end1
						});
						curStart = start2;
					} else {
						rawBands.push({
							lo: curStart,
							hi: ext.x
						});
						curStart = ext.x;
					}
				}
			}
		}
	}
	if (inBand) rawBands.push({
		lo: curStart,
		hi: uniq[uniq.length - 1]
	});
	return rawBands.slice(0, nBands).map((p, n) => {
		const lower = HBAR2_OVER_2M0 * p.lo * p.lo;
		const upper = HBAR2_OVER_2M0 * p.hi * p.hi;
		return {
			band: n,
			lower,
			upper,
			width: upper - lower,
			lowerAt: n % 2 === 0 ? "center" : "edge",
			upperAt: n % 2 === 0 ? "edge" : "center"
		};
	});
}
/** Bordi delle prime `nBands` bande per entrambi i modelli. */
function kronigPenneyBandEdges(spec, nBands) {
	return spec.variant === "delta" ? kronigPenneyDeltaBandEdges(spec.a, spec.P, nBands) : kronigPenneyRectangularBandEdges(spec.b, spec.c, spec.v0, nBands);
}
/** Estrae i gap tra bande successive dai bordi già calcolati. */
function kronigPenneyGaps(edges) {
	const gaps = [];
	for (let i = 0; i + 1 < edges.length; i++) {
		const lower = edges[i].upper;
		const upper = edges[i + 1].lower;
		gaps.push({
			index: i,
			lower,
			upper,
			width: Math.max(0, upper - lower),
			location: i % 2 === 0 ? "edge" : "center"
		});
	}
	return gaps;
}
/**
* Risolve L(E) = cos(k·a) sulla banda `band` per un vettore d'onda di Bloch `k` (Å⁻¹).
* Poiché L(E) è monotona su ciascuna banda permessa, l'inversione è univoca e regolare
* anche agli estremi k = 0 e k = ±π/a (per periodicità di cos ka).
*/
function kronigPenneyEnergyAt(spec, k, band, precomputedEdges) {
	const a = kronigPenneyPeriod(spec);
	const edge = (precomputedEdges ?? kronigPenneyBandEdges(spec, band + 1))[band];
	if (!edge) throw new RangeError(`banda ${band} non disponibile`);
	const cka = Math.cos(k * a);
	if (edge.width <= 1e-15 * Math.max(1, edge.lower)) return .5 * (edge.lower + edge.upper);
	const targetLo = band % 2 === 0 ? 1 : -1;
	const targetHi = -targetLo;
	if (Math.abs(cka - targetLo) <= 1e-14) return edge.lower;
	if (Math.abs(cka - targetHi) <= 1e-14) return edge.upper;
	return findRoot((E) => kronigPenneyL(spec, E) - cka, edge.lower, edge.upper, Math.min(1e-13, 1e-10 * edge.width + 1e-15));
}
/** Funzione E_n(k) della banda `band` (per `bandSlope`, `bandCurvature`, `effectiveMassRatio`). */
function kronigPenneyBandFunction(spec, band, precomputedEdges) {
	const edges = precomputedEdges ?? kronigPenneyBandEdges(spec, band + 1);
	return (k) => kronigPenneyEnergyAt(spec, k, band, edges);
}
/**
* Struttura a bande 1D nel formato comune `BandStructure` (compatibile con
* `fillBands`, `BandPlot` e confronto con `emptyLatticeBands`).
*/
function kronigPenneyBands(spec, path, nBands, precomputedEdges) {
	if (path.dimension !== 1) throw new RangeError("kronigPenneyBands: serve un cammino 1D");
	const a = kronigPenneyPeriod(spec);
	const edges = precomputedEdges ?? kronigPenneyBandEdges(spec, nBands);
	const nk = path.points.length;
	const energies = Array.from({ length: nBands }, () => new Float64Array(nk));
	const cache = /* @__PURE__ */ new Map();
	for (let b = 0; b < nBands; b++) {
		const edge = edges[b];
		for (let i = 0; i < nk; i++) {
			const kAbs = Math.abs(path.points[i][0]);
			const key = `${b}:${Math.round(kAbs * 0xe8d4a51000)}`;
			let E = cache.get(key);
			if (E === void 0) {
				const cka = Math.cos(kAbs * a);
				if (edge.width <= 1e-15 * Math.max(1, edge.lower)) E = .5 * (edge.lower + edge.upper);
				else {
					const targetLo = b % 2 === 0 ? 1 : -1;
					const targetHi = -targetLo;
					if (Math.abs(cka - targetLo) <= 1e-14) E = edge.lower;
					else if (Math.abs(cka - targetHi) <= 1e-14) E = edge.upper;
					else E = findRoot((val) => kronigPenneyL(spec, val) - cka, edge.lower, edge.upper, Math.min(1e-13, 1e-10 * edge.width + 1e-15));
				}
				cache.set(key, E);
			}
			energies[b][i] = E;
		}
	}
	return {
		method: "kronig-penney",
		path,
		energies
	};
}
/**
* Approssimazione a coseno per la banda `band` (P3 §10.6):
* E(k) ≈ Ē ∓ 2t·cos ka, con t = W/4 ≥ 0, W = 4t e m*(k_min) = ħ²/(2ta²).
*/
function kronigPenneyCosineApproximation(edges, a, band) {
	if (!(a > 0)) throw new RangeError(`passo a non valido: ${a}`);
	const edge = edges[band];
	if (!edge) throw new RangeError(`banda ${band} non disponibile`);
	const center = .5 * (edge.lower + edge.upper);
	const width = edge.width;
	const t = .25 * width;
	const cosSign = band % 2 === 0 ? -1 : 1;
	return {
		band,
		center,
		width,
		t,
		cosSign,
		evalAt(k) {
			return center + cosSign * 2 * t * Math.cos(k * a);
		},
		minMassRatio: t > 0 ? HBAR2_OVER_M0 / (2 * t * a * a) : Infinity,
		effectiveMassRatioAt(k) {
			const denom = -cosSign * 2 * t * a * a * Math.cos(k * a);
			return denom === 0 ? Infinity : HBAR2_OVER_M0 / denom;
		}
	};
}
/**
* Matrice di trasferimento 2×2 [ψ(d), ψ′(d)]ᵀ = T(d, E−V) [ψ(0), ψ′(0)]ᵀ
* su un tratto piatto lungo `d` (Å) con energia relativa `deltaE = E − V` (eV).
*/
function flatTransfer(d, deltaE) {
	const q2 = deltaE / HBAR2_OVER_2M0;
	if (q2 >= 0) {
		const qd = d * Math.sqrt(q2);
		const c = Math.cos(qd);
		const ds = d * sinc(qd);
		return [
			c,
			ds,
			-q2 * ds,
			c
		];
	}
	const k2 = -q2;
	const kd = d * Math.sqrt(k2);
	const c = Math.cosh(kd);
	const ds = d * sinhc(kd);
	return [
		c,
		ds,
		k2 * ds,
		c
	];
}
/**
* Calcola |ψ_k(x)|² esatta del modello di Kronig–Penney sui punti `xs` (Å),
* normalizzata in modo che la media su una cella sia 1 (come `blochDensity1D`).
* Convenzione spaziale: le buche (e gli ioni) sono centrate in x = n·a;
* le barriere (o le delta) stanno a metà tra due ioni, in x = (n + ½)a.
*/
function kronigPenneyDensity1D(spec, k, band, xs, precomputedEnergy) {
	const a = kronigPenneyPeriod(spec);
	const E = precomputedEnergy ?? kronigPenneyEnergyAt(spec, k, band);
	const b = spec.variant === "delta" ? a : spec.b;
	const c = spec.variant === "delta" ? 0 : spec.c;
	const v0 = spec.variant === "delta" ? 0 : spec.v0;
	const W = flatTransfer(b, E);
	let M11, M12, M21, M22;
	if (spec.variant === "delta") {
		const kick = 2 * spec.P / a;
		M11 = W[0];
		M12 = W[1];
		M21 = kick * W[0] + W[2];
		M22 = kick * W[1] + W[3];
	} else {
		const B = flatTransfer(c, E - v0);
		M11 = B[0] * W[0] + B[1] * W[2];
		M12 = B[0] * W[1] + B[1] * W[3];
		M21 = B[2] * W[0] + B[3] * W[2];
		M22 = B[2] * W[1] + B[3] * W[3];
	}
	const lamRe = Math.cos(k * a);
	const lamIm = Math.sin(k * a);
	const n1 = M12 * M12 + (lamRe - M11) * (lamRe - M11) + lamIm * lamIm;
	const n2 = (lamRe - M22) * (lamRe - M22) + lamIm * lamIm + M21 * M21;
	let psi0Re, psi0Im, dpsi0Re, dpsi0Im;
	if (Math.max(n1, n2) < 1e-18) {
		const alpha = Math.sqrt(Math.max(0, E) / HBAR2_OVER_2M0);
		psi0Re = 1;
		psi0Im = 0;
		dpsi0Re = 0;
		dpsi0Im = (k >= 0 ? 1 : -1) * alpha;
	} else if (n1 >= n2) {
		psi0Re = M12;
		psi0Im = 0;
		dpsi0Re = lamRe - M11;
		dpsi0Im = lamIm;
	} else {
		psi0Re = lamRe - M22;
		psi0Im = lamIm;
		dpsi0Re = M21;
		dpsi0Im = 0;
	}
	const psiBRe = W[0] * psi0Re + W[1] * dpsi0Re;
	const psiBIm = W[0] * psi0Im + W[1] * dpsi0Im;
	const dpsiBRe = W[2] * psi0Re + W[3] * dpsi0Re;
	const dpsiBIm = W[2] * psi0Im + W[3] * dpsi0Im;
	const evalAbs2AtR = (r) => {
		if (r <= b || c === 0) {
			const T = flatTransfer(r, E);
			const re = T[0] * psi0Re + T[1] * dpsi0Re;
			const im = T[0] * psi0Im + T[1] * dpsi0Im;
			return re * re + im * im;
		}
		const T = flatTransfer(r - b, E - v0);
		const re = T[0] * psiBRe + T[1] * dpsiBRe;
		const im = T[0] * psiBIm + T[1] * dpsiBIm;
		return re * re + im * im;
	};
	const nNorm = 240;
	let sum = 0;
	for (let i = 0; i < nNorm; i++) sum += evalAbs2AtR((i + .5) * a / nNorm);
	const mean = sum / nNorm;
	const invMean = mean > 0 ? 1 / mean : 1;
	const out = new Float64Array(xs.length);
	const shift = .5 * b;
	for (let i = 0; i < xs.length; i++) {
		let r = (xs[i] + shift) % a;
		if (r < 0) r += a;
		out[i] = evalAbs2AtR(r) * invMean;
	}
	return out;
}
/**
* Campiona L(E) su [eStart, eEnd] fondendo una griglia uniforme con infittimento
* dentro ciascuna banda trovata: garantisce che anche bande strettissime
* tocchino esattamente L = ±1 sul grafico di L(E).
*/
function sampleKronigConditionCurve(spec, eStart, eEnd, edges, uniformCount = 240) {
	const lo = Math.max(0, eStart);
	const hi = Math.max(lo + 1e-6, eEnd);
	const energies = [];
	for (let i = 0; i <= uniformCount; i++) energies.push(lo + (hi - lo) * i / uniformCount);
	for (const ed of edges) {
		if (ed.lower > hi) break;
		const a = Math.max(lo, ed.lower);
		const b = Math.min(hi, ed.upper);
		if (b < a) continue;
		const inner = 8;
		for (let j = 0; j <= inner; j++) energies.push(a + (b - a) * j / inner);
	}
	energies.sort((x, y) => x - y);
	const out = [];
	const eps = 1e-9 * (hi - lo);
	for (const E of energies) {
		if (out.length > 0 && E - out[out.length - 1].energy <= eps) continue;
		out.push({
			energy: E,
			L: kronigPenneyL(spec, E)
		});
	}
	return out;
}
/**
* Data un'energia E (eV) dentro una delle bande `edges`, restituisce l'indice
* di banda e |k|/(π/a) ∈ [0, 1] tramite cos(ka) = L(E); null se E è in un gap.
*/
function kronigPenneyStateFromEnergy(spec, energy, edges) {
	for (let b = 0; b < edges.length; b++) {
		const ed = edges[b];
		if (energy >= ed.lower - 1e-9 && energy <= ed.upper + 1e-9) {
			const clampedE = Math.max(ed.lower, Math.min(ed.upper, energy));
			const L = Math.max(-1, Math.min(1, kronigPenneyL(spec, clampedE)));
			const kFracAbs = Math.acos(L) / Math.PI;
			return {
				band: b,
				kFracAbs
			};
		}
	}
	return null;
}
// src/renderer/src/physics/tightBinding.ts
/** Larghezza di una banda 1D a primi vicini: W = 4|t| (P3 §12.3, P4 §1.4). */
function tightBindingBandwidth(t) {
	if (!Number.isFinite(t)) throw new RangeError(`t non valido: ${t}`);
	return 4 * Math.abs(t);
}
/** Legge esponenziale indicativa t(a) = t(a₀)·exp(−(a − a₀)/λ). */
function indicativeHoppingAtDistance(a, a0, tAtA0, lambda) {
	if (!(a > 0) || !(a0 > 0) || !(lambda > 0) || !Number.isFinite(tAtA0)) throw new RangeError("parametri non validi per indicativeHoppingAtDistance");
	return tAtA0 * Math.exp(-(a - a0) / lambda);
}
/** Inversa della legge indicativa: ricava t(a₀) dal valore corrente t(a) al passo a. */
function calibrateIndicativeHoppingAtA0(a, a0, tAtA, lambda) {
	if (!(a > 0) || !(a0 > 0) || !(lambda > 0) || !Number.isFinite(tAtA)) throw new RangeError("parametri non validi per calibrateIndicativeHoppingAtA0");
	return tAtA * Math.exp((a - a0) / lambda);
}
/** Parte reale dell'ampiezza di Bloch su un sito x: Re(c · e^{ikx}) = c · cos(kx). */
function blochSiteRealAmplitude(k, x, coefficient = 1) {
	if (!Number.isFinite(k) || !Number.isFinite(x) || !Number.isFinite(coefficient)) throw new RangeError("parametri non validi per blochSiteRealAmplitude");
	return coefficient * Math.cos(k * x);
}
/** Converte la frazione di zona k/(π/a) nel vettore d'onda k in Å⁻¹. */
function kFromZoneFraction(kFrac, a) {
	if (!Number.isFinite(kFrac)) throw new RangeError(`kFrac non valido: ${kFrac}`);
	return kFrac * zoneEdge1D(a);
}
/** Energie [E_s(k), E_p(k)] in eV per la catena monoatomica a un dato k (Å⁻¹). */
function monoatomicEnergiesAt(params, k) {
	validateMonoatomic(params);
	if (!Number.isFinite(k)) throw new RangeError(`k non valido: ${k}`);
	const c = Math.cos(k * params.a);
	return [params.centerS - 2 * params.tS * c, params.centerP + 2 * params.absTP * c];
}
/** Estremi e larghezza di una banda monoatomica s (t_s ≥ 0) o p (t_p = −|t_p| ≤ 0). */
function monoatomicBandSummary(center, tSigned) {
	if (!Number.isFinite(center) || !Number.isFinite(tSigned)) throw new RangeError("centro o t non valido");
	const absT = Math.abs(tSigned);
	return {
		center,
		tSigned,
		min: center - 2 * absT,
		max: center + 2 * absT,
		width: 4 * absT
	};
}
/**
* Gap al bordo di zona k = π/a nella catena monoatomica s–p:
* E_g(π/a) = (Ē_p − 2|t_p|) − (Ē_s + 2t_s) = (Ē_p − Ē_s) − 2(t_s + |t_p|).
* Negativo se le due bande si sovrappongono.
*/
function monoatomicGapAtZoneEdge(params) {
	validateMonoatomic(params);
	return params.centerP - params.centerS - 2 * (params.tS + params.absTP);
}
/** Distanza E_p(0) − E_s(0) al centro zona k = 0 nella catena monoatomica. */
function monoatomicCenterSeparation(params) {
	validateMonoatomic(params);
	return params.centerP + 2 * params.absTP - (params.centerS - 2 * params.tS);
}
/** Rapporto m* / m₀ analitico al fondo (k = 0) o in cima (k = ±π/a) di una banda a coseno. */
function cosineBandExtremumMassRatio(tSigned, a, at) {
	if (!(a > 0) || !Number.isFinite(tSigned) || Math.abs(tSigned) === 0) return at === "bottom" ? Infinity : -Infinity;
	const mag = HBAR2_OVER_2M0 / (Math.abs(tSigned) * a * a);
	return at === "bottom" ? mag : -mag;
}
/**
* Carattere legante/antilegante nella catena monoatomica lungo il cammino [−π/a, π/a]:
*  - banda s: cos(ka) > 0 → legante (massimo vicino a k = 0), cos(ka) < 0 → antilegante (bordo);
*  - banda p: cos(ka) < 0 → legante (bordo π/a), cos(ka) > 0 → antilegante (k = 0).
*/
function monoatomicBondingCharacter(band, k, a) {
	const c = Math.cos(k * a);
	const signed = band === "s" ? c : -c;
	if (signed > .15) return "bonding";
	if (signed < -.15) return "antibonding";
	return "mixed";
}
/** Bande [E_s, E_p] su un cammino 1D come BandStructure. */
function tightBindingMonoatomicBands(params, path) {
	validateMonoatomic(params);
	if (path.dimension !== 1) throw new RangeError("tightBindingMonoatomicBands: serve un cammino 1D");
	const n = path.points.length;
	const es = new Float64Array(n);
	const ep = new Float64Array(n);
	for (let i = 0; i < n; i++) {
		const c = Math.cos(path.points[i][0] * params.a);
		es[i] = params.centerS - 2 * params.tS * c;
		ep[i] = params.centerP + 2 * params.absTP * c;
	}
	return {
		method: "tight-binding",
		path,
		energies: [es, ep]
	};
}
/** Andamento dei bordi [sMin, sMax, pMin, pMax] in funzione di a con t(a) esponenziale indicativa. */
function monoatomicEdgesVsDistance(aValues, config) {
	return aValues.map((a) => {
		const tS = indicativeHoppingAtDistance(a, config.a0, config.tSAtA0, config.lambda);
		const absTP = indicativeHoppingAtDistance(a, config.a0, config.absTPAtA0, config.lambda);
		return {
			a,
			sMin: config.centerS - 2 * tS,
			sMax: config.centerS + 2 * tS,
			pMin: config.centerP - 2 * absTP,
			pMax: config.centerP + 2 * absTP
		};
	});
}
/**
* Stato esatto della catena biatomica A–B (P4 §2):
*  E±(k) = (E_A + E_B)/2 ± √[((E_B − E_A)/2)² + 4t²·cos²(ka/2)].
*/
function diatomicStateAt(params, k) {
	validateDiatomic(params);
	if (!Number.isFinite(k)) throw new RangeError(`k non valido: ${k}`);
	const mean = .5 * (params.eA + params.eB);
	const halfDiff = .5 * (params.eB - params.eA);
	const coupling = 2 * params.t * Math.cos(.5 * k * params.a);
	const delta = Math.hypot(halfDiff, coupling);
	const eMinus = mean - delta;
	const ePlus = mean + delta;
	let wMinus;
	let wPlus;
	if (delta === 0) {
		wMinus = {
			bA: Math.SQRT1_2,
			bB: Math.SQRT1_2,
			bA2: .5,
			bB2: .5
		};
		wPlus = {
			bA: Math.SQRT1_2,
			bB: -Math.SQRT1_2,
			bA2: .5,
			bB2: .5
		};
	} else if (Math.abs(coupling) <= 1e-12 * Math.max(1, delta)) {
		wMinus = {
			bA: 1,
			bB: 0,
			bA2: 1,
			bB2: 0
		};
		wPlus = {
			bA: 0,
			bB: 1,
			bA2: 0,
			bB2: 1
		};
	} else {
		const signC = coupling >= 0 ? 1 : -1;
		const bA2Minus = .5 * (1 + halfDiff / delta);
		const bB2Minus = Math.max(0, 1 - bA2Minus);
		wMinus = {
			bA: Math.sqrt(bA2Minus),
			bB: signC * Math.sqrt(bB2Minus),
			bA2: bA2Minus,
			bB2: bB2Minus
		};
		const bA2Plus = Math.max(0, 1 - bA2Minus);
		const bB2Plus = bA2Minus;
		wPlus = {
			bA: Math.sqrt(bA2Plus),
			bB: -signC * Math.sqrt(bB2Plus),
			bA2: bA2Plus,
			bB2: bB2Plus
		};
	}
	return {
		energies: [eMinus, ePlus],
		weights: [wMinus, wPlus]
	};
}
/** Gap al bordo di zona k = ±π/a nella catena biatomica: E_g = E_B − E_A. */
function diatomicGapAtZoneEdge(params) {
	validateDiatomic(params);
	return params.eB - params.eA;
}
/** Separazione in k = 0 tra le bande biatomiche: 2·√[¼(E_B − E_A)² + 4t²]. */
function diatomicCenterSeparation(params) {
	validateDiatomic(params);
	const diff = params.eB - params.eA;
	return 2 * Math.sqrt(.25 * diff * diff + 4 * params.t * params.t);
}
/** Larghezza esatta (uguale per valenza e conduzione) delle due bande biatomiche. */
function diatomicExactBandwidth(params) {
	validateDiatomic(params);
	const halfDiff = .5 * (params.eB - params.eA);
	return Math.hypot(halfDiff, 2 * params.t) - halfDiff;
}
/** Stima asintotica W ≃ 4t²/(E_B − E_A) valida per t ≪ E_B − E_A (P4 §2). */
function diatomicApproxBandwidth(params) {
	validateDiatomic(params);
	const diff = params.eB - params.eA;
	if (diff <= 0) return Infinity;
	return 4 * params.t * params.t / diff;
}
/**
* Massa efficace analitica al bordo di zona k = ±π/a (gap della catena biatomica):
* m*_c / m₀ = ħ²(E_B − E_A) / (2 m₀ t² a²), m*_v = −m*_c (P4 §2).
*/
function diatomicGapEffectiveMassRatio(params, band) {
	validateDiatomic(params);
	const diff = params.eB - params.eA;
	if (params.t === 0) return band === 1 ? Infinity : -Infinity;
	if (diff === 0) return 0;
	const mag = HBAR2_OVER_M0 * diff / (2 * params.t * params.t * params.a * params.a);
	return band === 1 ? mag : -mag;
}
/** Carattere legante/antilegante nella catena biatomica rispetto al legame A–B. */
function diatomicBondingCharacter(band, k, params) {
	if (Math.cos(.5 * k * params.a) < .15 && params.eB - params.eA > 1e-6) return "mixed";
	return band === 0 ? "bonding" : "antibonding";
}
/** Bande [E_-, E_+] della catena biatomica su un cammino 1D come BandStructure. */
function tightBindingDiatomicBands(params, path) {
	validateDiatomic(params);
	if (path.dimension !== 1) throw new RangeError("tightBindingDiatomicBands: serve un cammino 1D");
	const n = path.points.length;
	const eMinus = new Float64Array(n);
	const ePlus = new Float64Array(n);
	for (let i = 0; i < n; i++) {
		const st = diatomicStateAt(params, path.points[i][0]);
		eMinus[i] = st.energies[0];
		ePlus[i] = st.energies[1];
	}
	return {
		method: "tight-binding",
		path,
		energies: [eMinus, ePlus]
	};
}
/**
* Sposta tutte le bande di una BandStructure in energia così che il minimo della
* banda più bassa coincida con `targetBottom` (usato per il confronto con i quasi liberi).
*/
function alignBandStructureBottom(bands, targetBottom) {
	if (bands.energies.length === 0) return bands;
	let lowest = Infinity;
	for (const v of bands.energies[0]) if (v < lowest) lowest = v;
	const shift = targetBottom - lowest;
	const shifted = bands.energies.map((band) => {
		const out = new Float64Array(band.length);
		for (let i = 0; i < band.length; i++) out[i] = band[i] + shift;
		return out;
	});
	return {
		method: bands.method,
		path: bands.path,
		energies: shifted
	};
}
/** Orbitale 1D modello s (gaussiana normalizzata in L²(ℝ)). */
function modelOrbitalS(u, sigma) {
	return Math.pow(Math.PI * sigma * sigma, -.25) * Math.exp(-(u * u) / (2 * sigma * sigma));
}
/** Orbitale 1D modello p lungo la catena (x·gaussiana normalizzata in L²(ℝ)). */
function modelOrbitalP(u, sigma) {
	return Math.pow(4 / (Math.PI * Math.pow(sigma, 6)), .25) * u * Math.exp(-(u * u) / (2 * sigma * sigma));
}
/**
* Campiona Re ψ_k(x) e |ψ_k(x)|² per la catena monoatomica (orbitali modello s o p)
* su una griglia `xs`, normalizzando la densità in modo che la media su una cella sia 1.
*/
function monoatomicWaveSamples(a, k, band, xs) {
	if (!(a > 0) || !Number.isFinite(k)) throw new RangeError("parametri non validi per monoatomicWaveSamples");
	const sigma = band === "s" ? .31 * a : .27 * a;
	const evalPhi = band === "s" ? modelOrbitalS : modelOrbitalP;
	const nCellSamples = 96;
	let cellMean = 0;
	for (let m = 0; m < nCellSamples; m++) {
		const [re, im] = sumMonoatomicSite((m + .5) * a / nCellSamples, a, k, sigma, evalPhi);
		cellMean += re * re + im * im;
	}
	cellMean /= nCellSamples;
	const scale = cellMean > 1e-18 ? 1 / Math.sqrt(cellMean) : 1;
	const rePsi = new Float64Array(xs.length);
	const density = new Float64Array(xs.length);
	for (let i = 0; i < xs.length; i++) {
		const [re, im] = sumMonoatomicSite(xs[i], a, k, sigma, evalPhi);
		const r = re * scale;
		const imS = im * scale;
		rePsi[i] = r;
		density[i] = r * r + imS * imS;
	}
	return {
		rePsi,
		density
	};
}
/**
* Campiona Re ψ_k(x) e |ψ_k(x)|² per la catena biatomica A–B sommando gaussiane modello
* centrate su A (n·a) e B ((n+½)·a) pesate per b_A e b̃_B e normalizzate a media 1 su cella.
*/
function diatomicWaveSamples(params, k, band, xs) {
	validateDiatomic(params);
	const { bA, bB } = diatomicStateAt(params, k).weights[band];
	const sigma = .16 * params.a;
	const nCellSamples = 96;
	let cellMean = 0;
	for (let m = 0; m < nCellSamples; m++) {
		const [re, im] = sumDiatomicSite((m + .5) * params.a / nCellSamples, params.a, k, bA, bB, sigma);
		cellMean += re * re + im * im;
	}
	cellMean /= nCellSamples;
	const scale = cellMean > 1e-18 ? 1 / Math.sqrt(cellMean) : 1;
	const rePsi = new Float64Array(xs.length);
	const density = new Float64Array(xs.length);
	for (let i = 0; i < xs.length; i++) {
		const [re, im] = sumDiatomicSite(xs[i], params.a, k, bA, bB, sigma);
		const r = re * scale;
		const imS = im * scale;
		rePsi[i] = r;
		density[i] = r * r + imS * imS;
	}
	return {
		rePsi,
		density
	};
}
function sumMonoatomicSite(x, a, k, sigma, evalPhi) {
	const nCenter = Math.round(x / a);
	let re = 0;
	let im = 0;
	for (let n = nCenter - 4; n <= nCenter + 4; n++) {
		const phi = evalPhi(x - n * a, sigma);
		const phase = k * n * a;
		re += Math.cos(phase) * phi;
		im += Math.sin(phase) * phi;
	}
	return [re, im];
}
function sumDiatomicSite(x, a, k, bA, bB, sigma) {
	const nCenter = Math.round(x / a);
	let re = 0;
	let im = 0;
	for (let n = nCenter - 4; n <= nCenter + 4; n++) {
		const xA = n * a;
		const phiA = modelOrbitalS(x - xA, sigma);
		const pA = k * xA;
		re += bA * Math.cos(pA) * phiA;
		im += bA * Math.sin(pA) * phiA;
		const xB = (n + .5) * a;
		const phiB = modelOrbitalS(x - xB, sigma);
		const pB = k * xB;
		re += bB * Math.cos(pB) * phiB;
		im += bB * Math.sin(pB) * phiB;
	}
	return [re, im];
}
function validateMonoatomic(p) {
	if (!(p.a > 0)) throw new RangeError(`passo reticolare non valido: ${p.a}`);
	if (!Number.isFinite(p.centerS) || !Number.isFinite(p.centerP) || p.tS < 0 || p.absTP < 0) throw new RangeError("parametri non validi per la catena monoatomica");
}
function validateDiatomic(p) {
	if (!(p.a > 0)) throw new RangeError(`passo reticolare non valido: ${p.a}`);
	if (!Number.isFinite(p.eA) || !Number.isFinite(p.eB) || p.t < 0 || p.eB < p.eA - 1e-12) throw new RangeError("parametri non validi per la catena biatomica (serve E_B ≥ E_A, t ≥ 0)");
}
// src/renderer/src/physics/kDotP.ts
/**
* Metodo k·p vicino a Γ (dispensa P4 §3, «Il metodo k·p»; P4 formulario «Metodo k·p»):
*  - parametro ottico di Kane P e energia caratteristica E_P = 2m₀P²/ħ²;
*  - accoppiamento spin–orbita alla cima della valenza p (L = 1, S = 1/2):
*    separazione Δ = (3/2)λħ² tra J = 3/2 (hh, lh) e J = 1/2 (so);
*  - modello di Kane a quattro bande (slide 41: c, hh, lh, so);
*  - modello esatto a due bande (matrice 2×2 in k, autovalori E±, sviluppo per Pk ≪ E_g);
*  - scomposizione dei contributi a m₀/m* e verifica della formula generale
*    sugli elettroni quasi liberi al bordo di zona.
*
* Unità: k in Å⁻¹, energie (E, E_g, Δ, E_P) in eV, P in eV·Å.
* Zero delle energie nei diagrammi di Kane / due bande: cima della banda di valenza in Γ.
*/
/** Parametro ottico di Kane P = √((ħ²/2m₀)E_P) in eV·Å (P4 §3, eq. di Kane). */
function kanePFromEp(ep) {
	if (!(ep >= 0) || !Number.isFinite(ep)) throw new RangeError(`E_P non valido: ${ep}`);
	return Math.sqrt(HBAR2_OVER_2M0 * ep);
}
/** Energia caratteristica di Kane E_P = 2m₀P²/ħ² in eV. */
function kaneEpFromP(p) {
	if (!(p >= 0) || !Number.isFinite(p)) throw new RangeError(`P di Kane non valido: ${p}`);
	return p * p / HBAR2_OVER_2M0;
}
/** Cammino simmetrico in 1D attorno a Γ, −kMax ≤ k ≤ kMax in Å⁻¹ (con k = 0 incluso). */
function kDotPPath1D(kMax, nPoints = 241) {
	if (!(kMax > 0) || !Number.isFinite(kMax)) throw new RangeError(`kMax non valido: ${kMax}`);
	if (!Number.isInteger(nPoints) || nPoints < 5 || nPoints % 2 === 0) throw new RangeError(`nPoints deve essere un intero dispari ≥ 5: ${nPoints}`);
	const halfSegments = (nPoints - 1) / 2;
	return kPathFromVertices([
		{
			label: "−k_max",
			k: [
				-kMax,
				0,
				0
			]
		},
		{
			label: "Γ",
			k: [
				0,
				0,
				0
			]
		},
		{
			label: "+k_max",
			k: [
				kMax,
				0,
				0
			]
		}
	], halfSegments, 1);
}
/**
* Schema dei livelli in Γ senza e con spin–orbita H_so = λ L·S (P4 §3, fig. 3.1a / slide 42):
*  - Δ = (3/2)λħ² ⇒ λħ² = (2/3)Δ;
*  - L = 1, S = 1/2: J = 3/2 (4 stati, +½λħ² = +Δ/3) e J = 1/2 (2 stati, −λħ² = −2Δ/3);
*  - stati s (L = 0): L·S = 0, nessuna separazione.
*/
function spinOrbitGammaLevels(eg, delta) {
	validateKane({
		eg,
		delta,
		ep: 0
	});
	const lambdaHbar2 = 2 * delta / 3;
	const j32Shift = .5 * lambdaHbar2;
	const j12Shift = delta === 0 ? 0 : -lambdaHbar2;
	const barycenterCheck = 4 * j32Shift + 2 * j12Shift;
	const pBarycenter = delta === 0 ? 0 : -delta / 3;
	return {
		eg,
		delta,
		lambdaHbar2,
		j32Shift,
		j12Shift,
		pBarycenterRelativeToVbm: pBarycenter,
		barycenterCheck,
		withoutSo: [{
			id: "c-unsplit",
			label: "c (L=0)",
			orbital: "s",
			jLabel: "S = ½",
			mjLabel: "±½",
			states: 2,
			shiftFromBarycenter: 0,
			energyRelativeToVbm: eg,
			bandRole: "c"
		}, {
			id: "v-unsplit",
			label: "p (L=1)",
			orbital: "p",
			jLabel: "L = 1",
			mjLabel: "0, ±1 (×2)",
			states: 6,
			shiftFromBarycenter: 0,
			energyRelativeToVbm: pBarycenter,
			bandRole: "hh"
		}],
		withSo: [
			{
				id: "c",
				label: "c",
				orbital: "s",
				jLabel: "J = ½",
				mjLabel: "±½",
				states: 2,
				shiftFromBarycenter: 0,
				energyRelativeToVbm: eg,
				bandRole: "c"
			},
			{
				id: "hh",
				label: "hh",
				orbital: "p",
				jLabel: "J = 3/2",
				mjLabel: "±3/2",
				states: 2,
				shiftFromBarycenter: j32Shift,
				energyRelativeToVbm: 0,
				bandRole: "hh"
			},
			{
				id: "lh",
				label: "lh",
				orbital: "p",
				jLabel: "J = 3/2",
				mjLabel: "±1/2",
				states: 2,
				shiftFromBarycenter: j32Shift,
				energyRelativeToVbm: 0,
				bandRole: "lh"
			},
			{
				id: "so",
				label: "so",
				orbital: "p",
				jLabel: "J = 1/2",
				mjLabel: "±1/2",
				states: 2,
				shiftFromBarycenter: j12Shift,
				energyRelativeToVbm: -delta,
				bandRole: "so"
			}
		]
	};
}
/** Masse efficaci del modello a 4 bande di Kane (P4 §3, slide 41). */
function kaneEffectiveMasses(params) {
	validateKane(params);
	const { eg, delta, ep } = params;
	const invMc = 1 + ep / 3 * (2 / eg + 1 / (eg + delta));
	const invMhh = 1;
	const invMlh = 1 + 2 * ep / (3 * eg);
	const invMso = 1 + ep / (3 * (eg + delta));
	return {
		mc: 1 / invMc,
		mhh: 1,
		mlh: 1 / invMlh,
		mso: 1 / invMso,
		invMc,
		invMhh,
		invMlh,
		invMso,
		pKane: kanePFromEp(ep)
	};
}
/**
* Energie delle 4 bande di Kane in k (Å⁻¹), nell'ordine [so, lh, hh, c] (slide 41):
*  - E_so = −Δ − ħ²k²/2m₀ − P²k² / [3(E_g + Δ)]
*  - E_lh = −ħ²k²/2m₀ − 2P²k² / (3E_g)
*  - E_hh = −ħ²k²/2m₀
*  - E_c  = E_g + ħ²k²/2m₀ + (P²k²/3)(2/E_g + 1/(E_g + Δ))
*/
function kaneEnergiesAt(params, k) {
	validateKane(params);
	if (!Number.isFinite(k)) throw new RangeError(`k non valido: ${k}`);
	const { eg, delta, ep } = params;
	const free = HBAR2_OVER_2M0 * k * k;
	const pk2 = free * ep;
	return [
		-delta - free - pk2 / (3 * (eg + delta)),
		-free - 2 * pk2 / (3 * eg),
		-free,
		eg + free + pk2 / 3 * (2 / eg + 1 / (eg + delta))
	];
}
/** Struttura a bande del modello di Kane [so, lh, hh, c] lungo `path`. */
function kaneBands(params, path) {
	if (path.dimension !== 1) throw new RangeError("kaneBands: serve un cammino 1D");
	validateKane(params);
	const nPts = path.points.length;
	const eSo = new Float64Array(nPts);
	const eLh = new Float64Array(nPts);
	const eHh = new Float64Array(nPts);
	const eC = new Float64Array(nPts);
	for (let i = 0; i < nPts; i++) {
		const [so, lh, hh, c] = kaneEnergiesAt(params, path.points[i][0]);
		eSo[i] = so;
		eLh[i] = lh;
		eHh[i] = hh;
		eC[i] = c;
	}
	return {
		method: "k-dot-p",
		path,
		energies: [
			eSo,
			eLh,
			eHh,
			eC
		]
	};
}
/** Parabola dell'elettrone libero dal fondo della conduzione E_g + ħ²k²/2m₀ (confronto per Kane). */
function kaneConductionFreeParabola(eg, path) {
	if (path.dimension !== 1) throw new RangeError("kaneConductionFreeParabola: serve un cammino 1D");
	if (!(eg > 0) || !Number.isFinite(eg)) throw new RangeError(`E_g non valido: ${eg}`);
	const eFree = new Float64Array(path.points.length);
	for (let i = 0; i < path.points.length; i++) {
		const k = path.points[i][0];
		eFree[i] = eg + HBAR2_OVER_2M0 * k * k;
	}
	return {
		method: "empty-lattice",
		path,
		energies: [eFree]
	};
}
/** Soglia indicativa in k (Å⁻¹) oltre cui |P·k| = E_g/2 e il modello a due bande si stacca dalla parabola. */
function twoBandValidityLimitK(eg, ep) {
	validateTwoBand({
		eg,
		ep
	});
	if (ep === 0) return Infinity;
	return eg / (2 * kanePFromEp(ep));
}
/**
* Modello esatto a due bande senza spin–orbita (P4 §3, approfondimento «modello a due bande»):
* autovalori della matrice H = [[E_g, Pk], [Pk, 0]] + ħ²k²/2m₀, più le due valenze |X⟩, |Y⟩ non accoppiate (+ħ²k²/2m₀).
*/
function twoBandStateAt(params, k) {
	validateTwoBand(params);
	if (!Number.isFinite(k)) throw new RangeError(`k non valido: ${k}`);
	const { eg, ep } = params;
	const free = HBAR2_OVER_2M0 * k * k;
	const pk2 = free * ep;
	const halfEg = .5 * eg;
	const root = Math.sqrt(halfEg * halfEg + pk2);
	const eMinus = free + halfEg - root;
	const ePlus = free + halfEg + root;
	const eHhUncoupled = free;
	const cPar = eg + free + pk2 / eg;
	const lhPar = free - pk2 / eg;
	const pkOverHalfEg = Math.sqrt(pk2) / halfEg;
	return {
		energies: [
			eMinus,
			eHhUncoupled,
			ePlus
		],
		parabolic: {
			c: cPar,
			lh: lhPar
		},
		pkOverHalfEg,
		withinValidity: pkOverHalfEg < 1
	};
}
/** Struttura a bande del modello esatto a due bande: [lh (E_-), valenza non accoppiata (|X⟩,|Y⟩), c (E_+)]. */
function twoBandExactBands(params, path) {
	if (path.dimension !== 1) throw new RangeError("twoBandExactBands: serve un cammino 1D");
	validateTwoBand(params);
	const nPts = path.points.length;
	const eLh = new Float64Array(nPts);
	const eHh = new Float64Array(nPts);
	const eC = new Float64Array(nPts);
	for (let i = 0; i < nPts; i++) {
		const s = twoBandStateAt(params, path.points[i][0]);
		eLh[i] = s.energies[0];
		eHh[i] = s.energies[1];
		eC[i] = s.energies[2];
	}
	return {
		method: "k-dot-p",
		path,
		energies: [
			eLh,
			eHh,
			eC
		]
	};
}
/** Parabole di massa efficace in Γ del modello a due bande: [E_lh^par, E_hh^free, E_c^par]. */
function twoBandParabolicBands(params, path) {
	if (path.dimension !== 1) throw new RangeError("twoBandParabolicBands: serve un cammino 1D");
	validateTwoBand(params);
	const nPts = path.points.length;
	const eLh = new Float64Array(nPts);
	const eHh = new Float64Array(nPts);
	const eC = new Float64Array(nPts);
	for (let i = 0; i < nPts; i++) {
		const s = twoBandStateAt(params, path.points[i][0]);
		eLh[i] = s.parabolic.lh;
		eHh[i] = s.energies[1];
		eC[i] = s.parabolic.c;
	}
	return {
		method: "k-dot-p",
		path,
		energies: [
			eLh,
			eHh,
			eC
		]
	};
}
/**
* Scomposizione di m₀/m* nei suoi addendi per la variante di Kane (slide 41):
*  - conduzione c: +1 (libero) + (2E_P/3)/E_g (da lh) + (E_P/3)/(E_g+Δ) (da so);
*  - lacune pesanti hh: −1 (termine libero slide 41) + 0 (nessuna banda accoppiata);
*  - lacune leggere lh: −1 (termine libero slide 41) − (2E_P/3)/E_g (da c sopra);
*  - split-off so: −1 (termine libero slide 41) − (E_P/3)/(E_g+Δ) (da c sopra).
*/
function kaneMassBreakdown(params, role) {
	validateKane(params);
	const { eg, delta, ep } = params;
	const cFromLh = 2 * ep / (3 * eg);
	const cFromSo = ep / (3 * (eg + delta));
	let terms;
	let convention = "standard";
	if (role === "c") terms = [
		{
			source: "free",
			value: 1
		},
		{
			source: "lh",
			value: cFromLh
		},
		{
			source: "so",
			value: cFromSo
		}
	];
	else if (role === "hh") {
		convention = "kittel-valence-flip";
		terms = [{
			source: "free",
			value: -1
		}];
	} else if (role === "lh") {
		convention = "kittel-valence-flip";
		terms = [{
			source: "free",
			value: -1
		}, {
			source: "c",
			value: -cFromLh
		}];
	} else {
		convention = "kittel-valence-flip";
		terms = [{
			source: "free",
			value: -1
		}, {
			source: "c",
			value: -cFromSo
		}];
	}
	const totalInvMass = terms.reduce((acc, t) => acc + t.value, 0);
	const eff = 1 / totalInvMass;
	return {
		totalInvMass,
		effectiveMassRatio: eff,
		massMagnitude: Math.abs(eff),
		freeTermConvention: convention,
		terms
	};
}
/**
* Scomposizione esatta di m₀/m*(k) = (d²E/dk²)/(ħ²/m₀) nel modello a due bande:
*  - c (E_+): +1 (libero) + (E_P/E_g)·[1 + 4P²k²/E_g²]^(−3/2) (da lh sotto);
*  - lh (E_-): +1 (libero) − (E_P/E_g)·[1 + 4P²k²/E_g²]^(−3/2) (da c sopra);
*  - valenze non accoppiate (|X⟩,|Y⟩): +1 (libero) + 0.
*/
function twoBandMassBreakdown(params, role, k = 0) {
	validateTwoBand(params);
	if (!Number.isFinite(k)) throw new RangeError(`k non valido: ${k}`);
	const { eg, ep } = params;
	const pk2 = HBAR2_OVER_2M0 * ep * k * k;
	const factor = Math.pow(1 + 4 * pk2 / (eg * eg), -1.5);
	const coupling = ep / eg * factor;
	const terms = role === "c" ? [{
		source: "free",
		value: 1
	}, {
		source: "lh",
		value: coupling
	}] : role === "lh" ? [{
		source: "free",
		value: 1
	}, {
		source: "c",
		value: -coupling
	}] : [{
		source: "free",
		value: 1
	}];
	const totalInvMass = terms.reduce((acc, t) => acc + t.value, 0);
	const eff = totalInvMass === 0 ? Infinity : 1 / totalInvMass;
	return {
		totalInvMass,
		effectiveMassRatio: eff,
		massMagnitude: Math.abs(eff),
		freeTermConvention: "standard",
		terms
	};
}
/** Modulo quadro |⟨ψ_A|p̂_x|ψ_B⟩|² / ħ² in Å⁻² fra due bande di una soluzione a onde piane in 1D. */
function planeWaveMomentumElementSq(solution, bandA, bandB) {
	if (!solution.coefficients) throw new Error("Servono gli autostati (coefficients: true)");
	const vA = eigenvector(solution.coefficients, bandA);
	const vB = eigenvector(solution.coefficients, bandB);
	const G = 2 * Math.PI / solution.a;
	let re = 0;
	let im = 0;
	for (let i = 0; i < solution.g.length; i++) {
		const q = solution.k + solution.g[i] * G;
		const ar = vA.re[i];
		const ai = vA.im ? vA.im[i] : 0;
		const br = vB.re[i];
		const bi = vB.im ? vB.im[i] : 0;
		re += (ar * br + ai * bi) * q;
		im += (ar * bi - ai * br) * q;
	}
	return re * re + im * im;
}
/**
* Applicazione della formula generale m₀/m*_n = 1 + (2/m₀) Σ_{j≠n} |⟨ψ_n|p̂|ψ_j⟩|² / (E_n − E_j)
* alle bande degli elettroni quasi liberi in k₀ (default: bordo di zona π/a; dispensa P4 §3, verifica_kp.py).
*/
function nearlyFreeKpVerification(potential, k0 = zoneEdge1D(potential.a), band = 1, planeWaves = 41) {
	const sol = solveCentralEquation1D(potential, k0, {
		planeWaves,
		coefficients: true
	});
	const kb = zoneEdge1D(potential.a);
	const e0 = HBAR2_OVER_2M0 * kb * kb;
	const gapAtZoneEdge = sol.energies[1] - sol.energies[0];
	const invMassTwoBand = band === 1 ? 1 + 4 * e0 / gapAtZoneEdge : 1 - 4 * e0 / gapAtZoneEdge;
	const terms = [];
	let sum = 0;
	for (let j = 0; j < planeWaves; j++) {
		if (j === band) continue;
		const momentumSq = planeWaveMomentumElementSq(sol, band, j);
		const energyDiff = sol.energies[band] - sol.energies[j];
		const invMassContribution = 2 * HBAR2_OVER_M0 * momentumSq / energyDiff;
		sum += invMassContribution;
		terms.push({
			bandIndex: j,
			energy: sol.energies[j],
			momentumSq,
			energyDiff,
			invMassContribution
		});
	}
	terms.sort((a, b) => Math.abs(b.invMassContribution) - Math.abs(a.invMassContribution));
	const invMassExact = inverseEffectiveMassRatio(centralEquationBand(potential, band, {
		planeWaves,
		basisK: k0
	}), k0);
	const p01Abs = Math.sqrt(planeWaveMomentumElementSq(sol, 0, 1));
	return {
		k0,
		band,
		energy: sol.energies[band],
		gapAtZoneEdge,
		e0,
		invMassSum: 1 + sum,
		invMassExact,
		invMassTwoBand,
		p01Abs,
		terms
	};
}
function validateKane(p) {
	if (!(p.eg > 0) || !Number.isFinite(p.eg)) throw new RangeError(`E_g non valido: ${p.eg}`);
	if (!(p.delta >= 0) || !Number.isFinite(p.delta)) throw new RangeError(`Δ non valido: ${p.delta}`);
	if (!(p.ep >= 0) || !Number.isFinite(p.ep)) throw new RangeError(`E_P non valido: ${p.ep}`);
}
function validateTwoBand(p) {
	if (!(p.eg > 0) || !Number.isFinite(p.eg)) throw new RangeError(`E_g non valido: ${p.eg}`);
	if (!(p.ep >= 0) || !Number.isFinite(p.ep)) throw new RangeError(`E_P non valido: ${p.ep}`);
}
// src/renderer/src/physics/pseudopotential.ts
/**
* Metodo dello pseudopotenziale empirico (EPM) per cristalli fcc a base di due atomi
* (diamante e zincoblenda) lungo L–Γ–X–W–K–Γ, più curve di modello dello ione
* schermato, stima dello ione nudo e limite q → 0 di Thomas–Fermi (dispensa P4 §4, §5.4).
*
* Unità: lunghezze in Å, vettori d'onda in Å⁻¹, energie in eV; fattori di forma in Ry.
*/
/** Raggio di Bohr a₀ (Å) e costante coulombiana e²/(4πε₀) (eV·Å) da verifica_pseudo.py. */
const BOHR_RADIUS_ANG = .529177;
const E2_OVER_4PI_EPS0 = 14.39964;
/** Vertici adimensionali del percorso standard in unità di 2π/a (L–Γ–X–W–K–Γ). */
const EPM_PATH_VERTICES_DIMLESS = [
	{
		label: "L",
		k: [
			.5,
			.5,
			.5
		]
	},
	{
		label: "Γ",
		k: [
			0,
			0,
			0
		]
	},
	{
		label: "X",
		k: [
			1,
			0,
			0
		]
	},
	{
		label: "W",
		k: [
			1,
			.5,
			0
		]
	},
	{
		label: "K",
		k: [
			.75,
			.75,
			0
		]
	},
	{
		label: "Γ",
		k: [
			0,
			0,
			0
		]
	}
];
/**
* Tutti i vettori reciproci fcc (h, k, l) con h ≡ k ≡ l (mod 2) in unità di 2π/a
* e |G|² = h² + k² + l² ≤ gMaxSq. Ordinati per guscio crescente (|G|²).
*/
function fccReciprocalVectors(gMaxSq = 21) {
	if (!Number.isFinite(gMaxSq) || gMaxSq < 0) throw new RangeError(`taglio |G|² non valido: ${gMaxSq}`);
	const bound = Math.ceil(Math.sqrt(gMaxSq)) + 1;
	const out = [];
	for (let h = -bound; h <= bound; h++) for (let k = -bound; k <= bound; k++) for (let l = -bound; l <= bound; l++) if ((h & 1) === (k & 1) && (h & 1) === (l & 1)) {
		const gSq = h * h + k * k + l * l;
		if (gSq <= gMaxSq) out.push({
			h,
			k,
			l,
			gSq
		});
	}
	out.sort((a, b) => a.gSq - b.gSq || a.h - b.h || a.k - b.k || a.l - b.l);
	return out;
}
/** Conteggio dei vettori in ciascun guscio di |G|² (es. 0→1, 3→8, 4→6, 8→12, 11→24). */
function fccShellCounts(gMaxSq = 21) {
	const counts = /* @__PURE__ */ new Map();
	for (const g of fccReciprocalVectors(gMaxSq)) counts.set(g.gSq, (counts.get(g.gSq) ?? 0) + 1);
	return counts;
}
/** Percorso L–Γ–X–W–K–Γ in coordinate cartesiane (Å⁻¹) per il passo `a` (Å). */
function epmBrillouinPath(a, pointsPerSegment = 40) {
	if (!(a > 0) || !Number.isFinite(a)) throw new RangeError(`passo reticolare non valido: ${a}`);
	const scale = 2 * Math.PI / a;
	return kPathFromVertices(EPM_PATH_VERTICES_DIMLESS.map((v) => ({
		label: v.label,
		k: [
			v.k[0] * scale,
			v.k[1] * scale,
			v.k[2] * scale
		]
	})), pointsPerSegment, 3);
}
function buildPotentialTemplate(formFactors, gMaxSq) {
	const G = fccReciprocalVectors(gMaxSq);
	const n = G.length;
	const vRe = new Float64Array(n * n);
	const vIm = new Float64Array(n * n);
	const { v3s, v8s, v11s, v3a, v4a, v11a } = formFactors;
	const hasAntisymmetric = Math.abs(v3a) > 0 || Math.abs(v4a) > 0 || Math.abs(v11a) > 0;
	for (let i = 0; i < n; i++) {
		const gi = G[i];
		for (let j = i + 1; j < n; j++) {
			const gj = G[j];
			const dx = gi.h - gj.h;
			const dy = gi.k - gj.k;
			const dz = gi.l - gj.l;
			const q2 = dx * dx + dy * dy + dz * dz;
			let vs = 0;
			if (q2 === 3) vs = v3s;
			else if (q2 === 8) vs = v8s;
			else if (q2 === 11) vs = v11s;
			let va = 0;
			if (hasAntisymmetric) {
				if (q2 === 3) va = v3a;
				else if (q2 === 4) va = v4a;
				else if (q2 === 11) va = v11a;
			}
			if (vs !== 0 || va !== 0) {
				const phase = Math.PI / 4 * (dx + dy + dz);
				const re = vs * Math.cos(phase) * RYDBERG_EV;
				const im = va * Math.sin(phase) * RYDBERG_EV;
				vRe[i * n + j] = re;
				vRe[j * n + i] = re;
				vIm[i * n + j] = im;
				vIm[j * n + i] = -im;
			}
		}
	}
	return {
		planeWaves: n,
		G,
		hasAntisymmetric,
		vRe,
		vIm
	};
}
/**
* Costruisce la matrice hamiltoniana dello pseudopotenziale H(k) = diag(E_{k+G}) + V_ps
* nel punto `kCart` (Å⁻¹). Ritorna una matrice reale simmetrica se Vᵃ = 0, altrimenti
* hermitiana complessa.
*/
function pseudopotentialHamiltonian(params, kCart, gMaxSq = 21) {
	validateEpmParams(params);
	return assembleHamiltonianAt(buildPotentialTemplate(params.formFactors, gMaxSq), params.a, kCart);
}
function assembleHamiltonianAt(tpl, a, kCart) {
	const n = tpl.planeWaves;
	const b = 2 * Math.PI / a;
	const kx = kCart[0];
	const ky = kCart[1];
	const kz = kCart[2];
	if (!tpl.hasAntisymmetric) {
		const H = realSymmetricMatrix(n);
		H.data.set(tpl.vRe);
		for (let i = 0; i < n; i++) {
			const g = tpl.G[i];
			const qx = kx + g.h * b;
			const qy = ky + g.k * b;
			const qz = kz + g.l * b;
			H.data[i * n + i] = HBAR2_OVER_2M0 * (qx * qx + qy * qy + qz * qz);
		}
		return H;
	}
	const H = complexHermitianMatrix(n);
	H.re.set(tpl.vRe);
	H.im.set(tpl.vIm);
	for (let i = 0; i < n; i++) {
		const g = tpl.G[i];
		const qx = kx + g.h * b;
		const qy = ky + g.k * b;
		const qz = kz + g.l * b;
		H.re[i * n + i] = HBAR2_OVER_2M0 * (qx * qx + qy * qy + qz * qz);
	}
	return H;
}
/**
* Calcola le prime `numBands` bande dello pseudopotenziale lungo `path` (di default L–Γ–X–W–K–Γ).
* Usa `vectors: false` su tutti i punti per massime prestazioni interattive.
*/
function pseudopotentialBands(params, options = {}, customPath) {
	validateEpmParams(params);
	const gMaxSq = options.gMaxSq ?? 21;
	const pointsPerSegment = options.pointsPerSegment ?? 40;
	const numBands = options.numBands ?? 8;
	const zeroAtValenceTop = options.zeroAtValenceTop ?? true;
	const path = customPath ?? epmBrillouinPath(params.a, pointsPerSegment);
	const tpl = buildPotentialTemplate(params.formFactors, gMaxSq);
	if (tpl.planeWaves < numBands) throw new RangeError(`onde piane (${tpl.planeWaves}) insufficienti per ${numBands} bande`);
	const nPts = path.points.length;
	const energies = Array.from({ length: numBands }, () => new Float64Array(nPts));
	for (let i = 0; i < nPts; i++) {
		const { values } = eigh(assembleHamiltonianAt(tpl, params.a, path.points[i]), { vectors: false });
		for (let b = 0; b < numBands; b++) energies[b][i] = values[b];
	}
	if (zeroAtValenceTop && numBands >= 4) {
		let vbm = -Infinity;
		const vTop = energies[3];
		for (let i = 0; i < nPts; i++) if (vTop[i] > vbm) vbm = vTop[i];
		for (let b = 0; b < numBands; b++) {
			const arr = energies[b];
			for (let i = 0; i < nPts; i++) arr[i] -= vbm;
		}
	}
	return {
		method: "pseudopotential",
		path,
		energies
	};
}
/** Bande del reticolo vuoto fcc (V_ps = 0) sullo stesso percorso L–Γ–X–W–K–Γ. */
function emptyLatticeFccBands(a, options = {}, customPath) {
	if (!(a > 0) || !Number.isFinite(a)) throw new RangeError(`passo reticolare non valido: ${a}`);
	const gMaxSq = options.gMaxSq ?? 21;
	const pointsPerSegment = options.pointsPerSegment ?? 40;
	const numBands = options.numBands ?? 8;
	const path = customPath ?? epmBrillouinPath(a, pointsPerSegment);
	const G = fccReciprocalVectors(gMaxSq);
	const b = 2 * Math.PI / a;
	const nPts = path.points.length;
	const energies = Array.from({ length: numBands }, () => new Float64Array(nPts));
	const vals = new Float64Array(G.length);
	for (let i = 0; i < nPts; i++) {
		const [kx, ky, kz] = path.points[i];
		for (let m = 0; m < G.length; m++) {
			const g = G[m];
			const qx = kx + g.h * b;
			const qy = ky + g.k * b;
			const qz = kz + g.l * b;
			vals[m] = HBAR2_OVER_2M0 * (qx * qx + qy * qy + qz * qz);
		}
		vals.sort();
		for (let band = 0; band < numBands; band++) energies[band][i] = vals[band];
	}
	return {
		method: "empty-lattice",
		path,
		energies
	};
}
/**
* Calcola autovettore e pesi per guscio ∑_{|G|²=s} |c_G|² nel singolo punto `kCart`
* per la banda `bandIndex` (0..numBands-1), così l'istogramma si aggiorna sul solo stato scelto.
*/
function pseudopotentialStateAt(params, kCart, bandIndex, gMaxSq = 21, numBands = 8, vbmShiftEv = 0) {
	validateEpmParams(params);
	const tpl = buildPotentialTemplate(params.formFactors, gMaxSq);
	if (!Number.isInteger(bandIndex) || bandIndex < 0 || bandIndex >= tpl.planeWaves) throw new RangeError(`indice di banda non valido: ${bandIndex}`);
	const { values, vectors } = eigh(assembleHamiltonianAt(tpl, params.a, kCart), { vectors: true });
	const energies = new Float64Array(Math.min(numBands, tpl.planeWaves));
	for (let b = 0; b < energies.length; b++) energies[b] = values[b] - vbmShiftEv;
	const weightsMap = /* @__PURE__ */ new Map();
	if (vectors) {
		const vec = eigenvector(vectors, bandIndex);
		for (let m = 0; m < tpl.planeWaves; m++) {
			const re = vec.re[m];
			const im = vec.im ? vec.im[m] : 0;
			const w = re * re + im * im;
			const gSq = tpl.G[m].gSq;
			const cur = weightsMap.get(gSq);
			if (cur) {
				cur.weight += w;
				cur.count += 1;
			} else weightsMap.set(gSq, {
				weight: w,
				count: 1
			});
		}
	}
	return {
		energies,
		shellWeights: Array.from(weightsMap.entries()).sort((x, y) => x[0] - y[0]).map(([gSq, { weight, count }]) => ({
			gSq,
			weight,
			planeWaveCount: count
		})),
		planeWaves: tpl.planeWaves
	};
}
/** Versore unitario del tratto del percorso a cui appartiene `pointIndex`. */
function epmSegmentDirection(path, pointIndex) {
	const n = path.points.length;
	if (n < 2) return [
		1,
		0,
		0
	];
	const i0 = pointIndex >= n - 1 ? n - 2 : pointIndex;
	const i1 = i0 + 1;
	const p0 = path.points[i0];
	const p1 = path.points[i1];
	const dx = p1[0] - p0[0];
	const dy = p1[1] - p0[1];
	const dz = p1[2] - p0[2];
	const norm = Math.hypot(dx, dy, dz) || 1;
	return [
		dx / norm,
		dy / norm,
		dz / norm
	];
}
/**
* Derivate prima e seconda direzionali della banda `bandIndex` lungo il versore
* unitario `dirUnit` del tratto corrente (differenze centrate esatte con passo h).
*/
function epmDirectionalKinematics(params, kCart, dirUnit, bandIndex, gMaxSq = 21, h = .0015) {
	validateEpmParams(params);
	const tpl = buildPotentialTemplate(params.formFactors, gMaxSq);
	const norm = Math.hypot(dirUnit[0], dirUnit[1], dirUnit[2]) || 1;
	const ux = dirUnit[0] / norm;
	const uy = dirUnit[1] / norm;
	const uz = dirUnit[2] / norm;
	const evalBand = (t) => {
		return eigh(assembleHamiltonianAt(tpl, params.a, [
			kCart[0] + t * ux,
			kCart[1] + t * uy,
			kCart[2] + t * uz
		]), { vectors: false }).values[bandIndex];
	};
	const eMinus = evalBand(-h);
	const eZero = evalBand(0);
	const ePlus = evalBand(h);
	const slope = (ePlus - eMinus) / (2 * h);
	const curvature = (ePlus - 2 * eZero + eMinus) / (h * h);
	return {
		slope,
		curvature,
		effectiveMassRatio: 2 * HBAR2_OVER_2M0 / curvature
	};
}
/** Estrae VBM, CBM, gap assoluto (diretto/indiretto), posizione lungo ΓX e larghezza di valenza. */
function analyzeEpmBands(bands, rawBands, planeWaves = 113) {
	if (bands.energies.length < 5) throw new RangeError("servono almeno 5 bande (4 di valenza + 1 di conduzione)");
	const vTop = bands.energies[3];
	const cBot = bands.energies[4];
	const vBot = bands.energies[0];
	const nPts = vTop.length;
	let vbmIndex = 0;
	let vbmEnergy = vTop[0];
	let cbmIndex = 0;
	let cbmEnergy = cBot[0];
	let valenceBottom = vBot[0];
	for (let i = 1; i < nPts; i++) {
		if (vTop[i] > vbmEnergy) {
			vbmEnergy = vTop[i];
			vbmIndex = i;
		}
		if (cBot[i] < cbmEnergy) {
			cbmEnergy = cBot[i];
			cbmIndex = i;
		}
		if (vBot[i] < valenceBottom) valenceBottom = vBot[i];
	}
	const labels = bands.path.labels;
	const iL = labels[0]?.index ?? 0;
	const iG = labels[1]?.index ?? 0;
	const iX = labels[2]?.index ?? Math.min(nPts - 1, 2);
	let segStart = 0;
	let segEnd = nPts - 1;
	for (let s = 0; s < labels.length - 1; s++) if (cbmIndex >= labels[s].index && cbmIndex <= labels[s + 1].index) {
		segStart = labels[s].index;
		segEnd = labels[s + 1].index;
		break;
	}
	const dSeg = bands.path.distance[segEnd] - bands.path.distance[segStart];
	const cbmSegmentFraction = dSeg > 0 ? (bands.path.distance[cbmIndex] - bands.path.distance[segStart]) / dSeg : 0;
	const isDirect = cbmIndex === vbmIndex || Math.hypot(bands.path.points[cbmIndex][0] - bands.path.points[vbmIndex][0], bands.path.points[cbmIndex][1] - bands.path.points[vbmIndex][1], bands.path.points[cbmIndex][2] - bands.path.points[vbmIndex][2]) < 1e-6;
	let cbmDescription = "altro";
	if (cbmIndex === iG) cbmDescription = "Γ";
	else if (cbmIndex === iL) cbmDescription = "L";
	else if (cbmIndex === iX) cbmDescription = "X";
	else if (cbmIndex > iG && cbmIndex < iX) cbmDescription = "ΓX";
	let rawVbmEv = 0;
	if (rawBands && rawBands.energies[3]) {
		rawVbmEv = -Infinity;
		for (let i = 0; i < nPts; i++) if (rawBands.energies[3][i] > rawVbmEv) rawVbmEv = rawBands.energies[3][i];
	}
	return {
		planeWaves,
		vbmEnergy,
		vbmIndex,
		cbmEnergy,
		cbmIndex,
		gap: cbmEnergy - vbmEnergy,
		isDirect,
		cbmDescription,
		cbmSegmentFraction,
		ecGamma: cBot[iG],
		ecX: cBot[iX],
		ecL: cBot[iL],
		valenceBottom,
		valenceWidth: vbmEnergy - valenceBottom,
		rawVbmEv
	};
}
/**
* Stima di Ashcroft–Mermin (P4 §4, eq. 11.4) del modulo |V_G| (eV) dello ione nudo
* nel reticolo del diamante (8 atomi per cella cubica, Ω = a³/8):
* |V_G| = Z · 4π (e²/4πε₀) / (Ω G²).
*/
function bareIonFourierAmplitudeEv(a, atomicNumberZ, gSqDimless) {
	if (!(a > 0) || !Number.isFinite(a)) throw new RangeError(`passo reticolare non valido: ${a}`);
	if (!(atomicNumberZ > 0) || !Number.isFinite(atomicNumberZ)) throw new RangeError(`numero atomico non valido: ${atomicNumberZ}`);
	if (!(gSqDimless > 0) || !Number.isFinite(gSqDimless)) throw new RangeError(`|G|² non valido: ${gSqDimless}`);
	const omegaAtom = a * a * a / 8;
	const b = 2 * Math.PI / a;
	const g2 = gSqDimless * b * b;
	return atomicNumberZ * 4 * Math.PI * E2_OVER_4PI_EPS0 / (omegaAtom * g2);
}
/** Limite q → 0 dello pseudopotenziale schermato alla Thomas–Fermi: v(0) = −⅔ E_F (eV). */
function thomasFermiZeroLimitEv(fermiEnergyEv) {
	if (!(fermiEnergyEv >= 0) || !Number.isFinite(fermiEnergyEv)) throw new RangeError(`E_F non valida: ${fermiEnergyEv}`);
	return -.6666666666666666 * fermiEnergyEv;
}
/**
* Curva di modello dello pseudopotenziale locale «empty core» di Ashcroft con schermatura
* di Thomas–Fermi (parametri di tipo Si, P4 §4 fig. 4.1b):
* v(q) = −(2/3) E_F · [k_TF² / (q² + k_TF²)] · cos(q · R_c).
*/
function screenedAshcroftFormFactorCurve(a, qSqMaxDimless = 14, nPoints = 160, emptyCoreRadiusAng = .57) {
	if (!(a > 0) || !Number.isFinite(a)) throw new RangeError(`passo reticolare non valido: ${a}`);
	const nValence = 8 / (a * a * a / 4);
	const kF = Math.cbrt(3 * Math.PI * Math.PI * nValence);
	const efEv = HBAR2_OVER_2M0 * kF * kF;
	const gDos = 3 * nValence / (2 * efEv);
	const kTfSq = 4 * Math.PI * E2_OVER_4PI_EPS0 * gDos;
	const v0Ry = thomasFermiZeroLimitEv(efEv) / RYDBERG_EV;
	const b = 2 * Math.PI / a;
	const qSqDimless = new Float64Array(nPoints);
	const qAngInv = new Float64Array(nPoints);
	const vRy = new Float64Array(nPoints);
	for (let i = 0; i < nPoints; i++) {
		const q2Dim = qSqMaxDimless * i / (nPoints - 1);
		const q = Math.sqrt(q2Dim) * b;
		const q2 = q * q;
		qSqDimless[i] = q2Dim;
		qAngInv[i] = q;
		vRy[i] = v0Ry * (kTfSq / (q2 + kTfSq)) * Math.cos(q * emptyCoreRadiusAng);
	}
	const qZero = Math.PI / (2 * emptyCoreRadiusAng);
	return {
		qSqDimless,
		qAngInv,
		vRy,
		v0Ry,
		efEv,
		zeroCrossingGSq: qZero / b * (qZero / b)
	};
}
/**
* Curve didattiche indicative nello spazio reale (P4 §4, fig. 4.1a):
*  - potenziale dello ione nudo (∝ −1/|r|), soft core (→ 0 a r=0) e hard core (costante per |r| < r_c);
*  - funzione di valenza vera ψ(r) con oscillazioni di ortogonalità al core contro parte liscia ψᶠ(r)
*    coincidente fuori dal core |r| ≥ r_c.
*/
function realSpacePseudopotentialModel(rMaxAng = 2.6, rcAng = .72, nPoints = 241) {
	const r = new Float64Array(nPoints);
	const bareIon = new Float64Array(nPoints);
	const softCore = new Float64Array(nPoints);
	const hardCore = new Float64Array(nPoints);
	const truePsi = new Float64Array(nPoints);
	const smoothPsi = new Float64Array(nPoints);
	for (let i = 0; i < nPoints; i++) {
		const x = -rMaxAng + 2 * rMaxAng * i / (nPoints - 1);
		const ax = Math.abs(x);
		r[i] = x;
		bareIon[i] = -Math.min(4.2, rcAng * 1 / Math.max(ax, .08));
		const u = ax / rcAng;
		const switchOutside = 1 - Math.exp(-(u * u * u));
		softCore[i] = u < 1e-4 ? 0 : -rcAng / ax * switchOutside;
		hardCore[i] = ax < rcAng ? -1 : -rcAng / ax;
		const psiF = (.58 + .36 * Math.cos(Math.PI * x / rMaxAng)) * (1 - .38 * Math.exp(-(u * u)));
		smoothPsi[i] = psiF;
		if (ax < rcAng) {
			const s = ax / rcAng;
			const bell = Math.pow(1 - s * s, 2);
			const osc = -1.45 * Math.cos(2.5 * Math.PI * s);
			truePsi[i] = psiF + bell * osc;
		} else truePsi[i] = psiF;
	}
	return {
		r,
		bareIon,
		softCore,
		hardCore,
		truePsi,
		smoothPsi,
		rc: rcAng
	};
}
function validateEpmParams(params) {
	if (!(params.a > 0) || !Number.isFinite(params.a)) throw new RangeError(`passo reticolare non valido: ${params.a}`);
	const ff = params.formFactors;
	for (const val of [
		ff.v3s,
		ff.v8s,
		ff.v11s,
		ff.v3a,
		ff.v4a,
		ff.v11a
	]) if (!Number.isFinite(val)) throw new RangeError(`fattore di forma non valido: ${val}`);
}
export { ANGSTROM_IN_M, BOHR_RADIUS_ANG, DEFAULT_K_STEP, E2_OVER_4PI_EPS0, EPM_PATH_VERTICES_DIMLESS, HBAR2_OVER_2M0, HBAR2_OVER_M0, HBAR_EV_S, RYDBERG_EV, alignBandStructureBottom, analyzeEpmBands, bandCount, bandCurvature, bandSlope, bareIonFourierAmplitudeEv, blochCoefficients, blochDensity1D, blochSiteRealAmplitude, branchCoordinates1D, calibrateIndicativeHoppingAtA0, centralEquationBand, centralEquationMatrix1D, complexHermitianMatrix, cosineBandExtremumMassRatio, deltaPotentialScaleV0, diatomicApproxBandwidth, diatomicBondingCharacter, diatomicCenterSeparation, diatomicExactBandwidth, diatomicGapAtZoneEdge, diatomicGapEffectiveMassRatio, diatomicStateAt, diatomicWaveSamples, directGap1D, effectiveMassRatio, eigenvector, eigh, emptyLatticeBands, emptyLatticeBranchFunction, emptyLatticeBranchIndex, emptyLatticeBranchState1D, emptyLatticeCrossings1D, emptyLatticeEnergies, emptyLatticeFccBands, epmBrillouinPath, epmDirectionalKinematics, epmSegmentDirection, fccReciprocalVectors, fccShellCounts, fillBands, finiteWellLevels1D, foldToFirstZone1D, freeElectronEnergy, freeElectronWaveNumber, groupVelocity, indicativeHoppingAtDistance, inverseEffectiveMassRatio, kDotPPath1D, kFromZoneFraction, kPathFromVertices, kaneBands, kaneConductionFreeParabola, kaneEffectiveMasses, kaneEnergiesAt, kaneEpFromP, kaneMassBreakdown, kanePFromEp, kronigBarrierStrength, kronigEffectiveP, kronigPenneyBandEdges, kronigPenneyBandFunction, kronigPenneyBands, kronigPenneyCosineApproximation, kronigPenneyDeltaBandEdges, kronigPenneyDeltaL, kronigPenneyDensity1D, kronigPenneyEnergyAt, kronigPenneyGaps, kronigPenneyL, kronigPenneyPeriod, kronigPenneyRectangularBandEdges, kronigPenneyRectangularL, kronigPenneyStateFromEnergy, modelOrbitalP, modelOrbitalS, monoatomicBandSummary, monoatomicBondingCharacter, monoatomicCenterSeparation, monoatomicEdgesVsDistance, monoatomicEnergiesAt, monoatomicGapAtZoneEdge, monoatomicWaveSamples, nearlyFreeBands, nearlyFreeKpVerification, planeWaveBasis1D, planeWaveIonPhaseAngle, planeWaveMomentumElementSq, planeWaveRealPart1D, planeWaveRealPartAtIon, potentialAt, pseudopotentialBands, pseudopotentialHamiltonian, pseudopotentialStateAt, realSpacePseudopotentialModel, realSymmetricMatrix, reciprocalVector1D, sampleKronigConditionCurve, screenedAshcroftFormFactorCurve, solveCentralEquation1D, spinOrbitGammaLevels, thomasFermiZeroLimitEv, tightBindingBandwidth, tightBindingDiatomicBands, tightBindingMonoatomicBands, twoBandExactBands, twoBandMassBreakdown, twoBandParabolicBands, twoBandStateAt, twoBandValidityLimitK, twoWaveEnergies, zoneBoundaryEnergy, zoneEdge1D, zoneEdgeStandingWave, zoneFoldingSegments1D, zonePath1D };
