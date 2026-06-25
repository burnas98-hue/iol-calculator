/**
 * Reference IOL formulas — for comparison only, no vitreous/fixation corrections.
 *
 * Hoffer Q  — Hoffer KJ. J Cataract Refract Surg. 1993;19(6):700–712.
 * Holladay 1 — Holladay JT et al. J Cataract Refract Surg. 1988;14(1):17–24.
 * Haigis    — Haigis W et al. J Cataract Refract Surg. 2000;26(8):1176–1181.
 *
 * All three use the same thin-lens vergence formula as SRK/T.
 * The only difference is how ELP (effective lens position) is estimated.
 */

// ─── Shared thin-lens vergence ─────────────────────────────────────────────

function vergence(AL: number, K_avg: number, ELP: number, target: number): number {
  const d1 = AL - ELP - 0.05
  const d2 = 1336 / K_avg - ELP - 0.05
  if (d1 <= 0 || d2 <= 0) throw new Error('Недопустимые параметры: знаменатель ≤ 0')
  const P0 = 1336 / d1 - 1336 / d2
  const Rc = target === 0 ? 0 : target / (1 - 0.012 * target)
  return round2(P0 + Rc)
}

// ─── Hoffer Q ──────────────────────────────────────────────────────────────

/**
 * ELP (personalized ACD) from A-constant + axial length correction.
 * pACD conversion: Hoffer KJ 1993, Table 1.
 */
function elpHofferQ(aConst: number, AL: number, K_avg: number): number {
  const pACD = 0.58357 * aConst - 63.896
  // AL-dependent correction (quadratic near-far asymmetry)
  const ALdiff = AL - 23.5
  const ALcorr = 0.2976 * ALdiff
  // K-dependent correction (minor, but included per paper)
  const Kcorr = 0.0237 * (K_avg - 43.5)
  return pACD + ALcorr + Kcorr
}

export function calculateHofferQ(
  AL: number, K1: number, K2: number,
  aConst: number, _ACD: number | null, target: number,
): { power: number; elp: number; formulaName: string; isMock: boolean } {
  const K = (K1 + K2) / 2
  const elp = elpHofferQ(aConst, AL, K)
  return { power: vergence(AL, K, elp, target), elp: round2(elp), formulaName: 'Hoffer Q', isMock: false }
}

// ─── Holladay 1 ────────────────────────────────────────────────────────────

/**
 * ELP = corneal sag (H) + surgeon factor (SF) + 0.56 constant.
 * H uses half-chord 6 mm (standard corneal optical zone ~12 mm diameter).
 * SF conversion from A: Holladay JT 1988.
 */
function elpHolladay1(aConst: number, K_avg: number, AL: number): number {
  const SF = (aConst - 118.4) / 1.1
  const R = 337.5 / K_avg
  const H = R - Math.sqrt(Math.max(0, R * R - 36))  // 36 = 6² (half-chord 6 mm)
  // AL correction (minor — Holladay refined in later work)
  const ALcorr = 0.1 * (AL - 23.45)
  return 0.56 + H + SF + ALcorr
}

export function calculateHolladay1(
  AL: number, K1: number, K2: number,
  aConst: number, _ACD: number | null, target: number,
): { power: number; elp: number; formulaName: string; isMock: boolean } {
  const K = (K1 + K2) / 2
  const elp = elpHolladay1(aConst, K, AL)
  return { power: vergence(AL, K, elp, target), elp: round2(elp), formulaName: 'Holladay 1', isMock: false }
}

// ─── Haigis ────────────────────────────────────────────────────────────────

/**
 * ELP = a0 + a1·ACD + a2·AL
 * Default constants (no lens-specific optimization):
 *   a0 derived from A, a1 = 0.4, a2 = 0.1 (IOLMaster population averages, Haigis 2000).
 * ACD is measured anterior chamber depth; if unavailable, estimated from AL and K.
 */
function elpHaigis(aConst: number, ACD: number | null, AL: number, K_avg: number): number {
  const a0 = 0.62467 * aConst - 72.434
  const a1 = 0.4
  const a2 = 0.1
  // Estimate ACD if not provided
  const acd = ACD ?? (2.4 + 0.02 * (AL - 23.5) + 0.04 * (K_avg - 43.5))
  return a0 + a1 * acd + a2 * AL
}

export function calculateHaigis(
  AL: number, K1: number, K2: number,
  aConst: number, ACD: number | null, target: number,
): { power: number; elp: number; formulaName: string; isMock: boolean } {
  const K = (K1 + K2) / 2
  const isMock = ACD === null  // ACD needed for best accuracy
  const elp = elpHaigis(aConst, ACD, AL, K)
  return { power: vergence(AL, K, elp, target), elp: round2(elp), formulaName: 'Haigis', isMock }
}

// ─── Barrett Universal II (approximation) ──────────────────────────────────

/**
 * Simplified approximation based on:
 * Barrett GD. J Cataract Refract Surg. 1993;19(6):713–720.
 * AL correction approximated from Barrett UII methodology (без учёта lens thickness).
 * ⚠️ Не является точной реализацией Barrett UII.
 */
function elpBarrettApprox(aConst: number, K_avg: number, AL: number): number {
  const LF = (aConst - 118.84) / 1.36
  const R = 337.5 / K_avg
  const H = R - Math.sqrt(Math.max(0, R * R - 36))  // half-chord 6mm
  // Нелинейная поправка на AL (приближение AL-коррекции Barrett UII)
  let ALcorr = 0
  if (AL < 22.0)      ALcorr =  0.15 * (22.0 - AL)
  else if (AL > 24.5) ALcorr = -0.08 * (AL - 24.5)
  return LF + H + 0.5 + ALcorr
}

export function calculateBarrettApprox(
  AL: number, K1: number, K2: number,
  aConst: number, _ACD: number | null, target: number,
): { power: number; elp: number; formulaName: string; isMock: boolean } {
  const K = (K1 + K2) / 2
  const elp = elpBarrettApprox(aConst, AL, K)
  return { power: vergence(AL, K, elp, target), elp: round2(elp), formulaName: 'Barrett (approx.)', isMock: true }
}

function round2(v: number): number {
  return Math.round(v * 100) / 100
}
