import React, { useEffect, useState } from 'react';
import { getUserData } from '../../../Types/localUserData';

export const NotificationsButton: React.FC = () => {
    const [notifs, setNotifs] = useState<any[]>([]);
    const [open, setOpen] = useState(false);

    const userId = getUserData()?.userId;
    const base = import.meta.env.VITE_API_SUPERVISION_URL?.replace(/\/$/, '');

    // Carga el historial completo (leídas y no leídas)
    const fetchAll = async () => {
        if (!userId) return;
        try {
            const r = await fetch(`${base}/api/v1/supervision/notifications/${userId}/history`);
            if (r.ok) setNotifs(await r.json());
        } catch {}
    };

    const markAllAsRead = async () => {
        if (!userId) return;
        try {
            await fetch(`${base}/api/v1/supervision/notifications/${userId}/read`, {
                method: 'PATCH',
            });
            // Marcar todas como leídas localmente
            setNotifs(prev => prev.map(n => ({ ...n, read: true })));
        } catch {}
    };

    useEffect(() => {
        fetchAll();
        const interval = setInterval(fetchAll, 30000);
        return () => clearInterval(interval);
    }, [userId]);

    const unreadCount = notifs.filter(n => !n.read).length;

    const handleOpen = () => {
        const wasOpen = open;
        setOpen(prev => !prev);
        // Marca todas como leídas al CERRAR
        if (wasOpen && unreadCount > 0) markAllAsRead();
    };

    // Marca todas al hacer click en una notificación no leída
    const handleClickNotif = () => {
        if (unreadCount > 0) markAllAsRead();
    };

    return (
        <div className="relative">
            <button
                onClick={handleOpen}
                className="relative w-10 h-10 flex items-center justify-center hover:bg-stone-900 transition-all active:scale-95 text-stone-400 hover:text-orange-500 cursor-pointer"
            >
                <span className="material-symbols-outlined" data-icon="notifications">notifications</span>
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-orange-500 rounded-full text-[9px] font-black text-white flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {open && (
                <div className="absolute right-0 top-12 w-80 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden">
                    <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-widest text-white/40">
                            Notificaciones
                        </span>
                        <button
                            onClick={handleOpen}
                            className="text-white/20 hover:text-white transition-colors text-xs"
                        >
                            ✕
                        </button>
                    </div>

                    <div className="max-h-72 overflow-y-auto">
                        {notifs.length === 0 ? (
                            <div className="py-8 text-center text-white/20 text-[10px] uppercase tracking-widest font-black">
                                Sin notificaciones
                            </div>
                        ) : (
                            notifs.map((n: any) => (
                                <div
                                    key={n.id}
                                    onClick={handleClickNotif}
                                    className={`px-4 py-3 border-b border-white/5 transition-all cursor-pointer ${
                                        !n.read
                                            ? 'bg-orange-500/10 hover:bg-orange-500/20 border-l-2 border-l-orange-500'
                                            : 'hover:bg-white/5'
                                    }`}
                                >
                                    <p className={`text-xs ${!n.read ? 'text-white' : 'text-white/50'}`}>
                                        {n.message}
                                    </p>
                                    {n.createdAt && (
                                        <p className="text-[8px] text-white/20 uppercase tracking-widest mt-1">
                                            {new Date(n.createdAt).toLocaleString()}
                                        </p>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};