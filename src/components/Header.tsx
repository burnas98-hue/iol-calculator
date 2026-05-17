import { Eye } from 'lucide-react'

export function Header() {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-3">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-medical-600 text-white shrink-0">
          <Eye size={20} />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-slate-900 leading-tight">
            IOL Calc Abakarov
          </h1>
          <p className="text-xs text-slate-500">Калькулятор силы интраокулярной линзы</p>
        </div>
      </div>
    </header>
  )
}
