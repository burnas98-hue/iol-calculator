import { HelpCircle } from 'lucide-react'
import { useState } from 'react'
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
  const [openHints, setOpenHints] = useState<Set<string>>(new Set())
  const toggleHint = (key: string) =>
    setOpenHints(prev => { const s = new Set(prev); s.has(key) ? s.delete(key) : s.add(key); return s })

  const err = (field: keyof IOLInputs) => errors.find(e => e.field === field)?.message

  // Показываем метод фиксации: сценарий 1 только при замене, иначе всегда
  const showFixation =
    values.scenario !== 'dislocation' || values.disloc_replaceIOL

  const isScleralFix =
    showFixation &&
    (values.fixationMethod === 'scleral_sutures' || values.fixationMethod === 'intrascleral')

  return (
    <form onSubmit={e => { e.preventDefault(); onSubmit() }} className="space-y-5">

      {/* ── 1. Клинический сценарий ────────────────────────────────────── */}
      <fieldset className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
        <legend className="text-sm font-semibold text-slate-700 px-1">Клинический сценарий</legend>
        <div className="space-y-2">
          {(Object.keys(SCENARIO_LABELS) as ClinicalScenario[]).map((key, i) => (
            <label key={key} className={cn(
              'flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
              values.scenario === key
                ? 'border-medical-500 bg-medical-50'
                : 'border-slate-200 hover:border-slate-300',
            )}>
              <input type="radio" name="scenario" value={key}
                checked={values.scenario === key}
                onChange={() => onChange('scenario', key)}
                className="mt-0.5 accent-medical-600" />
              <div>
                <p className="text-sm font-medium text-slate-800">{i + 1}. {SCENARIO_LABELS[key]}</p>
                <p className="text-xs text-slate-500 mt-0.5">{SCENARIO_HINTS[key]}</p>
              </div>
            </label>
          ))}
        </div>
      </fieldset>

      {/* ── 2. Биометрия ──────────────────────────────────────────────── */}
      <fieldset className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
        <legend className="text-sm font-semibold text-slate-700 px-1">Биометрия глаза</legend>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {(['AL', 'K1', 'K2', 'ACD', 'aConst', 'targetRef'] as const).map(field => {
            const meta = FIELD_META[field]
            const fieldErr = err(field)
            const isOpen = openHints.has(field)
            return (
              <div key={field} className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <label htmlFor={field} className="text-sm font-medium text-slate-700">
                    {meta.label}
                    {!meta.required && (
                      <span className="ml-1.5 text-xs text-slate-400 font-normal">опционально</span>
                    )}
                  </label>
                  <button type="button" onClick={() => toggleHint(field)}
                    className="text-slate-400 hover:text-slate-600 transition-colors">
                    <HelpCircle size={14} />
                  </button>
                </div>
                {isOpen && (
                  <p className="text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-2 border border-slate-100">
                    {meta.hint}
                  </p>
                )}
                <div className="relative">
                  <input id={field} type="text" inputMode="decimal"
                    value={values[field] as string}
                    onChange={e => onChange(field, e.target.value)}
                    placeholder={meta.required ? meta.placeholder : `${meta.placeholder} (необяз.)`}
                    className={cn(
                      'w-full rounded-lg border px-3 py-2 text-sm bg-white transition-colors',
                      'focus:outline-none focus:ring-2 focus:ring-medical-400',
                      meta.unit ? 'pr-10' : '',
                      fieldErr
                        ? 'border-red-400 bg-red-50 text-red-900'
                        : 'border-slate-300 text-slate-900',
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
      </fieldset>

      {/* ── 3. Клинические параметры ──────────────────────────────────── */}
      <fieldset className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
        <legend className="text-sm font-semibold text-slate-700 px-1">Клинические параметры</legend>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <SelectField id="ethnicGroup" label="Этническая группа пациента"
            hint="Используется для поправки ELP. ⚠️ Значения — MOCK."
            value={values.ethnicGroup} onChange={v => onChange('ethnicGroup', v)}
            options={Object.entries(ETHNIC_GROUP_LABELS).map(([k, v]) => ({ value: k, label: v }))}
            openHints={openHints} onToggleHint={toggleHint} />

          <SelectField id="vitreousState" label="Состояние стекловидного тела"
            hint="Влияет на поправку к расчётной силе ИОЛ. ⚠️ Поправки — MOCK."
            value={values.vitreousState} onChange={v => onChange('vitreousState', v)}
            options={Object.entries(VITREOUS_STATE_LABELS).map(([k, v]) => ({ value: k, label: v }))}
            openHints={openHints} onToggleHint={toggleHint} />
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
                    ? 'border-orange-400 bg-orange-100 text-orange-800 font-medium'
                    : 'border-slate-200 bg-white text-slate-700',
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
      </fieldset>

      {/* ── 4. Данные о дислоцированной ИОЛ (только сценарий 1) ───────── */}
      {values.scenario === 'dislocation' && (
        <fieldset className="bg-white rounded-xl border border-slate-200 p-5 space-y-5">
          <legend className="text-sm font-semibold text-slate-700 px-1">Данные о дислоцированной ИОЛ</legend>

          {/* 4а. Известна ли оптическая сила? */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-700">Известна ли оптическая сила ИОЛ?</p>
            <YesNoToggle value={values.disloc_powerKnown}
              onChange={v => onChange('disloc_powerKnown', v)} name="disloc_powerKnown" />
          </div>

          {/* 4б. Сила в диоптриях — если да */}
          {values.disloc_powerKnown && (
            <div className="space-y-1">
              <label htmlFor="disloc_power" className="text-sm font-medium text-slate-700">
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
            <p className="text-sm font-medium text-slate-700">Направление смещения</p>
            <div className="space-y-1.5">
              {(Object.keys(DISPLACEMENT_DIRECTION_LABELS) as DisplacementDirection[]).map((key, i) => (
                <label key={key} className={cn(
                  'flex items-center gap-2.5 px-3 py-2 rounded-lg border cursor-pointer text-sm transition-colors',
                  values.disloc_direction === key
                    ? 'border-medical-400 bg-medical-50 text-medical-800 font-medium'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300',
                )}>
                  <input type="radio" name="disloc_direction" value={key}
                    checked={values.disloc_direction === key}
                    onChange={() => onChange('disloc_direction', key)}
                    className="accent-medical-600 shrink-0" />
                  {i + 1}. {DISPLACEMENT_DIRECTION_LABELS[key]}
                </label>
              ))}
            </div>
          </div>

          {/* 4г. Имплантировать новую ИОЛ? */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-700">Имплантировать новую ИОЛ?</p>
            <div className="flex flex-col sm:flex-row gap-2">
              {[
                { label: 'Да — удалить и имплантировать новую', val: true },
                { label: 'Нет — репозиция (ремонт)', val: false },
              ].map(opt => (
                <label key={String(opt.val)} className={cn(
                  'flex items-center gap-2 px-4 py-2.5 rounded-lg border cursor-pointer text-sm font-medium transition-colors',
                  values.disloc_replaceIOL === opt.val
                    ? opt.val
                      ? 'border-medical-500 bg-medical-50 text-medical-700'
                      : 'border-slate-500 bg-slate-100 text-slate-700'
                    : 'border-slate-300 bg-white text-slate-600 hover:border-slate-400',
                )}>
                  <input type="radio" name="disloc_replaceIOL"
                    checked={values.disloc_replaceIOL === opt.val}
                    onChange={() => onChange('disloc_replaceIOL', opt.val)}
                    className="accent-medical-600" />
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
                openHints={openHints} onToggleHint={toggleHint} />

              {/* Расстояние от лимба */}
              {isScleralFix && (
                <ScleralDistanceBlock values={values} err={err} onChange={onChange} />
              )}
            </div>
          )}
        </fieldset>
      )}

      {/* ── Метод фиксации для сценариев 2 и 3 ───────────────────────── */}
      {values.scenario !== 'dislocation' && (
        <fieldset className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
          <legend className="text-sm font-semibold text-slate-700 px-1">Метод фиксации ИОЛ</legend>

          <SelectField id="fixationMethod" label="Планируемый метод фиксации ИОЛ"
            hint="Определяет позицию линзы (ELP). Для нестандартных методов поправки — ⚠️ MOCK."
            value={values.fixationMethod} onChange={v => onChange('fixationMethod', v)}
            options={Object.entries(FIXATION_METHOD_LABELS).map(([k, v]) => ({ value: k, label: v }))}
            openHints={openHints} onToggleHint={toggleHint} />

          {isScleralFix && (
            <ScleralDistanceBlock values={values} err={err} onChange={onChange} />
          )}
        </fieldset>
      )}

      <button type="submit"
        className="w-full sm:w-auto px-8 py-3 rounded-xl bg-medical-600 hover:bg-medical-700 active:bg-medical-800 text-white font-semibold text-sm transition-colors shadow-sm">
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
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-3">
      <p className="text-sm font-medium text-slate-700">
        Использовать стандартное расстояние 2.0 мм от лимба?
      </p>
      <YesNoToggle value={values.useStandardScleralDist}
        onChange={v => onChange('useStandardScleralDist', v)}
        name="useStandardScleralDist" />

      {!values.useStandardScleralDist && (
        <div className="space-y-1 pt-1">
          <label htmlFor="scleralDistance" className="text-sm font-medium text-slate-700">
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
    <div className="flex gap-3">
      {[{ label: 'Да', val: true }, { label: 'Нет', val: false }].map(opt => (
        <label key={String(opt.val)} className={cn(
          'flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer text-sm font-medium transition-colors',
          value === opt.val
            ? 'border-medical-500 bg-medical-50 text-medical-700'
            : 'border-slate-300 bg-white text-slate-600 hover:border-slate-400',
        )}>
          <input type="radio" name={name} checked={value === opt.val}
            onChange={() => onChange(opt.val)} className="accent-medical-600" />
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
  openHints: Set<string>; onToggleHint: (k: string) => void
}

function SelectField({ id, label, hint, value, onChange, options, openHints, onToggleHint }: SelectFieldProps) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5">
        <label htmlFor={id} className="text-sm font-medium text-slate-700">{label}</label>
        <button type="button" onClick={() => onToggleHint(id)}
          className="text-slate-400 hover:text-slate-600 transition-colors">
          <HelpCircle size={14} />
        </button>
      </div>
      {openHints.has(id) && (
        <p className="text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-2 border border-slate-100">{hint}</p>
      )}
      <select id={id} value={value} onChange={e => onChange(e.target.value)}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-medical-400 transition-colors">
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  )
}
