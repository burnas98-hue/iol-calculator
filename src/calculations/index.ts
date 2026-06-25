import { calculateSRKT, elpFromAConstant } from './srkt'
import { calculateHolladay1Like } from './holladay1'
import { calculateHofferQ, calculateHolladay1, calculateHaigis, calculateBarrettApprox } from './reference'
import {
  elpByFixation,
  ethnicELPDelta,
  vitreousCorrection,
  getUncertainty,
  predictedRefraction,
} from './corrections'
import {
  ETHNIC_GROUP_LABELS,
  VITREOUS_STATE_LABELS,
  OIL_DENSITY_LABELS,
  FIXATION_METHOD_LABELS,
  DISPLACEMENT_DIRECTION_LABELS,
} from '../data/referenceRanges'
import type { IOLNumericInputs, IOLCalculationResult, ResultStatus } from '../types'

export function calculateIOL(inputs: IOLNumericInputs): IOLCalculationResult {
  const {
    AL, K1, K2, aConst, targetRef,
    ethnicGroup, vitreousState, oilDensity,
    fixationMethod, scleralDistance,
    dislocDirection, dislocReplace,
  } = inputs

  // ─── 1. ELP ───────────────────────────────────────────────────────────────
  // При репозиции (не замене) используем A-constant ELP — фиксация не меняется
  const effectiveFixation = (inputs.scenario === 'dislocation' && !dislocReplace)
    ? 'capsular_remnants' as const
    : fixationMethod

  const { elp: elpBase, isMock: fixMock } = elpByFixation(effectiveFixation, scleralDistance, aConst)
  const ethnicDelta = ethnicELPDelta(ethnicGroup)
  const elp = elpBase + ethnicDelta
  const ethnicMock = ethnicDelta !== 0

  // ─── 2. Расчёт ────────────────────────────────────────────────────────────
  const srktRaw = calculateSRKT(AL, K1, K2, aConst, elp, targetRef)
  const abakarovRaw = calculateHolladay1Like(AL, K1, K2, elp, targetRef)

  // ─── 3. Поправка на стекловидное тело ────────────────────────────────────
  const { pCorrected: srktP, isMock: vitMock } = vitreousCorrection(srktRaw.power, vitreousState, oilDensity)
  const { pCorrected: abakarovP } = vitreousCorrection(abakarovRaw.power, vitreousState, oilDensity)

  const hasMockData = fixMock || vitMock || ethnicMock

  // ─── 3б. Референсные формулы (без поправок на стекловидное тело/фиксацию) ─
  const refHofferQ   = calculateHofferQ(AL, K1, K2, aConst, inputs.ACD, targetRef)
  const refHolladay1 = calculateHolladay1(AL, K1, K2, aConst, inputs.ACD, targetRef)
  const refHaigis    = calculateHaigis(AL, K1, K2, aConst, inputs.ACD, targetRef)
  const refBarrett   = calculateBarrettApprox(AL, K1, K2, aConst, inputs.ACD, targetRef)

  // ─── 4. Умный выбор формулы для рекомендации ─────────────────────────────
  // correctionDelta = поправка на стекловидное тело, применяется к ref-формулам тоже
  const correctionDelta = srktP - srktRaw.power

  let recommended: number
  let recommendationBasis: string

  if (AL < 22.0) {
    // Короткий глаз: Hoffer Q наиболее точна
    const hofferCorrected = refHofferQ.power + correctionDelta
    recommended = round2((srktP + hofferCorrected) / 2)
    recommendationBasis = 'SRK/T + Hoffer Q (короткий глаз)'
  } else if (AL > 26.0) {
    // Длинный глаз: Haigis (если есть ACD) или Barrett
    const refLong = inputs.ACD !== null ? refHaigis : refBarrett
    const nameLong = inputs.ACD !== null ? 'Haigis' : 'Barrett (approx.)'
    const longCorrected = refLong.power + correctionDelta
    recommended = round2((srktP + longCorrected) / 2)
    recommendationBasis = `SRK/T + ${nameLong} (длинный глаз)`
  } else {
    // Нормальный диапазон: текущее поведение
    recommended = round2((srktP + abakarovP) / 2)
    recommendationBasis = 'SRK/T + Holladay-like'
  }

  const predRef = predictedRefraction(recommended, AL, K1, K2, elp)
  const uncertainty = getUncertainty(effectiveFixation, vitreousState)

  // ─── 4б. Предупреждения о нетипичных биометрических значениях ────────────
  const K_avg = (K1 + K2) / 2
  const biometryWarnings: string[] = []
  if (AL < 20.0 || AL > 30.0)
    biometryWarnings.push(`AL ${AL} мм вне типичного диапазона 20–30 мм`)
  if (K_avg < 38.0 || K_avg > 48.0)
    biometryWarnings.push(`K ${K_avg.toFixed(2)} Д вне типичного диапазона 38–48 Д`)
  if (inputs.ACD !== null && (inputs.ACD < 2.0 || inputs.ACD > 4.5))
    biometryWarnings.push(`ACD ${inputs.ACD} мм вне типичного диапазона 2.0–4.5 мм`)
  if (aConst < 115.0 || aConst > 122.0)
    biometryWarnings.push(`A-константа ${aConst} вне типичного диапазона 115–122`)

  // ─── 5. Итоговые данные ───────────────────────────────────────────────────
  const vitreousLabel = vitreousState === 'silicone'
    ? `${VITREOUS_STATE_LABELS[vitreousState]} (${OIL_DENSITY_LABELS[oilDensity]})`
    : VITREOUS_STATE_LABELS[vitreousState]

  const isScleralFix = effectiveFixation === 'scleral_sutures' || effectiveFixation === 'intrascleral'

  return {
    srkt: { formulaName: 'SRK/T', power: round2(srktP), elp: round2(elp), uncertainty, isMock: fixMock || vitMock || ethnicMock },
    abakarov: { formulaName: 'Holladay-like (Abakarov)', power: round2(abakarovP), elp: round2(elp), uncertainty, isMock: true },
    referenceFormulas: [
      { ...refHofferQ,   uncertainty: 0.5 },
      { ...refHolladay1, uncertainty: 0.5 },
      { ...refHaigis,    uncertainty: 0.5 },
      { ...refBarrett,   uncertainty: 0.5 },
    ],
    recommendedPower: recommended,
    recommendationBasis,
    predictedRefraction: predRef,
    status: deriveStatus(recommended, AL),
    hasMockData,
    biometryWarnings,
    inputSummary: {
      AL, K1, K2,
      ACD: inputs.ACD,
      aConst, targetRef,
      ethnicGroupLabel: ETHNIC_GROUP_LABELS[ethnicGroup],
      vitreousLabel,
      fixationLabel: FIXATION_METHOD_LABELS[effectiveFixation],
      scleralDistance: isScleralFix ? scleralDistance : null,
      dislocPower: inputs.dislocPower,
      dislocDirectionLabel: DISPLACEMENT_DIRECTION_LABELS[dislocDirection] ?? null,
      dislocReplace: inputs.scenario === 'dislocation' ? dislocReplace : null,
    },
  }
}

function deriveStatus(power: number, AL: number): ResultStatus {
  let min: number, max: number
  if (AL < 22.0)       { min = 27.0; max = 40.0 }
  else if (AL <= 25.0) { min = 18.0; max = 27.0 }
  else                 { min = 5.0;  max = 18.0 }

  if (power < min) return 'low'
  if (power > max) return 'high'
  if (power < min + 2 || power > max - 2) return 'attention'
  return 'normal'
}

function round2(v: number): number {
  return Math.round(v * 100) / 100
}

export { elpFromAConstant, calculateSRKT, calculateHolladay1Like }
