import { useEffect, useState, useRef, useCallback } from 'react';
import SockJS from 'sockjs-client';
import * as StompPkg from '@stomp/stompjs';
import { io, Socket } from 'socket.io-client';

import { fightApi } from '../Config/fightApi';
import type { 
    Fight, 
    HelpButton, 
    FighterAction 
} from '../types/fight';

// Variables de Entorno
const API_URL = import.meta.env.VITE_API_FIGHT_URL || 
    'https://fightclubservice-b4bye5fxhec7hzhn.mexicocentral-01.azurewebsites.net';

const VOICE_CHAT_URL = import.meta.env.VITE_API_VOICE_CHAT_URL || 
    'https://lamentaciones-voice-chat-a7czbaa5h3drb6gv.canadacentral-01.azurewebsites.net';

// Configuración de Endpoints
const WS_ENDPOINT = API_URL.includes('localhost') 
    ? `${API_URL}/fightService` 
    : `${API_URL.replace('http://', 'https://')}/fightService`;

const FIGHT_INITIAL_FETCH_DELAY_MS = (() => {
    const raw = import.meta.env.VITE_FIGHT_INITIAL_FETCH_DELAY_MS;
    if (raw === undefined || raw === '') return 800;
    const n = Number(raw);
    return Number.isFinite(n) && n >= 0 ? n : 800;
})();

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export interface FightWebsocketState {
    gameState: Fight | null;
    isConnected: boolean;
    isLoading: boolean;
    error: string | null;
    // Voice Chat State
    isVoiceConnected: boolean;
    isMuted: boolean;
    toggleMute: () => void;
    // Actions
    sendAction: (action: FighterAction) => void;
    selectCharacter: (characterId: number) => void;
    startFight: () => Promise<void>;
    askForHelp: () => void;
    claimHelp: () => void;
    takeBack: () => void;
}

export const useFightWebsocket = (fightId: string, userId: string): FightWebsocketState => {
    const [gameState, setGameState] = useState<Fight | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    // Estados del Voice Chat
    const [isVoiceConnected, setIsVoiceConnected] = useState(false);
    const [isMuted, setIsMuted] = useState(true);
    
    const stompClient = useRef<any>(null);
    const voiceSocketRef = useRef<Socket | null>(null);
    const lastActionRef = useRef<{ action: FighterAction; time: number } | null>(null);
    const ACTION_THROTTLE_MS = 50;

    // 1. Carga inicial del estado de la pelea
    useEffect(() => {
        let cancelled = false;
        const loadInitialState = async () => {
            if (!fightId) return;
            try {
                setIsLoading(true);
                await delay(FIGHT_INITIAL_FETCH_DELAY_MS);
                if (cancelled) return;
                const fight = await fightApi.getFight(fightId);
                if (cancelled) return;
                setGameState(fight);
                setError(null);
            } catch (err) {
                if (cancelled) return;
                setError(err instanceof Error ? err.message : 'Error al cargar la pelea');
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        };
        void loadInitialState();
        return () => { cancelled = true; };
    }, [fightId]);

    // 2. Conexión WebSocket Principal (STOMP) para el combate
    useEffect(() => {
        if (!fightId) return;
        const StompClient = (StompPkg as any).Client || (StompPkg as any).default?.Client;

        if (!StompClient) {
            setError("Error crítico: No se pudo instanciar el cliente de mensajería.");
            return;
        }

        const client = new StompClient({
            webSocketFactory: () => new SockJS(WS_ENDPOINT, null, {
                transports: ['websocket', 'xhr-streaming', 'xhr-polling']
            }),
            reconnectDelay: 5000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,
            onConnect: () => {
                console.log('🥊 Conectado al sistema de combate');
                setIsConnected(true);
                setError(null);
        
                client.subscribe(`/topic/fight.${fightId}`, (message: any) => {
                    try {
                        const payload = JSON.parse(message.body);
                        // Discriminación de mensajes según tus interfaces
                        if ("player1" in payload && "player2" in payload) {
                            setGameState(payload as Fight);
                        } 
                        else if ("buttonId" in payload || ("status" in payload && !("player1" in payload))) {
                            setGameState(prev => prev ? { ...prev, helpButton: payload as HelpButton } : null);
                        }
                    } catch (e) {
                        console.error('Error parseando socket data:', e);
                    }
                });
            },
            onDisconnect: () => setIsConnected(false),
            onStompError: (frame: any) => {
                setError(frame.headers?.['message'] || 'Error de protocolo STOMP');
            }
        });

        client.activate();
        stompClient.current = client;

        return () => {
            if (stompClient.current) stompClient.current.deactivate();
        };
    }, [fightId]);

    // 3. Lógica de Voice Chat (Socket.io a Azure)
    useEffect(() => {
        // CORRECCIÓN: Usamos 'active' según tu interfaz Fight
        if (gameState?.active && !voiceSocketRef.current) {
            console.log('🎙️ Activando Voice Chat en Azure...');
            
            const socket = io(VOICE_CHAT_URL, {
                transports: ['websocket'],
                query: { fightId, userId }
            });

            socket.on('connect', () => {
                setIsVoiceConnected(true);
                console.log('🎤 Voice Chat: Conexión establecida');
                socket.emit('join-voice-room', { fightId, userId });
            });

            socket.on('disconnect', () => {
                setIsVoiceConnected(false);
            });

            socket.on('moderator-mute', (data: { reason: string }) => {
                console.warn('🔇 Silenciado:', data.reason);
                setIsMuted(true);
            });

            voiceSocketRef.current = socket;
        }

        return () => {
            if (voiceSocketRef.current) {
                voiceSocketRef.current.disconnect();
                voiceSocketRef.current = null;
            }
        };
    }, [gameState?.active, fightId, userId]);

    // --- Handlers y Callbacks ---

    const toggleMute = useCallback(() => {
        if (!voiceSocketRef.current) return;
        const newMuteState = !isMuted;
        setIsMuted(newMuteState);
        voiceSocketRef.current.emit('toggle-mute', { muted: newMuteState });
    }, [isMuted]);

    const sendAction = useCallback((action: FighterAction) => {
        if (!stompClient.current?.connected) return;

        const now = Date.now();
        if (action !== 'IDLE') {
            if (lastActionRef.current?.action === action && now - lastActionRef.current.time < ACTION_THROTTLE_MS) {
                return;
            }
        }
        
        lastActionRef.current = { action, time: now };

        stompClient.current.publish({
            destination: `/fightService/fight/${fightId}/input`,
            body: JSON.stringify({ userId, action })
        });
    }, [fightId, userId]);

    const selectCharacter = useCallback((characterId: number) => {
        if (!stompClient.current?.connected) return;
        stompClient.current.publish({
            destination: `/fightService/fight/${fightId}/selectCharacter`,
            body: JSON.stringify({ userId, characterId })
        });
    }, [fightId, userId]);

    const askForHelp = useCallback(() => {
        if (stompClient.current?.connected) {
            stompClient.current.publish({
                destination: `/fightService/fight/${fightId}/help`,
                body: userId 
            });
        }
    }, [fightId, userId]);

    const claimHelp = useCallback(() => {
        if (stompClient.current?.connected) {
            stompClient.current.publish({
                destination: `/fightService/fight/${fightId}/claim`,
                body: userId
            });
        }
    }, [fightId, userId]);

    const takeBack = useCallback(() => {
        if (stompClient.current?.connected) {
            stompClient.current.publish({
                destination: `/fightService/fight/${fightId}/takeBack`,
                body: userId
            });
        }
    }, [fightId, userId]);

    const startFight = useCallback(async () => {
        try {
            setIsLoading(true);
            const updatedFight = await fightApi.startFight(fightId);
            setGameState(updatedFight);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al iniciar');
        } finally {
            setIsLoading(false);
        }
    }, [fightId]);

    return { 
        gameState, isConnected, isLoading, error,
        isVoiceConnected, isMuted, toggleMute,
        sendAction, selectCharacter, startFight, 
        askForHelp, claimHelp, takeBack
    };
};