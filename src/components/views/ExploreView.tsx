import React, { useState, useEffect } from 'react';
import { RoutePath, DestinationContext } from '../../types/mvp';
import { destinationService, NormalizedDestination } from '../../services/destinationService';
import { weatherService, DestinationWeatherContext } from '../../services/weatherService';
import { poiService, NormalizedPoi, PoiCategory } from '../../services/poiService';
import { generateItineraryWithGemini } from '../../services/geminiService';
import { SmartTripItinerary } from '../../types/itinerary';
import { Search, Sparkles, MapPin, Calendar, Sun, ArrowRight, Check, Loader2, AlertCircle, Compass, CloudRain, CloudOff, Landmark } from 'lucide-react';

interface ExploreViewProps {
  destinations: DestinationContext[];
  onSelectDestination: (dest: DestinationContext) => void;
  onGenerateItinerary: (
    dest: DestinationContext,
    startDate: string,
    endDate: string,
    smartTripItinerary?: SmartTripItinerary
  ) => void;
  onShowToast: (msg: string) => void;
}

export const ExploreView: React.FC<ExploreViewProps> = ({
  destinations,
  onSelectDestination,
  onGenerateItinerary,
  onShowToast,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [availableDestinations, setAvailableDestinations] = useState<DestinationContext[]>(destinations);
  const [selectedDest, setSelectedDest] = useState<DestinationContext>(destinations[0]);
  const [startDate, setStartDate] = useState('2026-10-12');
  const [endDate, setEndDate] = useState('2026-10-18');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState(1);

  // Estados meteorológicos
  const [weatherContext, setWeatherContext] = useState<DestinationWeatherContext | null>(null);
  const [isLoadingWeather, setIsLoadingWeather] = useState(false);

  // Estados de POIs (Pontos de Interesse)
  const [destinationPois, setDestinationPois] = useState<NormalizedPoi[]>([]);
  const [isLoadingPois, setIsLoadingPois] = useState(false);

  useEffect(() => {
    if (!selectedDest || !startDate || !endDate) return;

    let isMounted = true;
    setIsLoadingWeather(true);

    weatherService
      .getDestinationWeather({
        latitude: selectedDest.latitude,
        longitude: selectedDest.longitude,
        startDate,
        endDate,
      })
      .then((ctx) => {
        if (isMounted) {
          setWeatherContext(ctx);
          setIsLoadingWeather(false);
        }
      })
      .catch(() => {
        if (isMounted) setIsLoadingWeather(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedDest.id, selectedDest.latitude, selectedDest.longitude, startDate, endDate]);

  useEffect(() => {
    if (!selectedDest) return;
    let isMounted = true;
    setIsLoadingPois(true);

    poiService
      .searchPois({
        latitude: selectedDest.latitude,
        longitude: selectedDest.longitude,
        radiusMeters: 10000,
        limit: 8,
      })
      .then((res) => {
        if (isMounted) {
          setDestinationPois(res.pois);
          setIsLoadingPois(false);
        }
      })
      .catch(() => {
        if (isMounted) setIsLoadingPois(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedDest.id, selectedDest.latitude, selectedDest.longitude]);

  // Estados de busca normalizada
  const [searchResults, setSearchResults] = useState<NormalizedDestination[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Debounce e busca via DestinationService
  useEffect(() => {
    const cleanQuery = searchQuery.trim();
    if (!cleanQuery || cleanQuery.length < 3) {
      setSearchResults([]);
      setSearchError(null);
      setHasSearched(false);
      setIsSearching(false);
      return;
    }

    const abortController = new AbortController();
    setIsSearching(true);
    setSearchError(null);

    const timer = setTimeout(async () => {
      try {
        const results = await destinationService.searchDestinations(cleanQuery, {
          signal: abortController.signal,
        });
        setSearchResults(results);
        setHasSearched(true);
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          setSearchError(err.message || 'Erro ao consultar destinos.');
          setSearchResults([]);
          setHasSearched(true);
        }
      } finally {
        setIsSearching(false);
      }
    }, 350);

    return () => {
      clearTimeout(timer);
      abortController.abort();
    };
  }, [searchQuery]);

  const handleSelectNormalized = (dest: NormalizedDestination) => {
    const contextItem = destinationService.toDestinationContext(dest);
    setAvailableDestinations((prev) => {
      if (prev.some((d) => d.id === contextItem.id)) return prev;
      return [contextItem, ...prev];
    });
    setSelectedDest(contextItem);
    onSelectDestination(contextItem);
    setSearchResults([]);
    setSearchQuery(dest.name);
    onShowToast(`Destino normalizado selecionado: ${dest.name}, ${dest.address.country}`);
  };

  const filtered = availableDestinations.filter(
    (d) =>
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.country.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleGenerate = async () => {
    if (!startDate || !endDate) {
      onShowToast('Selecione as datas da viagem.');
      return;
    }

    setIsGenerating(true);
    setGenerationStep(1);

    const safePois = (destinationPois && destinationPois.length > 0
      ? destinationPois
      : [
          {
            id: `poi_${selectedDest.id}_1`,
            name: selectedDest.highlights?.[0] || `Centro Histórico de ${selectedDest.name}`,
            category: 'cultural',
            address: `${selectedDest.name}, ${selectedDest.country}`,
            latitude: selectedDest.latitude,
            longitude: selectedDest.longitude,
          },
          {
            id: `poi_${selectedDest.id}_2`,
            name: selectedDest.highlights?.[1] || `Parque Municipal de ${selectedDest.name}`,
            category: 'natureza',
            address: `${selectedDest.name}, ${selectedDest.country}`,
            latitude: selectedDest.latitude + 0.005,
            longitude: selectedDest.longitude + 0.005,
          },
          {
            id: `poi_${selectedDest.id}_3`,
            name: selectedDest.highlights?.[2] || `Gastronomia Local em ${selectedDest.name}`,
            category: 'gastronomia',
            address: `${selectedDest.name}, ${selectedDest.country}`,
            latitude: selectedDest.latitude - 0.005,
            longitude: selectedDest.longitude - 0.005,
          },
        ]
    ).map((p) => ({
      id: p.id,
      name: p.name,
      category: p.category || 'geral',
      address: (p as any).address || `${selectedDest.name}, ${selectedDest.country}`,
      latitude: p.latitude,
      longitude: p.longitude,
    }));

    const weatherDays = (weatherContext?.daily || []).map((w) => ({
      date: w.date,
      hasForecast: w.hasForecast,
      tempMin: w.tempMin,
      tempMax: w.tempMax,
      condition: w.condition,
    }));

    try {
      setTimeout(() => setGenerationStep(2), 500);
      const generated = await generateItineraryWithGemini({
        destination: {
          id: selectedDest.id,
          name: selectedDest.name,
          country: selectedDest.country,
          latitude: selectedDest.latitude,
          longitude: selectedDest.longitude,
        },
        startDate,
        endDate,
        places: safePois,
        weatherDays,
        preferences: {
          travelStyle: 'cultura e descoberta',
          budgetLevel: 'moderado',
          pace: 'equilibrado',
        },
      });

      setGenerationStep(3);
      setTimeout(() => {
        setIsGenerating(false);
        onGenerateItinerary(selectedDest, startDate, endDate, generated);
      }, 700);
    } catch (err: any) {
      console.warn('[ExploreView] Fallback na geração:', err);
      setGenerationStep(3);
      setTimeout(() => {
        setIsGenerating(false);
        onGenerateItinerary(selectedDest, startDate, endDate);
      }, 700);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 w-full space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Explorar Destinos & Gerar Roteiro</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Busque a cidade desejada, analise o clima previsto e dispare a inteligência do Gemini para criar seu itinerário.
        </p>
      </div>

      {/* Search Input with Autocomplete Dropdown */}
      <div className="relative">
        <div className="relative">
          <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar destino normalizado (ex: Lisboa, Tóquio, Santiago, Roma...)"
            className="w-full pl-12 pr-12 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 shadow-sm"
          />
          {isSearching && (
            <Loader2 className="w-5 h-5 absolute right-4 top-1/2 -translate-y-1/2 text-teal-600 animate-spin" />
          )}
        </div>

        {/* Informative Hint for < 3 characters */}
        {searchQuery.trim().length > 0 && searchQuery.trim().length < 3 && (
          <p className="text-xs text-slate-400 mt-2 ml-2">
            Digite pelo menos 3 caracteres para buscar entidades geográficas normalizadas.
          </p>
        )}

        {/* Error Alert */}
        {searchError && (
          <div className="mt-3 p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 flex items-center gap-2.5 text-xs text-rose-700 dark:text-rose-400">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{searchError}</span>
          </div>
        )}

        {/* Autocomplete Results Dropdown (Ambiguity Resolution) */}
        {searchResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 z-30 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800/60 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center justify-between">
              <span>Destinos Geográficos Normalizados ({searchResults.length})</span>
              <span className="text-[10px] text-teal-600 dark:text-teal-400 font-semibold">Selecione uma opção</span>
            </div>
            {searchResults.map((dest) => (
              <div
                key={dest.id}
                onClick={() => handleSelectNormalized(dest)}
                className="px-4 py-3 hover:bg-teal-50/60 dark:hover:bg-teal-950/30 cursor-pointer flex items-center justify-between transition group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300 flex items-center justify-center shrink-0">
                    <Compass className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition">
                      {dest.name}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {dest.address.stateOrRegion ? `${dest.address.stateOrRegion}, ` : ''}
                      {dest.address.country} • Lat: {dest.coordinates.latitude.toFixed(2)}, Lng: {dest.coordinates.longitude.toFixed(2)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 uppercase">
                    {dest.address.countryCode}
                  </span>
                  <span className="text-xs font-semibold text-teal-600 dark:text-teal-400 opacity-0 group-hover:opacity-100 transition">
                    Escolher →
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State when no results found */}
        {hasSearched && searchResults.length === 0 && !isSearching && searchQuery.trim().length >= 3 && (
          <div className="mt-3 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-3">
            <Compass className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Nenhum destino encontrado para "{searchQuery}".</p>
              <p className="text-[11px] text-amber-700/80 dark:text-amber-400/80 mt-0.5">
                Tente buscar pelo nome da cidade ou país (ex: <em>Paris, Tóquio, Santiago, Roma ou Florianópolis</em>).
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Destinations Cards Horizontal list */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {filtered.map((dest) => (
          <div
            key={dest.id}
            onClick={() => setSelectedDest(dest)}
            className={`cursor-pointer rounded-2xl p-4 border transition flex flex-col justify-between ${
              selectedDest.id === dest.id
                ? 'border-teal-500 bg-teal-50/40 dark:bg-teal-950/20 ring-2 ring-teal-500/20 shadow-md'
                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
            }`}
          >
            <div>
              <div className="relative h-28 rounded-xl overflow-hidden mb-3">
                <img src={dest.imageUrl} alt={dest.name} className="w-full h-full object-cover" />
                <span className="absolute top-2 right-2 text-xs px-2 py-0.5 rounded-full bg-slate-900/80 text-white font-medium">
                  {dest.weather.icon} {dest.weather.temperature}°C
                </span>
              </div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                {dest.name}, {dest.country}
              </h3>
              <p className="text-xs text-slate-500 line-clamp-2 mt-1">{dest.description}</p>
            </div>
            {selectedDest.id === dest.id && (
              <span className="mt-3 text-xs font-bold text-teal-600 dark:text-teal-400 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Destino Selecionado
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Selected Destination Details & Generator Box */}
      {selectedDest && (
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
                Contexto Enriquecido para a IA
              </span>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {selectedDest.name}, {selectedDest.country}
              </h2>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60">
              <Sun className="w-5 h-5 text-amber-500 shrink-0" />
              <div className="text-xs">
                <span className="font-bold text-slate-900 dark:text-white">
                  {weatherContext?.summary?.hasAnyForecast
                    ? `${weatherContext.summary.avgTempMax}°C / ${weatherContext.summary.avgTempMin}°C • ${weatherContext.summary.dominantCondition}`
                    : `${selectedDest.weather.temperature}°C • ${selectedDest.weather.condition}`}
                </span>
                <p className="text-[11px] text-slate-400">
                  {weatherContext?.summary?.hasAnyForecast
                    ? 'Previsão meteorológica do período'
                    : 'Previsão meteorológica de referência'}
                </p>
              </div>
            </div>
          </div>

          {/* Dynamic Weather Forecast Badges / Unavailability Notices */}
          {isLoadingWeather ? (
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 flex items-center gap-2 text-xs text-slate-400 animate-pulse">
              <Loader2 className="w-4 h-4 animate-spin text-teal-600" />
              <span>Consultando serviço meteorológico...</span>
            </div>
          ) : weatherContext?.hasError ? (
            <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs text-slate-600 dark:text-slate-400 flex items-center gap-2 border border-slate-200 dark:border-slate-700">
              <CloudOff className="w-4 h-4 text-slate-400 shrink-0" />
              <span>Previsão meteorológica temporariamente indisponível. O itinerário será gerado normalmente com base nos seus interesses.</span>
            </div>
          ) : weatherContext && !weatherContext.summary.hasAnyForecast ? (
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Data futura (&gt; 16 dias): Previsão meteorológica detalhada disponível mais próximo da data da viagem. Nenhuma estimativa inventada.</span>
            </div>
          ) : weatherContext && weatherContext.daily.length > 0 ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span className="font-semibold uppercase tracking-wider text-[11px]">Previsão Diária ({weatherContext.daily.length} dias)</span>
                {weatherContext.summary.rainyDaysCount > 0 && (
                  <span className="text-sky-600 dark:text-sky-400 font-medium flex items-center gap-1">
                    <CloudRain className="w-3.5 h-3.5" /> Chuva prevista em {weatherContext.summary.rainyDaysCount} dia(s)
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {weatherContext.daily.map((day) => (
                  <div
                    key={day.date}
                    className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 flex items-center gap-2 text-xs"
                  >
                    <span className="font-mono text-slate-400 text-[11px]">
                      {day.date.slice(8, 10)}/{day.date.slice(5, 7)}
                    </span>
                    <span className="text-base">{day.icon}</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {day.tempMax !== null ? `${day.tempMax}°` : '-'} / {day.tempMin !== null ? `${day.tempMin}°` : '-'}
                    </span>
                    {day.rainProbability !== null && (
                      <span className="text-[10px] text-sky-600 dark:text-sky-400 font-medium">
                        {day.rainProbability}% 💧
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {/* Real-World Points of Interest (Grounding para IA) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Pontos de Interesse Mapeados (Grounding da IA)
              </h4>
              <span className="text-[11px] text-teal-600 dark:text-teal-400 font-semibold">
                {destinationPois.length > 0 ? `${destinationPois.length} locais confirmados` : 'Base factual'}
              </span>
            </div>

            {isLoadingPois ? (
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 flex items-center gap-2 text-xs text-slate-400 animate-pulse">
                <Loader2 className="w-4 h-4 animate-spin text-teal-600" />
                <span>Mapeando pontos de interesse reais no destino...</span>
              </div>
            ) : destinationPois.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {destinationPois.map((poi) => (
                  <div
                    key={poi.id}
                    className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 flex items-start justify-between gap-2"
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{poi.name}</span>
                        {poi.rating && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 font-semibold">
                            ⭐ {poi.rating}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{poi.address}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 uppercase">
                        {poi.category}
                      </span>
                      {typeof poi.distanceMeters === 'number' && (
                        <p className="text-[10px] text-slate-400 mt-1 font-mono">
                          {(poi.distanceMeters / 1000).toFixed(1)} km
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {selectedDest.highlights.map((h) => (
                  <span
                    key={h}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300"
                  >
                    📍 {h}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Dates Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Data de Início da Viagem
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Data de Término (Máx 7 dias MVP)
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50"
              />
            </div>
          </div>

          {/* Generator Button */}
          <div className="pt-2">
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-teal-600 via-teal-500 to-emerald-500 hover:opacity-95 text-white font-bold text-base shadow-lg shadow-teal-600/30 flex items-center justify-center gap-3 transition"
            >
              {isGenerating ? (
                <div className="flex items-center gap-3">
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>
                    {generationStep === 1 && '1/3 - Coletando previsão meteorológica e coordenadas...'}
                    {generationStep === 2 && '2/3 - Mapeando pontos de interesse e atrações...'}
                    {generationStep === 3 && '3/3 - Google Gemini estruturando o itinerário diário...'}
                  </span>
                </div>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Gerar Roteiro Inteligente com Gemini
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
