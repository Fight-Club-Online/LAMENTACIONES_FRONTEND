import authApi from '../Config/axios';
import type { UserProfile, UserStats } from '../types/dashboard.types';

export const DashboardService = {
    getDashboardData: async (userId: string) => {
        const [profRes, statsRes] = await Promise.allSettled([
            authApi.get<UserProfile>(`/user-profile/${userId}`),
            authApi.get<UserStats>(`/api/v1/stats/${userId}`)
        ]);

        return {
            profile: profRes.status === 'fulfilled' ? profRes.value.data : null,
            stats: statsRes.status === 'fulfilled' ? statsRes.value.data : null
        };
    },

    updateProfile: async (userId: string, newData: Partial<UserProfile>) => {
        await authApi.patch(`/user-profile/${userId}`, newData);
        const response = await authApi.get<UserProfile>(`/user-profile/${userId}`);
        return response.data; 
    }
};