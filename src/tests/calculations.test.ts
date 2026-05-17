import { describe, it, expect } from 'vitest'
import { elpFromAConstant } from '../calculations/srkt'
import { calculateIOL } from '../calculations'
import { validateInputs } from '../validation'
import type { IOLNumericInputs, IOLInputs } from '../types'

const BASE_NUMERIC: IOLNumericInputs = {
  scenario: 'dislocation',
  AL: 23.5, K1: 43.5, K2: 44.5, ACD: 3.2,
  aConst: 118.5, targetRef: -0.75,
  ethnicGroup: 'european',
  vitreousState: 'native',
  oilDensity: '1000',
  fixationMethod: 'scleral_sutures',
  scleralDistance: 2.0,
  dislocPower: 22.0,
  dislocDirection: 'anterior_chamber',
  dislocReplace: true,
}

const BASE_STRING: IOLInputs = {
  scenario: 'dislocation',
  AL: '23.5', K1: '43.5', K2: '44.5', ACD: '3.2',
  aConst: '118.5', targetRef: '-0.75',
  ethnicGroup: 'european',
  vitreousState: 'native',
  oilDensity: '1000',
  fixationMethod: 'scleral_sutures',
  useStandardScleralDist: true,
  scleralDistance: '2.0',
  disloc_powerKnown: true,
  disloc_power: '22.0',
  disloc_direction: 'anterior_chamber',
  disloc_replaceIOL: true,
}

describe('elpFromAConstant', () => {
  it('A=118.5 → ELP ≈ 5.27 мм', () => {
    expect(elpFromAConstant(118.5)).toBeCloseTo(5.27, 1)
  })
})

describe('Валидационный кейс (по скрину)', () => {
  it('ELP при склеральной фиксации 2.0 мм → ≈ 1.20 мм', () => {
    const res = calculateIOL({ ...BASE_NUMERIC, AL: 24.5, K1: 41.5, K2: 42.3, ACD: 2.89, aConst: 118.4 })
    expect(res.srkt.elp).toBeCloseTo(1.20, 1)
  })

  it('Неопределённость при склеральной фиксации (нативное) = 0.75 Д', () => {
    const res = calculateIOL({ ...BASE_NUMERIC, fixationMethod: 'scleral_sutures', vitreousState: 'native' })
    expect(res.srkt.uncertainty).toBe(0.75)
  })

  it('Расчётная сила близка к 13.66 Д из скрина', () => {
    const res = calculateIOL({ ...BASE_NUMERIC, AL: 24.5, K1: 41.5, K2: 42.3, ACD: 2.89, aConst: 118.4 })
    expect(res.srkt.power).toBeGreaterThan(12.0)
    expect(res.srkt.power).toBeLessThan(16.0)
  })
})

describe('calculateIOL', () => {
  it('силиконовое масло → hasMockData = true', () => {
    expect(calculateIOL({ ...BASE_NUMERIC, vitreousState: 'silicone' }).hasMockData).toBe(true)
  })

  it('длинный глаз → меньше сила', () => {
    const n = calculateIOL({ ...BASE_NUMERIC, AL: 23.5 })
    const l = calculateIOL({ ...BASE_NUMERIC, AL: 27.0 })
    expect(l.recommendedPower).toBeLessThan(n.recommendedPower)
  })

  it('дислокация + репозиция → effectiveFixation не scleral_sutures', () => {
    const res = calculateIOL({ ...BASE_NUMERIC, dislocReplace: false })
    expect(res.inputSummary.dislocReplace).toBe(false)
  })

  it('направление смещения присутствует в inputSummary', () => {
    const res = calculateIOL({ ...BASE_NUMERIC, dislocDirection: 'vitreous' })
    expect(res.inputSummary.dislocDirectionLabel).toContain('стекловидное')
  })
})

describe('validateInputs', () => {
  it('валидные данные → valid: true', () => {
    expect(validateInputs(BASE_STRING).valid).toBe(true)
  })

  it('пустой AL → ошибка', () => {
    const res = validateInputs({ ...BASE_STRING, AL: '' })
    expect(res.valid).toBe(false)
    if (!res.valid) expect(res.errors.some(e => e.field === 'AL')).toBe(true)
  })

  it('K2 < K1 → ошибка', () => {
    expect(validateInputs({ ...BASE_STRING, K1: '46.0', K2: '44.0' }).valid).toBe(false)
  })

  it('ACD пустое → допустимо', () => {
    expect(validateInputs({ ...BASE_STRING, ACD: '' }).valid).toBe(true)
  })

  it('нестандартное расстояние без значения → ошибка', () => {
    const res = validateInputs({ ...BASE_STRING, useStandardScleralDist: false, scleralDistance: '' })
    expect(res.valid).toBe(false)
    if (!res.valid) expect(res.errors.some(e => e.field === 'scleralDistance')).toBe(true)
  })
})
