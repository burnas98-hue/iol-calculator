import { useState } from 'react'
import { Header } from './components/Header'
import { Disclaimer } from './components/Disclaimer'
import { InputForm } from './components/InputForm'
import { ResultsPanel } from './components/ResultsPanel'
import { calculateIOL } from './calculations'
import { validateInputs } from './validation'
import type { IOLInputs, FieldError, IOLCalculationResult } from './types'

const DEFAULT_INPUTS: IOLInputs = {
  scenario: 'dislocation',
  AL: '', K1: '', K2: '', ACD: '',
  aConst: '118.5', targetRef: '-0.75',
  ethnicGroup: 'european',
  vitreousState: 'native',
  oilDensity: '1000',
  fixationMethod: 'scleral_sutures',
  useStandardScleralDist: true,
  scleralDistance: '2.0',
  // Дислокация
  disloc_powerKnown: true,
  disloc_power: '',
  disloc_direction: 'anterior_chamber',
  disloc_replaceIOL: true,
}

export default function App() {
  const [inputs, setInputs] = useState<IOLInputs>(DEFAULT_INPUTS)
  const [errors, setErrors] = useState<FieldError[]>([])
  const [result, setResult] = useState<IOLCalculationResult | null>(null)
  const [calcError, setCalcError] = useState<string | null>(null)

  function handleChange(field: keyof IOLInputs, value: string | boolean) {
    setInputs(prev => ({ ...prev, [field]: value }))
    if (typeof value === 'string') {
      setErrors(prev => prev.filter(e => e.field !== field))
    }
    setCalcError(null)
    if (field === 'scenario') setResult(null)
  }

  function handleSubmit() {
    const validation = validateInputs(inputs)
    if (!validation.valid) { setErrors(validation.errors); setResult(null); return }
    setErrors([])

    try {
      const scleralDist = inputs.useStandardScleralDist ? 2.0 : parseFloat(inputs.scleralDistance)

      const res = calculateIOL({
        scenario: inputs.scenario,
        AL: parseFloat(inputs.AL),
        K1: parseFloat(inputs.K1),
        K2: parseFloat(inputs.K2),
        ACD: inputs.ACD.trim() !== '' ? parseFloat(inputs.ACD) : null,
        aConst: parseFloat(inputs.aConst),
        targetRef: parseFloat(inputs.targetRef),
        ethnicGroup: inputs.ethnicGroup,
        vitreousState: inputs.vitreousState,
        oilDensity: inputs.oilDensity,
        fixationMethod: inputs.fixationMethod,
        scleralDistance: scleralDist,
        dislocPower: inputs.disloc_powerKnown && inputs.disloc_power.trim() !== ''
          ? parseFloat(inputs.disloc_power)
          : null,
        dislocDirection: inputs.disloc_direction,
        dislocReplace: inputs.disloc_replaceIOL,
      })
      setResult(res)
      setCalcError(null)
    } catch (e) {
      setCalcError(e instanceof Error ? e.message : 'Ошибка расчёта')
      setResult(null)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <Header />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <Disclaimer />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          <section className="space-y-2">
            <h2 className="text-base font-semibold text-slate-700">Параметры пациента</h2>
            <InputForm values={inputs} errors={errors} onChange={handleChange} onSubmit={handleSubmit} />
          </section>
          <section className="space-y-2">
            <h2 className="text-base font-semibold text-slate-700">Результат расчёта</h2>
            {calcError && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <span className="font-semibold">Ошибка:</span> {calcError}
              </div>
            )}
            {result ? (
              <ResultsPanel result={result} scenario={inputs.scenario} />
            ) : (
              <EmptyState />
            )}
          </section>
        </div>
      </main>
      <footer className="max-w-5xl mx-auto px-4 sm:px-6 py-6 mt-8 border-t border-slate-200">
        <p className="text-xs text-slate-400 text-center">
          IOL Calc Abakarov · Веб-версия · Только для ознакомительных целей ·
          Формулы: SRK/T (Retzlaff 1990), Holladay-like (Abakarov) ·
          <span className="text-orange-400"> ⚠ часть констант — MOCK</span>
        </p>
      </footer>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="rounded-xl border-2 border-dashed border-slate-200 bg-white p-8 text-center">
      <div className="text-3xl mb-3">👁</div>
      <p className="text-sm text-slate-500">
        Выберите сценарий, заполните биометрию и нажмите{' '}
        <span className="font-semibold text-slate-700">«Рассчитать»</span>
      </p>
      <p className="text-xs text-slate-400 mt-2">AL, K1, K2, A-constant — обязательные · ACD — опционально</p>
    </div>
  )
}
