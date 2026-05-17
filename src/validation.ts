import type { IOLInputs, FieldError, ValidationResult } from './types'
import { REFERENCE_RANGES } from './data/referenceRanges'

export function validateInputs(inputs: IOLInputs): ValidationResult {
  const errors: FieldError[] = []

  const requiredFields = ['AL', 'K1', 'K2', 'aConst', 'targetRef'] as const
  for (const field of requiredFields) {
    const raw = inputs[field].trim()
    if (raw === '') { errors.push({ field, message: 'Обязательное поле' }); continue }
    const num = Number(raw)
    if (isNaN(num)) { errors.push({ field, message: 'Введите числовое значение' }); continue }
    const range = REFERENCE_RANGES[field]
    if (num < range.criticalMin || num > range.criticalMax) {
      errors.push({ field, message: `Допустимый диапазон: ${range.criticalMin}–${range.criticalMax} ${range.unit}` })
    }
  }

  if (inputs.ACD.trim() !== '') {
    const acd = Number(inputs.ACD)
    if (isNaN(acd)) {
      errors.push({ field: 'ACD', message: 'Введите числовое значение или оставьте пустым' })
    } else if (acd < REFERENCE_RANGES.ACD.criticalMin || acd > REFERENCE_RANGES.ACD.criticalMax) {
      errors.push({ field: 'ACD', message: `Допустимый диапазон: ${REFERENCE_RANGES.ACD.criticalMin}–${REFERENCE_RANGES.ACD.criticalMax} мм` })
    }
  }

  // Оптическая сила дислоцированной ИОЛ (если известна)
  if (inputs.scenario === 'dislocation' && inputs.disloc_powerKnown && inputs.disloc_power.trim() !== '') {
    const p = Number(inputs.disloc_power)
    const range = REFERENCE_RANGES.disloc_power
    if (isNaN(p) || p < range.criticalMin || p > range.criticalMax) {
      errors.push({ field: 'disloc_power', message: `Допустимый диапазон: ${range.criticalMin}–${range.criticalMax} Д` })
    }
  }

  // Расстояние от лимба (нестандартное)
  const needsScleralDist =
    !inputs.useStandardScleralDist &&
    (inputs.fixationMethod === 'scleral_sutures' || inputs.fixationMethod === 'intrascleral') &&
    (inputs.scenario !== 'dislocation' || inputs.disloc_replaceIOL)

  if (needsScleralDist) {
    const raw = inputs.scleralDistance.trim()
    if (raw === '') {
      errors.push({ field: 'scleralDistance', message: 'Укажите расстояние от лимба' })
    } else {
      const num = Number(raw)
      const range = REFERENCE_RANGES.scleralDistance
      if (isNaN(num) || num < range.criticalMin || num > range.criticalMax) {
        errors.push({ field: 'scleralDistance', message: `Допустимый диапазон: ${range.criticalMin}–${range.criticalMax} мм` })
      }
    }
  }

  if (errors.filter(e => e.field === 'K1' || e.field === 'K2').length === 0) {
    if (Number(inputs.K2) < Number(inputs.K1)) {
      errors.push({ field: 'K2', message: 'K2 должна быть ≥ K1 (крутой меридиан)' })
    }
  }

  return errors.length > 0 ? { valid: false, errors } : { valid: true }
}
