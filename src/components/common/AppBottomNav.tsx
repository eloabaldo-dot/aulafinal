import React from 'react';
import { RoutePath } from '../../types/mvp';
import { Home, Compass, Briefcase, Calendar, User } from 'lucide-react';

interface AppBottomNavProps {
  currentRoute: RoutePath;
  onNavigate: (route: RoutePath) => void;
}

export const AppBottomNav: React.FC<AppBottomNavProps> = ({ currentRoute, onNavigate }) => {
  const navItems = [
    { label: 'Início', route: '/dashboard' as RoutePath, icon: Home },
    { label: 'Explorar', route: '/explore' as RoutePath, icon: Compass },
    { label: 'Viagens', route: '/trips' as RoutePath, icon: Briefcase },
    { label: 'Folgas', route: '/availability' as RoutePath, icon: Calendar },
    { label: 'Perfil', route: '/profile' as RoutePath, icon: User },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-2 py-1.5 flex items-center justify-around">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive =
          currentRoute === item.route || (item.route === '/trips' && currentRoute === '/trips/[id]');

        return (
          <button
            key={item.route}
            onClick={() => onNavigate(item.route)}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition ${
              isActive
                ? 'text-teal-600 dark:text-teal-400 font-bold'
                : 'text-slate-500 dark:text-slate-400 font-medium hover:text-slate-900'
            }`}
          >
            <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
            <span className="text-[10px] tracking-tight">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
