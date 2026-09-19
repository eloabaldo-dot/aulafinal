import React from 'react';
import { APP_LOGO, USER_AVATAR } from '../data/travelData';

interface HeaderProps {
  onOpenImageModal: () => void;
  onOpenImageSearch: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  isPhoneFrame: boolean;
  onTogglePhoneFrame: () => void;
  onOpenProfile: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenImageModal,
  onOpenImageSearch,
  isDarkMode,
  onToggleDarkMode,
  isPhoneFrame,
  onTogglePhoneFrame,
  onOpenProfile,
}) => {
  return (
    <header className="sticky top-0 inset-x-0 z-40 bg-[#faf8ff]/90 dark:bg-[#111a2c]/90 backdrop-blur-xl border-b border-[#bcc9c6]/20 dark:border-slate-800 shadow-[0_1px_8px_rgba(0,0,0,0.04)] transition-colors">
      <div className="h-16 px-4 sm:px-6 flex items-center justify-between max-w-5xl mx-auto">
        {/* Brand & Logo */}
        <div className="flex items-center gap-2">
          <img
            src={APP_LOGO}
            alt="SmartTrip Logo"
            referrerPolicy="no-referrer"
            className="h-8 w-auto object-contain drop-shadow-sm"
          />
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-lg text-[#131b2e] dark:text-slate-100 tracking-tight">SmartTrip</span>
            <span className="bg-[#fea619] text-[#2a1700] text-[10px] font-extrabold px-1.5 py-0.5 rounded-full uppercase tracking-wider shadow-xs">
              AI
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* New Image Search Action (Unsplash / Pexels) */}
          <button
            id="header-image-search-btn"
            onClick={onOpenImageSearch}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#00685f]/10 dark:bg-[#008378]/25 text-[#00685f] dark:text-[#2dd4bf] hover:bg-[#00685f]/20 dark:hover:bg-[#008378]/40 text-xs font-bold transition-all border border-[#00685f]/20 dark:border-[#2dd4bf]/30 shadow-xs active:scale-95"
            title="Buscar fotos e imagens de alta resolução (Unsplash & Pexels)"
          >
            <span className="material-symbols-outlined text-[16px] fill-1">image_search</span>
            <span className="hidden sm:inline">Buscar Fotos</span>
          </button>

          {/* Direct HTML Image Links Action */}
          <button
            id="view-image-links-btn"
            onClick={onOpenImageModal}
            className="hidden md:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-[#f2f3ff] dark:bg-slate-800 text-[#00685f] dark:text-slate-300 hover:bg-[#eaedff] dark:hover:bg-slate-700 text-xs font-medium transition-all border border-[#bcc9c6]/30 dark:border-slate-700 shadow-xs active:scale-95"
            title="Ver e copiar links diretos das imagens HTML mapeadas"
          >
            <span className="material-symbols-outlined text-[16px]">link</span>
            <span>Links</span>
          </button>

          {/* Dark Mode Toggle Switch */}
          <button
            id="toggle-dark-mode-btn"
            onClick={onToggleDarkMode}
            className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-white dark:bg-slate-800 text-[#3d4947] dark:text-amber-400 hover:bg-[#f2f3ff] dark:hover:bg-slate-700 text-xs font-semibold border border-[#bcc9c6]/30 dark:border-slate-700 transition-all shadow-xs active:scale-95"
            title={isDarkMode ? 'Alternar para Modo Claro' : 'Alternar para Modo Escuro'}
            aria-label={isDarkMode ? 'Modo Claro' : 'Modo Escuro'}
          >
            <span className="material-symbols-outlined text-[19px]">
              {isDarkMode ? 'light_mode' : 'dark_mode'}
            </span>
          </button>

          {/* Mobile frame vs full-width toggle */}
          <button
            id="toggle-layout-btn"
            onClick={onTogglePhoneFrame}
            className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-white dark:bg-slate-800 text-[#3d4947] dark:text-slate-300 hover:bg-[#f2f3ff] dark:hover:bg-slate-700 text-xs font-semibold border border-[#bcc9c6]/30 dark:border-slate-700 transition-all shadow-xs active:scale-95"
            title={isPhoneFrame ? 'Expandir para largura total' : 'Ver em moldura de celular'}
          >
            <span className="material-symbols-outlined text-[18px]">
              {isPhoneFrame ? 'fullscreen' : 'smartphone'}
            </span>
            <span className="hidden lg:inline">{isPhoneFrame ? 'Expandir' : 'Celular'}</span>
          </button>

          {/* User Profile Avatar with Online Ring */}
          <button
            id="header-profile-btn"
            onClick={onOpenProfile}
            className="relative flex items-center justify-center min-w-[36px] min-h-[36px] p-0.5 rounded-full hover:bg-[#eaedff] dark:hover:bg-slate-800 transition-colors"
            title="Perfil de Sofia"
          >
            <img
              src={USER_AVATAR}
              alt="Profile"
              referrerPolicy="no-referrer"
              className="w-8 h-8 rounded-full object-cover ring-2 ring-[#00685f]/20 dark:ring-teal-400/30 shadow-xs"
            />
            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-[#fea619] rounded-full ring-2 ring-white dark:ring-[#111a2c]"></span>
          </button>
        </div>
      </div>
    </header>
  );
};
