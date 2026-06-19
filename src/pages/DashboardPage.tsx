import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronDown, Trash2, Pencil, Check, Plus, Calculator, StickyNote, Download } from 'lucide-react'
import { downloadReport } from '../lib/downloadReport'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Header } from '../components/Header'

interface Calculation {
  id: string
  name: string
  notes: string
  scenario: string
  inputs: Record<string, unknown>
  result: Record<string, unknown>
  created_at: string
}

// Перевод названий полей
const FIELD_LABELS: Record<string, string> = {
  // Результат
  recommendedPower: 'Рекомендованная сила ИОЛ (Д)',
  predictedRefraction: 'Ожидаемая рефракция (Д)',
  status: 'Статус',
  hasMockData: 'Содержит тестовые данные',
  power: 'Сила ИОЛ (Д)',
  refraction: 'Рефракция (Д)',
  // Вложенные формулы
  'srkt.power': 'SRK/T — Сила ИОЛ (Д)',
  'srkt.refraction': 'SRK/T — Рефракция',
  'abakarov.power': 'Абакаров — Сила ИОЛ (Д)',
  'abakarov.refraction': 'Абакаров — Рефракция',
  // Входные параметры
  AL: 'Осевая длина (мм)',
  K1: 'Кератометрия K1 (Д)',
  K2: 'Кератометрия K2 (Д)',
  ACD: 'Глубина передней камеры (мм)',
  aConst: 'Константа A линзы',
  targetRef: 'Целевая рефракция (Д)',
  scenario: 'Клинический сценарий',
  ethnicGroup: 'Этническая группа',
  vitreousState: 'Состояние стекловидного тела',
  oilDensity: 'Плотность масла',
  fixationMethod: 'Метод фиксации',
  scleralDistance: 'Склеральное расстояние (мм)',
  useStandardScleralDist: 'Стандартное склеральное расстояние',
  disloc_direction: 'Направление дислокации',
  disloc_powerKnown: 'Сила ИОЛ известна',
  disloc_power: 'Сила дислоцированной ИОЛ (Д)',
  disloc_replaceIOL: 'Замена ИОЛ',
}

const VALUE_LABELS: Record<string, string> = {
  dislocation: 'Дислокация ИОЛ',
  primary: 'Первичная имплантация',
  aphakia: 'Афакия',
  scleral: 'Склеральная фиксация',
  european: 'Европейская',
  asian: 'Азиатская',
  african: 'Африканская',
  native: 'Нативное',
  oil: 'Силиконовое масло',
  air: 'Воздух',
  gas: 'Газ',
  scleral_sutures: 'Склеральные швы',
  iris_sutures: 'Ирисовые швы',
  anterior_chamber: 'Передняя камера',
  posterior_chamber: 'Задняя камера',
  low: 'Низкий',
  moderate: 'Умеренный',
  high: 'Высокий',
  true: 'Да',
  false: 'Нет',
}

function translateValue(val: unknown): string {
  const s = String(val)
  return VALUE_LABELS[s] ?? s
}

function translateLabel(key: string): string {
  return FIELD_LABELS[key] ?? key
}

// Разворачивает вложенные объекты в плоский список пар ключ-значение
function flattenObject(obj: Record<string, unknown>, prefix = ''): Array<{ key: string; label: string; value: string }> {
  const result: Array<{ key: string; label: string; value: string }> = []
  for (const [k, v] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${k}` : k
    if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
      result.push(...flattenObject(v as Record<string, unknown>, fullKey))
    } else {
      result.push({
        key: fullKey,
        label: translateLabel(fullKey),
        value: translateValue(v),
      })
    }
  }
  return result
}

// Поля, которые не показываем в параметрах
const HIDDEN_INPUT_FIELDS = new Set(['inputSummary', 'disloc_powerKnown'])

// Поля результата, которые скрываем
const HIDDEN_RESULT_SUFFIXES = ['.isMock', '.formulaName', '.uncertainty']
const HIDDEN_RESULT_PREFIXES = ['inputSummary.']
const HIDDEN_RESULT_EXACT = new Set(['hasMockData'])

function isHiddenResultKey(key: string) {
  if (HIDDEN_RESULT_EXACT.has(key)) return true
  if (HIDDEN_RESULT_PREFIXES.some(p => key.startsWith(p))) return true
  if (HIDDEN_RESULT_SUFFIXES.some(s => key.endsWith(s))) return true
  return false
}

export default function DashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [calculations, setCalculations] = useState<Calculation[]>([])
  const [loading, setLoading] = useState(true)
  const [openId, setOpenId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [savingNotes, setSavingNotes] = useState<string | null>(null)
  const notesTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  useEffect(() => {
    if (!user) return
    fetchCalculations()
  }, [user])

  async function fetchCalculations() {
    setLoading(true)
    const { data, error } = await supabase
      .from('calculations')
      .select('*')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false })

    if (!error && data) setCalculations(data)
    setLoading(false)
  }

  async function deleteCalculation(id: string) {
    const { error } = await supabase.from('calculations').delete().eq('id', id)
    if (!error) setCalculations(prev => prev.filter(c => c.id !== id))
  }

  function startEditName(calc: Calculation) {
    setEditingId(calc.id)
    setEditName(calc.name)
  }

  async function saveName(id: string) {
    const trimmed = editName.trim()
    if (!trimmed) { setEditingId(null); return }
    const { error } = await supabase.from('calculations').update({ name: trimmed }).eq('id', id)
    if (!error) {
      setCalculations(prev => prev.map(c => c.id === id ? { ...c, name: trimmed } : c))
    }
    setEditingId(null)
  }

  function handleNotesChange(id: string, notes: string) {
    setCalculations(prev => prev.map(c => c.id === id ? { ...c, notes } : c))
    clearTimeout(notesTimers.current[id])
    setSavingNotes(id)
    notesTimers.current[id] = setTimeout(async () => {
      await supabase.from('calculations').update({ notes }).eq('id', id)
      setSavingNotes(null)
    }, 800)
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleString('ru-RU', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  }

  function scenarioLabel(scenario: string) {
    return VALUE_LABELS[scenario] ?? scenario
  }

  return (
    <div className="min-h-screen bg-app-bg">
      <Header />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-app-text">Личный кабинет</h2>
            <p className="text-sm text-app-muted mt-0.5">{user?.email}</p>
          </div>
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 px-4 py-2 bg-medical-600 hover:bg-medical-700 text-white text-sm font-medium rounded-xl transition-colors"
          >
            <Calculator size={16} />
            Новый расчёт
          </button>
        </div>

        {loading ? (
          <div className="text-center py-16 text-slate-400 text-sm">Загрузка истории...</div>
        ) : calculations.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-12 text-center">
            <div className="text-4xl mb-3">👁</div>
            <p className="text-sm text-slate-500">История расчётов пуста</p>
            <p className="text-xs text-app-muted mt-1">Выполните расчёт и он появится здесь</p>
            <button
              onClick={() => navigate('/')}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-medical-600 hover:bg-medical-700 text-white text-sm font-medium rounded-xl transition-colors"
            >
              <Plus size={16} />
              Первый расчёт
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {calculations.map((calc, index) => {
              const isOpen = openId === calc.id
              const isEditing = editingId === calc.id
              const resultRows = flattenObject(calc.result).filter(r => !isHiddenResultKey(r.key))
              const inputRows = flattenObject(calc.inputs).filter(r =>
                !HIDDEN_INPUT_FIELDS.has(r.key) && r.value !== '' && r.value !== 'undefined'
              )

              return (
                <div key={calc.id} className="bg-white rounded-2xl border border-app-border overflow-hidden">
                  {/* Заголовок строки */}
                  <div className="flex items-center gap-3 px-4 py-3">
                    <span className="text-xs font-mono text-slate-400 w-6 text-center shrink-0">
                      {calculations.length - index}
                    </span>

                    <div className="flex-1 min-w-0">
                      {isEditing ? (
                        <div className="flex items-center gap-2">
                          <input
                            autoFocus
                            value={editName}
                            onChange={e => setEditName(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') saveName(calc.id)
                              if (e.key === 'Escape') setEditingId(null)
                            }}
                            className="flex-1 text-sm border border-medical-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-medical-500"
                          />
                          <button onClick={() => saveName(calc.id)} className="text-medical-600 hover:text-medical-700">
                            <Check size={16} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 min-w-0">
                          <button onClick={() => setOpenId(isOpen ? null : calc.id)} className="flex-1 text-left min-w-0">
                            <span className="text-sm font-medium text-app-text truncate block">{calc.name}</span>
                            <span className="text-xs text-app-muted">
                              {scenarioLabel(calc.scenario)} · {formatDate(calc.created_at)}
                            </span>
                          </button>
                          <button
                            onClick={() => startEditName(calc)}
                            className="text-[#9F9FA9] hover:text-[#27272A] shrink-0 transition-colors"
                            title="Переименовать"
                          >
                            <Pencil size={16} />
                          </button>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => downloadReport({
                        name: calc.name,
                        scenario: calc.scenario,
                        inputs: calc.inputs,
                        result: calc.result,
                        notes: calc.notes,
                        createdAt: calc.created_at,
                      })}
                      className="text-[#9F9FA9] hover:text-[#27272A] shrink-0 transition-colors"
                      title="Скачать PDF"
                    >
                      <Download size={16} />
                    </button>
                    <button
                      onClick={() => deleteCalculation(calc.id)}
                      className="text-[#9F9FA9] hover:text-[#C10007] shrink-0 transition-colors"
                      title="Удалить"
                    >
                      <Trash2 size={16} />
                    </button>

                    <button
                      onClick={() => setOpenId(isOpen ? null : calc.id)}
                      className="text-[#9F9FA9] hover:text-[#27272A] shrink-0 transition-all"
                      style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                    >
                      <ChevronDown size={16} />
                    </button>
                  </div>

                  {/* Раскрытое содержимое */}
                  {isOpen && (
                    <div className="border-t border-app-border px-4 py-4 space-y-4">

                      {/* Единый белый контейнер с результатами и параметрами */}
                      <div className="bg-white rounded-2xl border border-app-border overflow-hidden">
                        {/* Результат расчёта */}
                        <div className="px-4 py-3 border-b border-app-border bg-white">
                          <h4 className="text-sm font-medium text-app-muted">Результат расчёта</h4>
                        </div>
                        <div className="divide-y divide-app-border">
                          {resultRows.map(({ key, label, value }) => (
                            <div key={key} className="flex justify-between items-center px-4 py-2.5 gap-4">
                              <span className="text-sm text-app-muted">{label}</span>
                              <span className="text-sm font-medium text-app-text text-right">{value}</span>
                            </div>
                          ))}
                        </div>

                        {/* Параметры пациента */}
                        <div className="px-4 py-3 border-t border-b border-app-border bg-white mt-2">
                          <h4 className="text-sm font-medium text-app-muted">Параметры пациента</h4>
                        </div>
                        <div className="divide-y divide-app-border">
                          {inputRows.map(({ key, label, value }) => (
                            <div key={key} className="flex justify-between items-center px-4 py-2.5 gap-4">
                              <span className="text-sm text-app-muted">{label}</span>
                              <span className="text-sm font-medium text-app-text text-right">{value}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Заметки */}
                      <div>
                        <div className="flex items-center gap-1.5 mb-2">
                          <StickyNote size={13} className="text-app-muted" />
                          <h4 className="text-sm font-medium text-app-text">Заметки</h4>
                          {savingNotes === calc.id && (
                            <span className="text-xs text-app-muted ml-auto">Сохраняю...</span>
                          )}
                        </div>
                        <textarea
                          value={calc.notes ?? ''}
                          onChange={e => handleNotesChange(calc.id, e.target.value)}
                          placeholder="Имя пациента, комментарии, дополнительные данные..."
                          rows={3}
                          className="w-full text-sm border border-app-border rounded-xl px-3 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-medical-500 focus:border-transparent placeholder:text-app-muted"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
