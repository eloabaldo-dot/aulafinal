import React, { useState, useEffect, useId } from 'react';
import { SearchImageItem } from '../types';
import { searchImages } from '../services/imageSearchService';

interface ImageSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast: (msg: string) => void;
  onSelectImage?: (image: SearchImageItem) => void;
  onSelectImageForItinerary?: (image: SearchImageItem) => void;
}

export const ImageSearchModal: React.FC<ImageSearchModalProps> = ({
  isOpen,
  onClose,
  onShowToast,
  onSelectImage,
  onSelectImageForItinerary,
}) => {
  const searchInputId = useId();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeOrientation, setActiveOrientation] = useState<'all' | 'landscape' | 'portrait' | 'square'>('all');
  const [activeSource, setActiveSource] = useState<'all' | 'Unsplash' | 'Pexels'>('all');
  const [images, setImages] = useState<SearchImageItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<SearchImageItem | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const categories = [
    { id: 'all', label: 'Todas as Categorias' },
    { id: 'Monumentos', label: '🏛️ Monumentos' },
    { id: 'Praias', label: '🏖️ Praias' },
    { id: 'Cidades', label: '🌆 Cidades' },
    { id: 'Gastronomia', label: '🍷 Gastronomia' },
    { id: 'Natureza', label: '🏔️ Natureza' },
    { id: 'Cultura', label: '🎨 Cultura' },
  ];

  const quickSearchTags = [
    'Barcelona',
    'Paris',
    'Roma',
    'Maldivas',
    'Tóquio',
    'Fernando de Noronha',
    'Dolomitas',
    'Café',
    'Tapas',
    'Praias',
  ];

  // Perform search
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setIsLoading(true);

    const timer = setTimeout(async () => {
      try {
        const results = await searchImages({
          query: searchTerm,
          category: activeCategory,
          orientation: activeOrientation,
          source: activeSource,
        });
        if (isMounted) {
          setImages(results);
          setIsLoading(false);
        }
      } catch {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }, 200);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [searchTerm, activeCategory, activeOrientation, activeSource, isOpen]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (selectedImage) {
          setSelectedImage(null);
        } else if (isOpen) {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedImage, onClose]);

  if (!isOpen) return null;

  const handleCopyLink = (item: SearchImageItem) => {
    navigator.clipboard.writeText(item.url);
    setCopiedId(item.id);
    onShowToast(`Link direto copiado da foto "${item.title}"!`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyHtmlTag = (item: SearchImageItem) => {
    const tag = `<img src="${item.url}" alt="${item.title}" referrerPolicy="no-referrer" />`;
    navigator.clipboard.writeText(tag);
    setCopiedId(`tag-${item.id}`);
    onShowToast('Tag HTML <img> copiada para a área de transferência!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleUseInItinerary = (item: SearchImageItem) => {
    if (onSelectImage) {
      onSelectImage(item);
    }
    if (onSelectImageForItinerary) {
      onSelectImageForItinerary(item);
    }
    onShowToast(`📸 Foto "${item.title}" vinculada ao seu roteiro de viagem!`);
    if (selectedImage) setSelectedImage(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div
        id="image-search-modal"
        className="w-full max-w-4xl max-h-[92vh] bg-[#faf8ff] dark:bg-[#111a2c] text-[#131b2e] dark:text-slate-100 rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-[#bcc9c6]/30 dark:border-slate-700/60 transition-colors"
      >
        {/* Modal Top Bar */}
        <div className="p-4 sm:p-5 bg-white dark:bg-[#162032] border-b border-[#bcc9c6]/30 dark:border-slate-700/60 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#00685f]/10 dark:bg-[#008378]/25 text-[#00685f] dark:text-[#2dd4bf] flex items-center justify-center shadow-xs">
              <span className="material-symbols-outlined text-[24px] fill-1">image_search</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold tracking-tight">Buscar Imagens de Viagem</h2>
                <span className="px-2 py-0.5 rounded-full bg-[#fea619]/20 text-[#855300] dark:text-[#fea619] text-[10px] font-extrabold uppercase">
                  Unsplash & Pexels
                </span>
              </div>
              <p className="text-xs text-[#3d4947] dark:text-slate-400">
                Pesquise fotos em alta definição para enriquecer seus roteiros e destinos.
              </p>
            </div>
          </div>

          <button
            id="close-image-search-btn"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-[#f2f3ff] dark:bg-slate-800 text-[#131b2e] dark:text-slate-300 hover:bg-[#eaedff] dark:hover:bg-slate-700 flex items-center justify-center transition-colors"
            title="Fechar busca de imagens"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Search & Filters Controls Section */}
        <div className="p-4 bg-[#f8f9ff] dark:bg-[#141f33] border-b border-[#bcc9c6]/20 dark:border-slate-800 flex flex-col gap-3 shrink-0">
          {/* Main Search Input */}
          <div className="relative flex items-center bg-white dark:bg-[#1a273d] rounded-2xl p-1.5 shadow-sm border border-[#bcc9c6]/30 dark:border-slate-700">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#00685f]/10 dark:bg-[#008378]/20 text-[#00685f] dark:text-[#2dd4bf] shrink-0">
              <span className="material-symbols-outlined text-[20px]">search</span>
            </div>

            <input
              id={searchInputId}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Digite um termo... Ex: Barcelona, Paris, praias paradisíacas, cafés, montanhas..."
              className="w-full bg-transparent px-3 text-sm text-[#131b2e] dark:text-slate-100 placeholder:text-[#6d7a77] dark:placeholder:text-slate-400 focus:outline-none"
              autoFocus
            />

            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="w-8 h-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 flex items-center justify-center mr-1"
                title="Limpar pesquisa"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => onShowToast('🎤 Ouvindo pesquisa por voz... Pode falar!')}
              className="w-9 h-9 rounded-xl hover:bg-[#eaedff] dark:hover:bg-slate-700 text-[#3d4947] dark:text-slate-300 flex items-center justify-center mr-1 transition-colors"
              title="Pesquisa por voz"
            >
              <span className="material-symbols-outlined text-[20px]">mic</span>
            </button>
          </div>

          {/* Quick Search Suggestions */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            <span className="text-[11px] font-bold text-[#6d7a77] dark:text-slate-400 uppercase shrink-0 mr-1">
              Sugestões:
            </span>
            {quickSearchTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => setSearchTerm(tag)}
                className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all shrink-0 ${
                  searchTerm.toLowerCase() === tag.toLowerCase()
                    ? 'bg-[#00685f] text-white shadow-xs'
                    : 'bg-white dark:bg-[#1a273d] text-[#3d4947] dark:text-slate-300 hover:bg-[#eaedff] dark:hover:bg-slate-700 border border-[#bcc9c6]/30 dark:border-slate-700/60'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>

          {/* Filter Row: Categories + Orientation + Source */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            {/* Category selection */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar max-w-full">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                    activeCategory === cat.id
                      ? 'bg-[#00685f] text-white'
                      : 'bg-white/70 dark:bg-[#1a273d]/70 text-[#3d4947] dark:text-slate-300 hover:bg-white dark:hover:bg-[#1a273d]'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Selectors for Orientation and Source */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Orientation selector */}
              <select
                id="image-orientation-select"
                value={activeOrientation}
                onChange={(e) => setActiveOrientation(e.target.value as any)}
                className="bg-white dark:bg-[#1a273d] text-xs font-medium text-[#3d4947] dark:text-slate-300 px-2.5 py-1.5 rounded-lg border border-[#bcc9c6]/30 dark:border-slate-700 focus:outline-none"
              >
                <option value="all">Todas as Orientações</option>
                <option value="landscape">Horizontal (Paisagem)</option>
                <option value="portrait">Vertical (Retrato)</option>
                <option value="square">Quadrado</option>
              </select>

              {/* Source selector */}
              <select
                id="image-source-select"
                value={activeSource}
                onChange={(e) => setActiveSource(e.target.value as any)}
                className="bg-white dark:bg-[#1a273d] text-xs font-medium text-[#3d4947] dark:text-slate-300 px-2.5 py-1.5 rounded-lg border border-[#bcc9c6]/30 dark:border-slate-700 focus:outline-none"
              >
                <option value="all">Todas as Fontes</option>
                <option value="Unsplash">Unsplash</option>
                <option value="Pexels">Pexels</option>
              </select>
            </div>
          </div>
        </div>

        {/* Search Results Grid */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 text-[#6d7a77] dark:text-slate-400 gap-3">
              <span className="material-symbols-outlined text-4xl animate-spin text-[#00685f] dark:text-[#2dd4bf]">
                progress_activity
              </span>
              <p className="text-sm font-semibold">Buscando imagens em alta definição...</p>
            </div>
          ) : images.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-[#6d7a77] dark:text-slate-400 gap-2">
              <span className="material-symbols-outlined text-5xl text-slate-300 dark:text-slate-600">
                hide_image
              </span>
              <h3 className="text-base font-bold text-[#131b2e] dark:text-slate-200">
                Nenhuma imagem encontrada
              </h3>
              <p className="text-xs max-w-sm">
                Tente buscar termos como "Barcelona", "Praia", "Paris", "Montanhas" ou limpe os filtros.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setActiveCategory('all');
                  setActiveOrientation('all');
                  setActiveSource('all');
                }}
                className="mt-2 px-4 py-2 rounded-xl bg-[#00685f] text-white text-xs font-bold hover:bg-[#008378] transition-colors"
              >
                Redefinir Filtros
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {images.map((img) => (
                <div
                  key={img.id}
                  className="group relative bg-white dark:bg-[#162032] rounded-2xl overflow-hidden border border-[#bcc9c6]/30 dark:border-slate-700/60 shadow-sm hover:shadow-md transition-all flex flex-col"
                >
                  {/* Image container */}
                  <div
                    className="relative w-full h-48 overflow-hidden bg-slate-100 dark:bg-slate-800 cursor-pointer"
                    onClick={() => setSelectedImage(img)}
                  >
                    <img
                      src={img.thumbnailUrl || img.url}
                      alt={img.title}
                      referrerPolicy="no-referrer"
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20 opacity-90 group-hover:opacity-100 transition-opacity"></div>

                    {/* Source & Orientation Badges */}
                    <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-white text-[10px] font-bold tracking-wider uppercase border border-white/20">
                        {img.source}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-[#00685f]/90 text-white text-[10px] font-bold">
                        {img.category}
                      </span>
                    </div>

                    {/* Likes counter */}
                    {img.likes && (
                      <div className="absolute top-2.5 right-2.5 flex items-center gap-1 bg-black/60 backdrop-blur-md text-white px-2 py-0.5 rounded-full text-[10px] font-bold border border-white/20">
                        <span className="material-symbols-outlined text-[12px] text-rose-400 fill-1">favorite</span>
                        <span>{img.likes}</span>
                      </div>
                    )}

                    {/* Bottom Title on Image */}
                    <div className="absolute bottom-2.5 left-2.5 right-2.5">
                      <h4 className="text-white text-xs font-bold line-clamp-1 drop-shadow-sm">
                        {img.title}
                      </h4>
                      <p className="text-white/80 text-[10px] truncate flex items-center gap-1 mt-0.5">
                        <span className="material-symbols-outlined text-[12px]">person</span>
                        <span>{img.author}</span>
                      </p>
                    </div>

                    {/* Hover Quick Actions Overlay */}
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedImage(img);
                        }}
                        className="w-9 h-9 rounded-full bg-white/90 text-[#131b2e] hover:bg-white flex items-center justify-center shadow-md active:scale-95 transition-transform"
                        title="Ver em tamanho grande"
                      >
                        <span className="material-symbols-outlined text-[18px]">visibility</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyLink(img);
                        }}
                        className="w-9 h-9 rounded-full bg-white/90 text-[#00685f] hover:bg-white flex items-center justify-center shadow-md active:scale-95 transition-transform"
                        title="Copiar URL direta"
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          {copiedId === img.id ? 'done' : 'link'}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUseInItinerary(img);
                        }}
                        className="w-9 h-9 rounded-full bg-[#fea619] text-[#2a1700] hover:bg-[#ffb638] flex items-center justify-center shadow-md active:scale-95 transition-transform"
                        title="Adicionar ao roteiro"
                      >
                        <span className="material-symbols-outlined text-[18px] fill-1">add_location_alt</span>
                      </button>
                    </div>
                  </div>

                  {/* Card Bottom Details & Actions */}
                  <div className="p-3 flex flex-col gap-2 flex-1 justify-between">
                    <p className="text-[11px] text-[#3d4947] dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {img.description}
                    </p>

                    <div className="flex items-center justify-between pt-2 border-t border-[#bcc9c6]/20 dark:border-slate-700/60 mt-auto">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleCopyLink(img)}
                          className="px-2 py-1 rounded-md bg-[#f2f3ff] dark:bg-slate-800 text-[#00685f] dark:text-[#2dd4bf] hover:bg-[#eaedff] dark:hover:bg-slate-700 text-[11px] font-semibold flex items-center gap-1 transition-colors"
                          title="Copiar link"
                        >
                          <span className="material-symbols-outlined text-[14px]">
                            {copiedId === img.id ? 'done' : 'content_copy'}
                          </span>
                          <span>URL</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleCopyHtmlTag(img)}
                          className="px-2 py-1 rounded-md bg-[#f2f3ff] dark:bg-slate-800 text-[#3d4947] dark:text-slate-300 hover:bg-[#eaedff] dark:hover:bg-slate-700 text-[11px] font-semibold flex items-center gap-1 transition-colors"
                          title="Copiar tag <img>"
                        >
                          <span className="material-symbols-outlined text-[14px]">code</span>
                          <span>&lt;img&gt;</span>
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleUseInItinerary(img)}
                        className="px-2.5 py-1 rounded-md bg-[#00685f] text-white hover:bg-[#008378] text-[11px] font-bold flex items-center gap-1 shadow-xs active:scale-95 transition-all"
                        title="Usar esta foto no roteiro"
                      >
                        <span className="material-symbols-outlined text-[14px]">map</span>
                        <span>Usar</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Bottom Status Bar */}
        <div className="p-3.5 bg-white dark:bg-[#162032] border-t border-[#bcc9c6]/30 dark:border-slate-700/60 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-xs text-[#3d4947] dark:text-slate-400">
            <span className="material-symbols-outlined text-[16px] text-[#00685f] dark:text-[#2dd4bf]">
              verified
            </span>
            <span>
              {images.length} fotos disponíveis sob licenças livres para turismo e web
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-[#00685f] text-white text-xs font-bold hover:bg-[#008378] transition-colors"
          >
            Concluir
          </button>
        </div>
      </div>

      {/* Lightbox / Full Photo Preview Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-60 bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fade-in"
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="relative max-w-4xl w-full max-h-[90vh] bg-[#111a2c] text-white rounded-3xl overflow-hidden shadow-2xl flex flex-col border border-slate-700"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Lightbox Header */}
            <div className="p-4 bg-[#162032] border-b border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-[#008378] text-white text-[11px] font-bold uppercase">
                  {selectedImage.source}
                </span>
                <h3 className="text-sm sm:text-base font-bold text-white truncate max-w-md">
                  {selectedImage.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedImage(null)}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-300 hover:bg-slate-700 flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            {/* High-Res Image View */}
            <div className="relative flex-1 bg-black/50 overflow-hidden flex items-center justify-center min-h-[300px] max-h-[58vh]">
              <img
                src={selectedImage.url}
                alt={selectedImage.title}
                referrerPolicy="no-referrer"
                className="max-h-[56vh] w-auto object-contain mx-auto"
              />
            </div>

            {/* Lightbox Footer Details & Actions */}
            <div className="p-4 sm:p-5 bg-[#162032] border-t border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex flex-col gap-1">
                <p className="text-xs text-slate-300 max-w-lg leading-relaxed">
                  {selectedImage.description}
                </p>
                <div className="flex items-center gap-3 text-[11px] text-slate-400">
                  <span>
                    Foto por: <strong className="text-slate-200">{selectedImage.author}</strong>
                  </span>
                  <span>•</span>
                  <span>Categoria: {selectedImage.category}</span>
                  <span>•</span>
                  <span>Orientação: {selectedImage.orientation}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                <button
                  type="button"
                  onClick={() => handleCopyLink(selectedImage)}
                  className="px-3 py-2 rounded-xl bg-slate-800 text-slate-200 hover:bg-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-700"
                >
                  <span className="material-symbols-outlined text-[16px]">
                    {copiedId === selectedImage.id ? 'done' : 'link'}
                  </span>
                  <span>{copiedId === selectedImage.id ? 'Copiado!' : 'Copiar URL'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleCopyHtmlTag(selectedImage)}
                  className="px-3 py-2 rounded-xl bg-slate-800 text-slate-200 hover:bg-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-700"
                >
                  <span className="material-symbols-outlined text-[16px]">code</span>
                  <span>Tag &lt;img&gt;</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleUseInItinerary(selectedImage)}
                  className="px-4 py-2 rounded-xl bg-[#008378] text-white hover:bg-[#00685f] text-xs font-bold flex items-center gap-1.5 shadow-md transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px] fill-1">check_circle</span>
                  <span>Usar no Roteiro</span>
                </button>

                <a
                  href={selectedImage.url}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors border border-slate-700"
                  title="Abrir em nova aba"
                >
                  <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
