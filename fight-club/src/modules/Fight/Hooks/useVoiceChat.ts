import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

const VOICE_CHAT_URL = import.meta.env.VITE_API_VOICE_CHAT_URL || 'https://lamentaciones-chat-voz-c8csfrfhgyb3d5hu.canadacentral-01.azurewebsites.net';

export const useVoiceChat = (fightId: string | null, userId: string | null, username: string | null, playerType: string = 'PLAYER') => {
    const socketRef = useRef<Socket | null>(null);
    const playerTypeRef = useRef(playerType);
    const usernameRef = useRef(username);

    useEffect(() => { playerTypeRef.current = playerType; }, [playerType]);
    useEffect(() => { usernameRef.current = username; }, [username]);

    useEffect(() => {
        if (!fightId || !userId) return;

        const token = localStorage.getItem('fight_club_token');
        const s = io(VOICE_CHAT_URL, {
            auth: { token: token || '' },
            transports: ['polling', 'websocket'],
            upgrade: true,
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        });
        
        s.on('connect', () => {
            console.log('[Voice] Conectado:', s.id);
            s.emit('join_fight', { fightId, userId, username: usernameRef.current || userId,  playerType: playerTypeRef.current });
        });

        s.on('connect_error', (err) => {
            console.warn('[Voice] Error de conexión:', err.message);
        });

        s.on('voice_access_denied', (data: { reason: string }) => {
            console.warn('[VOICE] Acceso denegado:', data.reason);
        });

        socketRef.current = s;

        return () => {
            s.disconnect();
            socketRef.current = null;
        };
    }, [fightId, userId]);

    return socketRef;
};