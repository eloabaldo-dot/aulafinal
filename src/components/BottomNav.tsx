import React from 'react';
import { TabType } from '../types';

interface BottomNavProps {
  currentTab: TabType;
  onSelectTab: (tab: TabType) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onSelectTab }) => {
  const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: 'inicio', label: 'Início', icon: 'home' },
    { id: 'explorar', label: 'Explorar', icon: 'explore' },
    { id: 'planejar', label: 'Planejar', icon: 'auto_awesome' },
    { id: 'roteiros', label: 'Roteiros', icon: 'map' },
    { id: 'compartilhar', label: 'Amigos', icon: 'group' },
  ];

  return (
    <nav
      id="bottom-app-navigation"
      className="fixed bottom-0 inset-x-0 z-40 pb-safe bg-[#faf8ff]/90 dark:bg-[#111a2c]/90 backdrop-blur-xl border-t border-[#bcc9c6]/20 dark:border-slate-800 shadow-[0_-2px_14px_rgba(0,0,0,0.06)] dark:shadow-[0_-2px_14px_rgba(0,0,0,0.3)] transition-colors"
    >
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto px-2">
        {tabs.map((tab) => {
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              id={`tab-btn-${tab.id}`}
              onClick={() => onSelectTab(tab.id)}
              className={`flex flex-col items-center justify-center min-w-[52px] min-h-[44px] py-1 px-2 rounded-xl transition-all duration-200 active:scale-95 ${
                isActive
                  ? 'text-[#00685f] dark:text-[#2dd4bf] font-bold'
                  : 'text-[#3d4947] dark:text-slate-400 font-medium hover:text-[#00685f]/80 dark:hover:text-[#2dd4bf]'
              }`}
            >
              <div className="relative">
                <span
                  className={`material-symbols-outlined text-[22px] transition-transform ${
                    isActive ? 'scale-110' : ''
                  }`}
                  style={isActive && tab.id === 'planejar' ? { fontVariationSettings: "'FILL' 1" } : undefined}
                >
                  {tab.icon}
                </span>
                {isActive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-[#00685f] dark:bg-[#2dd4bf] rounded-full"></span>
                )}
              </div>
              <span className={`text-[10px] mt-0.5 tracking-tight ${isActive ? 'font-bold' : 'font-medium'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
