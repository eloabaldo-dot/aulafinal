import React, { useState } from 'react';
import { RoutePath, Trip, ItineraryActivity } from '../../types/mvp';
import { ArrowLeft, Calendar, Sun, Clock, Trash2, Edit2, Plus, Check, Save } from 'lucide-react';

interface TripDetailViewProps {
  trip: Trip;
  onNavigate: (route: RoutePath) => void;
  onUpdateTrip: (updated: Trip) => void;
  onShowToast: (msg: string) => void;
}

export const TripDetailView: React.FC<TripDetailViewProps> = ({
  trip,
  onNavigate,
  onUpdateTrip,
  onShowToast,
}) => {
  const [selectedDay, setSelectedDay] = useState(1);
  const [editingActivityId, setEditingActivityId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');

  // Safeguard: fallback if itinerary is empty
  const days = trip.itinerary.length > 0 ? trip.itinerary : [
    {
      dayNumber: 1,
      date: trip.startDate,
      theme: `Chegada e Boas-Vindas a ${trip.destination}`,
      activities: [
        {
          id: 'act_default_1',
          period: 'manha' as const,
          time: '10:00',
          title: `Check-in no Hotel e Caminhada Inicial por ${trip.destination}`,
          description: 'Acomodação inicial e reconhecimento da vizinhança local.',
          locationName: 'Centro da Cidade',
          estimatedCost: 'Gratuito',
          tips: 'Retire um mapa turístico ou use o aplicativo offline.',
        },
      ],
    },
  ];

  const currentDayData = days.find((d) => d.dayNumber === selectedDay) || days[0];

  const startEditActivity = (act: ItineraryActivity) => {
    setEditingActivityId(act.id);
    setEditTitle(act.title);
    setEditDescription(act.description);
  };

  const saveEditActivity = (actId: string) => {
    const updatedItinerary = days.map((day) => {
      if (day.dayNumber !== currentDayData.dayNumber) return day;
      return {
        ...day,
        activities: day.activities.map((act) => {
          if (act.id !== actId) return act;
          return {
            ...act,
            title: editTitle,
            description: editDescription,
          };
        }),
      };
    });

    onUpdateTrip({
      ...trip,
      itinerary: updatedItinerary,
    });
    setEditingActivityId(null);
    onShowToast('✏️ Atividade editada com sucesso!');
  };

  const deleteActivity = (actId: string) => {
    const updatedItinerary = days.map((day) => {
      if (day.dayNumber !== currentDayData.dayNumber) return day;
      return {
        ...day,
        activities: day.activities.filter((act) => act.id !== actId),
      };
    });

    onUpdateTrip({
      ...trip,
      itinerary: updatedItinerary,
    });
    onShowToast('Atividade removida do itinerário.');
  };

  const addManualActivity = (period: 'manha' | 'tarde' | 'noite') => {
    const newAct: ItineraryActivity = {
      id: `act_manual_${Date.now()}`,
      period,
      time: period === 'manha' ? '11:00' : period === 'tarde' ? '16:00' : '21:00',
      title: 'Nova Atividade Personalizada',
      description: 'Clique em editar para descrever este passeio ou restaurante.',
      locationName: trip.destination,
      estimatedCost: 'A definir',
      tips: 'Adicionada manualmente pelo viajante.',
    };

    const updatedItinerary = days.map((day) => {
      if (day.dayNumber !== currentDayData.dayNumber) return day;
      return {
        ...day,
        activities: [...day.activities, newAct],
      };
    });

    onUpdateTrip({
      ...trip,
      itinerary: updatedItinerary,
    });
    onShowToast('Nova atividade incluída no dia!');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 w-full space-y-6">
      {/* Top Navigation Back */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => onNavigate('/trips')}
          className="text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center gap-1.5 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar para Minhas Viagens
        </button>

        <button
          onClick={() => onShowToast('💾 Roteiro salvo com sucesso no seu perfil!')}
          className="px-5 py-2.5 rounded-2xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-md shadow-teal-600/30 flex items-center gap-2 transition"
        >
          <Save className="w-4 h-4" /> Salvar Roteiro no Perfil
        </button>
      </div>

      {/* Hero Header */}
      <div className="relative rounded-3xl overflow-hidden h-64 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <img src={trip.imageUrl} alt={trip.destination} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent flex flex-col justify-end p-6 text-white">
          <div className="flex items-center gap-2 text-xs font-semibold text-teal-300 mb-1">
            <Calendar className="w-4 h-4" />
            {trip.startDate} até {trip.endDate} • {trip.totalDays} Dias
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            {trip.destination}, {trip.country}
          </h1>
          <div className="flex items-center gap-2 text-xs text-slate-200 mt-2">
            <Sun className="w-4 h-4 text-amber-400" />
            {trip.weatherSummary.conditions} (Média {trip.weatherSummary.avgTempMax}°C)
          </div>
        </div>
      </div>

      {/* Day Selector Carousel */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200 dark:border-slate-800">
        {days.map((day) => (
          <button
            key={day.dayNumber}
            onClick={() => setSelectedDay(day.dayNumber)}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold shrink-0 transition flex flex-col items-center ${
              selectedDay === day.dayNumber
                ? 'bg-teal-600 text-white shadow-md shadow-teal-600/20'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
            }`}
          >
            <span>Dia {day.dayNumber}</span>
            <span className="text-[10px] font-normal opacity-80">{day.date}</span>
          </button>
        ))}
      </div>

      {/* Theme of the day */}
      <div className="p-4 rounded-2xl bg-teal-50/60 dark:bg-slate-900 border border-teal-100 dark:border-slate-800 flex items-center justify-between">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400">
            Foco do Dia {currentDayData.dayNumber}
          </span>
          <h3 className="font-bold text-sm text-slate-900 dark:text-white mt-0.5">
            {currentDayData.theme}
          </h3>
        </div>
      </div>

      {/* Timeline Periods: Manhã, Tarde, Noite */}
      {(['manha', 'tarde', 'noite'] as const).map((period) => {
        const periodActivities = currentDayData.activities.filter((a) => a.period === period);
        const periodTitle = period === 'manha' ? '🌅 Manhã' : period === 'tarde' ? '☀️ Tarde' : '🌙 Noite';

        return (
          <div key={period} className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                {periodTitle}
              </h3>
              <button
                onClick={() => addManualActivity(period)}
                className="text-xs font-bold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Adicionar Atividade
              </button>
            </div>

            {periodActivities.length === 0 ? (
              <p className="text-xs text-slate-400 italic p-3 bg-slate-50 dark:bg-slate-900 rounded-xl">
                Nenhuma atividade programada para este período.
              </p>
            ) : (
              <div className="space-y-3">
                {periodActivities.map((act) => (
                  <div
                    key={act.id}
                    className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-start justify-between gap-4"
                  >
                    {editingActivityId === act.id ? (
                      /* Inline Edit Mode */
                      <div className="flex-1 space-y-2">
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg border border-teal-500 bg-white dark:bg-slate-800 text-sm font-bold text-slate-900 dark:text-white"
                        />
                        <textarea
                          rows={2}
                          value={editDescription}
                          onChange={(e) => setEditDescription(e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-300"
                        />
                        <div className="flex gap-2 pt-1">
                          <button
                            onClick={() => saveEditActivity(act.id)}
                            className="px-3 py-1 rounded-lg bg-teal-600 text-white text-xs font-bold flex items-center gap-1"
                          >
                            <Check className="w-3.5 h-3.5" /> Salvar Edição
                          </button>
                          <button
                            onClick={() => setEditingActivityId(null)}
                            className="px-3 py-1 rounded-lg text-slate-500 text-xs font-semibold"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Read Mode */
                      <div className="flex-1 space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-teal-600 dark:text-teal-400 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" /> {act.time}
                          </span>
                          <span className="text-xs text-slate-400">• {act.locationName}</span>
                          {act.estimatedCost && (
                            <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">
                              {act.estimatedCost}
                            </span>
                          )}
                        </div>
                        <h4 className="text-base font-bold text-slate-900 dark:text-white">
                          {act.title}
                        </h4>
                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                          {act.description}
                        </p>
                        {act.tips && (
                          <p className="text-[11px] text-teal-700 dark:text-teal-300/90 bg-teal-50/50 dark:bg-teal-950/40 p-2 rounded-xl mt-1">
                            💡 <strong>Dica da IA:</strong> {act.tips}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Editorial Actions (Edit and Delete) */}
                    <div className="flex items-center gap-1 self-end sm:self-start">
                      <button
                        onClick={() => startEditActivity(act)}
                        aria-label={`Editar ${act.title}`}
                        className="p-2 rounded-xl text-slate-400 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-slate-800 transition"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteActivity(act.id)}
                        aria-label={`Excluir ${act.title}`}
                        className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
