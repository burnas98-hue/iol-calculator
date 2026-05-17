// ─── Clinical scenarios ───────────────────────────────────────────────────────

export type ClinicalScenario =
  | 'dislocation'
  | 'secondary'
  | 'scleral_ext'

// ─── Dislocation-specific ─────────────────────────────────────────────────────

export type DisplacementDirection =
  | 'anterior_chamber'    // В переднюю камеру
  | 'vitreous'            // В стекловидное тело (без контакта с сетчаткой)
  | 'retina'              // На сетчатку/дно
  | 'pupil_iris'          // В зрачок/к радужке

// ─── Input parameters ────────────────────────────────────────────────────────

export type EthnicGroup = 'european' | 'mongoloid' | 'negroid' | 'other'

export type VitreousState = 'native' | 'silicone' | 'gas'

export type SiliconeOilDensity = '1000' | '1300' | '5000'

export type FixationMethod =
  | 'capsular_remnants'
  | 'scleral_sutures'
  | 'intrascleral'

export interface IOLInputs {
  scenario: ClinicalScenario

  // Биометрия
  AL: string
  K1: string
  K2: string
  ACD: string
  aConst: string
  targetRef: string

  // Клинические
  ethnicGroup: EthnicGroup
  vitreousState: VitreousState
  oilDensity: SiliconeOilDensity
  fixationMethod: FixationMethod
  useStandardScleralDist: boolean
  scleralDistance: string

  // Только для сценария «Дислокация/сублюксация»
  disloc_powerKnown: boolean           // Известна ли оптическая сила?
  disloc_power: string                 // Оптическая сила смещённой ИОЛ, Д
  disloc_direction: DisplacementDirection
  disloc_replaceIOL: boolean           // Планируете удалить и имплантировать новую?
}

// ─── Validation ───────────────────────────────────────────────────────────────

export interface FieldError {
  field: keyof IOLInputs
  message: string
}

export type ValidationResult =
  | { valid: true }
  | { valid: false; errors: FieldError[] }

// ─── Calculation results ──────────────────────────────────────────────────────

export type ResultStatus = 'normal' | 'attention' | 'low' | 'high'

export interface FormulaResult {
  formulaName: string
  power: number
  elp: number
  uncertainty: number
  isMock: boolean
}

export interface IOLCalculationResult {
  srkt: FormulaResult
  abakarov: FormulaResult
  recommendedPower: number
  predictedRefraction: number
  status: ResultStatus
  hasMockData: boolean
  inputSummary: InputSummary
}

export interface InputSummary {
  AL: number
  K1: number
  K2: number
  ACD: number | null
  aConst: number
  targetRef: number
  ethnicGroupLabel: string
  vitreousLabel: string
  fixationLabel: string
  scleralDistance: number | null
  // Дислокация
  dislocPower: number | null
  dislocDirectionLabel: string | null
  dislocReplace: boolean | null
}

// ─── Numeric inputs (parsed) ──────────────────────────────────────────────────

export interface IOLNumericInputs {
  scenario: ClinicalScenario
  AL: number
  K1: number
  K2: number
  ACD: number | null
  aConst: number
  targetRef: number
  ethnicGroup: EthnicGroup
  vitreousState: VitreousState
  oilDensity: SiliconeOilDensity
  fixationMethod: FixationMethod
  scleralDistance: number
  // Дислокация
  dislocPower: number | null
  dislocDirection: DisplacementDirection
  dislocReplace: boolean
}
