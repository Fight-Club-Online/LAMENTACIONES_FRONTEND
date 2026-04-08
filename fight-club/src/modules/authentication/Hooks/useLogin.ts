import { useState } from 'react';
import { authService } from '../services/authService';

export const useLogin = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [profileRoute, setProfileRoute] = useState('/login');
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        
        if (!email || !password) {
            setError("TODOS LOS CAMPOS SON OBLIGATORIOS");
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const data = await authService.login({ email, password });
            
            if (data?.accessToken && data?.refreshToken) {
                // 1. Guardamos el token de acceso (vida corta)
                localStorage.setItem('fight_club_token', data.accessToken);
                localStorage.setItem('fight_club_userId', data.userId);
                // 2. Guardamos el token de refresco (vida larga)
                localStorage.setItem('fight_club_refresh', data.refreshToken);
                
                // 3. Guardamos info del usuario para la UI
                localStorage.setItem('user_data', JSON.stringify({
                    userId: data.userId,
                    username: data.username,
                    email: data.email,
                    role: data.role
                }));

                setProfileRoute(`/lobby`);
                setIsSuccess(true);
            } else {
                setError("RESPUESTA DEL SERVIDOR INCOMPLETA");
            }
        } catch (err: any) {
            const serverMessage = err.response?.data?.message || "ERROR DE CONEXIÓN AL CLUB";
            setError(serverMessage.toUpperCase());
        } finally {
            setIsLoading(false);
        }
    };

    return { 
        email, setEmail, 
        password, setPassword, 
        isLoading, isSuccess, 
        profileRoute,
        error, handleSubmit 
    };
};