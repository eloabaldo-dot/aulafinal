import React from 'react';

interface ToastProps {
  message: string | null;
  type?: 'success' | 'info' | 'ai';
}

export const Toast: React.FC<ToastProps> = ({ message, type = 'success' }) => {
  if (!message) return null;

  return (
    <div
      id="app-toast"
      className="fixed bottom-22 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-full bg-[#283044] text-[#eef0ff] shadow-2xl flex items-center gap-2.5 text-xs font-semibold tracking-wide border border-white/10 animate-fade-in pointer-events-none transition-all duration-300"
    >
      {type === 'ai' ? (
        <span className="material-symbols-outlined text-[#6bd8cb] text-[18px] fill-1">auto_awesome</span>
      ) : (
        <span className="material-symbols-outlined text-[#89f5e7] text-[18px]">check_circle</span>
      )}
      <span>{message}</span>
    </div>
  );
};
