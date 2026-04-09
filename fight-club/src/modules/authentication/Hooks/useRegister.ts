import { useState } from 'react';
import { authService } from '../services/authService';
import type { RegisterRequest } from '../types/auth.types';

export const useRegister = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [profileRoute, setProfileRoute] = useState('/login');
    const [error, setError] = useState<string | null>(null);

    const register = async (formData: RegisterRequest) => {
        setIsLoading(true);
        setError(null);

        try {
            const data = await authService.register(formData);
            
            if (data?.accessToken && data?.refreshToken) {
                // Guardamos ambos tokens inmediatamente
                localStorage.setItem('fight_club_token', data.accessToken);
                localStorage.setItem('fight_club_refresh', data.refreshToken);
                
                // Guardamos datos del nuevo guerrero
                localStorage.setItem('user_data', JSON.stringify({
                    userId: data.userId,
                    username: data.username,
                    email: data.email,
                    role: data.role
                }));
                setProfileRoute(`/lobby`);
                setIsSuccess(true);
            }
        } catch (err: any) {
            const serverMessage = err.response?.data?.message || "ERROR AL CREAR LUCHADOR";
            setError(serverMessage.toUpperCase());
        } finally {
            setIsLoading(false);
        }
    };

    return { register, isLoading, isSuccess, profileRoute, error, setError };
};