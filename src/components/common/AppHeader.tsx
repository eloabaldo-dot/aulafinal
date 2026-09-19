import React from 'react';
import { RoutePath } from '../../types/mvp';
import { Compass, Calendar, Briefcase, User, Sparkles, Moon, Sun, ArrowLeft, LogOut } from 'lucide-react';

interface AppHeaderProps {
  currentRoute: RoutePath;
  onNavigate: (route: RoutePath) => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  isAuthenticated: boolean;
  onLogout: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  currentRoute,
  onNavigate,
  isDarkMode,
  onToggleDarkMode,
  isAuthenticated,
  onLogout,
}) => {
  const isAuthScreen = currentRoute === '/login' || currentRoute === '/register';

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md transition-colors">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo & Brand */}
        <div className="flex items-center gap-3">
          {currentRoute !== '/' && currentRoute !== '/dashboard' && (
            <button
              onClick={() => onNavigate(isAuthenticated ? '/dashboard' : '/')}
              aria-label="Voltar para tela anterior"
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <button
            onClick={() => onNavigate(isAuthenticated ? '/dashboard' : '/')}
            className="flex items-center gap-2 text-left group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center text-white shadow-md shadow-teal-500/20 group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-teal-600 to-emerald-500 bg-clip-text text-transparent">
                SmartTrip
              </span>
              <span className="hidden sm:inline-block ml-2 text-xs font-medium px-2 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200/50 dark:border-teal-800/50">
                MVP IA
              </span>
            </div>
          </button>
        </div>

        {/* Desktop Navigation Links for authenticated user */}
        {isAuthenticated && (
          <nav className="hidden md:flex items-center gap-1 bg-slate-100 dark:bg-slate-800/60 p-1 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
            <button
              onClick={() => onNavigate('/dashboard')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                currentRoute === '/dashboard'
                  ? 'bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-300 shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Início
            </button>
            <button
              onClick={() => onNavigate('/explore')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                currentRoute === '/explore'
                  ? 'bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-300 shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Explorar
            </button>
            <button
              onClick={() => onNavigate('/trips')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                currentRoute === '/trips' || currentRoute === '/trips/[id]'
                  ? 'bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-300 shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Viagens
            </button>
            <button
              onClick={() => onNavigate('/availability')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                currentRoute === '/availability'
                  ? 'bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-300 shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Folgas
            </button>
            <button
              onClick={() => onNavigate('/profile')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                currentRoute === '/profile'
                  ? 'bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-300 shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Perfil
            </button>
          </nav>
        )}

        {/* Right Action buttons */}
        <div className="flex items-center gap-2">
          {/* Dark Mode Toggle */}
          <button
            onClick={onToggleDarkMode}
            aria-label={isDarkMode ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            {isDarkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-600" />}
          </button>

          {/* Authentication controls */}
          {!isAuthenticated ? (
            <div className="flex items-center gap-2">
              {currentRoute !== '/login' && (
                <button
                  onClick={() => onNavigate('/login')}
                  className="px-3.5 py-1.5 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  Entrar
                </button>
              )}
              {currentRoute !== '/register' && (
                <button
                  onClick={() => onNavigate('/register')}
                  className="px-4 py-1.5 rounded-xl text-sm font-semibold text-white bg-teal-600 hover:bg-teal-500 shadow-sm shadow-teal-600/30 transition"
                >
                  Cadastrar
                </button>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onNavigate('/profile')}
                className="hidden sm:flex items-center gap-2 p-1.5 pr-3 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80"
                  alt="Avatar de Clara"
                  className="w-7 h-7 rounded-full object-cover border border-teal-500/40"
                />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Clara</span>
              </button>
              <button
                onClick={onLogout}
                title="Sair da conta"
                aria-label="Encerrar sessão"
                className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
