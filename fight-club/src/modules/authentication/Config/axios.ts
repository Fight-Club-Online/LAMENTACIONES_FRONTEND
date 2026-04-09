import axios from 'axios';

const authApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { 'Content-Type': 'application/json' },
});


authApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('fight_club_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});


authApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('fight_club_refresh');
        
        const response = await axios.post(`${authApi.defaults.baseURL}/auth/refresh`, {
          refreshToken: refreshToken
        });

        const { accessToken } = response.data;

        localStorage.setItem('fight_club_token', accessToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return authApi(originalRequest);
        
      } catch (refreshError) {
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default authApi;