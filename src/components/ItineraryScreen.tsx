import React, { useState } from 'react';
import { BARCELONA_DAY_1_ACTIVITIES } from '../data/travelData';
import { TabType, SearchImageItem } from '../types';

interface ItineraryScreenProps {
  onOpenSagradaDetail: () => void;
  onNavigate: (tab: TabType) => void;
  onShowToast: (msg: string) => void;
  onOpenImageSearch?: () => void;
  selectedPhoto?: SearchImageItem | null;
}

export const ItineraryScreen: React.FC<ItineraryScreenProps> = ({
  onOpenSagradaDetail,
  onNavigate,
  onShowToast,
  onOpenImageSearch,
  selectedPhoto,
}) => {
  const [selectedDay, setSelectedDay] = useState(1);
  const [activities, setActivities] = useState(BARCELONA_DAY_1_ACTIVITIES);

  const days = [
    { num: 1, label: 'Dia 1 (12/10)' },
    { num: 2, label: 'Dia 2 (13/10)' },
    { num: 3, label: 'Dia 3 (14/10)' },
    { num: 4, label: 'Dia 4 (15/10)' },
    { num: 5, label: 'Dia 5 (16/10)' },
  ];

  const handleAddActivity = () => {
    const newAct = {
      id: `act-${Date.now()}`,
      time: '17:45',
      category: 'Café & Mirante',
      title: 'Mirador de Colom & Passeig Marítim',
      description: 'Vista do porto antigo de Barcelona com brisa marítima e cafés locais.',
      tags: ['Cênico', 'Lazer'],
      duration: '45 min',
      rating: 4.7,
      icon: 'photo_camera',
      imageUrl: selectedPhoto?.url || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
    };
    setActivities([...activities.slice(0, 4), newAct, ...activities.slice(4)]);
    onShowToast('Nova atividade inserida pela IA no cronograma do Dia 1!');
  };

  const handleAdjustWithAI = () => {
    onNavigate('compartilhar');
    onShowToast('Abra a aba "Amigos" para enviar comandos de ajuste para a IA!');
  };

  return (
    <div className="w-full flex flex-col pb-28">
      {/* Trip Header & Atmospheric Context */}
      <div className="px-4 sm:px-6 pt-3 pb-3 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#89f5e7] dark:bg-teal-900/60 text-[#00201d] dark:text-teal-200 text-xs font-bold shadow-xs">
            <span className="material-symbols-outlined text-[15px] fill-1">auto_awesome</span>
            <span>Roteiro IA Otimizado</span>
          </div>

          <div className="flex items-center gap-2">
            {onOpenImageSearch && (
              <button
                type="button"
                onClick={onOpenImageSearch}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#00685f]/10 dark:bg-[#008378]/25 text-[#00685f] dark:text-[#2dd4bf] text-xs font-bold hover:bg-[#00685f]/20 transition-all border border-[#00685f]/20 dark:border-teal-500/30 shadow-xs active:scale-95"
                title="Buscar fotos para o roteiro no Unsplash ou Pexels"
              >
                <span className="material-symbols-outlined text-[16px]">image_search</span>
                <span className="hidden sm:inline">Buscar Fotos</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => onShowToast('Link do roteiro Barcelona Mágica copiado!')}
              aria-label="Compartilhar Roteiro"
              className="w-9 h-9 rounded-full bg-[#e2e7ff] dark:bg-slate-800 text-[#131b2e] dark:text-slate-200 flex items-center justify-center shadow-xs active:scale-95 transition-transform"
            >
              <span className="material-symbols-outlined text-[20px]">ios_share</span>
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-1 mt-0.5">
          <h1 className="text-2xl font-extrabold text-[#131b2e] dark:text-slate-100 tracking-tight leading-tight">
            Barcelona Mágica: Cultura & Tapas
          </h1>
          <div className="flex items-center gap-2 text-[#3d4947] dark:text-slate-400 text-xs font-semibold flex-wrap">
            <span className="material-symbols-outlined text-[16px] text-[#00685f] dark:text-[#2dd4bf]">calendar_month</span>
            <span>12 - 18 Out</span>
            <span>•</span>
            <span>7 dias</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px] text-[#00685f] dark:text-[#2dd4bf]">group</span>
              2 viajantes
            </span>
          </div>
        </div>
      </div>

      {/* Selected Photo Notification Pill if user picked one via Image Search */}
      {selectedPhoto && (
        <div className="mx-4 sm:mx-6 mb-3 p-3 rounded-2xl bg-gradient-to-r from-[#00685f]/15 to-[#fea619]/15 dark:from-[#008378]/30 dark:to-slate-800 border border-[#00685f]/30 dark:border-teal-500/40 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <img
              src={selectedPhoto.thumbnailUrl || selectedPhoto.url}
              alt={selectedPhoto.title}
              referrerPolicy="no-referrer"
              className="w-10 h-10 rounded-xl object-cover shrink-0 border border-white/40"
            />
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] uppercase font-bold text-[#00685f] dark:text-[#2dd4bf]">
                Foto selecionada via {selectedPhoto.source}
              </span>
              <p className="text-xs font-bold text-[#131b2e] dark:text-slate-100 truncate">
                {selectedPhoto.title}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleAddActivity}
            className="px-3 py-1.5 rounded-full bg-[#00685f] text-white text-xs font-bold hover:bg-[#008378] active:scale-95 transition-all shrink-0 shadow-xs"
          >
            Adicionar ao Dia
          </button>
        </div>
      )}

      {/* Smart Proximity & Dynamic Weather Insights Widget */}
      <div className="px-4 sm:px-6 mb-3">
        <div className="rounded-2xl bg-white dark:bg-[#162032] p-3.5 shadow-sm border border-[#bcc9c6]/30 dark:border-slate-700/60 flex flex-col gap-2.5 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-full bg-[#ffddb8] dark:bg-amber-950/70 flex items-center justify-center text-[#855300] dark:text-amber-300 shrink-0">
                <span className="material-symbols-outlined text-[18px]">wb_sunny</span>
              </span>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-[#131b2e] dark:text-slate-100">21°C • Céu Ensolarado</span>
                <span className="text-[11px] text-[#3d4947] dark:text-slate-400">Baixo índice de chuva (0%)</span>
              </div>
            </div>
            <div className="px-2.5 py-1 rounded-full bg-[#71f8e4]/60 dark:bg-teal-900/60 text-[#00201c] dark:text-teal-200 text-[10px] font-extrabold tracking-wide">
              Excelente p/ caminhar
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1 border-t border-[#bcc9c6]/20 dark:border-slate-700/60 bg-[#f2f3ff] dark:bg-[#1a273d] px-2.5 py-2 rounded-xl text-[#3d4947] dark:text-slate-300 text-xs">
            <span className="material-symbols-outlined text-[#00685f] dark:text-[#2dd4bf] text-[18px] shrink-0">
              directions_walk
            </span>
            <span className="truncate">Rota otimizada para caminhadas (méd. 15 min entre paradas)</span>
          </div>
        </div>
      </div>

      {/* Horizontal Scrollable Day Selector */}
      <div className="w-full pl-4 sm:pl-6 mb-3">
        <div className="flex items-center gap-2 overflow-x-auto pr-4 sm:pr-6 py-1 no-scrollbar">
          {days.map((d) => {
            const isSelected = selectedDay === d.num;
            return (
              <button
                key={d.num}
                type="button"
                onClick={() => {
                  setSelectedDay(d.num);
                  onShowToast(`Exibindo cronograma do Dia ${d.num}`);
                }}
                className={`shrink-0 px-4 py-2.5 rounded-full text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-[#00685f] dark:bg-[#008378] text-white shadow-md'
                    : 'bg-[#eaedff] dark:bg-slate-800 text-[#3d4947] dark:text-slate-300 hover:bg-[#dae2fd] dark:hover:bg-slate-700'
                }`}
              >
                {isSelected && (
                  <span className="material-symbols-outlined text-[16px]">verified</span>
                )}
                <span>{d.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Day Subheader Context */}
      <div className="px-4 sm:px-6 flex items-center justify-between mb-2">
        <div>
          <span className="text-[10px] uppercase tracking-wider text-[#00685f] dark:text-[#2dd4bf] font-extrabold">
            Hoje • 12 de Outubro
          </span>
          <h2 className="text-base font-bold text-[#131b2e] dark:text-slate-100">Bairro Gótico & Obras de Gaudí</h2>
        </div>
        <button
          type="button"
          onClick={() => onShowToast('Visualização de mapa interativo de Barcelona')}
          aria-label="Ver no mapa"
          className="p-2 rounded-full text-[#3d4947] dark:text-slate-300 bg-[#e2e7ff] dark:bg-slate-800 hover:bg-[#dae2fd] dark:hover:bg-slate-700 active:scale-90 transition-transform"
        >
          <span className="material-symbols-outlined text-[20px]">map</span>
        </button>
      </div>

      {/* Daily Timeline Stream */}
      <div className="px-4 sm:px-6 flex flex-col relative pb-4">
        {activities.map((item, index) => (
          <React.Fragment key={item.id}>
            {/* Optional Transit Segment before Activity */}
            {item.transitBefore && (
              <div className="flex items-center gap-3 pl-3 py-1 mb-4 text-[#3d4947] dark:text-slate-400">
                <div className="w-3 flex justify-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#bcc9c6] dark:bg-slate-600"></span>
                </div>
                <div className="flex items-center gap-1.5 text-xs bg-[#f2f3ff] dark:bg-[#1a273d] px-2.5 py-1 rounded-full border border-[#bcc9c6]/20 dark:border-slate-700/60">
                  <span className="material-symbols-outlined text-[14px] text-[#00685f] dark:text-[#2dd4bf]">
                    {item.transitBefore.type === 'walk'
                      ? 'directions_walk'
                      : item.transitBefore.type === 'subway'
                      ? 'subway'
                      : item.transitBefore.type === 'bus'
                      ? 'directions_bus'
                      : 'local_taxi'}
                  </span>
                  <span>{item.transitBefore.text}</span>
                </div>
              </div>
            )}

            {/* Main Activity Node */}
            <div className="flex items-start gap-3.5 relative pb-6 group">
              {/* Vertical timeline connector */}
              {index < activities.length - 1 && (
                <div className="absolute left-[17px] top-10 bottom-0 w-0.5 bg-gradient-to-b from-[#00685f]/40 to-[#bcc9c6]/30 dark:from-teal-500/40 dark:to-slate-700"></div>
              )}

              {/* Time & Category Icon Indicator */}
              <div className="flex flex-col items-center shrink-0 z-10">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center shadow-xs ${
                    item.isMainAttraction
                      ? 'bg-[#00685f] dark:bg-[#008378] text-white ring-4 ring-[#89f5e7]/40 dark:ring-teal-500/30'
                      : 'bg-[#f2f3ff] dark:bg-slate-800 text-[#00685f] dark:text-[#2dd4bf] border border-[#bcc9c6]/30 dark:border-slate-700'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
                </div>
              </div>

              {/* Activity Card */}
              <div
                onClick={() => {
                  if (item.isMainAttraction) {
                    onOpenSagradaDetail();
                  }
                }}
                className={`flex-1 rounded-2xl bg-white dark:bg-[#162032] p-3.5 shadow-sm border border-[#bcc9c6]/30 dark:border-slate-700/60 transition-all ${
                  item.isMainAttraction
                    ? 'cursor-pointer hover:shadow-md hover:border-[#00685f]/40 dark:hover:border-teal-500/40 ring-1 ring-[#00685f]/10 dark:ring-teal-500/20'
                    : ''
                }`}
              >
                {/* Photo if present */}
                {item.imageUrl && (
                  <div className="relative w-full h-32 rounded-xl overflow-hidden mb-3 bg-slate-100 dark:bg-slate-800">
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                    {item.isMainAttraction && (
                      <span className="absolute top-2 left-2 bg-[#283044]/80 backdrop-blur-md text-white px-2 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-1">
                        <span className="material-symbols-outlined text-[13px] text-[#fea619]">
                          confirmation_number
                        </span>
                        Hora Marcada
                      </span>
                    )}
                    {item.id === 'act-4' && (
                      <span className="absolute bottom-2 right-2 bg-[#283044]/85 backdrop-blur-md text-white px-2 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-1">
                        <span className="material-symbols-outlined text-[13px] text-[#ffddb8]">
                          wb_twilight
                        </span>
                        Pôr do Sol 18:42
                      </span>
                    )}
                  </div>
                )}

                {/* Top Line & Rating */}
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`text-[11px] font-bold ${
                      item.isMainAttraction ? 'text-[#00685d] dark:text-[#2dd4bf]' : 'text-[#00685f] dark:text-teal-400'
                    }`}
                  >
                    {item.time} • {item.category}
                  </span>

                  {item.rating && (
                    <div className="flex items-center gap-1 bg-[#eaedff] dark:bg-slate-800 px-2 py-0.5 rounded-full">
                      <span className="material-symbols-outlined text-[#855300] dark:text-amber-400 text-[13px] fill-1">
                        star
                      </span>
                      <span className="text-xs font-bold text-[#131b2e] dark:text-slate-100">{item.rating}</span>
                    </div>
                  )}

                  {item.duration && !item.rating && (
                    <span className="text-[10px] bg-[#eaedff] dark:bg-slate-800 px-2 py-0.5 rounded-full text-[#131b2e] dark:text-slate-200 font-semibold">
                      {item.duration}
                    </span>
                  )}
                </div>

                <h3 className="text-base font-bold text-[#131b2e] dark:text-slate-100">{item.title}</h3>
                <p className="text-xs text-[#3d4947] dark:text-slate-300 mt-0.5 leading-relaxed">{item.description}</p>

                {/* AI Tip Pill */}
                {item.aiTip && (
                  <div className="mt-2.5 p-2.5 rounded-xl bg-[#89f5e7]/30 dark:bg-teal-900/30 text-[#131b2e] dark:text-teal-100 flex items-start gap-2 border border-[#00685f]/15 dark:border-teal-500/30">
                    <span className="material-symbols-outlined text-[#00685f] dark:text-[#2dd4bf] text-[18px] shrink-0 mt-0.5 fill-1">
                      lightbulb
                    </span>
                    <p className="text-xs leading-snug">
                      <strong className="font-bold text-[#00685f] dark:text-[#2dd4bf]">Dica IA:</strong> {item.aiTip}
                    </p>
                  </div>
                )}

                {/* Bottom Badges */}
                <div className="mt-2.5 flex items-center justify-between pt-1 flex-wrap gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {item.tags.map((tag, tIdx) => (
                      <span
                        key={tIdx}
                        className="px-2 py-0.5 rounded-full bg-[#eaedff] dark:bg-slate-800 text-[#3d4947] dark:text-slate-300 text-[10px] font-semibold"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {item.isMainAttraction && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenSagradaDetail();
                      }}
                      className="text-[#00685f] dark:text-[#2dd4bf] text-xs font-bold flex items-center gap-0.5 hover:underline ml-auto"
                    >
                      Bilhete <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                    </button>
                  )}

                  {item.crowdNote && (
                    <span className="text-[#3d4947] dark:text-slate-400 text-[11px] flex items-center gap-1 ml-auto font-medium">
                      <span className="material-symbols-outlined text-[14px] text-[#fea619]">
                        local_fire_department
                      </span>
                      {item.crowdNote}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </React.Fragment>
        ))}
      </div>

      {/* Summary Card & Bottom Action Bar */}
      <div className="px-4 sm:px-6 mb-2">
        <div className="rounded-2xl bg-[#e2e7ff] dark:bg-[#162032] p-4 shadow-sm border border-[#bcc9c6]/30 dark:border-slate-700/60 flex flex-col gap-3 transition-colors">
          {/* Metrics Summary */}
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] text-[#3d4947] dark:text-slate-400 uppercase font-bold tracking-wider">
                Resumo do Dia 1
              </span>
              <span className="text-lg font-bold text-[#131b2e] dark:text-slate-100">
                €65 <span className="text-xs text-[#3d4947] dark:text-slate-400 font-normal">/ por pessoa</span>
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 text-[#3d4947] dark:text-slate-300 text-xs font-semibold">
                <span className="material-symbols-outlined text-[#00685f] dark:text-[#2dd4bf] text-[18px]">
                  location_on
                </span>
                <span>{activities.length} locais</span>
              </div>
              <div className="flex items-center gap-1 text-[#3d4947] dark:text-slate-300 text-xs font-semibold">
                <span className="material-symbols-outlined text-[#00685f] dark:text-[#2dd4bf] text-[18px]">
                  nordic_walking
                </span>
                <span>8.2 km</span>
              </div>
            </div>
          </div>

          {/* Quick Buttons */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={handleAddActivity}
              className="w-full py-2.5 px-3 rounded-full bg-white dark:bg-slate-800 text-[#131b2e] dark:text-slate-100 text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all hover:bg-[#faf8ff] dark:hover:bg-slate-700 border border-[#bcc9c6]/30 dark:border-slate-700"
            >
              <span className="material-symbols-outlined text-[#00685f] dark:text-[#2dd4bf] text-[18px]">
                add_circle
              </span>
              <span>+ Atividade</span>
            </button>

            <button
              type="button"
              onClick={handleAdjustWithAI}
              className="w-full py-2.5 px-3 rounded-full bg-[#00685f] dark:bg-[#008378] text-white text-xs font-bold shadow-sm flex items-center justify-center gap-1.5 active:scale-95 transition-all hover:bg-[#008378]"
            >
              <span className="material-symbols-outlined text-[18px] fill-1">auto_fix_high</span>
              <span>Ajustar com IA</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
