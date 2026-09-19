import React, { useState } from 'react';
import { SAGRADA_FAMILIA_TICKETS, REVIEWS_SAGRADA, APP_LOGO, USER_AVATAR } from '../data/travelData';

interface ActivityDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast: (msg: string) => void;
}

export const ActivityDetailModal: React.FC<ActivityDetailModalProps> = ({
  isOpen,
  onClose,
  onShowToast,
}) => {
  const [selectedTicketId, setSelectedTicketId] = useState<string>('towers');
  const [isBookmarked, setIsBookmarked] = useState<boolean>(true);

  if (!isOpen) return null;

  const currentTicket = SAGRADA_FAMILIA_TICKETS.find((t) => t.id === selectedTicketId) || SAGRADA_FAMILIA_TICKETS[1];

  const handleToggleBookmark = () => {
    setIsBookmarked(!isBookmarked);
    onShowToast(!isBookmarked ? 'Sagrada Família salva nos seus favoritos!' : 'Removido dos favoritos');
  };

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    onShowToast('Link da atração copiado para compartilhar!');
  };

  const handleReserve = () => {
    onShowToast(`Reserva de "${currentTicket.name}" (€${currentTicket.price}) confirmada! Voucher gerado.`);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#faf8ff] dark:bg-[#0b1120] animate-fade-in flex flex-col transition-colors">
      {/* Fixed Sticky Header Navigation */}
      <header className="fixed top-0 inset-x-0 z-50 bg-[#faf8ff]/85 dark:bg-[#111a2c]/85 backdrop-blur-xl border-b border-[#bcc9c6]/20 dark:border-slate-800 shadow-[0_1px_8px_rgba(0,0,0,0.04)] dark:shadow-[0_1px_8px_rgba(0,0,0,0.3)] transition-colors">
        <div className="h-16 px-4 sm:px-6 flex items-center justify-between max-w-2xl mx-auto">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center text-[#131b2e] dark:text-slate-100 shadow-xs active:scale-95 transition-transform border border-[#bcc9c6]/30 dark:border-slate-700"
              title="Voltar ao roteiro"
            >
              <span className="material-symbols-outlined text-[20px]">arrow_back_ios_new</span>
            </button>
            <img
              src={APP_LOGO}
              alt="SmartTrip Logo"
              referrerPolicy="no-referrer"
              className="h-7 w-auto object-contain"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleToggleBookmark}
              className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center text-[#131b2e] dark:text-slate-100 shadow-xs active:scale-95 transition-transform border border-[#bcc9c6]/30 dark:border-slate-700"
              title="Salvar atração"
            >
              <span className={`material-symbols-outlined text-[20px] ${isBookmarked ? 'text-[#00685f] dark:text-[#2dd4bf] fill-1' : ''}`}>
                bookmark
              </span>
            </button>
            <button
              type="button"
              onClick={handleShare}
              className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center text-[#131b2e] dark:text-slate-100 shadow-xs active:scale-95 transition-transform border border-[#bcc9c6]/30 dark:border-slate-700"
              title="Compartilhar"
            >
              <span className="material-symbols-outlined text-[20px]">share</span>
            </button>
            <img
              src={USER_AVATAR}
              alt="Profile"
              referrerPolicy="no-referrer"
              className="w-8 h-8 rounded-full object-cover shadow-xs ring-2 ring-[#00685f]/20 dark:ring-teal-500/30"
            />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-2xl w-full mx-auto pt-16 pb-28">
        {/* Top Hero Visual Module */}
        <div className="relative w-full h-72 sm:h-80 overflow-hidden bg-slate-200 dark:bg-slate-800">
          <img
            src="https://images.unsplash.com/photo-1583779457094-0cef4abc52ae?auto=format&fit=crop&w=1200&q=80"
            alt="Basílica da Sagrada Família com reflexo dourado ao pôr do sol"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-[#faf8ff] dark:to-[#0b1120]"></div>

          {/* Floating Badges */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md text-[#131b2e] dark:text-slate-100 text-[11px] font-bold shadow-xs">
              <span className="material-symbols-outlined text-[#855300] dark:text-amber-400 text-sm fill-1">stars</span>
              Patrimônio UNESCO
            </span>

            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#00685f]/90 dark:bg-[#008378]/90 backdrop-blur-md text-white text-[11px] font-bold shadow-xs">
              <span className="material-symbols-outlined text-sm">flag</span>
              Ponto Alto do Roteiro
            </span>
          </div>

          {/* Bottom Meta Overlay */}
          <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-md text-[#131b2e] dark:text-slate-100">
              <span className="material-symbols-outlined text-[#fea619] text-base fill-1">star</span>
              <span className="text-xs font-bold">4.9</span>
              <span className="text-[11px] text-[#3d4947] dark:text-slate-400">(14.2k avaliações)</span>
            </div>

            <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#dae2fd]/85 dark:bg-slate-800/85 backdrop-blur-md text-[#131b2e] dark:text-slate-200 text-[11px] font-semibold">
              <span className="material-symbols-outlined text-sm">photo_camera</span>
              +420 fotos
            </span>
          </div>
        </div>

        {/* Content Details Container */}
        <div className="flex flex-col px-4 sm:px-6 gap-5 -mt-2">
          {/* Title & Subtitle */}
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#131b2e] dark:text-slate-100 tracking-tight">
              Basílica da Sagrada Família
            </h1>
            <p className="text-xs sm:text-sm text-[#3d4947] dark:text-slate-400 flex items-center gap-1">
              <span className="material-symbols-outlined text-[#00685f] dark:text-[#2dd4bf] text-base">location_on</span>
              Obra-prima de Antoni Gaudí • Eixample, Barcelona
            </p>
          </div>

          {/* Quick Feature Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#e2e7ff] dark:bg-slate-800 text-[#131b2e] dark:text-slate-200 whitespace-nowrap shadow-2xs text-xs font-semibold">
              <span className="material-symbols-outlined text-[#00685f] dark:text-[#2dd4bf] text-base">schedule</span>
              <span>2h recomendadas</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#e2e7ff] dark:bg-slate-800 text-[#131b2e] dark:text-slate-200 whitespace-nowrap shadow-2xs text-xs font-semibold">
              <span className="material-symbols-outlined text-[#00685f] dark:text-[#2dd4bf] text-base">bolt</span>
              <span>Acesso sem filas</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#e2e7ff] dark:bg-slate-800 text-[#131b2e] dark:text-slate-200 whitespace-nowrap shadow-2xs text-xs font-semibold">
              <span className="material-symbols-outlined text-[#00685f] dark:text-[#2dd4bf] text-base">headphones</span>
              <span>Audioguia em Português</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#e2e7ff] dark:bg-slate-800 text-[#131b2e] dark:text-slate-200 whitespace-nowrap shadow-2xs text-xs font-semibold">
              <span className="material-symbols-outlined text-[#00685f] dark:text-[#2dd4bf] text-base">accessible</span>
              <span>Acessível</span>
            </div>
          </div>

          {/* AI Smart Recommendation Card */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#f2f3ff] via-[#eaedff] to-[#dae2fd] dark:from-slate-800 dark:via-slate-850 dark:to-slate-800 p-4 shadow-sm border border-[#bcc9c6]/30 dark:border-slate-700">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg bg-[#00685f] dark:bg-[#008378] text-white flex items-center justify-center shadow-xs">
                <span className="material-symbols-outlined text-base fill-1">auto_awesome</span>
              </div>
              <span className="text-xs font-bold text-[#00685f] dark:text-[#2dd4bf] tracking-tight">
                Dica Inteligente do SmartTrip
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#3d4947] dark:text-slate-300 leading-relaxed">
              Os ingressos das <strong>16:30 às 17:30</strong> aproveitam o pôr do sol através dos vitrais da fachada oeste, criando uma explosão de cores quentes no interior da nave central. Agendamento prévio altamente recomendado.
            </p>
            <div className="mt-3 flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-[#fea619]/25 text-[#684000] dark:text-amber-300 text-[11px] font-bold">
                <span className="material-symbols-outlined text-[13px]">wb_twilight</span>
                Golden Hour: 17:15
              </span>
              <span className="text-[11px] text-[#3d4947] dark:text-slate-400">94% dos viajantes amaram esta dica</span>
            </div>
          </div>

          {/* Tickets & Pricing Options */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-[#131b2e] dark:text-slate-100">Ingressos Disponíveis</h2>
              <span className="text-xs text-[#00685f] dark:text-[#2dd4bf] flex items-center gap-1 font-semibold">
                <span className="material-symbols-outlined text-[15px]">verified_user</span>
                Garantia SmartTrip
              </span>
            </div>

            <div className="flex flex-col gap-3">
              {SAGRADA_FAMILIA_TICKETS.map((ticket) => {
                const isSelected = selectedTicketId === ticket.id;
                return (
                  <div
                    key={ticket.id}
                    onClick={() => {
                      setSelectedTicketId(ticket.id);
                      onShowToast(`Plano "${ticket.name}" selecionado (€${ticket.price})`);
                    }}
                    className={`ticket-card relative flex flex-col p-4 rounded-2xl bg-white dark:bg-[#162032] transition-all cursor-pointer border ${
                      isSelected
                        ? 'ring-2 ring-[#00685f] dark:ring-[#2dd4bf] border-transparent shadow-md bg-[#00685f]/5 dark:bg-[#008378]/15'
                        : 'border-[#bcc9c6]/40 dark:border-slate-700 shadow-xs hover:border-[#00685f]/30'
                    }`}
                  >
                    {ticket.recommended && (
                      <div className="absolute -top-3 right-4 bg-[#00685f] dark:bg-[#008378] text-white text-[10px] font-bold px-3 py-0.5 rounded-full shadow-xs flex items-center gap-1">
                        <span className="material-symbols-outlined text-[12px] fill-1">verified</span>
                        Mais Recomendado
                      </div>
                    )}

                    <div className="flex items-start justify-between mt-0.5">
                      <div className="flex flex-col pr-2">
                        <h3 className="text-sm font-bold text-[#131b2e] dark:text-slate-100">{ticket.name}</h3>
                        <p className="text-xs text-[#3d4947] dark:text-slate-400 mt-1 leading-relaxed">{ticket.description}</p>
                      </div>

                      <div className="flex flex-col items-end shrink-0">
                        <span className="text-lg font-bold text-[#00685f] dark:text-[#2dd4bf]">€{ticket.price},00</span>
                        <span className="text-[10px] text-[#3d4947] dark:text-slate-400">/ pessoa</span>
                      </div>
                    </div>

                    <div className="mt-3 pt-2 flex items-center justify-between bg-[#f2f3ff] dark:bg-slate-800 rounded-xl px-3 py-1.5">
                      <span className="text-xs text-[#3d4947] dark:text-slate-300 flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm text-[#00685f] dark:text-[#2dd4bf]">
                          check_circle
                        </span>
                        {ticket.highlightNote}
                      </span>
                      <span className="text-xs font-bold text-[#00685f] dark:text-[#2dd4bf]">
                        {isSelected ? 'Selecionado' : 'Selecionar'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Operating Hours & Peak Times */}
          <div className="flex flex-col p-4 rounded-2xl bg-white dark:bg-[#162032] shadow-xs border border-[#bcc9c6]/30 dark:border-slate-700 gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#008378] animate-pulse"></span>
                <span className="text-xs font-bold text-[#131b2e] dark:text-slate-100">Aberto agora</span>
                <span className="text-xs text-[#3d4947] dark:text-slate-400">• Fecha às 19:00</span>
              </div>
              <span className="text-xs font-bold text-[#00685f] dark:text-[#2dd4bf]">Seg - Dom</span>
            </div>

            <div className="flex items-center justify-between bg-[#f2f3ff] dark:bg-slate-800 rounded-xl px-3 py-2 text-xs text-[#131b2e] dark:text-slate-200">
              <span>Horário de Inverno (Nov - Fev)</span>
              <span className="font-bold">09:00 – 18:00</span>
            </div>

            <div className="flex items-center justify-between bg-[#eaedff] dark:bg-slate-800 rounded-xl px-3 py-2 text-xs text-[#131b2e] dark:text-slate-200">
              <span>Horário Padrão (Mar - Out)</span>
              <span className="font-bold">09:00 – 19:00</span>
            </div>

            {/* Crowd Level Histogram */}
            <div className="flex flex-col gap-1.5 pt-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#131b2e] dark:text-slate-100">Movimentação ao Longo do Dia</span>
                <span className="text-[11px] font-bold text-[#00685f] dark:text-[#2dd4bf]">16:30 ideal</span>
              </div>

              <div className="h-16 flex items-end justify-between gap-1.5 pt-2">
                <div className="flex flex-col items-center flex-1 gap-1">
                  <div className="w-full bg-[#dae2fd] dark:bg-slate-700 rounded-t-sm h-6"></div>
                  <span className="text-[10px] text-[#3d4947] dark:text-slate-400">09h</span>
                </div>
                <div className="flex flex-col items-center flex-1 gap-1">
                  <div className="w-full bg-[#dae2fd] dark:bg-slate-700 rounded-t-sm h-10"></div>
                  <span className="text-[10px] text-[#3d4947] dark:text-slate-400">11h</span>
                </div>
                <div className="flex flex-col items-center flex-1 gap-1">
                  <div className="w-full bg-[#ffdad6] dark:bg-rose-950/60 rounded-t-sm h-14"></div>
                  <span className="text-[10px] text-[#3d4947] dark:text-slate-400">13h</span>
                </div>
                <div className="flex flex-col items-center flex-1 gap-1">
                  <div className="w-full bg-[#ffdad6] dark:bg-rose-950/60 rounded-t-sm h-16"></div>
                  <span className="text-[10px] text-[#3d4947] dark:text-slate-400">15h</span>
                </div>
                <div className="flex flex-col items-center flex-1 gap-1">
                  <div className="w-full bg-[#00685f] dark:bg-[#2dd4bf] rounded-t-sm h-8 shadow-xs"></div>
                  <span className="text-[10px] font-bold text-[#00685f] dark:text-[#2dd4bf]">17h</span>
                </div>
                <div className="flex flex-col items-center flex-1 gap-1">
                  <div className="w-full bg-[#dae2fd] dark:bg-slate-700 rounded-t-sm h-5"></div>
                  <span className="text-[10px] text-[#3d4947] dark:text-slate-400">18h</span>
                </div>
              </div>
            </div>
          </div>

          {/* Community Reviews Section */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-[#131b2e] dark:text-slate-100">Avaliações da Comunidade</h2>
                <p className="text-xs text-[#3d4947] dark:text-slate-400">Baseado em viajantes verificados do SmartTrip</p>
              </div>

              <div className="text-right">
                <span className="text-2xl font-extrabold text-[#00685f] dark:text-[#2dd4bf] leading-none">4.9</span>
                <div className="flex text-[#fea619] justify-end">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="material-symbols-outlined text-xs fill-1">
                      star
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Review Cards */}
            <div className="flex flex-col gap-3">
              {REVIEWS_SAGRADA.map((rev) => (
                <div
                  key={rev.id}
                  className="p-3.5 rounded-2xl bg-white dark:bg-[#162032] shadow-xs border border-[#bcc9c6]/30 dark:border-slate-700 flex flex-col gap-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={rev.avatarUrl}
                        alt={rev.author}
                        referrerPolicy="no-referrer"
                        className="w-10 h-10 rounded-full object-cover shadow-xs"
                      />
                      <div>
                        <h4 className="text-xs font-bold text-[#131b2e] dark:text-slate-100">{rev.author}</h4>
                        <p className="text-[11px] text-[#3d4947] dark:text-slate-400">
                          {rev.tripType} • {rev.date}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center text-[#fea619] gap-0.5">
                      <span className="material-symbols-outlined text-sm fill-1">star</span>
                      <span className="text-xs font-bold text-[#131b2e] dark:text-slate-100 ml-0.5">{rev.rating.toFixed(1)}</span>
                    </div>
                  </div>

                  <p className="text-xs text-[#3d4947] dark:text-slate-300 leading-relaxed italic">
                    "{rev.comment}"
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Sticky Bottom Reservation Dock */}
      <aside className="fixed bottom-0 inset-x-0 z-50 bg-white/95 dark:bg-[#111a2c]/95 backdrop-blur-xl border-t border-[#bcc9c6]/30 dark:border-slate-800 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
        <div className="h-20 px-4 sm:px-6 flex items-center justify-between max-w-2xl mx-auto">
          <div className="flex flex-col justify-center">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#3d4947] dark:text-slate-400">
              Preço Selecionado
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-extrabold text-[#00685f] dark:text-[#2dd4bf]">€{currentTicket.price}</span>
              <span className="text-xs text-[#3d4947] dark:text-slate-400">/ pessoa</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleReserve}
            className="h-12 px-6 rounded-full bg-[#00685f] dark:bg-[#008378] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md hover:bg-[#008378] active:scale-95 transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg">bolt</span>
            <span>Reservar Agora</span>
          </button>
        </div>
      </aside>
    </div>
  );
};
