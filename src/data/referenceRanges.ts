export const REFERENCE_RANGES = {
  AL:             { criticalMin: 15.0, criticalMax: 36.0, normalMin: 21.0, normalMax: 26.0,  unit: 'мм', label: 'Осевая длина' },
  K1:             { criticalMin: 35.0, criticalMax: 60.0, normalMin: 40.0, normalMax: 48.0,  unit: 'Д',  label: 'K1' },
  K2:             { criticalMin: 35.0, criticalMax: 60.0, normalMin: 40.0, normalMax: 48.0,  unit: 'Д',  label: 'K2' },
  ACD:            { criticalMin: 1.5,  criticalMax: 5.5,  normalMin: 2.5,  normalMax: 4.2,   unit: 'мм', label: 'Глубина передней камеры' },
  aConst:         { criticalMin: 110.0, criticalMax: 125.0, normalMin: 115.0, normalMax: 122.0, unit: '', label: 'Константа A' },
  targetRef:      { criticalMin: -8.0, criticalMax: 4.0,  normalMin: -2.0, normalMax: 0.5,   unit: 'Д',  label: 'Целевая рефракция' },
  scleralDistance:{ criticalMin: 0.5,  criticalMax: 5.0,  normalMin: 1.5,  normalMax: 3.0,   unit: 'мм', label: 'Расстояние от лимба' },
  disloc_power:   { criticalMin: -5.0, criticalMax: 50.0, normalMin: 5.0,  normalMax: 35.0,  unit: 'Д',  label: 'Оптическая сила ИОЛ' },
} as const

export const SCENARIO_LABELS: Record<string, string> = {
  dislocation: 'Дислокация/сублюксация ИОЛ',
  secondary:   'Вторичная имплантация в афакичный глаз',
  scleral_ext: 'Склеральная фиксация (расширенный расчёт)',
}

export const ETHNIC_GROUP_LABELS: Record<string, string> = {
  european:  'Европеоидная',
  mongoloid: 'Монголоидная',
  negroid:   'Негроидная',
  other:     'Другая',
}

export const VITREOUS_STATE_LABELS: Record<string, string> = {
  native:   'Нативное',
  silicone: 'Замещено силиконом',
  gas:      'Газ/воздух',
}

export const OIL_DENSITY_LABELS: Record<string, string> = {
  '1000': '1000 сСт',
  '1300': '1300 сСт',
  '5000': '5000 сСт',
}

export const FIXATION_METHOD_LABELS: Record<string, string> = {
  capsular_remnants: 'В цилиарную борозду (на остатки капсулы)',
  scleral_sutures:   'Склеральная фиксация швами',
  intrascleral:      'Интрасклеральный туннель/клипса',
}

export const DISPLACEMENT_DIRECTION_LABELS: Record<string, string> = {
  anterior_chamber: 'В переднюю камеру',
  vitreous:         'В стекловидное тело (без контакта с сетчаткой)',
  retina:           'На сетчатку/дно',
  pupil_iris:       'В зрачок/к радужке',
}
