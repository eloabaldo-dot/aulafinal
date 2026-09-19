import React, { useState } from 'react';
import { DIRECT_IMAGE_LINKS } from '../data/travelData';
import { DirectImageLink } from '../types';

interface ImageLinksModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast: (msg: string) => void;
}

export const ImageLinksModal: React.FC<ImageLinksModalProps> = ({
  isOpen,
  onClose,
  onShowToast,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  if (!isOpen) return null;

  const categories = ['Todas', ...Array.from(new Set(DIRECT_IMAGE_LINKS.map((img) => img.category)))];

  const filteredLinks =
    selectedCategory === 'Todas'
      ? DIRECT_IMAGE_LINKS
      : DIRECT_IMAGE_LINKS.filter((img) => img.category === selectedCategory);

  const handleCopyLink = (url: string, index: number) => {
    navigator.clipboard.writeText(url);
    setCopiedIndex(index);
    onShowToast('Link direto copiado para a área de transferência!');
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleCopyImgTag = (link: DirectImageLink, index: number) => {
    const tag = `<img src="${link.url}" alt="${link.label}" referrerPolicy="no-referrer" />`;
    navigator.clipboard.writeText(tag);
    setCopiedIndex(index);
    onShowToast('Tag <img> copiada pronta para uso!');
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div
        id="image-links-modal"
        className="w-full max-w-2xl max-h-[85vh] bg-[#faf8ff] dark:bg-[#111a2c] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-[#bcc9c6]/40 dark:border-slate-800 transition-colors"
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-white dark:bg-[#162032] border-b border-[#bcc9c6]/30 dark:border-slate-800 flex items-center justify-between transition-colors">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#00685f]/10 dark:bg-[#008378]/25 text-[#00685f] dark:text-[#2dd4bf] flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl">image</span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#131b2e] dark:text-slate-100">Links Diretos das Imagens HTML</h2>
              <p className="text-xs text-[#3d4947] dark:text-slate-400">
                Sim! Todas as imagens possuem URLs diretas que podem ser usadas livremente em tags HTML.
              </p>
            </div>
          </div>
          <button
            id="close-image-modal-btn"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-[#eaedff] dark:bg-slate-800 text-[#131b2e] dark:text-slate-200 hover:bg-[#dae2fd] dark:hover:bg-slate-700 flex items-center justify-center transition-colors"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Categories Bar */}
        <div className="px-4 py-2.5 bg-[#f2f3ff] dark:bg-slate-800/80 border-b border-[#bcc9c6]/20 dark:border-slate-800 flex items-center gap-2 overflow-x-auto no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-[#00685f] dark:bg-[#008378] text-white shadow-sm'
                  : 'bg-white dark:bg-slate-800 text-[#3d4947] dark:text-slate-300 hover:bg-[#eaedff] dark:hover:bg-slate-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Tip Box */}
        <div className="mx-4 mt-3 p-3 rounded-xl bg-[#008378]/10 dark:bg-teal-950/40 text-[#00685f] dark:text-teal-300 text-xs leading-relaxed flex items-start gap-2 border border-[#00685f]/20 dark:border-teal-500/30">
          <span className="material-symbols-outlined text-base shrink-0 mt-0.5 fill-1">lightbulb</span>
          <p>
            <strong>Dica de Uso no HTML:</strong> Sempre adicione o atributo{' '}
            <code className="bg-white/80 dark:bg-slate-800 px-1 py-0.5 rounded font-mono text-[11px]">
              referrerPolicy="no-referrer"
            </code>{' '}
            nas tags{' '}
            <code className="bg-white/80 dark:bg-slate-800 px-1 py-0.5 rounded font-mono text-[11px]">
              &lt;img&gt;
            </code>{' '}
            para garantir que as imagens externas carreguem sem bloqueios de referer.
          </p>
        </div>

        {/* Image Grid / List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredLinks.map((item, idx) => (
            <div
              key={idx}
              className="p-3 bg-white dark:bg-[#162032] rounded-xl border border-[#bcc9c6]/30 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center gap-3 hover:border-[#00685f]/40 dark:hover:border-teal-500/40 transition-colors"
            >
              <div className="w-16 h-16 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 border border-slate-200 dark:border-slate-700">
                <img
                  src={item.url}
                  alt={item.label}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-[#eaedff] dark:bg-slate-800 text-[#00685f] dark:text-[#2dd4bf] font-semibold">
                    {item.category}
                  </span>
                  <h4 className="text-sm font-bold text-[#131b2e] dark:text-slate-100 truncate">{item.label}</h4>
                </div>
                <p className="text-xs text-[#3d4947] dark:text-slate-400 mt-0.5">{item.usage}</p>
                <p className="text-[11px] text-slate-400 dark:text-slate-400 font-mono truncate mt-1 select-all">{item.url}</p>
              </div>

              <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                <button
                  id={`copy-url-${idx}`}
                  onClick={() => handleCopyLink(item.url, idx)}
                  className="px-2.5 py-1.5 rounded-lg bg-[#f2f3ff] dark:bg-slate-800 text-[#00685f] dark:text-[#2dd4bf] hover:bg-[#eaedff] dark:hover:bg-slate-700 text-xs font-semibold flex items-center gap-1 transition-colors"
                  title="Copiar URL direta"
                >
                  <span className="material-symbols-outlined text-[15px]">
                    {copiedIndex === idx ? 'done' : 'content_copy'}
                  </span>
                  <span>{copiedIndex === idx ? 'Copiado!' : 'URL'}</span>
                </button>

                <button
                  id={`copy-tag-${idx}`}
                  onClick={() => handleCopyImgTag(item, idx)}
                  className="px-2.5 py-1.5 rounded-lg bg-[#00685f] dark:bg-[#008378] text-white hover:bg-[#008378] text-xs font-semibold flex items-center gap-1 shadow-sm transition-colors"
                  title="Copiar tag HTML <img> completa"
                >
                  <span className="material-symbols-outlined text-[15px]">code</span>
                  <span>Tag &lt;img&gt;</span>
                </button>

                <a
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="w-8 h-8 rounded-lg bg-[#f2f3ff] dark:bg-slate-800 text-[#3d4947] dark:text-slate-300 hover:bg-[#eaedff] dark:hover:bg-slate-700 flex items-center justify-center transition-colors"
                  title="Abrir imagem em nova aba"
                >
                  <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 bg-white dark:bg-[#162032] border-t border-[#bcc9c6]/30 dark:border-slate-800 flex items-center justify-between transition-colors">
          <span className="text-xs text-[#3d4947] dark:text-slate-400">
            {filteredLinks.length} imagens mapeadas prontas para uso
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[#00685f] dark:bg-[#008378] text-white text-xs font-bold hover:bg-[#008378] transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
