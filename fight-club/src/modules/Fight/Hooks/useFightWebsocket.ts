import { useEffect, useState, useRef, useCallback } from 'react';
import SockJS from 'sockjs-client';
import * as StompPkg from '@stomp/stompjs';

import { fightApi } from '../Config/fightApi';
import type { 
    Fight, 
    HelpButton, 
    FighterAction, 
    PlayerInputDto 
} from '../types/fight';

const API_URL = import.meta.env.VITE_API_FIGHT_URL || 
    'https://fightclubservice-b4bye5fxhec7hzhn.mexicocentral-01.azurewebsites.net';

const WS_ENDPOINT = API_URL.includes('localhost') ? `${API_URL}/fightService` : `${API_URL.replace('http://', 'https://')}/fightService`;

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
    
    const stompClient = useRef<any>(null);
    const lastActionRef = useRef<{ action: FighterAction; time: number } | null>(null);
    const ACTION_THROTTLE_MS = 50;

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
                console.log('🥊 Conectado al ring de Azure');
                setIsConnected(true);
                setError(null);
        
                client.subscribe(`/topic/fight.${fightId}`, (message: any) => {
                    try {
                        const payload = JSON.parse(message.body);
                        if ("player1" in payload && "player2" in payload) {
                            // Es una actualización del Fight completo (game loop)
                            // Preservar el helpButton actual si el payload no trae uno válido
                            setGameState(prev => {
                                const newFight = payload as Fight;
                                // Si el payload trae helpButton con visible=true o status activo, usarlo
                                // Si no, preservar el helpButton previo
                                const shouldUseNewHelpButton = newFight.helpButton && 
                                    (newFight.helpButton.visible || newFight.helpButton.status !== 'INACTIVE');
                                
                                return {
                                    ...newFight,
                                    helpButton: shouldUseNewHelpButton ? newFight.helpButton : (prev?.helpButton || newFight.helpButton)
                                };
                            });
                        } 
                        else if ("buttonId" in payload || ("status" in payload && !("player1" in payload))) {
                            // Es una actualización específica del HelpButton
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
        console.log('[v0] askForHelp called - connected:', stompClient.current?.connected, 'fightId:', fightId, 'userId:', userId);
        if (stompClient.current?.connected) {
            const destination = `/fightService/fight/${fightId}/help`;
            console.log('[v0] Publishing to:', destination, 'body:', userId);
            stompClient.current.publish({
                destination,
                body: userId 
            });
            console.log('[v0] askForHelp message sent');
        } else {
            console.log('[v0] askForHelp - NOT connected!');
        }
    }, [fightId, userId]);

    const claimHelp = useCallback(() => {
        console.log('[v0] claimHelp called - connected:', stompClient.current?.connected, 'fightId:', fightId, 'userId:', userId);
        if (stompClient.current?.connected) {
            const destination = `/fightService/fight/${fightId}/claim`;
            console.log('[v0] Publishing to:', destination, 'body:', userId);
            stompClient.current.publish({
                destination,
                body: userId
            });
            console.log('[v0] claimHelp message sent');
        } else {
            console.log('[v0] claimHelp - NOT connected!');
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
