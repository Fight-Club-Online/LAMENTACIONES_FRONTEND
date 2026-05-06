import { useState, useRef } from 'react';
import { jwtDecode } from 'jwt-decode';
import { authService } from '../services/authService';

export const useLogin = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const profileRouteRef = useRef('/lobby');

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
                localStorage.setItem('fight_club_token', data.accessToken);
                localStorage.setItem('fight_club_userId', data.userId);
                localStorage.setItem('fight_club_refresh', data.refreshToken);

                // Decodificar el JWT para leer el rol real
                const decoded: any = jwtDecode(data.accessToken);
                console.log('🔍 JWT decoded:', decoded); // borra esto después

                const role = decoded.role 
                    || decoded.roles?.[0] 
                    || decoded.authorities?.[0]?.replace?.('ROLE_', '')
                    || 'USER';

                localStorage.setItem('user_data', JSON.stringify({
                    userId: data.userId,
                    username: data.username,
                    email: data.email,
                    role: role
                }));

                profileRouteRef.current = role === 'ADMIN' ? '/admin' : '/lobby';
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
        profileRoute: profileRouteRef.current,
        error, handleSubmit
    };
};