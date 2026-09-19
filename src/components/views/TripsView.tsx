import React, { useState } from 'react';
import { RoutePath, Trip } from '../../types/mvp';
import { Plus, Trash2, Calendar, MapPin, Eye, AlertTriangle } from 'lucide-react';

interface TripsViewProps {
  trips: Trip[];
  onNavigate: (route: RoutePath) => void;
  onSelectTrip: (tripId: string) => void;
  onDeleteTrip: (tripId: string) => void;
  onShowToast: (msg: string) => void;
}

export const TripsView: React.FC<TripsViewProps> = ({
  trips,
  onNavigate,
  onSelectTrip,
  onDeleteTrip,
  onShowToast,
}) => {
  const [filter, setFilter] = useState<'todas' | 'confirmadas' | 'passadas'>('todas');
  const [tripToDelete, setTripToDelete] = useState<Trip | null>(null);

  const filtered = trips.filter((t) => {
    if (filter === 'confirmadas') return t.status === 'confirmada' || t.status === 'rascunho';
    if (filter === 'passadas') return t.status === 'concluida';
    return true;
  });

  const confirmDelete = () => {
    if (tripToDelete) {
      onDeleteTrip(tripToDelete.id);
      onShowToast(`Viagem para ${tripToDelete.destination} excluída com sucesso.`);
      setTripToDelete(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 w-full space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Minhas Viagens</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Gerencie seus itinerários planejados, revise rascunhos e consulte viagens realizadas.
          </p>
        </div>
        <button
          onClick={() => onNavigate('/explore')}
          className="px-5 py-2.5 rounded-2xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-sm shadow-md shadow-teal-600/20 flex items-center justify-center gap-2 transition"
        >
          <Plus className="w-4 h-4" /> Nova Viagem
        </button>
      </div>

      {/* Tabs Filter */}
      <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl w-fit">
        <button
          onClick={() => setFilter('todas')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
            filter === 'todas'
              ? 'bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-300 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          Todas ({trips.length})
        </button>
        <button
          onClick={() => setFilter('confirmadas')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
            filter === 'confirmadas'
              ? 'bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-300 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          Próximas & Rascunhos
        </button>
        <button
          onClick={() => setFilter('passadas')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
            filter === 'passadas'
              ? 'bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-300 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          Concluídas
        </button>
      </div>

      {/* Trips Grid */}
      {filtered.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
          <Calendar className="w-12 h-12 mx-auto text-slate-400 mb-3" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Nenhuma viagem encontrada neste filtro</h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1">
            Planeje sua próxima viagem agora mesmo explorando nossos destinos inteligentes.
          </p>
          <button
            onClick={() => onNavigate('/explore')}
            className="mt-4 px-5 py-2 rounded-xl bg-teal-600 text-white text-xs font-bold"
          >
            Explorar Destinos
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {filtered.map((trip) => (
            <div
              key={trip.id}
              className="rounded-3xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between hover:shadow-md transition"
            >
              <div>
                <div className="relative h-44">
                  <img src={trip.imageUrl} alt={trip.destination} className="w-full h-full object-cover" />
                  <span className="absolute top-3 left-3 text-[11px] px-2.5 py-1 rounded-full bg-slate-900/80 backdrop-blur-md text-white font-semibold capitalize">
                    {trip.status}
                  </span>
                  <button
                    onClick={() => setTripToDelete(trip)}
                    aria-label={`Excluir viagem para ${trip.destination}`}
                    className="absolute top-3 right-3 p-2 rounded-full bg-slate-900/80 hover:bg-rose-600 text-white transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="p-5 space-y-2">
                  <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                    {trip.destination}, {trip.country}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-teal-500" />
                    {trip.startDate} até {trip.endDate} ({trip.totalDays} dias)
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    {trip.weatherSummary.conditions}
                  </p>
                </div>
              </div>

              <div className="p-5 pt-0">
                <button
                  onClick={() => {
                    onSelectTrip(trip.id);
                    onNavigate('/trips/[id]');
                  }}
                  className="w-full py-2.5 rounded-xl border border-teal-500/30 hover:bg-teal-50 dark:hover:bg-teal-950/40 text-teal-700 dark:text-teal-300 text-xs font-bold flex items-center justify-center gap-1.5 transition"
                >
                  <Eye className="w-4 h-4" /> Ver & Editar Roteiro
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {tripToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-sm p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Excluir Viagem?</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              Tem certeza que deseja excluir permanentemente o roteiro para{' '}
              <strong>{tripToDelete.destination}</strong>? Esta ação não poderá ser desfeita.
            </p>

            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setTripToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-sm"
              >
                Confirmar Exclusão
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
