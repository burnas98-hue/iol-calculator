import { HelpCircle } from 'lucide-react'
import { FIELD_META } from '../data/units'
import {
  SCENARIO_LABELS,
  ETHNIC_GROUP_LABELS,
  VITREOUS_STATE_LABELS,
  OIL_DENSITY_LABELS,
  FIXATION_METHOD_LABELS,
  DISPLACEMENT_DIRECTION_LABELS,
} from '../data/referenceRanges'
import type { IOLInputs, FieldError, ClinicalScenario, DisplacementDirection } from '../types'
import { cn } from './ui/cn'

interface Props {
  values: IOLInputs
  errors: FieldError[]
  onChange: (field: keyof IOLInputs, value: string | boolean) => void
  onSubmit: () => void
}

const SCENARIO_HINTS: Record<ClinicalScenario, string> = {
  dislocation: 'Репозиция или замена дислоцированной/сублюксированной ИОЛ.',
  secondary:   'Первичная имплантация ИОЛ в афакичный глаз после ранее выполненной экстракции катаракты без имплантации.',
  scleral_ext: 'Расширенный расчёт при первичной или вторичной склеральной фиксации ИОЛ.',
}

export function InputForm({ values, errors, onChange, onSubmit }: Props) {
  const err = (field: keyof IOLInputs) => errors.find(e => e.field === field)?.message

  // Показываем метод фиксации: сценарий 1 только при замене, иначе всегда
  const showFixation =
    values.scenario !== 'dislocation' || values.disloc_replaceIOL

  const isScleralFix =
    showFixation &&
    (values.fixationMethod === 'scleral_sutures' || values.fixationMethod === 'intrascleral')

  return (
    <form onSubmit={e => { e.preventDefault(); onSubmit() }} className="space-y-4">

      {/* ── 1. Клинический сценарий ────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-app-border shadow-sm p-5 space-y-3">
        <p className="text-base font-medium text-app-text">Клинический сценарий</p>
        <div className="space-y-1.5">
          {(Object.keys(SCENARIO_LABELS) as ClinicalScenario[]).map((key, i) => (
            <label key={key} className={cn(
              'flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all',
              values.scenario === key
                ? 'border-medical-400 bg-medical-50 shadow-sm'
                : 'border-app-border hover:border-slate-300 hover:bg-app-bg',
            )}>
              <span className={cn(
                'mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all',
                values.scenario === key ? 'border-medical-500' : 'border-slate-300',
              )}>
                {values.scenario === key && (
                  <span className="w-2 h-2 rounded-full bg-medical-500" />
                )}
              </span>
              <input type="radio" name="scenario" value={key}
                checked={values.scenario === key}
                onChange={() => onChange('scenario', key)}
                className="sr-only" />
              <div>
                <p className="text-sm text-app-text">{i + 1}. {SCENARIO_LABELS[key]}</p>
                <p className="text-xs text-app-muted mt-0.5">{SCENARIO_HINTS[key]}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* ── 2. Биометрия ──────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-app-border shadow-sm p-5 space-y-4">
        <p className="text-base font-medium text-app-text">Биометрия глаза</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
          {(['AL', 'K1', 'K2', 'ACD', 'aConst', 'targetRef'] as const).map(field => {
            const meta = FIELD_META[field]
            const fieldErr = err(field)
            return (
              <div key={field} className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <label htmlFor={field} className="text-sm text-app-text">
                    {meta.label}
                    {!meta.required && (
                      <span className="ml-1.5 text-xs text-slate-400 font-normal">опционально</span>
                    )}
                  </label>
                  <HintTooltip text={meta.hint} />
                </div>
                <div className="relative">
                  <input id={field} type="text" inputMode="decimal"
                    value={values[field] as string}
                    onChange={e => onChange(field, e.target.value)}
                    placeholder={meta.required ? meta.placeholder : `${meta.placeholder} (необяз.)`}
                    className={cn(
                      'w-full rounded-xl border px-3 py-2.5 text-sm bg-white transition-all',
                      'focus:outline-none focus:ring-2 focus:ring-medical-400 focus:border-transparent',
                      meta.unit ? 'pr-10' : '',
                      fieldErr
                        ? 'border-red-300 bg-red-50 text-red-900'
                        : 'border-app-border text-app-text placeholder:text-app-muted',
                    )}
                  />
                  {meta.unit && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 select-none pointer-events-none">
                      {meta.unit}
                    </span>
                  )}
                </div>
                {fieldErr && <p className="text-xs text-red-600">⚠ {fieldErr}</p>}
              </div>
            )
          })}
        </div>
      </div>

      {/* ── 3. Клинические параметры ──────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-app-border shadow-sm p-5 space-y-4">
        <p className="text-base font-medium text-app-text">Клинические параметры</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <SelectField id="ethnicGroup" label="Этническая группа пациента"
            hint="Используется для поправки ELP. ⚠️ Значения — MOCK."
            value={values.ethnicGroup} onChange={v => onChange('ethnicGroup', v)}
            options={Object.entries(ETHNIC_GROUP_LABELS).map(([k, v]) => ({ value: k, label: v }))}
            />

          <SelectField id="vitreousState" label="Состояние стекловидного тела"
            hint="Влияет на поправку к расчётной силе ИОЛ. ⚠️ Поправки — MOCK."
            value={values.vitreousState} onChange={v => onChange('vitreousState', v)}
            options={Object.entries(VITREOUS_STATE_LABELS).map(([k, v]) => ({ value: k, label: v }))}
            />
        </div>

        {/* Плотность масла */}
        {values.vitreousState === 'silicone' && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 space-y-2">
            <p className="text-xs font-semibold text-orange-700">Плотность силиконового масла ⚠️ MOCK</p>
            <div className="flex flex-wrap gap-3">
              {Object.entries(OIL_DENSITY_LABELS).map(([k, v]) => (
                <label key={k} className={cn(
                  'flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm cursor-pointer transition-colors',
                  values.oilDensity === k
                    ? 'border-orange-400 bg-orange-100 text-orange-800'
                    : 'border-app-border bg-white text-app-text',
                )}>
                  <input type="radio" name="oilDensity" value={k}
                    checked={values.oilDensity === k}
                    onChange={() => onChange('oilDensity', k)}
                    className="accent-orange-500" />
                  {v}
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── 4. Данные о дислоцированной ИОЛ (только сценарий 1) ───────── */}
      {values.scenario === 'dislocation' && (
        <div className="bg-white rounded-2xl border border-app-border shadow-sm p-5 space-y-5">
          <p className="text-base font-medium text-app-text">Данные о дислоцированной ИОЛ</p>

          {/* 4а. Известна ли оптическая сила? */}
          <div className="space-y-2">
            <p className="text-sm text-app-text">Известна ли оптическая сила ИОЛ?</p>
            <YesNoToggle value={values.disloc_powerKnown}
              onChange={v => onChange('disloc_powerKnown', v)} name="disloc_powerKnown" />
          </div>

          {/* 4б. Сила в диоптриях — если да */}
          {values.disloc_powerKnown && (
            <div className="space-y-1">
              <label htmlFor="disloc_power" className="text-sm text-app-text">
                Оптическая сила смещённой ИОЛ
              </label>
              <div className="relative max-w-[180px]">
                <input id="disloc_power" type="text" inputMode="decimal"
                  value={values.disloc_power}
                  onChange={e => onChange('disloc_power', e.target.value)}
                  placeholder="22.0"
                  className={cn(
                    'w-full rounded-lg border px-3 py-2 text-sm pr-8',
                    'focus:outline-none focus:ring-2 focus:ring-medical-400',
                    err('disloc_power') ? 'border-red-400 bg-red-50' : 'border-slate-300 bg-white',
                  )}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">Д</span>
              </div>
              {err('disloc_power') && <p className="text-xs text-red-600">⚠ {err('disloc_power')}</p>}
            </div>
          )}

          {/* 4в. Направление смещения */}
          <div className="space-y-2">
            <p className="text-sm text-app-text">Направление смещения</p>
            <div className="space-y-1.5">
              {(Object.keys(DISPLACEMENT_DIRECTION_LABELS) as DisplacementDirection[]).map((key, i) => (
                <label key={key} className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl border cursor-pointer text-sm transition-all',
                  values.disloc_direction === key
                    ? 'border-medical-400 bg-medical-50 text-medical-800'
                    : 'border-app-border bg-white text-app-text hover:border-slate-300 hover:bg-app-bg',
                )}>
                  <span className={cn(
                    'w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all',
                    values.disloc_direction === key ? 'border-medical-500' : 'border-slate-300',
                  )}>
                    {values.disloc_direction === key && (
                      <span className="w-2 h-2 rounded-full bg-medical-500" />
                    )}
                  </span>
                  <input type="radio" name="disloc_direction" value={key}
                    checked={values.disloc_direction === key}
                    onChange={() => onChange('disloc_direction', key)}
                    className="sr-only" />
                  {i + 1}. {DISPLACEMENT_DIRECTION_LABELS[key]}
                </label>
              ))}
            </div>
          </div>

          {/* 4г. Имплантировать новую ИОЛ? */}
          <div className="space-y-2">
            <p className="text-sm text-app-text">Имплантировать новую ИОЛ?</p>
            <div className="flex gap-2">
              {[
                { label: 'Да — имплантировать новую', val: true },
                { label: 'Нет — репозиция', val: false },
              ].map(opt => (
                <label key={String(opt.val)} className={cn(
                  'flex items-center gap-2 px-4 py-2.5 rounded-xl border cursor-pointer text-sm transition-all',
                  values.disloc_replaceIOL === opt.val
                    ? 'border-medical-400 bg-medical-50 text-medical-700'
                    : 'border-app-border bg-white text-app-muted hover:border-slate-300',
                )}>
                  <span className={cn(
                    'w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all',
                    values.disloc_replaceIOL === opt.val ? 'border-medical-500' : 'border-slate-300',
                  )}>
                    {values.disloc_replaceIOL === opt.val && <span className="w-2 h-2 rounded-full bg-medical-500" />}
                  </span>
                  <input type="radio" name="disloc_replaceIOL"
                    checked={values.disloc_replaceIOL === opt.val}
                    onChange={() => onChange('disloc_replaceIOL', opt.val)}
                    className="sr-only" />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>

          {/* 4д. Метод фиксации — только если да */}
          {values.disloc_replaceIOL && (
            <div className="space-y-3 pt-1 border-t border-slate-100">
              <SelectField id="fixationMethod" label="Планируемый метод фиксации ИОЛ"
                hint="Определяет позицию линзы (ELP). Для нестандартных методов поправки — ⚠️ MOCK."
                value={values.fixationMethod} onChange={v => onChange('fixationMethod', v)}
                options={Object.entries(FIXATION_METHOD_LABELS).map(([k, v]) => ({ value: k, label: v }))}
                />

              {/* Расстояние от лимба */}
              {isScleralFix && (
                <ScleralDistanceBlock values={values} err={err} onChange={onChange} />
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Метод фиксации для сценариев 2 и 3 ───────────────────────── */}
      {values.scenario !== 'dislocation' && (
        <div className="bg-white rounded-2xl border border-app-border shadow-sm p-5 space-y-4">
          <p className="text-base font-medium text-app-text">Метод фиксации ИОЛ</p>

          <SelectField id="fixationMethod" label="Планируемый метод фиксации ИОЛ"
            hint="Определяет позицию линзы (ELP). Для нестандартных методов поправки — ⚠️ MOCK."
            value={values.fixationMethod} onChange={v => onChange('fixationMethod', v)}
            options={Object.entries(FIXATION_METHOD_LABELS).map(([k, v]) => ({ value: k, label: v }))}
            />

          {isScleralFix && (
            <ScleralDistanceBlock values={values} err={err} onChange={onChange} />
          )}
        </div>
      )}

      <button type="submit"
        className="w-full py-3 rounded-2xl bg-medical-600 hover:bg-medical-700 active:bg-medical-800 text-white font-semibold text-sm transition-all shadow-md hover:shadow-lg">
        Рассчитать
      </button>
    </form>
  )
}

// ─── Scleral distance block (переиспользуемый) ────────────────────────────────

function ScleralDistanceBlock({
  values, err, onChange,
}: {
  values: IOLInputs
  err: (f: keyof IOLInputs) => string | undefined
  onChange: (field: keyof IOLInputs, value: string | boolean) => void
}) {
  return (
    <div className="rounded-xl border border-app-border bg-app-bg p-4 space-y-3">
      <p className="text-sm text-app-text">
        Использовать стандартное расстояние 2.0 мм от лимба?
      </p>
      <YesNoToggle value={values.useStandardScleralDist}
        onChange={v => onChange('useStandardScleralDist', v)}
        name="useStandardScleralDist" />

      {!values.useStandardScleralDist && (
        <div className="space-y-1 pt-1">
          <label htmlFor="scleralDistance" className="text-sm text-app-text">
            {FIELD_META.scleralDistance.label}
          </label>
          <div className="relative max-w-[160px]">
            <input id="scleralDistance" type="text" inputMode="decimal"
              value={values.scleralDistance}
              onChange={e => onChange('scleralDistance', e.target.value)}
              placeholder="2.0"
              className={cn(
                'w-full rounded-lg border px-3 py-2 text-sm pr-10',
                'focus:outline-none focus:ring-2 focus:ring-medical-400',
                err('scleralDistance') ? 'border-red-400 bg-red-50' : 'border-slate-300 bg-white',
              )}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">мм</span>
          </div>
          {err('scleralDistance') && (
            <p className="text-xs text-red-600">⚠ {err('scleralDistance')}</p>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Yes/No toggle ────────────────────────────────────────────────────────────

function YesNoToggle({ value, onChange, name }: {
  value: boolean
  onChange: (v: boolean) => void
  name: string
}) {
  return (
    <div className="flex gap-2">
      {[{ label: 'Да', val: true }, { label: 'Нет', val: false }].map(opt => (
        <label key={String(opt.val)} className={cn(
          'flex items-center gap-2 px-4 py-2 rounded-xl border cursor-pointer text-sm transition-all',
          value === opt.val
            ? 'border-medical-400 bg-medical-50 text-medical-700'
            : 'border-app-border bg-white text-app-muted hover:border-slate-300',
        )}>
          <span className={cn(
            'w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all',
            value === opt.val ? 'border-medical-500' : 'border-slate-300',
          )}>
            {value === opt.val && <span className="w-2 h-2 rounded-full bg-medical-500" />}
          </span>
          <input type="radio" name={name} checked={value === opt.val}
            onChange={() => onChange(opt.val)} className="sr-only" />
          {opt.label}
        </label>
      ))}
    </div>
  )
}

// ─── Select helper ────────────────────────────────────────────────────────────

interface SelectFieldProps {
  id: string; label: string; hint: string; value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}

function SelectField({ id, label, hint, value, onChange, options }: SelectFieldProps) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5">
        <label htmlFor={id} className="text-sm text-app-text">{label}</label>
        <HintTooltip text={hint} />
      </div>
      <div className="relative">
        <select id={id} value={value} onChange={e => onChange(e.target.value)}
          className="w-full appearance-none rounded-xl border border-app-border pl-3 pr-9 py-2.5 text-sm bg-white text-app-text focus:outline-none focus:ring-2 focus:ring-medical-400 focus:border-transparent transition-all">
          {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </span>
      </div>
    </div>
  )
}

// ─── Hint tooltip (hover, no layout shift) ───────────────────────────────────

function HintTooltip({ text }: { text: string }) {
  return (
    <span className="relative group inline-flex items-center">
      <HelpCircle size={14} className="text-slate-400 group-hover:text-slate-600 cursor-help transition-colors" />
      <span className="pointer-events-none absolute top-5 left-0 z-50 w-60 rounded-xl bg-white border border-app-border shadow-md px-3 py-2 text-xs text-app-muted opacity-0 group-hover:opacity-100 transition-opacity">
        {text}
      </span>
    </span>
  )
}
