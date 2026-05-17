/**
 * Holladay-like формула (версия Абакарова)
 * Holladay JT et al. J Cataract Refract Surg. 1988;14(1):17–24.
 * ⚠️  Коэффициенты SF-конвертации частично MOCK.
 */

export function calculateHolladay1Like(
  AL: number,
  K1: number,
  K2: number,
  elp: number,        // Передаём уже вычисленный ELP
  target: number = 0,
): { power: number } {
  const K = (K1 + K2) / 2
  const R = 337.5 / K
  const halfChord = 6.0  // ⚠️ MOCK
  const H = R - Math.sqrt(Math.max(0, R * R - halfChord * halfChord))
  const ELP = elp + H + 0.56  // ⚠️ 0.56 — MOCK

  const denom1 = AL - ELP - 0.05
  const denom2 = 1336 / K - ELP - 0.05

  if (denom1 <= 0 || denom2 <= 0) {
    throw new Error('Недопустимые параметры: знаменатель ≤ 0 (Holladay-like)')
  }

  const P0 = 1336 / denom1 - 1336 / denom2
  const Rc = target === 0 ? 0 : target / (1 - 0.012 * target)

  return { power: round2(P0 + Rc) }
}

function round2(v: number): number {
  return Math.round(v * 100) / 100
}
