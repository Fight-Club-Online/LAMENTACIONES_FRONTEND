import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";

// AdminRoute.tsx
export const AdminRoute = ({ children }: { children: ReactNode }) => {
    const raw = localStorage.getItem('user_data');
    const user = raw ? JSON.parse(raw) : null;
    if (!user) return <Navigate to="/login" replace />;
    if (user.role !== 'ADMIN') return <Navigate to="/lobby" replace />;
    return <>{children}</>;
};