import { useState } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { Header } from './components/Header'
import { Disclaimer } from './components/Disclaimer'
import { InputForm } from './components/InputForm'
import { ResultsPanel } from './components/ResultsPanel'
import { calculateIOL } from './calculations'
import { validateInputs } from './validation'
import type { IOLInputs, FieldError, IOLCalculationResult } from './types'
import { useAuth } from './contexts/AuthContext'
import { supabase } from './lib/supabase'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import { BookmarkPlus, Download } from 'lucide-react'
import { downloadReport } from './lib/downloadReport'

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
  disloc_powerKnown: true,
  disloc_power: '',
  disloc_direction: 'anterior_chamber',
  disloc_replaceIOL: true,
}

function CalculatorPage() {
  const [inputs, setInputs] = useState<IOLInputs>(DEFAULT_INPUTS)
  const [errors, setErrors] = useState<FieldError[]>([])
  const [result, setResult] = useState<IOLCalculationResult | null>(null)
  const [calcError, setCalcError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [savedOk, setSavedOk] = useState(false)

  const { user } = useAuth()
  const navigate = useNavigate()

  function handleChange(field: keyof IOLInputs, value: string | boolean) {
    if (typeof value === 'string') value = value.replace(',', '.')
    setInputs(prev => ({ ...prev, [field]: value }))
    if (typeof value === 'string') {
      setErrors(prev => prev.filter(e => e.field !== field))
    }
    setCalcError(null)
    setSavedOk(false)
    if (field === 'scenario') setResult(null)
  }

  function handleSubmit() {
    const validation = validateInputs(inputs)
    if (!validation.valid) { setErrors(validation.errors); setResult(null); return }
    setErrors([])
    setSavedOk(false)

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

  async function saveToHistory() {
    if (!user || !result) return
    setSaving(true)
    const date = new Date().toLocaleDateString('ru-RU')
    const name = `Расчёт ${date}`
    await supabase.from('calculations').insert({
      user_id: user.id,
      name,
      notes: '',
      scenario: inputs.scenario,
      inputs: inputs as unknown as Record<string, unknown>,
      result: result as unknown as Record<string, unknown>,
    })
    setSaving(false)
    setSavedOk(true)
  }

  return (
    <div className="min-h-screen bg-app-bg font-sans">
      <Header />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-5">
        <Disclaimer />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          <section className="space-y-2">
            <h2 className="text-base font-semibold text-app-text">Параметры пациента</h2>
            <InputForm values={inputs} errors={errors} onChange={handleChange} onSubmit={handleSubmit} />
          </section>
          <section className="space-y-2">
            <h2 className="text-base font-semibold text-app-text">Результат расчёта</h2>
            {calcError && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <span className="font-semibold">Ошибка:</span> {calcError}
              </div>
            )}
            {result ? (
              <>
                <ResultsPanel result={result} scenario={inputs.scenario} />
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {user ? (
                    <button
                      onClick={saveToHistory}
                      disabled={saving || savedOk}
                      className="flex items-center gap-2 px-4 py-2.5 bg-medical-600 hover:bg-medical-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
                    >
                      <BookmarkPlus size={16} />
                      {saving ? 'Сохраняю...' : savedOk ? 'Сохранено ✓' : 'Сохранить в историю'}
                    </button>
                  ) : (
                    <button
                      onClick={() => navigate('/login')}
                      className="flex items-center gap-2 px-4 py-2.5 border border-medical-300 text-medical-600 hover:bg-medical-50 text-sm font-medium rounded-xl transition-colors"
                    >
                      <BookmarkPlus size={16} />
                      Войдите чтобы сохранить
                    </button>
                  )}
                  <button
                    onClick={() => downloadReport({
                      name: `Расчёт ${new Date().toLocaleDateString('ru-RU')}`,
                      scenario: inputs.scenario,
                      inputs: inputs as unknown as Record<string, unknown>,
                      result: result as unknown as Record<string, unknown>,
                    })}
                    className="flex items-center gap-2 px-4 py-2.5 border border-app-border text-app-muted hover:text-app-text hover:bg-app-bg text-sm font-medium rounded-xl transition-colors"
                  >
                    <Download size={16} />
                    Скачать PDF
                  </button>
                  {savedOk && (
                    <button
                      onClick={() => navigate('/dashboard')}
                      className="text-sm text-medical-600 hover:underline"
                    >
                      Перейти в кабинет →
                    </button>
                  )}
                </div>
              </>
            ) : (
              <EmptyState />
            )}
          </section>
        </div>
      </main>
      <footer className="max-w-5xl mx-auto px-4 sm:px-6 py-6 mt-8 border-t border-app-border">
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

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/dashboard" element={
        <RequireAuth>
          <DashboardPage />
        </RequireAuth>
      } />
      <Route path="/" element={<CalculatorPage />} />
    </Routes>
  )
}
