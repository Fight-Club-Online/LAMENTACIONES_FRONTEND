const supervisionApi = (path: string, options: RequestInit = {}) => {
    const token = localStorage.getItem('fight_club_token');
    const base = import.meta.env.VITE_API_SUPERVISION_URL;
    return fetch(`${base}api/v1/admin/supervision${path}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            ...options.headers,
        },
    });
};

export default supervisionApi;