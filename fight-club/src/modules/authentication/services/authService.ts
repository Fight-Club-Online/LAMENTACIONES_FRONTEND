import authApi from '../Config/axios';
import type { AuthResponse, LoginRequest, RegisterRequest } from '../types/auth.types';

export const authService = {
    login: async (credentials: LoginRequest): Promise<AuthResponse> => {
        const { data } = await authApi.post<AuthResponse>('/api/v1/users/login', credentials);
        return data;
    },

    googleLogin: async (googleToken: string): Promise<AuthResponse> => {
        const { data } = await authApi.post<AuthResponse>('/auth/oauth/google', { 
            idToken: googleToken 
        });
        return data;
    },

    register: async (userData: RegisterRequest): Promise<AuthResponse> => {
        const { data } = await authApi.post<AuthResponse>('/api/v1/users/register', userData);
        return data;
    }
};