import React from 'react';
import { RoutePath } from '../../types/mvp';
import { Sparkles, Compass, MapPin, Calendar, ShieldCheck, ArrowRight, CheckCircle2 } from 'lucide-react';

interface LandingViewProps {
  onNavigate: (route: RoutePath) => void;
}

export const LandingView: React.FC<LandingViewProps> = ({ onNavigate }) => {
  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-16 sm:py-24 border-b border-slate-200/60 dark:border-slate-800/60 bg-gradient-to-b from-teal-50/50 via-white to-white dark:from-slate-900 dark:via-slate-900 dark:to-slate-950">
        <div className="max-w-6xl mx-auto px-4 flex flex-col lg:flex-row items-center gap-12">
          {/* Left Column: Value Prop */}
          <div className="flex-1 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-100/80 dark:bg-teal-950/80 text-teal-800 dark:text-teal-300 text-xs font-semibold uppercase tracking-wider mb-6 border border-teal-200/80 dark:border-teal-800/80">
              <Sparkles className="w-3.5 h-3.5" /> IA Generativa + Curadoria Real
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.15]">
              Seu roteiro de viagem sob medida em{' '}
              <span className="bg-gradient-to-r from-teal-600 via-emerald-500 to-teal-500 bg-clip-text text-transparent">
                segundos
              </span>
              .
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-slate-600 dark:text-slate-300 max-w-xl mx-auto lg:mx-0 leading-relaxed">
              O SmartTrip cruza seus períodos reais de folga, previsão meteorológica e pontos de interesse com o Google Gemini para gerar itinerários que você pode revisar e personalizar livremente.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <button
                onClick={() => onNavigate('/register')}
                className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-base shadow-lg shadow-teal-600/30 flex items-center justify-center gap-2 group transition"
              >
                Começar Grátis
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={() => onNavigate('/login')}
                className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 font-semibold text-base transition"
              >
                Entrar com Conta Existente
              </button>
            </div>
          </div>

          {/* Right Column: Interactive Mockup Card */}
          <div className="w-full max-w-md lg:w-[460px]">
            <div className="rounded-3xl p-6 bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 shadow-2xl shadow-slate-900/10 dark:shadow-black/40">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-700">
                <div className="flex items-center gap-2.5">
                  <span className="w-3 h-3 rounded-full bg-rose-500 inline-block" />
                  <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" />
                  <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
                  <span className="text-xs font-semibold text-slate-400 ml-2">Exemplo do Gemini</span>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 font-medium">
                  Lisboa • 7 Dias
                </span>
              </div>

              <div className="mt-5 space-y-3.5">
                <div className="p-3.5 rounded-2xl bg-teal-50/60 dark:bg-slate-900/60 border border-teal-100 dark:border-slate-700/80">
                  <div className="flex items-center justify-between text-xs text-teal-700 dark:text-teal-400 font-semibold mb-1">
                    <span>Dia 1 • 09:30 • Manhã</span>
                    <span>☀️ 22°C</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    Passeio pela Praça do Comércio e Arco da Augusta
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                    Vista aberta do Tejo e subida ao arco triunfal. Dica da IA: Evite o sol do meio-dia.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-700/60">
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-semibold mb-1">
                    <span>Dia 1 • 13:00 • Tarde</span>
                    <span>Gastronomia</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    Almoço no Time Out Market
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                    Curadoria de 24 chefs portugueses com opções vegetarianas para seu perfil.
                  </p>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                  <CheckCircle2 className="w-4 h-4" /> 100% Editável pelo usuário
                </span>
                <button
                  onClick={() => onNavigate('/register')}
                  className="font-semibold text-teal-600 dark:text-teal-400 hover:underline"
                >
                  Experimentar &rarr;
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3 Pillars Section */}
      <section className="py-16 max-w-6xl mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            Por que planejar com o SmartTrip?
          </h2>
          <p className="mt-3 text-slate-600 dark:text-slate-300 text-sm sm:text-base">
            Eliminamos dezenas de abas abertas de guias, planilhas e blogs com uma experiência coesa e inteligente.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 hover:shadow-xl transition">
            <div className="w-12 h-12 rounded-2xl bg-teal-100 dark:bg-teal-950/80 text-teal-600 dark:text-teal-300 flex items-center justify-center mb-4">
              <Calendar className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">Janelas Reais de Folga</h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Cadastre suas férias e recessos. O planejador sugere roteiros adequados à duração exata do seu descanso.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 hover:shadow-xl transition">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-300 flex items-center justify-center mb-4">
              <Compass className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">Previsão do Tempo & POIs</h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Verifique temperaturas estimadas e atrações verificadas no destino antes de aprovar seu roteiro.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 hover:shadow-xl transition">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-300 flex items-center justify-center mb-4">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">Controle Editorial Total</h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              A IA não toma a decisão por você. Altere títulos, exclua passeios ou adicione programas manuais livremente.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
