import { AlertTriangle } from 'lucide-react'

export function Disclaimer() {
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 flex gap-3">
      <AlertTriangle size={18} className="text-amber-600 mt-0.5 shrink-0" />
      <p className="text-sm text-amber-800 leading-relaxed">
        <span className="font-semibold">Важно:</span> калькулятор носит вспомогательный характер
        и <strong>не является медицинским заключением</strong>. Окончательное решение
        о выборе силы ИОЛ принимается оперирующим хирургом на основании полного
        клинического обследования пациента. Часть расчётных констант отмечена как{' '}
        <span className="font-medium">MOCK</span> и требует верификации по первоисточнику.
      </p>
    </div>
  )
}
