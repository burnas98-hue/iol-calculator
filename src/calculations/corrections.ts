/**
 * Расчёт ELP с учётом всех клинических поправок.
 * ⚠️  Большинство констант — MOCK (см. mockCorrections.ts)
 */

import {
  ETHNIC_ELP_ADJUST,
  DELTA_ELP_CAPSULAR_REMNANTS,
  DELTA_ELP_INTRASCLERAL,
  LIMBAL_CORNEAL_OFFSET,
  DELTA_P_GAS,
  DELTA_P_OIL_1000,
  DELTA_P_OIL_1300,
  DELTA_P_OIL_5000,
  UNCERTAINTY_STANDARD,
  UNCERTAINTY_SCLERAL,
  UNCERTAINTY_OIL,
  UNCERTAINTY_GAS,
  UNCERTAINTY_COMPLEX,
} from '../data/mockCorrections'
import type { EthnicGroup, FixationMethod, VitreousState, SiliconeOilDensity } from '../types'

// ─── ELP base ─────────────────────────────────────────────────────────────────

/**
 * Базовый ELP из константы A (для капсульного мешка).
 * Формула Retzlaff 1990: ACD_T = 0.62467 × A − 68.747
 */
export function baseELP(aConst: number): number {
  return 0.62467 * aConst - 68.747
}

/**
 * ELP при склеральной фиксации — рассчитывается из расстояния от лимба.
 *
 * Валидация по скрину: расстояние 2.0 мм → ELP = 1.20 мм
 * ELP = scleral_distance − LIMBAL_CORNEAL_OFFSET (0.80 мм)
 */
export function scleralELP(scleralDistance: number): number {
  return Math.max(0, scleralDistance - LIMBAL_CORNEAL_OFFSET)
}

// ─── Поправка ELP по методу фиксации ─────────────────────────────────────────

export function elpByFixation(
  fixation: FixationMethod,
  scleralDistance: number,
  aConst: number,
): { elp: number; isMock: boolean } {
  switch (fixation) {
    case 'capsular_remnants':
      return { elp: baseELP(aConst) + DELTA_ELP_CAPSULAR_REMNANTS, isMock: true }

    case 'scleral_sutures':
      return { elp: scleralELP(scleralDistance), isMock: false } // формула верифицирована по одному случаю

    case 'intrascleral':
      return { elp: scleralELP(scleralDistance) + DELTA_ELP_INTRASCLERAL, isMock: true }

    default:
      return { elp: baseELP(aConst), isMock: false }
  }
}

// ─── Этническая поправка к ELP ───────────────────────────────────────────────

export function ethnicELPDelta(ethnicGroup: EthnicGroup): number {
  return ETHNIC_ELP_ADJUST[ethnicGroup] ?? 0
}

// ─── Поправка к силе ИОЛ: стекловидное тело ──────────────────────────────────

export function vitreousCorrection(
  pBase: number,
  state: VitreousState,
  oilDensity: SiliconeOilDensity,
): { pCorrected: number; isMock: boolean } {
  switch (state) {
    case 'native':
      return { pCorrected: pBase, isMock: false }

    case 'gas':
      return { pCorrected: pBase + DELTA_P_GAS, isMock: true }

    case 'silicone': {
      const delta =
        oilDensity === '1000' ? DELTA_P_OIL_1000
        : oilDensity === '5000' ? DELTA_P_OIL_5000
        : DELTA_P_OIL_1300
      return { pCorrected: pBase + delta, isMock: true }
    }

    default:
      return { pCorrected: pBase, isMock: false }
  }
}

// ─── Неопределённость ────────────────────────────────────────────────────────

export function getUncertainty(
  fixation: FixationMethod,
  vitreous: VitreousState,
): number {
  const isScleralFix = fixation === 'scleral_sutures' || fixation === 'intrascleral'
  const isVitreoRetinal = vitreous !== 'native'

  if (isScleralFix && isVitreoRetinal) return UNCERTAINTY_COMPLEX
  if (vitreous === 'silicone') return UNCERTAINTY_OIL
  if (vitreous === 'gas') return UNCERTAINTY_GAS
  if (isScleralFix) return UNCERTAINTY_SCLERAL // 0.75 Д — верифицировано по скрину
  return UNCERTAINTY_STANDARD
}

// ─── Прогнозируемая послеоперационная рефракция ───────────────────────────────

/**
 * Предсказание послеоперационной рефракции при выбранной силе ИОЛ.
 * Если P_chosen = P_calculated(target), то predictedRefraction ≈ target.
 */
export function predictedRefraction(
  pChosen: number,
  AL: number,
  K1: number,
  K2: number,
  elp: number,
): number {
  const K = (K1 + K2) / 2
  const d1 = AL - elp - 0.05
  const d2 = 1336 / K - elp - 0.05

  if (d1 <= 0 || d2 <= 0) return 0

  // Эмметропийная сила для данного ELP
  const P_emm = 1336 / d1 - 1336 / d2

  // Разница → рефракция в корнеальной плоскости (приближение)
  const Rc = pChosen - P_emm

  // Перевод в плоскость очков (вершинное расстояние 12 мм)
  const Rs = Rc / (1 + 0.012 * Rc)

  return round2(Rs)
}

function round2(v: number): number {
  return Math.round(v * 100) / 100
}
