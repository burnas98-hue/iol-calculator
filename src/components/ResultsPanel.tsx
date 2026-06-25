import { CheckCircle, AlertCircle, TrendingDown, TrendingUp, FlaskConical } from 'lucide-react'
import type { IOLCalculationResult, ResultStatus, FormulaResult } from '../types'
import { SCENARIO_LABELS } from '../data/referenceRanges'
import { cn } from './ui/cn'

interface Props {
  result: IOLCalculationResult
  scenario: string
}

export function ResultsPanel({ result, scenario }: Props) {
  const { srkt, abakarov, recommendedPower, predictedRefraction, status, hasMockData, inputSummary } = result

  return (
    <div className="space-y-4">
      {/* ── Mock-предупреждение ──────────────────────────────────────────── */}
      {hasMockData && (
        <div className="flex gap-2.5 rounded-xl border border-orange-200 bg-orange-50 px-4 py-3">
          <FlaskConical size={16} className="text-orange-500 mt-0.5 shrink-0" />
          <p className="text-sm text-orange-800">
            <span className="font-semibold">Результат содержит mock-данные.</span>{' '}
            Поправки на состояние стекловидного тела, этническую группу и метод
            фиксации используют приближённые константы.
          </p>
        </div>
      )}

      {/* ── Рекомендованная сила ──────────────────────────────────────────── */}
      <div className={cn('rounded-xl border-2 p-5', statusColors[status].border, statusColors[status].bg)}>
        <div className="flex items-start gap-3">
          <StatusIcon status={status} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-app-muted">
              Рекомендуемая оптическая сила ИОЛ
            </p>
            <p className={cn('text-4xl font-bold mt-1 leading-none', statusColors[status].text)}>
              {recommendedPower.toFixed(2)}{' '}
              <span className="text-xl font-normal">Д</span>
            </p>
            <p className="text-xs text-slate-500 mt-2">
              с диапазоном неопределённости{' '}
              <span className="font-semibold text-slate-700">
                ±{srkt.uncertainty.toFixed(2)} Д
              </span>
              {hasMockData && <span className="text-orange-400 ml-1">⚠</span>}
            </p>
          </div>
          <StatusBadge status={status} />
        </div>
      </div>

      {/* ── Прогнозируемая рефракция ──────────────────────────────────────── */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-500">Прогнозируемая послеоперационная рефракция</p>
          <p className="text-2xl font-bold text-slate-800 mt-0.5">
            {predictedRefraction >= 0 ? '+' : ''}{predictedRefraction.toFixed(2)}{' '}
            <span className="text-base font-normal text-slate-500">Д</span>
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-500">Рассчитанное ELP</p>
          <p className="text-xl font-semibold text-slate-700 mt-0.5">
            {srkt.elp.toFixed(2)} <span className="text-sm font-normal text-slate-400">мм</span>
          </p>
        </div>
      </div>

      {/* ── По формулам (Abakarov) ───────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3">
        <FormulaCard result={srkt} />
        <FormulaCard result={abakarov} />
      </div>

      {/* ── Референсные формулы ──────────────────────────────────────────── */}
      {result.referenceFormulas.length > 0 && (
        <div className="rounded-xl border border-app-border bg-white overflow-hidden">
          <p className="text-sm font-medium text-app-muted px-4 py-2.5 border-b border-app-border">
            Референсные формулы (интактный глаз)
          </p>
          <div className="divide-y divide-app-border">
            {result.referenceFormulas.map(f => (
              <div key={f.formulaName} className="flex items-center justify-between px-4 py-2.5 gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-app-text">{f.formulaName}</span>
                  {f.isMock && (
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-600">
                      ~ACD
                    </span>
                  )}
                </div>
                <div className="text-right">
                  <span className="text-sm font-semibold text-app-text">{f.power.toFixed(2)} Д</span>
                  <span className="text-xs text-app-muted ml-2">ELP {f.elp.toFixed(2)} мм</span>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-app-muted px-4 py-2 border-t border-app-border bg-app-bg">
            Рассчитаны без поправок на стекловидное тело и метод фиксации — только как ориентир
          </p>
        </div>
      )}

      {/* ── Исходные данные (как в оригинальной программе) ───────────────── */}
      <InputSummaryCard summary={inputSummary} scenario={scenario} />
    </div>
  )
}

// ─── Input summary ────────────────────────────────────────────────────────────

function InputSummaryCard({ summary, scenario }: { summary: IOLCalculationResult['inputSummary']; scenario: string }) {
  const rows = [
    { label: 'Сценарий', value: SCENARIO_LABELS[scenario] ?? scenario },
    { label: 'AL', value: `${summary.AL.toFixed(2)} мм` },
    { label: 'K', value: `${summary.K1.toFixed(2)} / ${summary.K2.toFixed(2)} Д` },
    ...(summary.ACD !== null ? [{ label: 'ACD', value: `${summary.ACD.toFixed(2)} мм` }] : []),
    { label: 'A-constant', value: summary.aConst.toFixed(2) },
    { label: 'Этническая группа', value: summary.ethnicGroupLabel },
    { label: 'Целевая рефракция', value: `${summary.targetRef} Д` },
    { label: 'Метод фиксации', value: summary.fixationLabel },
    ...(summary.scleralDistance !== null
      ? [{ label: 'Расстояние от лимба', value: `${summary.scleralDistance.toFixed(1)} мм` }]
      : []),
    { label: 'Состояние стекловидного тела', value: summary.vitreousLabel },
    ...(summary.dislocPower !== null
      ? [{ label: 'Сила дислоцированной ИОЛ', value: `${summary.dislocPower} Д` }]
      : []),
    ...(summary.dislocDirectionLabel
      ? [{ label: 'Направление смещения', value: summary.dislocDirectionLabel }]
      : []),
    ...(summary.dislocReplace !== null
      ? [{ label: 'Тактика', value: summary.dislocReplace ? 'Удалить и имплантировать новую' : 'Репозиция' }]
      : []),
  ]

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      <p className="text-sm font-medium text-app-muted px-4 py-2.5 border-b border-app-border bg-white">
        Исходные данные
      </p>
      <div className="divide-y divide-slate-100">
        {rows.map(r => (
          <div key={r.label} className="flex justify-between px-4 py-2 text-sm">
            <span className="text-slate-500">{r.label}</span>
            <span className="font-medium text-slate-800 text-right">{r.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Formula card ──────────────────────────────────────────────────────────────

function FormulaCard({ result }: { result: FormulaResult }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2">
      <div className="flex items-center justify-between gap-1">
        <p className="text-xs font-semibold text-slate-600 leading-tight">{result.formulaName}</p>
        {result.isMock && (
          <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-600 shrink-0">
            Mock
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-slate-900">
        {result.power.toFixed(2)}<span className="text-sm font-normal text-slate-500 ml-1">Д</span>
      </p>
      <p className="text-xs text-slate-400">ELP: {result.elp.toFixed(2)} мм</p>
    </div>
  )
}

// ─── Status helpers ───────────────────────────────────────────────────────────

const statusColors: Record<ResultStatus, { border: string; bg: string; text: string }> = {
  normal:    { border: 'border-emerald-300', bg: 'bg-emerald-50',  text: 'text-emerald-700' },
  attention: { border: 'border-amber-300',   bg: 'bg-amber-50',    text: 'text-amber-700'   },
  low:       { border: 'border-blue-300',    bg: 'bg-blue-50',     text: 'text-blue-700'    },
  high:      { border: 'border-red-300',     bg: 'bg-red-50',      text: 'text-red-700'     },
}

const statusLabels: Record<ResultStatus, string> = {
  normal:    'В норме',
  attention: 'Требует внимания',
  low:       'Ниже ожидаемого',
  high:      'Выше ожидаемого',
}

function StatusIcon({ status }: { status: ResultStatus }) {
  const cls = 'mt-1 shrink-0'
  switch (status) {
    case 'normal':    return <CheckCircle size={22} className={cn(cls, 'text-emerald-500')} />
    case 'attention': return <AlertCircle size={22} className={cn(cls, 'text-amber-500')} />
    case 'low':       return <TrendingDown size={22} className={cn(cls, 'text-blue-500')} />
    case 'high':      return <TrendingUp   size={22} className={cn(cls, 'text-red-500')} />
  }
}

function StatusBadge({ status }: { status: ResultStatus }) {
  const colors: Record<ResultStatus, string> = {
    normal:    'bg-emerald-100 text-emerald-700',
    attention: 'bg-amber-100 text-amber-700',
    low:       'bg-blue-100 text-blue-700',
    high:      'bg-red-100 text-red-700',
  }
  return (
    <span className={cn('text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap', colors[status])}>
      {statusLabels[status]}
    </span>
  )
}
