import { Eye, User, LogOut } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export function Header() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  return (
    <header className="bg-white border-b border-app-border sticky top-0 z-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-3">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-3 hover:opacity-80 transition-opacity"
        >
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-medical-600 text-white shrink-0">
            <Eye size={20} />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-app-text leading-tight">
              IOL Calc Abakarov
            </h1>
            <p className="text-xs text-app-muted">Калькулятор силы интраокулярной линзы</p>
          </div>
        </button>

        <div className="ml-auto flex items-center gap-2">
          {user ? (
            <>
              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-600 hover:text-medical-600 hover:bg-medical-50 rounded-lg transition-colors"
                title="Личный кабинет"
              >
                <User size={16} />
                <span className="hidden sm:inline max-w-[160px] truncate">{user.email}</span>
              </button>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Выйти"
              >
                <LogOut size={16} />
                <span className="hidden sm:inline">Выйти</span>
              </button>
            </>
          ) : (
            <button
              onClick={() => navigate('/login')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-app-muted hover:text-app-text hover:bg-app-bg rounded-lg transition-colors border border-app-border"
            >
              <User size={16} />
              <span>Войти</span>
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
