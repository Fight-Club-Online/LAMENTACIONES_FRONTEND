import { useEffect, useState, useRef, useCallback } from 'react';
import { Client } from "@stomp/stompjs";
import SockJS from 'sockjs-client';

import { fightApi } from '../Config/fightApi';
import type { 
    Fight, 
    HelpButton, 
    FighterAction, 
    PlayerInputDto, 
    FightSocketDTO
} from '../types/fight';

const API_URL = import.meta.env.VITE_API_FIGHT_URL || 
    'https://fightclubservice-b4bye5fxhec7hzhn.mexicocentral-01.azurewebsites.net';
const WS_ENDPOINT = `${API_URL}/fightService`;

const FIGHT_INITIAL_FETCH_DELAY_MS = (() => {
    const raw = import.meta.env.VITE_FIGHT_INITIAL_FETCH_DELAY_MS;
    if (raw === undefined || raw === '') return 0;
    const n = Number(raw);
    return Number.isFinite(n) && n >= 0 ? n : 0;
})();

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export interface FightWebsocketState {
    gameState: Fight | null;
    isConnected: boolean;
    isLoading: boolean;
    error: string | null;
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
    
    // Tipado correcto del cliente STOMP
    const stompClient = useRef<Client | null>(null);
    
    // Throttling optimizado para juegos (16ms = ~60fps)
    const lastActionRef = useRef<{ action: FighterAction; time: number } | null>(null);
    const ACTION_THROTTLE_MS = 16; 

    // --- Carga Inicial HTTP ---
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

    // --- WebSocket Lifecycle ---
    useEffect(() => {
        if (!fightId) return;

        const client = new Client({
            webSocketFactory: () => new SockJS(`${WS_ENDPOINT}?fightId=${fightId}`, null, {
                transports: ['websocket']
            }),
            reconnectDelay: 5000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,
            onConnect: () => {
                setIsConnected(true);
                setError(null);

                // para los movimientos
                client.subscribe(`/topic/fight.${fightId}`, (message) => {
                    try {
                        const payload: FightSocketDTO = JSON.parse(message.body);
                        console.log(payload)
                        setGameState(prev => prev ? {...prev,
                            player1: {...prev.player1, ...payload.player1},
                            player2:{...prev.player2,...payload.player2},
                            active: payload.active
                        } : null);
                    } catch (e) {
                        console.error('Error parseando Fight:', e);
                    }
                });

                //boton de ayuda 
                client.subscribe(`/topic/fight.${fightId}.helpButton`, (message) => {
                    try {
                        const payload: HelpButton = JSON.parse(message.body);
    
                        setGameState(prev => prev ? { ...prev, helpButton: payload } : null);
                    } catch (e) {
                        console.error('Error parseando HelpButton:', e);
                    }
                });

                //cambio de jugaor
                client.subscribe(`/topic/fight.${fightId}.fighters`, (message) => {
                    try {
                        const payload: Fight = JSON.parse(message.body);
                        setGameState(payload);
                    } catch (e) {
                        console.error('Error parseando fighters:', e);
                    }
                });


                //coso fig seleccionado
                client.subscribe(`/topic/fight.${fightId}.selected`, (message) => {
                    try {
                        const payload: Fight = JSON.parse(message.body);
                        setGameState(payload);
                    } catch (e) {
                        console.error('Error parseando selected:', e);
                    }
                });


            },
            onDisconnect: () => setIsConnected(false),
            onStompError: (frame) => {
                setError(frame.headers?.['message'] || 'Error STOMP');
                setIsConnected(false);
            }
        });

        client.activate();
        stompClient.current = client;

        return () => {
            if (stompClient.current) stompClient.current.deactivate();
        };
    }, [fightId]);

    // --- Lógica de Acciones con Throttling ---
    const sendAction = useCallback((action: FighterAction) => {
        if (!stompClient.current?.connected) return;

        const now = Date.now();
        const last = lastActionRef.current;
        
        // Solo bloqueamos si es exactamente la misma acción en menos de 16ms
        if (last && last.action === action && (now - last.time) < ACTION_THROTTLE_MS) {
            return;
        }

        lastActionRef.current = { action, time: now };
        const payload: PlayerInputDto = { userId, action };
        
        stompClient.current.publish({
            destination: `/fightService/fight/${fightId}/input`,
            body: JSON.stringify(payload)
        });
    }, [fightId, userId]);

    // --- Resto de funciones de control ---
    const selectCharacter = useCallback((characterId: number) => {
        if (stompClient.current?.connected) {
            const userData = JSON.parse(localStorage.getItem('user_data') || '{}');
            stompClient.current.publish({
                destination: `/fightService/fight/${fightId}/selectCharacter`,
                body: JSON.stringify({ userId, characterId: String(characterId), username: userData.username || userId })
            });
        }
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
        sendAction, selectCharacter, startFight, 
        askForHelp, claimHelp, takeBack
    };
};