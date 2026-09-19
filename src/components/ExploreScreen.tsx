import React, { useState } from 'react';
import { DESTINATIONS } from '../data/travelData';
import { DestinationItem, TabType } from '../types';

interface ExploreScreenProps {
  onSelectDestination: (dest: DestinationItem) => void;
  onNavigate: (tab: TabType) => void;
  onShowToast: (msg: string) => void;
  onOpenImageSearch?: () => void;
}

export const ExploreScreen: React.FC<ExploreScreenProps> = ({
  onSelectDestination,
  onNavigate,
  onShowToast,
  onOpenImageSearch,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<'trending' | 'value' | 'quick' | 'romantic'>('trending');
  const [recentSearches, setRecentSearches] = useState<string[]>([
    'Barcelona 7 dias',
    'Chapada dos Veadeiros',
    'Toscana em casal',
  ]);

  const moodChips = [
    { emoji: '✨', label: 'Fugir do inverno', query: 'Destinos quentes para fugir do frio' },
    { emoji: '🍷', label: 'Rota gastronômica', query: 'Roteiros culinários e vinícolas' },
    { emoji: '🏖️', label: 'Até R$ 3.500', query: 'Viagens econômicas até R$ 3.500' },
    { emoji: '🏛️', label: 'Histórico & Cultural', query: 'Cidades históricas e museus' },
    { emoji: '🏔️', label: 'Trilhas e Natureza', query: 'Ecoturismo e montanhas' },
  ];

  const surpriseDestinations = [
    { name: 'Barcelona, Espanha', note: 'Obra de Gaudí, tapas e praias ensolaradas!' },
    { name: 'Reykjavík, Islândia', note: 'Auroras boreais e fontes termais geotérmicas!' },
    { name: 'Cartagena, Colômbia', note: 'Charme colonial histórico e mar caribenho!' },
    { name: 'Dolomitas, Itália', note: 'Picos alpinos dramáticos e vinhedos deslumbrantes!' },
    { name: 'Quioto, Japão', note: 'Templos milenares, jardins zen e gastronomia tradicional!' },
  ];

  const handleRoulette = () => {
    const randomPick = surpriseDestinations[Math.floor(Math.random() * surpriseDestinations.length)];
    setSearchQuery(randomPick.name);
    onShowToast(`🎯 Sorteado pela IA: ${randomPick.name} - ${randomPick.note}`);
  };

  const handleClearHistory = () => {
    setRecentSearches([]);
    onShowToast('Histórico de buscas limpo');
  };

  const handleApplyRecent = (item: string) => {
    setSearchQuery(item);
    onShowToast(`Pesquisando "${item}"...`);
  };

  const filteredDestinations = DESTINATIONS.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.name.toLowerCase().includes(q) ||
      item.country.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex flex-col w-full px-4 sm:px-6 pb-8 gap-5">
      {/* Search & AI Query Bar */}
      <section className="flex flex-col gap-2 mt-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[#00685f] dark:text-[#2dd4bf] text-[20px] fill-1">
              travel_explore
            </span>
            <h1 className="text-lg font-bold text-[#131b2e] dark:text-slate-100">Explorar Destinos</h1>
          </div>
          <span className="bg-[#00685f]/10 dark:bg-[#008378]/25 text-[#00685f] dark:text-[#2dd4bf] text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-xs">
            <span className="material-symbols-outlined text-[14px]">auto_awesome</span> Curadoria IA
          </span>
        </div>

        {/* Input Field with elevated pill design */}
        <div className="relative flex items-center bg-white dark:bg-[#162032] rounded-full p-1.5 shadow-md border border-[#bcc9c6]/30 dark:border-slate-700/60 transition-colors">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[#00685f]/10 dark:bg-[#008378]/25 text-[#00685f] dark:text-[#2dd4bf] shrink-0">
            <span className="material-symbols-outlined text-[20px] fill-1">auto_awesome</span>
          </div>

          <input
            id="explore-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Para onde quer ir? Ex: Praias tranquilas na Europa..."
            className="w-full bg-transparent px-3 text-[#131b2e] dark:text-slate-100 placeholder:text-[#6d7a77] dark:placeholder:text-slate-400 text-sm focus:outline-none"
          />

          <div className="flex items-center gap-1 pr-1 shrink-0">
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="w-8 h-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => onShowToast('🎤 Ouvindo comando de voz... Fale o destino!')}
              className="flex items-center justify-center w-9 h-9 rounded-full hover:bg-[#eaedff] dark:hover:bg-slate-700 text-[#3d4947] dark:text-slate-300 transition-colors"
              title="Pesquisa por voz"
            >
              <span className="material-symbols-outlined text-[20px]">mic</span>
            </button>
            <button
              type="button"
              onClick={() => onShowToast('Filtros inteligentes aplicados')}
              className="flex items-center justify-center w-9 h-9 rounded-full bg-[#00685f] dark:bg-[#008378] text-white shadow-sm hover:opacity-95 active:scale-95 transition-transform"
              title="Filtros avançados"
            >
              <span className="material-symbols-outlined text-[18px]">tune</span>
            </button>
          </div>
        </div>
      </section>

      {/* New: Unsplash & Pexels Photo Finder Quick Link Banner */}
      {onOpenImageSearch && (
        <section
          onClick={onOpenImageSearch}
          className="flex items-center justify-between p-3 sm:p-3.5 bg-gradient-to-r from-[#00685f]/15 via-[#008378]/10 to-[#fea619]/15 dark:from-[#008378]/30 dark:to-slate-800 rounded-2xl border border-[#00685f]/30 dark:border-teal-500/30 cursor-pointer shadow-xs hover:shadow-md transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#00685f] text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-[22px]">photo_library</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs sm:text-sm font-bold text-[#131b2e] dark:text-slate-100">
                  Galeria & Busca de Imagens de Alta Resolução
                </h3>
                <span className="bg-[#00685f] text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-full uppercase">
                  API
                </span>
              </div>
              <p className="text-[11px] text-[#3d4947] dark:text-slate-300">
                Pesquise e insira imagens reais do Unsplash e Pexels nos seus planos
              </p>
            </div>
          </div>
          <span className="material-symbols-outlined text-[#00685f] dark:text-[#2dd4bf] text-[20px] group-hover:translate-x-1 transition-transform shrink-0">
            arrow_forward
          </span>
        </section>
      )}

      {/* Horizontal Mood / AI Prompt Chips */}
      <section className="flex flex-col -mx-4 sm:-mx-6">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar px-4 sm:px-6 py-1">
          {moodChips.map((chip, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setSearchQuery(chip.label);
                onShowToast(`Filtro IA ativado: "${chip.label}"`);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white dark:bg-[#162032] text-[#131b2e] dark:text-slate-200 text-xs font-semibold shadow-xs border border-[#bcc9c6]/30 dark:border-slate-700/60 whitespace-nowrap active:scale-95 hover:border-[#00685f]/40 dark:hover:border-[#2dd4bf]/40 transition-all shrink-0"
            >
              <span>{chip.emoji}</span>
              <span>{chip.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Surprise Me / Matchmaker AI Banner */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#008378] via-[#00685f] to-[#006a61] dark:from-[#00524a] dark:to-[#0f172a] text-white p-4 sm:p-5 shadow-lg">
        <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-[#89f5e7]/20 rounded-full blur-2xl pointer-events-none"></div>
        <div className="absolute right-3 top-3 opacity-20 text-white">
          <span className="material-symbols-outlined text-[68px]">travel_explore</span>
        </div>

        <div className="relative z-10 flex flex-col gap-2">
          <div className="flex items-center gap-1.5">
            <span className="bg-[#fea619] text-[#684000] px-2 py-0.5 rounded-full text-[10px] uppercase font-extrabold flex items-center gap-1 shadow-xs">
              <span className="material-symbols-outlined text-[12px] fill-1">bolt</span> IA Matchmaker
            </span>
            <span className="text-white/80 text-xs">Sugestão rápida</span>
          </div>

          <div className="flex flex-col">
            <h2 className="text-lg font-bold text-white leading-tight">Sem rumo definido?</h2>
            <p className="text-xs text-white/90 mt-0.5 max-w-[280px] leading-relaxed">
              Deixe o algoritmo analisar suas viagens passadas e limites de orçamento para encontrar a próxima parada.
            </p>
          </div>

          <button
            type="button"
            onClick={handleRoulette}
            className="mt-1 self-start flex items-center gap-2 px-4 py-2.5 rounded-full bg-white dark:bg-[#162032] text-[#00685f] dark:text-[#2dd4bf] text-xs font-bold shadow-md hover:bg-[#faf8ff] dark:hover:bg-[#1f2d47] active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-[18px] text-[#fea619] fill-1">casino</span>
            <span>Sortear Destino Ideal</span>
          </button>
        </div>
      </section>

      {/* Recent Searches */}
      {recentSearches.length > 0 && (
        <section className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[#3d4947] dark:text-slate-400">
              <span className="material-symbols-outlined text-[16px]">history</span>
              <span className="text-xs font-bold uppercase tracking-wider">Buscas Recentes</span>
            </div>
            <button
              type="button"
              onClick={handleClearHistory}
              className="text-[#00685f] dark:text-[#2dd4bf] text-xs font-semibold hover:underline"
            >
              Limpar
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {recentSearches.map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleApplyRecent(item)}
                className="flex items-center gap-1.5 bg-[#eaedff] dark:bg-slate-800 px-3 py-1.5 rounded-full text-[#131b2e] dark:text-slate-200 text-xs font-medium hover:bg-[#dae2fd] dark:hover:bg-slate-700 transition-colors shadow-2xs"
              >
                <span>{item}</span>
                <span className="material-symbols-outlined text-[13px] text-[#6d7a77] dark:text-slate-400">north_west</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Curated Recommendations Section */}
      <section className="flex flex-col gap-3">
        <div>
          <h2 className="text-lg font-bold text-[#131b2e] dark:text-slate-100">Destinos Recomendados</h2>
          <p className="text-xs text-[#3d4947] dark:text-slate-400">Calibrados com base no clima, tendências e rotas</p>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 sm:-mx-6 px-4 sm:px-6">
          <button
            type="button"
            onClick={() => setActiveCategory('trending')}
            className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
              activeCategory === 'trending'
                ? 'bg-[#00685f] dark:bg-[#008378] text-white shadow-sm'
                : 'bg-[#f2f3ff] dark:bg-slate-800 text-[#3d4947] dark:text-slate-300 hover:bg-[#eaedff] dark:hover:bg-slate-700'
            }`}
          >
            Em Alta 🔥
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory('value')}
            className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
              activeCategory === 'value'
                ? 'bg-[#00685f] dark:bg-[#008378] text-white shadow-sm'
                : 'bg-[#f2f3ff] dark:bg-slate-800 text-[#3d4947] dark:text-slate-300 hover:bg-[#eaedff] dark:hover:bg-slate-700'
            }`}
          >
            Custo-Benefício 💎
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory('quick')}
            className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
              activeCategory === 'quick'
                ? 'bg-[#00685f] dark:bg-[#008378] text-white shadow-sm'
                : 'bg-[#f2f3ff] dark:bg-slate-800 text-[#3d4947] dark:text-slate-300 hover:bg-[#eaedff] dark:hover:bg-slate-700'
            }`}
          >
            Roteiros Rápidos ⏱️
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory('romantic')}
            className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
              activeCategory === 'romantic'
                ? 'bg-[#00685f] dark:bg-[#008378] text-white shadow-sm'
                : 'bg-[#f2f3ff] dark:bg-slate-800 text-[#3d4947] dark:text-slate-300 hover:bg-[#eaedff] dark:hover:bg-slate-700'
            }`}
          >
            Romântico 💫
          </button>
        </div>

        {/* Destinations Stack */}
        <div className="flex flex-col gap-4">
          {filteredDestinations.map((dest) => (
            <article
              key={dest.id}
              className="relative flex flex-col bg-white dark:bg-[#162032] rounded-2xl overflow-hidden shadow-md group transition-all hover:shadow-lg border border-[#bcc9c6]/30 dark:border-slate-700/60"
            >
              {/* Photo Banner with Direct Image Link */}
              <div className="relative h-48 w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                <img
                  src={dest.imageUrl}
                  alt={dest.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#131b2e]/85 via-transparent to-black/20"></div>

                {/* Top Badge */}
                <div className="absolute top-3 left-3 flex items-center gap-1.5">
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider shadow-sm ${
                      dest.badgeType === 'highlight'
                        ? 'bg-[#855300] text-white'
                        : dest.badgeType === 'value'
                        ? 'bg-[#008378] text-white'
                        : dest.badgeType === 'nature'
                        ? 'bg-[#fea619] text-[#684000]'
                        : 'bg-[#006a61] text-white'
                    }`}
                  >
                    {dest.badge}
                  </span>
                </div>

                {/* Weather pill */}
                <div className="absolute top-3 right-3 flex items-center gap-1 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-2.5 py-1 rounded-full shadow-sm text-[#131b2e] dark:text-slate-100">
                  <span className="material-symbols-outlined text-[14px] text-[#fea619] fill-1">
                    {dest.weatherCondition}
                  </span>
                  <span className="text-[10px] font-bold">{dest.weather}</span>
                </div>

                {/* Bottom Overlay Title & Match */}
                <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between text-white">
                  <div>
                    <h3 className="text-xl font-extrabold drop-shadow-md">{dest.name}</h3>
                    <p className="text-xs opacity-90 drop-shadow-sm flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">pin_drop</span>{' '}
                      {dest.country}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 bg-[#00685f]/95 dark:bg-[#008378]/95 text-white px-2.5 py-1 rounded-full text-xs font-bold shadow-md">
                    <span className="material-symbols-outlined text-[14px] fill-1">verified</span>
                    <span>{dest.matchPercentage}% Match</span>
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="p-4 flex flex-col gap-2">
                <p className="text-xs text-[#3d4947] dark:text-slate-300 leading-relaxed">{dest.description}</p>

                {/* Footer with Daily Rate & Explore Button */}
                <div className="flex items-center justify-between pt-2 border-t border-[#bcc9c6]/20 dark:border-slate-700/60 bg-[#f2f3ff]/40 dark:bg-slate-800/40 -mx-4 -mb-4 px-4 py-3 mt-1">
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-semibold text-[#6d7a77] dark:text-slate-400">
                      Estimativa diária
                    </span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-lg font-bold text-[#00685f] dark:text-[#2dd4bf]">
                        R$ {dest.dailyEstimate}
                      </span>
                      <span className="text-xs text-[#3d4947] dark:text-slate-400">/ dia</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      onSelectDestination(dest);
                      onNavigate('roteiros');
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#00685f] dark:bg-[#008378] text-white text-xs font-bold hover:bg-[#008378] active:scale-95 transition-all shadow-sm"
                  >
                    <span>Explorar</span>
                    <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
};
