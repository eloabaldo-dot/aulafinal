import React from 'react';
import { RoutePath } from '../../types/mvp';
import { useAuth } from './AuthContext';

interface ProtectedRouteProps {
  currentRoute: RoutePath;
  children: React.ReactNode;
  fallbackRoute?: RoutePath;
  onRedirect: (route: RoutePath) => void;
}

const PRIVATE_ROUTES: RoutePath[] = [
  '/dashboard',
  '/profile',
  '/availability',
  '/explore',
  '/trips',
  '/trips/[id]',
];

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  currentRoute,
  children,
  fallbackRoute = '/login',
  onRedirect,
}) => {
  const { isAuthenticated, isLoading } = useAuth();

  const isPrivate = PRIVATE_ROUTES.includes(currentRoute);

  React.useEffect(() => {
    if (!isLoading && isPrivate && !isAuthenticated) {
      onRedirect(fallbackRoute);
    }
  }, [isPrivate, isAuthenticated, isLoading, fallbackRoute, onRedirect]);

  if (isPrivate && !isAuthenticated) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center p-8 text-center">
        <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mb-4" />
        <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
          Redirecionando para login...
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          Esta rota requer autenticação ativa no SmartTrip.
        </p>
      </div>
    );
  }

  return <>{children}</>;
};
