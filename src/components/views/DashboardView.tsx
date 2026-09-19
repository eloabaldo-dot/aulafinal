import React from 'react';
import { RoutePath, Trip, VacationPeriod, UserProfile } from '../../types/mvp';
import { Sparkles, Calendar, Compass, ArrowRight, Sun, MapPin, Clock } from 'lucide-react';

interface DashboardViewProps {
  onNavigate: (route: RoutePath) => void;
  user: UserProfile;
  trips: Trip[];
  vacations: VacationPeriod[];
  onSelectTrip: (tripId: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  user,
  trips,
  vacations,
  onSelectTrip,
}) => {
  const nextTrip = trips.find((t) => t.status === 'confirmada') || trips[0];
  const nextVacation = vacations[0];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 w-full space-y-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-teal-600 via-teal-500 to-emerald-500 text-white shadow-xl shadow-teal-700/10">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-teal-100 text-xs font-semibold uppercase tracking-wider mb-2">
              <Sparkles className="w-4 h-4" /> Bem-vinda ao seu painel
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Olá, {user.name.split(' ')[0]}! Para onde vamos agora?
            </h1>
            <p className="mt-2 text-teal-50 text-sm max-w-xl">
              Você tem <strong className="font-bold underline">{nextVacation ? nextVacation.title : 'folgas'}</strong> cadastradas no seu calendário. Que tal transformar esse tempo livre em um roteiro completo?
            </p>
          </div>
          <button
            onClick={() => onNavigate('/explore')}
            className="px-6 py-3.5 rounded-2xl bg-white text-teal-700 hover:bg-teal-50 font-bold text-sm shadow-md flex items-center justify-center gap-2 group shrink-0 transition"
          >
            <Compass className="w-4 h-4 text-teal-600" />
            Planejar Nova Viagem
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>

      {/* Grid: Next Trip and Next Vacation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Next Trip Card (Takes 2 columns) */}
        <div className="lg:col-span-2 rounded-3xl p-6 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
                Próxima Viagem Confirmada
              </span>
              <span className="text-xs px-2.5 py-1 rounded-full bg-teal-50 dark:bg-teal-950/80 text-teal-700 dark:text-teal-300 font-medium">
                Em 23 dias
              </span>
            </div>

            {nextTrip ? (
              <div className="flex flex-col sm:flex-row gap-5 items-start">
                <img
                  src={nextTrip.imageUrl}
                  alt={nextTrip.destination}
                  className="w-full sm:w-44 h-32 rounded-2xl object-cover"
                />
                <div className="flex-1 space-y-2">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                    {nextTrip.destination}, {nextTrip.country}
                  </h3>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-teal-500" />
                      {nextTrip.startDate} até {nextTrip.endDate} ({nextTrip.totalDays} dias)
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Sun className="w-4 h-4 text-amber-500" />
                      {nextTrip.weatherSummary.conditions}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                    {nextTrip.itinerary[0]?.theme || 'Roteiro inteligente pronto para revisão e exploração.'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-400 text-sm">
                Nenhuma viagem agendada no momento.
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Roteiro com controle editorial habilitado
            </span>
            <button
              onClick={() => {
                if (nextTrip) {
                  onSelectTrip(nextTrip.id);
                  onNavigate('/trips/[id]');
                }
              }}
              className="text-sm font-bold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1"
            >
              Abrir Roteiro Completo <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Vacation Status Card (Takes 1 column) */}
        <div className="rounded-3xl p-6 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Período de Folga Ativo
              </span>
              <Calendar className="w-4 h-4 text-teal-500" />
            </div>

            {nextVacation ? (
              <div className="space-y-3">
                <h4 className="text-lg font-bold text-slate-900 dark:text-white">{nextVacation.title}</h4>
                <div className="p-3.5 rounded-2xl bg-teal-50/60 dark:bg-slate-800/60 border border-teal-100/60 dark:border-slate-700/60">
                  <div className="text-xs font-semibold text-teal-700 dark:text-teal-400">
                    {nextVacation.startDate} até {nextVacation.endDate}
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-300 mt-1 font-medium">
                    {nextVacation.totalDays} dias livres disponíveis
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500">Cadastre suas folgas para planejar com facilidade.</p>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => onNavigate('/availability')}
              className="w-full py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 transition"
            >
              Gerenciar Meus Períodos
            </button>
          </div>
        </div>
      </div>

      {/* Recent Trips Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Meus Últimos Roteiros</h2>
          <button
            onClick={() => onNavigate('/trips')}
            className="text-xs font-bold text-teal-600 dark:text-teal-400 hover:underline"
          >
            Ver Todas ({trips.length}) &rarr;
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
          {trips.map((trip) => (
            <div
              key={trip.id}
              onClick={() => {
                onSelectTrip(trip.id);
                onNavigate('/trips/[id]');
              }}
              className="group cursor-pointer rounded-2xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:shadow-lg transition"
            >
              <div className="relative h-36">
                <img
                  src={trip.imageUrl}
                  alt={trip.destination}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <span className="absolute top-3 right-3 text-[11px] px-2.5 py-1 rounded-full bg-slate-900/80 backdrop-blur-md text-white font-semibold capitalize">
                  {trip.status}
                </span>
              </div>
              <div className="p-4">
                <h4 className="font-bold text-slate-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition">
                  {trip.destination}, {trip.country}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {trip.startDate} • {trip.totalDays} dias
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
