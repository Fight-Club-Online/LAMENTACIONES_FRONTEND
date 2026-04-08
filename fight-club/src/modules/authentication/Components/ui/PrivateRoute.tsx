import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';

export const PrivateRoute = ({ children }: { children: ReactNode }) => {
  const isAuthenticated = !!localStorage.getItem('user_data');
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};