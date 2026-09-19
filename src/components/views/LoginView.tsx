import React, { useState } from 'react';
import { RoutePath } from '../../types/mvp';
import { Mail, Lock, Eye, EyeOff, Sparkles, AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useAuth, mapFirebaseAuthError } from '../../modules/auth';

interface LoginViewProps {
  onNavigate: (route: RoutePath) => void;
  onLoginSuccess?: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onNavigate, onLoginSuccess }) => {
  const { signInWithEmail, signInWithGoogle, signInDemoAccount, sendPasswordReset, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage('Por favor, preencha todos os campos obrigatórios.');
      return;
    }
    setErrorMessage(null);
    setSuccessNotice(null);

    try {
      await signInWithEmail(email, password);
      if (onLoginSuccess) onLoginSuccess();
      onNavigate('/dashboard');
    } catch (err: any) {
      setErrorMessage(mapFirebaseAuthError(err.message));
    }
  };

  const handleGoogleLogin = async () => {
    setErrorMessage(null);
    setSuccessNotice(null);
    try {
      await signInWithGoogle();
      if (onLoginSuccess) onLoginSuccess();
      onNavigate('/dashboard');
    } catch (err: any) {
      if (err.message === 'auth/popup-closed-by-user') {
        setErrorMessage('A conexão com o Google foi cancelada antes da conclusão.');
      } else {
        setErrorMessage(mapFirebaseAuthError(err.message));
      }
    }
  };

  const handleDemoLogin = async () => {
    setErrorMessage(null);
    setSuccessNotice(null);
    try {
      await signInDemoAccount();
      if (onLoginSuccess) onLoginSuccess();
      onNavigate('/dashboard');
    } catch (err: any) {
      setErrorMessage(mapFirebaseAuthError(err.message));
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setErrorMessage('Digite seu e-mail acima para receber o link de recuperação.');
      return;
    }
    setErrorMessage(null);
    try {
      await sendPasswordReset(email);
      setSuccessNotice('E-mail de recuperação enviado! Verifique sua caixa de entrada.');
    } catch (err: any) {
      setErrorMessage(mapFirebaseAuthError(err.message));
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 bg-slate-50/60 dark:bg-slate-950/60">
      <div className="w-full max-w-md p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-900/5">
        <div className="text-center mb-8">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center mb-3">
            <Sparkles className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Bem-vindo de volta</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Entre na sua conta para acessar seus roteiros inteligentes
          </p>
        </div>

        {errorMessage && (
          <div className="mb-6 p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 text-xs flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            {errorMessage.includes('Nenhum usuário cadastrado') && (
              <button
                type="button"
                onClick={() => onNavigate('/register')}
                className="text-left font-bold text-teal-600 dark:text-teal-400 hover:underline pl-6"
              >
                Clique aqui para cadastrar sua nova conta grátis →
              </button>
            )}
          </div>
        )}

        {successNotice && (
          <div className="mb-6 p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successNotice}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="login-email" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              E-mail
            </label>
            <div className="relative">
              <Mail className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu.email@exemplo.com"
                className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 transition"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="login-password" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Senha
              </label>
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-xs text-teal-600 dark:text-teal-400 hover:underline"
              >
                Esqueceu a senha?
              </button>
            </div>
            <div className="relative">
              <Lock className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-11 pr-11 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !email || !password}
            className="w-full py-3.5 mt-2 rounded-2xl bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-bold text-sm shadow-md shadow-teal-600/30 flex items-center justify-center gap-2 transition cursor-pointer"
          >
            {isLoading ? (
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                Entrar na Conta <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="my-5 flex items-center gap-3">
          <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
          <span className="text-xs text-slate-400 uppercase tracking-wider">ou</span>
          <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
        </div>

        <div className="space-y-2.5">
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/80 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-sm flex items-center justify-center gap-2.5 transition cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.87c2.26-2.09 3.67-5.17 3.67-9.15z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.87-3.05c-1.08.72-2.45 1.16-4.06 1.16-3.13 0-5.78-2.11-6.73-4.96H1.27v3.13C3.26 21.31 7.34 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.27 14.24c-.25-.72-.38-1.49-.38-2.24s.13-1.52.38-2.24V6.63H1.27C.46 8.24 0 10.06 0 12s.46 3.76 1.27 5.37l4-3.13z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.69 1.27 6.63l4 3.13c.95-2.85 3.6-4.96 6.73-4.96z"
              />
            </svg>
            Entrar com o Google
          </button>

          <button
            type="button"
            onClick={handleDemoLogin}
            disabled={isLoading}
            className="w-full py-2.5 rounded-2xl border border-dashed border-teal-300 dark:border-teal-800/60 bg-teal-50/50 hover:bg-teal-50 dark:bg-teal-950/20 text-teal-700 dark:text-teal-300 text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-teal-600 shrink-0" />
            Entrar com Conta de Demonstração (Clara Ferreira)
          </button>
        </div>

        <p className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
          Ainda não tem conta?{' '}
          <button
            onClick={() => onNavigate('/register')}
            className="font-bold text-teal-600 dark:text-teal-400 hover:underline"
          >
            Cadastre-se grátis
          </button>
        </p>
      </div>
    </div>
  );
};
