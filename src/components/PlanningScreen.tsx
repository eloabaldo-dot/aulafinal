import React, { useState } from 'react';

interface PlanningScreenProps {
  onBack: () => void;
  onGenerateItinerary: () => void;
  onShowToast: (msg: string) => void;
  initialPrompt?: string;
}

export const PlanningScreen: React.FC<PlanningScreenProps> = ({
  onBack,
  onGenerateItinerary,
  onShowToast,
  initialPrompt,
}) => {
  const [budget, setBudget] = useState<'economico' | 'moderado' | 'luxo'>('moderado');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([
    'Gastronomia Local',
    'Arte e Museus',
    'Mirantes & Fotos',
  ]);
  const [pace, setPace] = useState<'tranquilo' | 'equilibrado' | 'intenso'>('equilibrado');
  const [destination, setDestination] = useState(
    initialPrompt && initialPrompt.includes('Lisboa') ? 'Lisboa, Portugal' : 'Barcelona, Espanha'
  );
  const [period, setPeriod] = useState('12 Out - 18 Out (7 dias)');

  const interestOptions = [
    { label: 'Arte e Museus', emoji: '🎨' },
    { label: 'Gastronomia Local', emoji: '🍷' },
    { label: 'Mirantes & Fotos', emoji: '📸' },
    { label: 'Natureza & Parques', emoji: '🌿' },
    { label: 'Vida Noturna', emoji: '🍸' },
    { label: 'Compras & Mercados', emoji: '🛍️' },
    { label: 'História & Arquitetura', emoji: '🏛️' },
    { label: 'Praia & Costa', emoji: '🏖️' },
  ];

  const toggleInterest = (label: string) => {
    if (selectedInterests.includes(label)) {
      if (selectedInterests.length > 1) {
        setSelectedInterests(selectedInterests.filter((i) => i !== label));
      } else {
        onShowToast('Selecione pelo menos 1 interesse para guiar a IA.');
      }
    } else {
      setSelectedInterests([...selectedInterests, label]);
    }
  };

  const handleQuickDestChange = () => {
    const list = ['Barcelona, Espanha', 'Lisboa, Portugal', 'Tóquio, Japão', 'Paris, França', 'Roma, Itália'];
    const next = list[(list.indexOf(destination) + 1) % list.length];
    setDestination(next);
    onShowToast(`Destino alterado para ${next}`);
  };

  const handleQuickPeriodChange = () => {
    const list = [
      '12 Out - 18 Out (7 dias)',
      '01 Nov - 05 Nov (5 dias)',
      '15 Dez - 22 Dez (8 dias)',
      '10 Jan - 20 Jan (10 dias)',
    ];
    const next = list[(list.indexOf(period) + 1) % list.length];
    setPeriod(next);
    onShowToast(`Período ajustado para ${next}`);
  };

  return (
    <div className="w-full flex flex-col justify-between min-h-screen pb-28">
      {/* Top Header & Step Indicator */}
      <div className="bg-[#f8fcfb] dark:bg-[#111a2c] border-b border-[#bcc9c6]/20 dark:border-slate-800 transition-colors">
        <div className="flex items-center p-4 pb-2 justify-between">
          <button
            type="button"
            onClick={onBack}
            className="w-10 h-10 rounded-full flex items-center justify-center text-[#0d1b1a] dark:text-slate-200 hover:bg-[#e7f3f2] dark:hover:bg-slate-800 transition-colors"
          >
            <span className="material-symbols-outlined text-2xl">arrow_back</span>
          </button>
          <h2 className="text-[#0d1b1a] dark:text-slate-100 text-lg font-bold tracking-tight flex-1 text-center sm:text-left">
            Assistente de Planejamento
          </h2>
          <button
            type="button"
            onClick={onBack}
            className="w-10 h-10 rounded-full flex items-center justify-center text-[#0d1b1a] dark:text-slate-200 hover:bg-[#e7f3f2] dark:hover:bg-slate-800 transition-colors"
          >
            <span className="material-symbols-outlined text-2xl">close</span>
          </button>
        </div>

        {/* Step Progress Bar */}
        <div className="flex flex-col gap-2.5 px-4 pb-4">
          <div className="flex justify-between items-center">
            <p className="text-[#0d1b1a] dark:text-slate-300 text-sm font-semibold">Passo 2 de 3 • Personalizando com IA</p>
            <p className="text-[#0d1b1a] dark:text-teal-200 text-xs font-bold bg-[#cfe7e5] dark:bg-teal-900/60 px-2 py-0.5 rounded-full">
              65%
            </p>
          </div>
          <div className="h-2 rounded-full bg-[#cfe7e5] dark:bg-slate-700 overflow-hidden">
            <div className="h-full rounded-full bg-[#0d9489] transition-all duration-500" style={{ width: '65%' }}></div>
          </div>
        </div>
      </div>

      {/* Main Form Fields Container */}
      <div className="px-4 sm:px-6 pt-5 pb-6 space-y-6">
        <div>
          <h3 className="text-xl sm:text-2xl font-extrabold text-[#0d1b1a] dark:text-slate-100 tracking-tight">
            Para onde e como você quer viajar?
          </h3>

          {/* Destino e Datas Pills */}
          <div className="mt-4">
            <h4 className="text-sm font-bold text-[#0d1b1a] dark:text-slate-200 mb-2">Destino e Datas</h4>
            <div className="flex gap-2 flex-wrap">
              <button
                type="button"
                onClick={handleQuickDestChange}
                className="flex h-9 items-center justify-center gap-x-2 rounded-xl bg-[#e7f3f2] dark:bg-slate-800 px-3 border border-[#00685f]/20 dark:border-teal-500/30 hover:bg-[#cfe7e5] dark:hover:bg-slate-700 transition-colors active:scale-95"
              >
                <span className="material-symbols-outlined text-[18px] text-[#00685f] dark:text-[#2dd4bf]">location_on</span>
                <span className="text-xs font-bold text-[#0d1b1a] dark:text-slate-200">Destino: {destination}</span>
                <span className="material-symbols-outlined text-[18px] text-[#6d7a77] dark:text-slate-400">expand_more</span>
              </button>

              <button
                type="button"
                onClick={handleQuickPeriodChange}
                className="flex h-9 items-center justify-center gap-x-2 rounded-xl bg-[#e7f3f2] dark:bg-slate-800 px-3 border border-[#00685f]/20 dark:border-teal-500/30 hover:bg-[#cfe7e5] dark:hover:bg-slate-700 transition-colors active:scale-95"
              >
                <span className="material-symbols-outlined text-[18px] text-[#00685f] dark:text-[#2dd4bf]">calendar_today</span>
                <span className="text-xs font-bold text-[#0d1b1a] dark:text-slate-200">Período: {period}</span>
                <span className="material-symbols-outlined text-[18px] text-[#6d7a77] dark:text-slate-400">expand_more</span>
              </button>
            </div>
          </div>
        </div>

        {/* Field: Orçamento / Budget */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-base font-bold text-[#131b2e] dark:text-slate-100 tracking-tight flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[#00685f] dark:text-[#2dd4bf] text-xl">account_balance_wallet</span>
              Faixa de Orçamento
            </h4>
            <span className="text-xs text-[#3d4947] dark:text-slate-400 font-medium">Estimativa por dia</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Econômico */}
            <div
              onClick={() => setBudget('economico')}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex sm:flex-col justify-between items-start gap-2 ${
                budget === 'economico'
                  ? 'border-[#00685f] dark:border-[#2dd4bf] bg-[#e7f3f2] dark:bg-[#162938] shadow-xs ring-1 ring-[#00685f]'
                  : 'border-[#bcc9c6]/40 dark:border-slate-700 bg-white dark:bg-[#162032] hover:bg-[#f8fcfb] dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex flex-col">
                <span className="text-xs font-extrabold uppercase tracking-wider text-[#00685f] dark:text-[#2dd4bf]">
                  Econômico
                </span>
                <span className="text-lg font-bold text-[#131b2e] dark:text-slate-100">€35 - €60</span>
                <span className="text-[11px] text-[#3d4947] dark:text-slate-400">Hostels & transporte público</span>
              </div>
              <div
                className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                  budget === 'economico'
                    ? 'border-[#00685f] bg-[#00685f] text-white'
                    : 'border-[#6d7a77]'
                }`}
              >
                {budget === 'economico' && <span className="material-symbols-outlined text-sm font-bold">check</span>}
              </div>
            </div>

            {/* Moderado */}
            <div
              onClick={() => setBudget('moderado')}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex sm:flex-col justify-between items-start gap-2 ${
                budget === 'moderado'
                  ? 'border-[#00685f] dark:border-[#2dd4bf] bg-[#e7f3f2] dark:bg-[#162938] shadow-xs ring-1 ring-[#00685f]'
                  : 'border-[#bcc9c6]/40 dark:border-slate-700 bg-white dark:bg-[#162032] hover:bg-[#f8fcfb] dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex flex-col">
                <span className="text-xs font-extrabold uppercase tracking-wider text-[#00685f] dark:text-[#2dd4bf]">
                  Moderado (Ideal)
                </span>
                <span className="text-lg font-bold text-[#131b2e] dark:text-slate-100">€70 - €130</span>
                <span className="text-[11px] text-[#3d4947] dark:text-slate-400">Hotéis 3-4★ & bons jantares</span>
              </div>
              <div
                className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                  budget === 'moderado'
                    ? 'border-[#00685f] bg-[#00685f] text-white'
                    : 'border-[#6d7a77]'
                }`}
              >
                {budget === 'moderado' && <span className="material-symbols-outlined text-sm font-bold">check</span>}
              </div>
            </div>

            {/* Luxo */}
            <div
              onClick={() => setBudget('luxo')}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex sm:flex-col justify-between items-start gap-2 ${
                budget === 'luxo'
                  ? 'border-[#00685f] dark:border-[#2dd4bf] bg-[#e7f3f2] dark:bg-[#162938] shadow-xs ring-1 ring-[#00685f]'
                  : 'border-[#bcc9c6]/40 dark:border-slate-700 bg-white dark:bg-[#162032] hover:bg-[#f8fcfb] dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex flex-col">
                <span className="text-xs font-extrabold uppercase tracking-wider text-[#00685f] dark:text-[#2dd4bf]">
                  Luxo & Conforto
                </span>
                <span className="text-lg font-bold text-[#131b2e] dark:text-slate-100">€180+</span>
                <span className="text-[11px] text-[#3d4947] dark:text-slate-400">Suítes 5★ & guias privados</span>
              </div>
              <div
                className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                  budget === 'luxo'
                    ? 'border-[#00685f] bg-[#00685f] text-white'
                    : 'border-[#6d7a77]'
                }`}
              >
                {budget === 'luxo' && <span className="material-symbols-outlined text-sm font-bold">check</span>}
              </div>
            </div>
          </div>
        </section>

        {/* Field: Estilo & Interesses de Viagem */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-base font-bold text-[#131b2e] dark:text-slate-100 tracking-tight flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[#00685f] dark:text-[#2dd4bf] text-xl">interests</span>
              Estilo & Interesses
            </h4>
            <span className="text-xs text-[#3d4947] dark:text-slate-400 font-medium">Escolha pelo menos 2</span>
          </div>

          <div className="flex flex-wrap gap-2.5">
            {interestOptions.map((opt) => {
              const isSelected = selectedInterests.includes(opt.label);
              return (
                <button
                  key={opt.label}
                  type="button"
                  onClick={() => toggleInterest(opt.label)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all active:scale-95 ${
                    isSelected
                      ? 'bg-[#008378] text-white shadow-sm border border-[#00685f]/30'
                      : 'bg-[#f2f3ff] dark:bg-slate-800 text-[#3d4947] dark:text-slate-300 hover:bg-[#eaedff] dark:hover:bg-slate-700 border border-[#bcc9c6]/40 dark:border-slate-700'
                  }`}
                >
                  <span>{opt.emoji}</span>
                  <span>{opt.label}</span>
                  {isSelected && (
                    <span className="material-symbols-outlined text-sm ml-0.5">check</span>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {/* Field: Ritmo da Viagem */}
        <section className="space-y-3">
          <h4 className="text-base font-bold text-[#131b2e] dark:text-slate-100 tracking-tight flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[#00685f] dark:text-[#2dd4bf] text-xl">speed</span>
            Ritmo da Viagem
          </h4>

          <div className="grid grid-cols-3 gap-2 bg-[#f2f3ff] dark:bg-slate-800 p-1.5 rounded-xl border border-[#bcc9c6]/30 dark:border-slate-700">
            {/* Tranquilo */}
            <button
              type="button"
              onClick={() => setPace('tranquilo')}
              className={`py-2.5 px-2 rounded-lg flex flex-col items-center justify-center text-center transition-all ${
                pace === 'tranquilo'
                  ? 'bg-white dark:bg-[#162032] text-[#00685f] dark:text-[#2dd4bf] shadow-sm border border-[#00685f]/20 font-bold ring-1 ring-[#00685f]/20'
                  : 'text-[#3d4947] dark:text-slate-400 hover:bg-white/60 dark:hover:bg-slate-700'
              }`}
            >
              <span className="text-xs font-bold">Tranquilo</span>
              <span className="text-[10px] leading-tight text-[#6d7a77] dark:text-slate-400 mt-0.5">2 atrações/dia</span>
            </button>

            {/* Equilibrado */}
            <button
              type="button"
              onClick={() => setPace('equilibrado')}
              className={`py-2.5 px-2 rounded-lg flex flex-col items-center justify-center text-center transition-all ${
                pace === 'equilibrado'
                  ? 'bg-white dark:bg-[#162032] text-[#00685f] dark:text-[#2dd4bf] shadow-sm border border-[#00685f]/20 font-bold ring-1 ring-[#00685f]/20'
                  : 'text-[#3d4947] dark:text-slate-400 hover:bg-white/60 dark:hover:bg-slate-700'
              }`}
            >
              <span className="text-xs font-bold text-[#00685f] dark:text-[#2dd4bf]">Equilibrado</span>
              <span className="text-[10px] leading-tight text-[#6d7a77] dark:text-slate-400 mt-0.5">3-4 atrações/dia</span>
            </button>

            {/* Intenso */}
            <button
              type="button"
              onClick={() => setPace('intenso')}
              className={`py-2.5 px-2 rounded-lg flex flex-col items-center justify-center text-center transition-all ${
                pace === 'intenso'
                  ? 'bg-white dark:bg-[#162032] text-[#00685f] dark:text-[#2dd4bf] shadow-sm border border-[#00685f]/20 font-bold ring-1 ring-[#00685f]/20'
                  : 'text-[#3d4947] dark:text-slate-400 hover:bg-white/60 dark:hover:bg-slate-700'
              }`}
            >
              <span className="text-xs font-bold">Intenso</span>
              <span className="text-[10px] leading-tight text-[#6d7a77] dark:text-slate-400 mt-0.5">Máximo possível</span>
            </button>
          </div>
        </section>

        {/* AI Tip Box */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-[#e7f6f5] to-[#eaedff] dark:from-teal-950/40 dark:to-slate-800 border border-[#6bd8cb]/40 dark:border-teal-500/30 flex gap-3 items-start shadow-xs">
          <div className="w-8 h-8 rounded-full bg-[#00685f] dark:bg-[#008378] text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
            <span className="material-symbols-outlined text-base fill-1">auto_awesome</span>
          </div>
          <div className="space-y-1">
            <p className="text-[11px] font-bold tracking-wider text-[#00685f] dark:text-[#2dd4bf] uppercase">
              Dica Inteligente da IA
            </p>
            <p className="text-xs text-[#131b2e] dark:text-slate-200 leading-relaxed">
              A IA irá verificar a previsão do tempo para Barcelona em Outubro e agrupar atrações por proximidade para economizar transporte e evitar filas.
            </p>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Action CTA */}
      <div className="p-4 bg-white/95 dark:bg-[#111a2c]/95 backdrop-blur-md border-t border-[#bcc9c6]/30 dark:border-slate-800 fixed bottom-16 inset-x-0 z-30 max-w-lg mx-auto transition-colors">
        <button
          id="generate-itinerary-btn"
          type="button"
          onClick={() => {
            onShowToast('IA sintetizando o roteiro otimizado para Barcelona...');
            onGenerateItinerary();
          }}
          className="w-full py-3.5 px-6 rounded-xl bg-[#00685f] dark:bg-[#008378] text-white text-sm font-bold flex items-center justify-center gap-2.5 shadow-lg shadow-[#00685f]/25 hover:bg-[#008378] active:scale-[0.99] transition-all group cursor-pointer"
        >
          <span className="material-symbols-outlined text-lg transition-transform group-hover:rotate-12 group-hover:scale-110 fill-1">
            auto_awesome
          </span>
          <span>Gerar Roteiro com IA</span>
          <span className="material-symbols-outlined text-base opacity-80 group-hover:translate-x-1 transition-transform">
            arrow_forward
          </span>
        </button>
        <p className="text-center text-[11px] text-[#3d4947] dark:text-slate-400 mt-1.5 font-normal">
          Você poderá ajustar horários e trocar paradas livremente depois.
        </p>
      </div>
    </div>
  );
};
