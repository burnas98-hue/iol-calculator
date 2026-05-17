/**
 * ⚠️  MOCK / PLACEHOLDER DATA
 *
 * Константы извлечены из структуры программы IOL Calc Abakarov,
 * но числовые значения не верифицированы по первоисточнику (публикации Абакарова).
 *
 * Для медицински корректной реализации необходимо:
 *  1. Получить оригинальную публикацию Абакарова
 *  2. Верифицировать все DELTA_* константы
 *  3. Верифицировать формулу ELP при склеральной фиксации
 */

// ─── Поправки к силе ИОЛ: состояние стекловидного тела ──────────────────────

export const DELTA_P_GAS = 1.0              // ⚠️ MOCK
export const DELTA_P_OIL_1000 = 3.0         // ⚠️ MOCK
export const DELTA_P_OIL_1300 = 3.25        // ⚠️ MOCK (интерполяция)
export const DELTA_P_OIL_5000 = 3.5         // ⚠️ MOCK
export const DELTA_P_PPV = 0.5              // ⚠️ MOCK

// ─── Неопределённость расчёта ±Д ─────────────────────────────────────────────
// Валидационный случай: склеральная фиксация (нативное ст. тело) → ±0.75 Д (из скрина)

export const UNCERTAINTY_STANDARD = 0.5    // Стандартный случай
export const UNCERTAINTY_SCLERAL = 0.75    // Склеральная фиксация (подтверждено скрином)
export const UNCERTAINTY_OIL = 1.5         // ⚠️ MOCK
export const UNCERTAINTY_GAS = 1.25        // ⚠️ MOCK
export const UNCERTAINTY_COMPLEX = 2.0     // ⚠️ MOCK

// ─── Этнические поправки к ELP (мм) ──────────────────────────────────────────

export const ETHNIC_ELP_ADJUST: Record<string, number> = {
  european:  0.0,     // базовая
  mongoloid: -0.15,   // ⚠️ MOCK
  negroid:   +0.05,   // ⚠️ MOCK
  other:     0.0,
}

// ─── ELP при склеральной фиксации ────────────────────────────────────────────
// Основано на валидационном случае из скрина:
// Расстояние от лимба 2.0 мм → ELP = 1.20 мм
// Следовательно: ELP = scleral_distance - LIMBAL_CORNEAL_OFFSET
// LIMBAL_CORNEAL_OFFSET = 2.0 - 1.20 = 0.80 мм

export const LIMBAL_CORNEAL_OFFSET = 0.80  // мм — верифицировано по одному случаю

// ─── Поправки ELP по методу фиксации (сдвиг относительно капсульного мешка) ─

export const DELTA_ELP_CAPSULAR_REMNANTS = -0.77   // ⚠️ MOCK (цилиарная борозда)
export const DELTA_ELP_INTRASCLERAL = -0.3          // ⚠️ MOCK (интрасклеральный туннель)
