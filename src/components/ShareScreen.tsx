import React, { useState } from 'react';
import { GROUP_MEMBERS, USER_AVATAR } from '../data/travelData';

interface ShareScreenProps {
  onShowToast: (msg: string) => void;
}

export const ShareScreen: React.FC<ShareScreenProps> = ({ onShowToast }) => {
  const [showQr, setShowQr] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [pollVotes, setPollVotes] = useState({ tapaspot: 3, sagrada: 4, praia: 1 });
  const [hasVoted, setHasVoted] = useState(false);

  const [messages, setMessages] = useState([
    {
      id: 'm-1',
      sender: 'Lucas',
      avatar: GROUP_MEMBERS[1].avatar,
      text: 'O roteiro do Dia 1 tá perfeito! A Sagrada Família com áudio guia já tá com ingresso reservado?',
      time: '10:24',
      isAI: false,
    },
    {
      id: 'm-2',
      sender: 'SmartTrip AI',
      avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=200&q=80',
      text: 'Sim, Lucas! O ingresso para as 14:00 inclui subida na Torre da Paixão e guia em português.',
      time: '10:25',
      isAI: true,
    },
    {
      id: 'm-3',
      sender: 'Camila',
      avatar: GROUP_MEMBERS[2].avatar,
      text: 'Gente, e no fim da tarde? Podemos colocar o Parque Güell ou o pôr do sol em Bunkers del Carmel?',
      time: '10:31',
      isAI: false,
    },
  ]);

  const handleVote = (option: 'tapaspot' | 'sagrada' | 'praia') => {
    if (hasVoted) {
      onShowToast('Você já registrou seu voto nesta enquete!');
      return;
    }
    setPollVotes({ ...pollVotes, [option]: pollVotes[option] + 1 });
    setHasVoted(true);
    onShowToast('Voto registrado! A IA reorganizou as preferências.');
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = {
      id: `user-${Date.now()}`,
      sender: 'Sofia',
      avatar: USER_AVATAR,
      text: chatInput,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isAI: false,
    };

    setMessages((prev) => [...prev, userMsg]);
    const currentInput = chatInput;
    setChatInput('');

    // Simulate smart AI reply after 800ms
    setTimeout(() => {
      let aiResponse = 'Entendido! Analisei seu pedido e os ajustes foram salvos no roteiro compartilhado.';
      if (currentInput.toLowerCase().includes('vegan') || currentInput.toLowerCase().includes('comida')) {
        aiResponse = 'Encontrei o restaurante Flax & Kale no Bairro El Born: 90% vegetal, culinária mediterrânea deliciosa e sem filas no almoço!';
      } else if (
        currentInput.toLowerCase().includes('gasto') ||
        currentInput.toLowerCase().includes('conta') ||
        currentInput.toLowerCase().includes('dividir')
      ) {
        aiResponse = 'O saldo do grupo está em €240 divididos igualmente entre 3 pessoas (€80/cada). Despesas registradas em tempo real.';
      } else if (
        currentInput.toLowerCase().includes('bar') ||
        currentInput.toLowerCase().includes('jazz') ||
        currentInput.toLowerCase().includes('noite')
      ) {
        aiResponse = 'Sugestão: Harlem Jazz Club no Bairro Gótico! Música ao vivo às 21:00, ambiente intimista e a 10 min a pé do hotel.';
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          sender: 'SmartTrip AI',
          avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=200&q=80',
          text: aiResponse,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isAI: true,
        },
      ]);
      onShowToast('IA respondeu e atualizou o roteiro do grupo!');
    }, 800);
  };

  const handleCopyTripLink = () => {
    navigator.clipboard?.writeText(window.location.href);
    onShowToast('Link compartilhado copiado! Envie aos seus amigos.');
  };

  return (
    <div className="flex flex-col w-full px-4 sm:px-6 pb-28 gap-5">
      {/* Title Header */}
      <div className="pt-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[#00685f] dark:text-[#2dd4bf] text-[22px]">group</span>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#131b2e] dark:text-slate-100 tracking-tight">
              Planejamento em Grupo
            </h1>
          </div>
          <span className="bg-[#00685f]/10 dark:bg-[#008378]/25 text-[#00685f] dark:text-[#2dd4bf] text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#008378] animate-pulse"></span> Sincronizado
          </span>
        </div>
        <p className="text-xs text-[#3d4947] dark:text-slate-400 mt-1">
          Convide amigos para votar em passeios, dividir despesas e conversar com a IA.
        </p>
      </div>

      {/* Share / Invite Banner */}
      <div className="bg-white dark:bg-[#162032] rounded-2xl p-4 shadow-sm border border-[#bcc9c6]/30 dark:border-slate-700/60 flex flex-col gap-3 transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-[#131b2e] dark:text-slate-100 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[#00685f] dark:text-[#2dd4bf] text-base">person_add</span>
            Convidar Co-viajantes
          </span>
          <button
            type="button"
            onClick={() => setShowQr(!showQr)}
            className="text-xs font-bold text-[#00685f] dark:text-[#2dd4bf] hover:underline flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[16px]">qr_code_2</span>
            <span>{showQr ? 'Ocultar QR Code' : 'Exibir QR Code'}</span>
          </button>
        </div>

        {/* QR Code expansion */}
        {showQr && (
          <div className="p-3 bg-[#f2f3ff] dark:bg-slate-800 rounded-xl flex flex-col items-center gap-2 border border-[#bcc9c6]/20 dark:border-slate-700">
            <div className="w-32 h-32 bg-white p-2 rounded-lg shadow-xs flex items-center justify-center">
              <span className="material-symbols-outlined text-6xl text-slate-800">qr_code_scanner</span>
            </div>
            <p className="text-[11px] text-[#3d4947] dark:text-slate-300 text-center">
              Aponte a câmera para entrar no grupo de Barcelona instantaneamente
            </p>
          </div>
        )}

        <div className="flex items-center gap-2">
          <div className="flex-1 bg-[#eaedff] dark:bg-slate-800 px-3 py-2 rounded-xl text-xs text-[#131b2e] dark:text-slate-200 truncate border border-[#bcc9c6]/20 dark:border-slate-700">
            https://smarttrip.ai/join/barcelona-2026-grp
          </div>
          <button
            type="button"
            onClick={handleCopyTripLink}
            className="px-3.5 py-2 rounded-xl bg-[#00685f] dark:bg-[#008378] text-white text-xs font-bold hover:bg-[#008378] active:scale-95 transition-all shrink-0 flex items-center gap-1 shadow-xs"
          >
            <span className="material-symbols-outlined text-[16px]">content_copy</span>
            <span>Copiar</span>
          </button>
        </div>
      </div>

      {/* Group Voting Poll Widget */}
      <div className="bg-white dark:bg-[#162032] rounded-2xl p-4 shadow-sm border border-[#bcc9c6]/30 dark:border-slate-700/60 flex flex-col gap-3 transition-colors">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[#fea619] text-[20px] fill-1">how_to_vote</span>
            <h2 className="text-sm font-bold text-[#131b2e] dark:text-slate-100">Enquete do Grupo: Dia 2</h2>
          </div>
          <span className="text-[10px] bg-[#eaedff] dark:bg-slate-800 text-[#00685f] dark:text-[#2dd4bf] font-bold px-2 py-0.5 rounded-full">
            {hasVoted ? 'Você já votou' : 'Votação Aberta'}
          </span>
        </div>

        <p className="text-xs text-[#3d4947] dark:text-slate-300">
          Qual atração principal você prefere priorizar na tarde de quinta-feira?
        </p>

        <div className="flex flex-col gap-2 pt-1">
          {/* Option 1 */}
          <button
            type="button"
            onClick={() => handleVote('tapaspot')}
            className="p-3 rounded-xl border border-[#bcc9c6]/30 dark:border-slate-700 bg-[#f8fcfb] dark:bg-slate-800/60 hover:border-[#00685f] dark:hover:border-[#2dd4bf] text-left transition-all flex items-center justify-between active:scale-[0.99]"
          >
            <div className="flex items-center gap-2">
              <span className="text-base">🍷</span>
              <span className="text-xs font-semibold text-[#131b2e] dark:text-slate-200">
                Tour de Tapas & Vinhos em El Born
              </span>
            </div>
            <span className="text-xs font-bold text-[#00685f] dark:text-[#2dd4bf]">{pollVotes.tapaspot} votos</span>
          </button>

          {/* Option 2 */}
          <button
            type="button"
            onClick={() => handleVote('sagrada')}
            className="p-3 rounded-xl border border-[#bcc9c6]/30 dark:border-slate-700 bg-[#f8fcfb] dark:bg-slate-800/60 hover:border-[#00685f] dark:hover:border-[#2dd4bf] text-left transition-all flex items-center justify-between active:scale-[0.99]"
          >
            <div className="flex items-center gap-2">
              <span className="text-base">🌇</span>
              <span className="text-xs font-semibold text-[#131b2e] dark:text-slate-200">
                Pôr do Sol no Bunkers del Carmel
              </span>
            </div>
            <span className="text-xs font-bold text-[#00685f] dark:text-[#2dd4bf]">{pollVotes.sagrada} votos</span>
          </button>

          {/* Option 3 */}
          <button
            type="button"
            onClick={() => handleVote('praia')}
            className="p-3 rounded-xl border border-[#bcc9c6]/30 dark:border-slate-700 bg-[#f8fcfb] dark:bg-slate-800/60 hover:border-[#00685f] dark:hover:border-[#2dd4bf] text-left transition-all flex items-center justify-between active:scale-[0.99]"
          >
            <div className="flex items-center gap-2">
              <span className="text-base">⛵</span>
              <span className="text-xs font-semibold text-[#131b2e] dark:text-slate-200">
                Passeio de Veleiro na Barceloneta
              </span>
            </div>
            <span className="text-xs font-bold text-[#00685f] dark:text-[#2dd4bf]">{pollVotes.praia} votos</span>
          </button>
        </div>
      </div>

      {/* Group Members List */}
      <div className="bg-white dark:bg-[#162032] rounded-2xl p-4 shadow-sm border border-[#bcc9c6]/30 dark:border-slate-700/60 flex flex-col gap-3 transition-colors">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-[#131b2e] dark:text-slate-100 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[#00685f] dark:text-[#2dd4bf] text-base">badge</span>
            Membros da Viagem ({GROUP_MEMBERS.length})
          </h2>
          <span className="text-[11px] text-[#3d4947] dark:text-slate-400">Todos com permissão de edição</span>
        </div>

        <div className="flex flex-col divide-y divide-[#bcc9c6]/20 dark:divide-slate-700">
          {GROUP_MEMBERS.map((comp) => (
            <div key={comp.id} className="flex items-center justify-between py-2.5">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img
                    src={comp.avatar}
                    alt={comp.name}
                    referrerPolicy="no-referrer"
                    className="w-10 h-10 rounded-full object-cover shadow-2xs border border-white dark:border-slate-700"
                  />
                  {comp.isOnline && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-800"></span>
                  )}
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-[#131b2e] dark:text-slate-100">{comp.name}</span>
                  <span className="text-[11px] text-[#3d4947] dark:text-slate-400">{comp.role}</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#f2f3ff] dark:bg-slate-800 text-[#3d4947] dark:text-slate-300 font-semibold">
                  {comp.isOnline ? 'Online' : 'Offline'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Group Concierge Chat */}
      <div className="bg-white dark:bg-[#162032] rounded-2xl p-4 shadow-sm border border-[#bcc9c6]/30 dark:border-slate-700/60 flex flex-col gap-3 transition-colors">
        <div className="flex items-center justify-between pb-2 border-b border-[#bcc9c6]/20 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#00685f] text-white flex items-center justify-center shadow-xs">
              <span className="material-symbols-outlined text-base fill-1">auto_awesome</span>
            </div>
            <div>
              <h2 className="text-xs font-bold text-[#131b2e] dark:text-slate-100">Chat do Grupo com IA</h2>
              <p className="text-[10px] text-[#3d4947] dark:text-slate-400">Envie pedidos para a IA alterar o plano</p>
            </div>
          </div>
          <span className="text-[10px] bg-[#e7f8ef] dark:bg-emerald-950/70 text-[#0f5132] dark:text-emerald-300 px-2 py-0.5 rounded-full font-bold">
            IA Ativa
          </span>
        </div>

        {/* Message stream */}
        <div className="flex flex-col gap-3 max-h-64 overflow-y-auto pr-1">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex gap-2.5 ${m.sender === 'Sofia' ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <img
                src={m.avatar}
                alt={m.sender}
                referrerPolicy="no-referrer"
                className="w-7 h-7 rounded-full object-cover shrink-0 mt-0.5 shadow-2xs"
              />
              <div
                className={`flex flex-col max-w-[80%] ${
                  m.sender === 'Sofia' ? 'items-end' : 'items-start'
                }`}
              >
                <div className="flex items-center gap-1 text-[10px] text-[#6d7a77] dark:text-slate-400 mb-0.5">
                  <span className="font-bold text-[#131b2e] dark:text-slate-200">{m.sender}</span>
                  <span>• {m.time}</span>
                </div>
                <div
                  className={`p-2.5 rounded-2xl text-xs leading-relaxed shadow-2xs ${
                    m.isAI
                      ? 'bg-gradient-to-br from-[#e7f6f5] to-[#f2f3ff] dark:from-teal-950/50 dark:to-slate-800 text-[#131b2e] dark:text-slate-100 border border-[#00685f]/20 dark:border-teal-500/30 rounded-tl-xs'
                      : m.sender === 'Sofia'
                      ? 'bg-[#00685f] dark:bg-[#008378] text-white rounded-tr-xs'
                      : 'bg-[#f2f3ff] dark:bg-slate-800 text-[#131b2e] dark:text-slate-200 rounded-tl-xs'
                  }`}
                >
                  {m.text}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Suggestion Chips for AI */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
          <button
            type="button"
            onClick={() => setChatInput('Troque o almoço do Dia 2 por restaurante vegano.')}
            className="px-2.5 py-1 rounded-full bg-[#eaedff] dark:bg-slate-800 text-[#3d4947] dark:text-slate-300 hover:bg-[#dae2fd] dark:hover:bg-slate-700 whitespace-nowrap text-[11px] transition-colors"
          >
            🥗 Opção vegana
          </button>
          <button
            type="button"
            onClick={() => setChatInput('Sugira um bar com música ao vivo para o Dia 3.')}
            className="px-2.5 py-1 rounded-full bg-[#eaedff] dark:bg-slate-800 text-[#3d4947] dark:text-slate-300 hover:bg-[#dae2fd] dark:hover:bg-slate-700 whitespace-nowrap text-[11px] transition-colors"
          >
            🎷 Bar com Jazz
          </button>
          <button
            type="button"
            onClick={() => setChatInput('Como está a divisão de gastos da viagem?')}
            className="px-2.5 py-1 rounded-full bg-[#eaedff] dark:bg-slate-800 text-[#3d4947] dark:text-slate-300 hover:bg-[#dae2fd] dark:hover:bg-slate-700 whitespace-nowrap text-[11px] transition-colors"
          >
            💰 Divisão de gastos
          </button>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSendMessage} className="flex items-center gap-2 pt-1">
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Peça algo para a IA ou fale com o grupo..."
            className="flex-1 bg-[#f2f3ff] dark:bg-slate-800 rounded-xl px-3 py-2 text-xs text-[#131b2e] dark:text-slate-100 placeholder:text-[#6d7a77] dark:placeholder:text-slate-400 focus:outline-none border border-[#bcc9c6]/30 dark:border-slate-700"
          />
          <button
            type="submit"
            className="w-9 h-9 rounded-xl bg-[#00685f] dark:bg-[#008378] text-white flex items-center justify-center hover:bg-[#008378] active:scale-95 transition-all shadow-xs shrink-0"
          >
            <span className="material-symbols-outlined text-[18px]">send</span>
          </button>
        </form>
      </div>
    </div>
  );
};
