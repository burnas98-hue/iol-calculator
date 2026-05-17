/**
 * SRK/T Formula
 * Retzlaff JA, Sanders DR, Kraff MC. J Cataract Refract Surg. 1990;16(3):333–340.
 */

export function elpFromAConstant(aConst: number): number {
  return 0.62467 * aConst - 68.747
}

function retinalConst(AL: number): number {
  return 0.65696 - 0.02029 * AL
}

function correctAL(AL: number): number {
  if (AL > 24.2) return -0.99166 + 0.89990 * AL
  return AL
}

export function calculateSRKT(
  AL: number,
  K1: number,
  K2: number,
  _aConst: number,
  elp: number,         // Передаём уже вычисленный ELP (с учётом всех поправок)
  target: number = 0,
): { power: number } {
  const K = (K1 + K2) / 2
  const LCOR = correctAL(AL)
  const RCONST = retinalConst(AL)

  const R = 337.5 / K
  const chordArg = (LCOR + RCONST) * Math.sqrt(R / (R + RCONST))
  let H = 0
  if (chordArg < R) {
    H = R - Math.sqrt(R * R - chordArg * chordArg)
  }

  const ELP = elp + H  // добавляем поправку роговичной высоты к переданному ELP

  // В знаменателе используем сырую AL, не LCOR:
  // LCOR нужен только для расчёта хорды H, формула мощности работает с физической длиной глаза
  const denom1 = AL - ELP - 0.05
  const denom2 = 1336 / K - ELP - 0.05

  if (denom1 <= 0 || denom2 <= 0) {
    throw new Error('Недопустимые параметры: знаменатель ≤ 0 (SRK/T)')
  }

  const P0 = 1336 / denom1 - 1336 / denom2

  if (target === 0) return { power: round2(P0) }

  const Rc = target / (1 - 0.012 * target)
  return { power: round2(P0 + Rc) }
}

export { correctAL, retinalConst }

function round2(v: number): number {
  return Math.round(v * 100) / 100
}
