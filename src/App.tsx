import React, { useState, useEffect } from 'react';
import { RoutePath, UserProfile, VacationPeriod, DestinationContext, Trip, DayItinerary } from './types/mvp';
import { SmartTripItinerary } from './types/itinerary';
import {
  mockUserProfile,
  mockVacationPeriods,
  mockDestinations,
  mockTrips,
} from './data/mockData';

import { AuthProvider, ProtectedRoute, useAuth } from './modules/auth';

import { AppHeader } from './components/common/AppHeader';
import { AppBottomNav } from './components/common/AppBottomNav';

import { LandingView } from './components/views/LandingView';
import { LoginView } from './components/views/LoginView';
import { RegisterView } from './components/views/RegisterView';
import { DashboardView } from './components/views/DashboardView';
import { ProfileView } from './components/views/ProfileView';
import { AvailabilityView } from './components/views/AvailabilityView';
import { ExploreView } from './components/views/ExploreView';
import { TripsView } from './components/views/TripsView';
import { TripDetailView } from './components/views/TripDetailView';

function AppContent() {
  const { user: authUser, isAuthenticated, signOutUser, updateUserProfile } = useAuth();
  // Navigation State
  const [currentRoute, setCurrentRoute] = useState<RoutePath>('/');

  // Application Data States (Sincronizado dinamicamente com authUser)
  const [user, setUser] = useState<UserProfile>(() => {
    if (authUser) {
      return {
        uid: authUser.uid,
        name: authUser.displayName,
        email: authUser.email,
        bio: authUser.bio || 'Viajante explorador SmartTrip.',
        avatarUrl: authUser.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(authUser.displayName)}&backgroundColor=0d9488,14b8a6,059669`,
        preferences: authUser.preferences || {
          travelStyle: 'cultura',
          budgetLevel: 'moderado',
          pace: 'tranquilo',
          dietaryRestrictions: [],
        },
      };
    }
    return mockUserProfile;
  });

  // Atualiza os dados da interface sempre que o usuário ativo mudar
  useEffect(() => {
    if (authUser) {
      setUser({
        uid: authUser.uid,
        name: authUser.displayName,
        email: authUser.email,
        bio: authUser.bio || 'Viajante explorador SmartTrip.',
        avatarUrl: authUser.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(authUser.displayName)}&backgroundColor=0d9488,14b8a6,059669`,
        preferences: authUser.preferences || {
          travelStyle: 'cultura',
          budgetLevel: 'moderado',
          pace: 'tranquilo',
          dietaryRestrictions: [],
        },
      });
    } else {
      setUser(mockUserProfile);
    }
  }, [authUser]);

  const [vacations, setVacations] = useState<VacationPeriod[]>(mockVacationPeriods);
  const [destinations] = useState<DestinationContext[]>(mockDestinations);
  const [trips, setTrips] = useState<Trip[]>(mockTrips);
  const [selectedTripId, setSelectedTripId] = useState<string>(mockTrips[0].id);

  // Sincroniza mutações do perfil tanto no estado da UI quanto no AuthContext
  const handleUpdateUser = (updated: UserProfile) => {
    setUser(updated);
    if (authUser) {
      updateUserProfile({
        displayName: updated.name,
        bio: updated.bio,
        photoURL: updated.avatarUrl,
        preferences: updated.preferences,
      });
    }
  };

  // System Toast Notification State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Dark Mode State
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      const savedTheme = localStorage.getItem('smarttrip_theme');
      if (savedTheme) return savedTheme === 'dark';
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      if (isDarkMode) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('smarttrip_theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('smarttrip_theme', 'light');
      }
    } catch (e) {
      console.warn('Erro ao persistir tema', e);
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => {
      const next = !prev;
      showToast(next ? '🌙 Modo escuro ativado' : '☀️ Modo claro ativado');
      return next;
    });
  };

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage((prev) => (prev === message ? null : prev));
    }, 3200);
  };

  const handleNavigate = (route: RoutePath) => {
    setCurrentRoute(route);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddVacation = (newVacation: VacationPeriod) => {
    setVacations([newVacation, ...vacations]);
  };

  const handleDeleteVacation = (id: string) => {
    setVacations(vacations.filter((v) => v.id !== id));
  };

  const handleDeleteTrip = (tripId: string) => {
    setTrips(trips.filter((t) => t.id !== tripId));
  };

  const handleUpdateTrip = (updatedTrip: Trip) => {
    setTrips(trips.map((t) => (t.id === updatedTrip.id ? updatedTrip : t)));
  };

  const handleGenerateItinerary = (
    dest: DestinationContext,
    startDate: string,
    endDate: string,
    smartTripItinerary?: SmartTripItinerary
  ) => {
    const diffDays = Math.ceil(
      (new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)
    ) + 1;

    let mappedDays: DayItinerary[] = [
      {
        dayNumber: 1,
        date: startDate,
        theme: `Primeiras Impressões de ${dest.name}`,
        activities: [
          {
            id: `act_${Date.now()}_1`,
            period: 'manha' as const,
            time: '09:30',
            title: `Exploração matinal dos arredores de ${dest.name}`,
            description: 'Caminhada inicial com paradas em cafés e miradouros centrais.',
            locationName: dest.name,
            estimatedCost: 'Gratuito',
            tips: 'Excelente oportunidade para ambientação e fotos matinais.',
          },
          {
            id: `act_${Date.now()}_2`,
            period: 'tarde' as const,
            time: '14:00',
            title: `Visita aos destaques culturais: ${dest.highlights[0] || 'Centro Histórico'}`,
            description: 'Visita guiada e contemplação da arquitetura e patrimônio histórico.',
            locationName: dest.highlights[0] || dest.name,
            estimatedCost: '€15',
            tips: 'Ingresso antecipado recomendado pela curadoria da IA.',
          },
          {
            id: `act_${Date.now()}_3`,
            period: 'noite' as const,
            time: '20:00',
            title: 'Jantar típico e gastronomia regional',
            description: 'Restaurante acolhedor alinhado às preferências do seu perfil.',
            locationName: dest.name,
            estimatedCost: '€25 - €35',
            tips: 'Experimente a especialidade do chef.',
          },
        ],
      },
    ];

    if (smartTripItinerary && smartTripItinerary.days?.length > 0) {
      mappedDays = smartTripItinerary.days.map((day) => ({
        dayNumber: day.dayNumber,
        date: day.date,
        theme: day.theme || `Dia ${day.dayNumber} em ${dest.name}`,
        activities: day.activities.map((act, actIdx) => ({
          id: `act_${day.dayNumber}_${act.placeId || actIdx}`,
          placeId: act.placeId,
          period: act.period,
          time: act.timeSlot || (act.period === 'manha' ? '09:30' : act.period === 'tarde' ? '14:30' : '19:30'),
          title: act.name,
          description: act.rationale,
          locationName: act.name,
          estimatedCost: 'Sugerido por IA',
          tips: act.curatorTip || (day.alerts && day.alerts.length > 0 ? day.alerts.join(' • ') : undefined),
        })),
      }));
    }

    const newGeneratedTrip: Trip = {
      id: `trip_${Date.now()}`,
      destination: dest.name,
      country: dest.country,
      imageUrl: dest.imageUrl,
      startDate,
      endDate,
      totalDays: smartTripItinerary?.days?.length || diffDays,
      status: 'confirmada',
      weatherSummary: {
        avgTempMax: dest.weather.temperature,
        avgTempMin: dest.weather.temperature - 6,
        conditions: smartTripItinerary?.summary || `${dest.weather.condition}, ideal para passeios e caminhadas`,
      },
      itinerary: mappedDays,
    };

    setTrips([newGeneratedTrip, ...trips]);
    setSelectedTripId(newGeneratedTrip.id);
    showToast(`🎉 Roteiro inteligente para ${dest.name} gerado com sucesso!`);
    handleNavigate('/trips/[id]');
  };

  const currentTrip = trips.find((t) => t.id === selectedTripId) || trips[0];

  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'} flex flex-col transition-colors duration-300`}>
      {/* Top Application Header */}
      <AppHeader
        currentRoute={currentRoute}
        onNavigate={handleNavigate}
        isDarkMode={isDarkMode}
        onToggleDarkMode={toggleDarkMode}
        isAuthenticated={isAuthenticated}
        onLogout={async () => {
          await signOutUser();
          handleNavigate('/login');
          showToast('Sessão encerrada com sucesso.');
        }}
      />

      {/* Main Content Router for the 9 MVP screens with route protection */}
      <main className="flex-1 w-full pb-20 md:pb-10">
        <ProtectedRoute currentRoute={currentRoute} onRedirect={handleNavigate}>
          {currentRoute === '/' && <LandingView onNavigate={handleNavigate} />}

          {currentRoute === '/login' && <LoginView onNavigate={handleNavigate} />}

          {currentRoute === '/register' && <RegisterView onNavigate={handleNavigate} />}

          {currentRoute === '/dashboard' && (
            <DashboardView
              onNavigate={handleNavigate}
              user={user}
              trips={trips}
              vacations={vacations}
              onSelectTrip={(id) => setSelectedTripId(id)}
            />
          )}

          {currentRoute === '/profile' && (
            <ProfileView
              user={user}
              onUpdateUser={handleUpdateUser}
              onNavigate={handleNavigate}
              onLogout={async () => {
                await signOutUser();
                handleNavigate('/login');
              }}
              onShowToast={showToast}
            />
          )}

          {currentRoute === '/availability' && (
            <AvailabilityView
              vacations={vacations}
              onAddVacation={handleAddVacation}
              onUpdateVacation={(updated) => {
                setVacations(vacations.map((v) => (v.id === updated.id ? updated : v)));
              }}
              onDeleteVacation={handleDeleteVacation}
              onShowToast={showToast}
            />
          )}

          {currentRoute === '/explore' && (
            <ExploreView
              destinations={destinations}
              onSelectDestination={(dest) => showToast(`Destino ${dest.name} selecionado.`)}
              onGenerateItinerary={handleGenerateItinerary}
              onShowToast={showToast}
            />
          )}

          {currentRoute === '/trips' && (
            <TripsView
              trips={trips}
              onNavigate={handleNavigate}
              onSelectTrip={(id) => setSelectedTripId(id)}
              onDeleteTrip={handleDeleteTrip}
              onShowToast={showToast}
            />
          )}

          {currentRoute === '/trips/[id]' && currentTrip && (
            <TripDetailView
              trip={currentTrip}
              onNavigate={handleNavigate}
              onUpdateTrip={handleUpdateTrip}
              onShowToast={showToast}
            />
          )}
        </ProtectedRoute>
      </main>

      {/* Floating Bottom Nav for Mobile Screens */}
      {isAuthenticated && currentRoute !== '/' && currentRoute !== '/login' && currentRoute !== '/register' && (
        <AppBottomNav currentRoute={currentRoute} onNavigate={handleNavigate} />
      )}

      {/* Global Toast */}
      {toastMessage && (
        <div className="fixed bottom-20 md:bottom-6 right-4 left-4 md:left-auto md:w-auto z-50 p-4 rounded-2xl bg-slate-900/95 dark:bg-slate-100 text-white dark:text-slate-900 font-semibold text-xs shadow-2xl flex items-center gap-3 backdrop-blur-md transition-all animate-bounce">
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
