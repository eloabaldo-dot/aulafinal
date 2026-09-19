import React, { useState } from 'react';
import { CURATED_INSPIRATIONS } from '../data/travelData';
import { TabType } from '../types';

interface HomeScreenProps {
  onNavigate: (tab: TabType) => void;
  onSelectPrompt: (prompt: string) => void;
  onShowToast: (msg: string) => void;
  onOpenImageSearch?: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onNavigate,
  onSelectPrompt,
  onShowToast,
  onOpenImageSearch,
}) => {
  const [aiPrompt, setAiPrompt] = useState('');
  const [activeTripProgress] = useState(90);

  const promptSuggestions = [
    { label: '🥐 Paris Express', text: '3 dias românticos em Paris com cafés e museus' },
    { label: '🌿 Bonito Eco', text: 'Fim de semana em Bonito com flutuação e ecoturismo' },
    { label: '🍷 Mendoza Vinhedos', text: '5 dias em Mendoza degustando vinhos e cordilheira' },
  ];

  const handleCreateItinerary = () => {
    if (aiPrompt.trim()) {
      onSelectPrompt(aiPrompt);
      onShowToast(`Gerando plano para "${aiPrompt}"...`);
    } else {
      onSelectPrompt('4 dias em Lisboa com foco em gastronomia');
      onShowToast('Carregando assistente inteligente de roteiro...');
    }
    onNavigate('planejar');
  };

  const handleQuickAddInspiration = (title: string) => {
    onShowToast(`"${title}" adicionado à sua lista de desejos!`);
  };

  return (
    <div className="flex flex-col w-full pb-8">
      {/* Greeting Banner */}
      <div className="px-4 sm:px-6 pt-4 pb-3 flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ffddb8] dark:bg-amber-950/60 text-[#2a1700] dark:text-amber-300 text-[11px] font-bold tracking-wider uppercase shadow-xs">
            <span className="material-symbols-outlined text-[14px] fill-1">flight_takeoff</span>
            EXPLORADORA VIP
          </span>
          <div className="flex items-center gap-1 text-[#3d4947] dark:text-slate-400 text-xs font-semibold">
            <span className="material-symbols-outlined text-[16px] text-[#855300] dark:text-amber-400">wb_sunny</span>
            <span>São Paulo, 26°C</span>
          </div>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#131b2e] dark:text-slate-100 tracking-tight mt-1">
          Olá, Sofia! ✈️
        </h1>
        <p className="text-sm text-[#3d4947] dark:text-slate-400">
          Onde sua próxima aventura começa com IA?
        </p>
      </div>

      {/* AI Smart Prompt Search Bar */}
      <div className="px-4 sm:px-6 mb-6">
        <div className="relative bg-white dark:bg-[#162032] rounded-2xl p-4 shadow-md border border-[#bcc9c6]/30 dark:border-slate-700/60 transition-colors">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#00685f] dark:text-[#2dd4bf] text-[20px] fill-1">
                auto_awesome
              </span>
              <span className="text-xs font-bold text-[#00685f] dark:text-[#2dd4bf] tracking-wide uppercase">
                Crie com IA Generativa
              </span>
            </div>
            {onOpenImageSearch && (
              <button
                type="button"
                onClick={onOpenImageSearch}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#00685f] dark:text-[#2dd4bf] hover:underline"
              >
                <span className="material-symbols-outlined text-[14px]">image_search</span>
                <span>Buscar Fotos</span>
              </button>
            )}
          </div>

          <div className="relative flex flex-col gap-3">
            <div className="flex items-start gap-2.5 bg-[#f2f3ff] dark:bg-[#1a273d] rounded-xl p-3 border border-[#bcc9c6]/20 dark:border-slate-700/60 transition-colors">
              <span className="material-symbols-outlined text-[#00685f] dark:text-[#2dd4bf] text-[22px] mt-0.5 shrink-0">
                travel_explore
              </span>
              <textarea
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Ex: 4 dias em Lisboa com foco em gastronomia e cafés aconchegantes..."
                rows={2}
                className="w-full bg-transparent text-sm text-[#131b2e] dark:text-slate-100 placeholder:text-[#6d7a77] dark:placeholder:text-slate-400 focus:outline-none resize-none"
              />
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-1.5 overflow-x-auto py-1 no-scrollbar">
                {promptSuggestions.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setAiPrompt(item.text)}
                    className="px-2.5 py-1 rounded-full bg-[#eaedff] dark:bg-slate-800 text-[#3d4947] dark:text-slate-300 hover:bg-[#dae2fd] dark:hover:bg-slate-700 text-xs font-medium whitespace-nowrap transition-colors active:scale-95 shrink-0"
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={handleCreateItinerary}
                className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-full bg-[#00685f] dark:bg-[#008378] text-white font-bold text-xs shadow-md hover:bg-[#008378] active:scale-95 transition-all whitespace-nowrap self-end sm:self-auto w-full sm:w-auto"
              >
                <span className="material-symbols-outlined text-[18px]">magic_button</span>
                <span>Criar Roteiro</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Active Trip Widget */}
      <div className="px-4 sm:px-6 mb-7">
        <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-[#162032] shadow-md border border-[#bcc9c6]/30 dark:border-slate-700/60 transition-colors">
          {/* Card Hero Image */}
          <div
            className="relative h-32 sm:h-36 w-full bg-cover bg-center"
            style={{
              backgroundImage:
                "url('https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1200&q=80')",
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-[#131b2e]/90 via-[#131b2e]/30 to-transparent"></div>

            <div className="absolute top-3 left-3 flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm text-[#00685f] dark:text-[#2dd4bf] font-bold text-[11px] shadow-sm flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#00685f] dark:bg-[#2dd4bf] animate-ping"></span>
                EM 14 DIAS
              </span>
              <span className="px-2.5 py-1 rounded-full bg-[#ffddb8]/90 dark:bg-amber-900/80 backdrop-blur-sm text-[#2a1700] dark:text-amber-200 font-bold text-[11px] flex items-center gap-1">
                <span>☀️</span>
                <span>22°C</span>
              </span>
            </div>

            <div className="absolute bottom-3 left-3 right-3 text-white">
              <p className="text-[11px] uppercase tracking-wider text-[#dae2fd] font-semibold">
                Próxima Viagem Confirmada
              </p>
              <p className="text-xl font-extrabold text-white drop-shadow-md">Quioto & Tóquio</p>
            </div>
          </div>

          {/* Card Body Progress */}
          <div className="p-4 flex flex-col gap-2.5 bg-white dark:bg-[#162032] transition-colors">
            <div className="flex items-center justify-between text-[#131b2e] dark:text-slate-100">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#00685f] dark:text-[#2dd4bf] text-[20px]">
                  checklist
                </span>
                <span className="text-xs font-bold">Progresso do Roteiro</span>
              </div>
              <span className="text-lg font-bold text-[#00685f] dark:text-[#2dd4bf]">{activeTripProgress}%</span>
            </div>

            <div className="w-full h-2.5 bg-[#eaedff] dark:bg-slate-700/60 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#00685f] dark:bg-[#2dd4bf] rounded-full transition-all duration-700"
                style={{ width: `${activeTripProgress}%` }}
              ></div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-1.5 text-[#3d4947] dark:text-slate-400 text-xs">
                <span className="material-symbols-outlined text-[16px] text-[#00685d] dark:text-[#2dd4bf]">hotel</span>
                <span>Hotéis e passes reservados</span>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('roteiros')}
                className="px-3 py-1.5 rounded-full bg-[#e2e7ff] dark:bg-slate-800 text-[#131b2e] dark:text-slate-200 hover:bg-[#00685f] hover:text-white dark:hover:bg-[#008378] text-xs font-semibold transition-colors flex items-center gap-1"
              >
                <span>Continuar Editando</span>
                <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Section: Inspirações Curadas por IA */}
      <div className="flex flex-col mb-7">
        <div className="px-4 sm:px-6 flex items-center justify-between mb-3">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[#855300] dark:text-amber-400 text-[20px] fill-1">
                recommend
              </span>
              <h2 className="text-base sm:text-lg font-bold text-[#131b2e] dark:text-slate-100 tracking-tight">
                Inspirações Curadas por IA
              </h2>
            </div>
            <p className="text-xs text-[#3d4947] dark:text-slate-400">Destinos combinando com seus gostos recentes</p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('explorar')}
            className="text-[#00685f] dark:text-[#2dd4bf] text-xs font-bold hover:underline"
          >
            Ver todos
          </button>
        </div>

        {/* Horizontal Scroll Cards */}
        <div className="flex gap-4 overflow-x-auto px-4 sm:px-6 pb-2 no-scrollbar snap-x snap-mandatory">
          {CURATED_INSPIRATIONS.map((insp) => (
            <div
              key={insp.id}
              className="min-w-[260px] max-w-[260px] bg-white dark:bg-[#162032] rounded-2xl overflow-hidden shadow-md border border-[#bcc9c6]/30 dark:border-slate-700/60 snap-start flex flex-col justify-between hover:shadow-lg transition-all"
            >
              <div
                className="relative h-36 w-full bg-cover bg-center"
                style={{ backgroundImage: `url('${insp.imageUrl}')` }}
              >
                <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full bg-[#008378] text-[#f4fffc] text-[10px] font-bold shadow-xs flex items-center gap-1">
                  <span className="material-symbols-outlined text-[11px] fill-1">arrow_back_ios_new</span>
                  {insp.matchScore}% seu estilo
                </span>
                <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm text-[#131b2e] dark:text-slate-200 text-[11px] font-bold">
                  {insp.priceLevel}
                </span>
              </div>

              <div className="p-3.5 flex flex-col gap-1.5 flex-grow justify-between">
                <div>
                  <span className="text-[#855300] dark:text-amber-400 text-[10px] font-extrabold uppercase tracking-wide">
                    {insp.category}
                  </span>
                  <h3 className="text-base font-bold text-[#131b2e] dark:text-slate-100 line-clamp-1">{insp.title}</h3>
                  <p className="text-xs text-[#3d4947] dark:text-slate-400 line-clamp-2 mt-0.5 leading-relaxed">
                    {insp.description}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[#bcc9c6]/20 dark:border-slate-700/60">
                  <span className="text-xs text-[#3d4947] dark:text-slate-400 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                    {insp.duration}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleQuickAddInspiration(insp.title)}
                    className="w-8 h-8 rounded-full bg-[#eaedff] dark:bg-slate-800 text-[#00685f] dark:text-[#2dd4bf] hover:bg-[#00685f] hover:text-white dark:hover:bg-[#008378] transition-colors flex items-center justify-center shadow-xs"
                    title="Adicionar à lista de desejos"
                  >
                    <span className="material-symbols-outlined text-[18px]">add</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section: Recursos Inteligentes */}
      <div className="px-4 sm:px-6 mb-7 flex flex-col gap-3">
        <div className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[#00685f] dark:text-[#2dd4bf] text-[20px]">bolt</span>
          <h2 className="text-base sm:text-lg font-bold text-[#131b2e] dark:text-slate-100 tracking-tight">
            Recursos Inteligentes
          </h2>
        </div>

        <div className="flex flex-col gap-2.5">
          {/* Feature 1: Image Search Highlight */}
          {onOpenImageSearch && (
            <div
              onClick={onOpenImageSearch}
              className="flex items-center justify-between p-3.5 bg-gradient-to-r from-[#00685f]/10 to-[#008378]/10 dark:from-[#008378]/25 dark:to-[#00685f]/25 rounded-2xl shadow-xs border border-[#00685f]/20 dark:border-[#2dd4bf]/30 hover:shadow-md transition-all cursor-pointer"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 rounded-xl bg-[#00685f] dark:bg-[#008378] flex items-center justify-center text-white shrink-0 shadow-xs">
                  <span className="material-symbols-outlined text-[22px]">image_search</span>
                </div>
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-[#131b2e] dark:text-slate-100 truncate">Busca de Imagens com IA</h3>
                    <span className="px-1.5 py-0.5 rounded-full bg-[#fea619] text-[#2a1700] text-[9px] font-extrabold uppercase">Novo</span>
                  </div>
                  <p className="text-xs text-[#3d4947] dark:text-slate-300 truncate">
                    Pesquise milhares de fotos via Unsplash e Pexels para inspirar sua viagem.
                  </p>
                </div>
              </div>
              <span className="material-symbols-outlined text-[#00685f] dark:text-[#2dd4bf] text-[18px] ml-2">arrow_forward</span>
            </div>
          )}

          {/* Feature 2 */}
          <div
            onClick={() => onShowToast('Previsão em tempo real sincronizada!')}
            className="flex items-center justify-between p-3.5 bg-white dark:bg-[#162032] rounded-2xl shadow-xs border border-[#bcc9c6]/30 dark:border-slate-700/60 hover:shadow-md transition-all cursor-pointer"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 rounded-xl bg-[#ffddb8] dark:bg-amber-950/60 flex items-center justify-center text-[#2a1700] dark:text-amber-300 shrink-0">
                <span className="material-symbols-outlined text-[22px]">cloud_sync</span>
              </div>
              <div className="flex flex-col min-w-0">
                <h3 className="text-sm font-bold text-[#131b2e] dark:text-slate-100 truncate">Previsão em Tempo Real</h3>
                <p className="text-xs text-[#3d4947] dark:text-slate-400 truncate">
                  Alertas meteorológicos e sugestões dinâmicas para chuva ou sol.
                </p>
              </div>
            </div>
            <span className="material-symbols-outlined text-[#6d7a77] dark:text-slate-400 text-[18px] ml-2">chevron_right</span>
          </div>

          {/* Feature 3 */}
          <div
            onClick={() => onShowToast('Otimizador de orçamento ativo: calculando melhores tarifas!')}
            className="flex items-center justify-between p-3.5 bg-white dark:bg-[#162032] rounded-2xl shadow-xs border border-[#bcc9c6]/30 dark:border-slate-700/60 hover:shadow-md transition-all cursor-pointer"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 rounded-xl bg-[#eaedff] dark:bg-slate-800 flex items-center justify-center text-[#00685f] dark:text-[#2dd4bf] shrink-0">
                <span className="material-symbols-outlined text-[22px]">savings</span>
              </div>
              <div className="flex flex-col min-w-0">
                <h3 className="text-sm font-bold text-[#131b2e] dark:text-slate-100 truncate">Otimizador de Orçamento</h3>
                <p className="text-xs text-[#3d4947] dark:text-slate-400 truncate">
                  Equilibre gastos entre estadias, refeições e ingressos sem surpresas.
                </p>
              </div>
            </div>
            <span className="material-symbols-outlined text-[#6d7a77] dark:text-slate-400 text-[18px] ml-2">chevron_right</span>
          </div>
        </div>
      </div>

      {/* Motivational Floating Banner */}
      <div className="px-4 sm:px-6">
        <div className="p-4 rounded-2xl bg-[#e2e7ff] dark:bg-[#162032] flex items-center gap-3 border border-[#bcc9c6]/30 dark:border-slate-700/60 shadow-xs transition-colors">
          <div className="w-10 h-10 rounded-full bg-[#00685f] dark:bg-[#008378] flex items-center justify-center text-white shrink-0 shadow-xs">
            <span className="material-symbols-outlined text-[20px]">lightbulb</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold text-[#131b2e] dark:text-slate-100">Dica da IA do SmartTrip</span>
            <span className="text-xs text-[#3d4947] dark:text-slate-400">
              Fotografias de monumentos ficam espetaculares no amanhecer com menos aglomeração.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
