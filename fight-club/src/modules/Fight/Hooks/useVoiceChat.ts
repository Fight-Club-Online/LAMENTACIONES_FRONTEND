import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

const VOICE_CHAT_URL = import.meta.env.VITE_API_VOICE_CHAT_URL || 'http://localhost:3030';

export const useVoiceChat = (fightId: string | null, userId: string | null, username: string | null) => {
    const socketRef = useRef<Socket | null>(null);

    useEffect(() => {
        if (!fightId || !userId) return;

        const token = localStorage.getItem('fight_club_token');
        const s = io(VOICE_CHAT_URL, {
            auth: { token: token || '' },
            transports: ['websocket'],
        });

        s.on('connect', () => {
            s.emit('join_fight', { fightId, userId, username: username || userId });
        });

        s.on('voice_access_denied', (data: { reason: string }) => {
            console.warn('[VOICE] Acceso denegado:', data.reason);
        });

        socketRef.current = s;

        return () => {
            s.disconnect();
        };
    }, [fightId, userId, username]);

    return socketRef;
};