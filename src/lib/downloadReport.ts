const FIELD_LABELS: Record<string, string> = {
  AL: 'Осевая длина (мм)', K1: 'Кератометрия K1 (Д)', K2: 'Кератометрия K2 (Д)',
  ACD: 'Глубина передней камеры (мм)', aConst: 'Константа A линзы',
  targetRef: 'Целевая рефракция (Д)', ethnicGroup: 'Этническая группа',
  vitreousState: 'Состояние стекловидного тела', oilDensity: 'Плотность масла',
  fixationMethod: 'Метод фиксации', scleralDistance: 'Склеральное расстояние (мм)',
  useStandardScleralDist: 'Стандартное склеральное расстояние',
  disloc_direction: 'Направление дислокации', disloc_power: 'Сила дислоцированной ИОЛ (Д)',
  disloc_replaceIOL: 'Замена ИОЛ', scenario: 'Сценарий',
}

const RESULT_LABELS: Record<string, string> = {
  recommendedPower: 'Рекомендованная сила ИОЛ (Д)', predictedRefraction: 'Ожидаемая рефракция (Д)',
  'srkt.power': 'SRK/T — Сила ИОЛ (Д)', 'srkt.elp': 'SRK/T — ELP (мм)',
  'abakarov.power': 'Абакаров — Сила ИОЛ (Д)', 'abakarov.elp': 'Абакаров — ELP (мм)',
  status: 'Статус', hasMockData: 'Содержит тестовые данные',
}

const VALUE_LABELS: Record<string, string> = {
  dislocation: 'Дислокация ИОЛ', primary: 'Первичная имплантация', aphakia: 'Афакия',
  scleral: 'Склеральная фиксация', european: 'Европейская', asian: 'Азиатская',
  african: 'Африканская', native: 'Нативное', oil: 'Силиконовое масло',
  air: 'Воздух', gas: 'Газ', scleral_sutures: 'Склеральные швы',
  iris_sutures: 'Ирисовые швы', anterior_chamber: 'Передняя камера',
  posterior_chamber: 'Задняя камера', true: 'Да', false: 'Нет',
  low: 'Ниже ожидаемого', normal: 'В норме', high: 'Выше ожидаемого', attention: 'Требует внимания',
}

const SCENARIO_LABELS: Record<string, string> = {
  dislocation: 'Дислокация / сублюксация ИОЛ',
  secondary: 'Вторичная имплантация в афакичный глаз',
  scleral_ext: 'Склеральная фиксация (расширенный расчёт)',
}

const HIDDEN_KEYS = new Set(['inputSummary', 'disloc_powerKnown', 'formulaName', 'isMock', 'uncertainty'])

function tv(val: unknown): string {
  return VALUE_LABELS[String(val)] ?? String(val)
}

function flattenResult(obj: Record<string, unknown>, prefix = ''): Array<[string, string]> {
  const result: Array<[string, string]> = []
  for (const [k, v] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${k}` : k
    if (HIDDEN_KEYS.has(k) || k === 'inputSummary') continue
    if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
      result.push(...flattenResult(v as Record<string, unknown>, fullKey))
    } else {
      result.push([fullKey, tv(v)])
    }
  }
  return result
}

function tableRows(pairs: Array<[string, string]>, labels: Record<string, string>): string {
  return pairs.map(([k, v]) => `
    <tr>
      <td class="label">${labels[k] ?? k}</td>
      <td class="value">${v}</td>
    </tr>`).join('')
}

export function downloadReport(opts: {
  name: string
  scenario: string
  inputs: Record<string, unknown>
  result: Record<string, unknown>
  notes?: string
  createdAt?: string
}) {
  const { name, scenario, inputs, result, notes, createdAt } = opts

  const date = createdAt
    ? new Date(createdAt).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : new Date().toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })

  const resultPairs = flattenResult(result)
  const inputPairs: Array<[string, string]> = Object.entries(inputs)
    .filter(([k, v]) => !HIDDEN_KEYS.has(k) && v !== '' && v !== null && v !== undefined)
    .map(([k, v]) => [k, tv(v)])

  const html = `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <title>${name}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; color: #27272A; background: white; padding: 32px; font-size: 13px; line-height: 1.5; max-width: 680px; margin: 0 auto; }
    .header { display: flex; align-items: center; gap: 12px; padding-bottom: 18px; border-bottom: 2px solid #E4E4E7; margin-bottom: 22px; }
    .logo { width: 40px; height: 40px; border-radius: 10px; background: #0f5fb8; color: white; font-size: 20px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .app-name { font-size: 17px; font-weight: 700; }
    .app-sub { font-size: 11px; color: #9F9FA9; }
    .doc-title { font-size: 16px; font-weight: 600; margin-bottom: 3px; }
    .doc-meta { font-size: 11px; color: #9F9FA9; margin-bottom: 22px; }
    .section { margin-bottom: 18px; }
    .section-head { font-size: 12px; font-weight: 600; color: #27272A; background: #F6F6F7; border: 1px solid #E4E4E7; border-bottom: none; border-radius: 8px 8px 0 0; padding: 9px 14px; }
    table { width: 100%; border-collapse: collapse; border: 1px solid #E4E4E7; border-radius: 0 0 8px 8px; overflow: hidden; }
    tr:nth-child(even) td { background: #FAFAFA; }
    td { padding: 8px 14px; border-bottom: 1px solid #E4E4E7; font-size: 12px; }
    td.label { color: #9F9FA9; width: 55%; }
    td.value { font-weight: 600; text-align: right; }
    .notes-box { background: #F6F6F7; border: 1px solid #E4E4E7; border-radius: 8px; padding: 12px 14px; font-size: 12px; color: #27272A; white-space: pre-wrap; }
    .notes-head { font-size: 12px; font-weight: 600; margin-bottom: 6px; }
    .footer { margin-top: 28px; padding-top: 14px; border-top: 1px solid #E4E4E7; font-size: 10px; color: #9F9FA9; text-align: center; }
    @media print {
      body { padding: 16px; }
      @page { margin: 12mm; size: A4; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">👁</div>
    <div>
      <div class="app-name">IOL Calc Abakarov</div>
      <div class="app-sub">Калькулятор силы интраокулярной линзы</div>
    </div>
  </div>

  <div class="doc-title">${name}</div>
  <div class="doc-meta">${SCENARIO_LABELS[scenario] ?? scenario} · ${date}</div>

  <div class="section">
    <div class="section-head">Результат расчёта</div>
    <table>${tableRows(resultPairs, RESULT_LABELS)}</table>
  </div>

  <div class="section">
    <div class="section-head">Параметры пациента</div>
    <table>${tableRows(inputPairs, FIELD_LABELS)}</table>
  </div>

  ${notes ? `<div class="section"><div class="notes-head">Заметки</div><div class="notes-box">${notes}</div></div>` : ''}

  <div class="footer">IOL Calc Abakarov · Только для ознакомительных целей · Не является медицинским заключением</div>

  <script>window.onload = () => { window.print(); }<\/script>
</body>
</html>`

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const win = window.open(url, '_blank')
  if (win) setTimeout(() => URL.revokeObjectURL(url), 60000)
}
