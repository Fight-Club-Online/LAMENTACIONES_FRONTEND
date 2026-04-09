import { useEffect, useState, useRef, useCallback } from 'react';
import * as StompJs from '@stomp/stompjs'; 
import SockJS from 'sockjs-client';
import { fightApi } from '../Config/fightApi';
import type { 
    Fight, 
    HelpButton, 
    FighterAction, 
    PlayerInputDto 
} from '../types/fight';

const API_URL = import.meta.env.VITE_API_FIGHT_URL || 
    'http://localhost:8080';
const WS_ENDPOINT = `${API_URL}/fightService`;

/** Da tiempo a que eventos (p. ej. Rabbit) propaguen la pelea tras iniciar desde lobby */
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
    
    // Usamos any para evitar que TS bloquee la compilación por la librería
    const stompClient = useRef<any>(null);
    
    // Ref para evitar enviar acciones repetidas muy rápido
    const lastActionRef = useRef<{ action: FighterAction; time: number } | null>(null);
    const ACTION_THROTTLE_MS = 50; // Mínimo 50ms entre acciones iguales

    // Cargar estado inicial de la pelea via HTTP
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
                const message = err instanceof Error ? err.message : 'Error al cargar la pelea';
                setError(message);
                console.error('Error cargando pelea inicial:', err);
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        };

        void loadInitialState();
        return () => {
            cancelled = true;
        };
    }, [fightId]);

    // Conectar WebSocket para actualizaciones en tiempo real
    useEffect(() => {
        if (!fightId) return;

        const socket = new SockJS(WS_ENDPOINT);
        
        // Intentamos obtener el constructor de Client de forma segura para Vite
        const StompClient = (StompJs as any).Client || (StompJs as any).CompatClient;
        
        if (!StompClient) {
            console.error("No se pudo cargar el cliente STOMP. Revisa la instalación.");
            setError("Error de conexión WebSocket");
            return;
        }

        const client = new StompClient({
            webSocketFactory: () => socket,
            reconnectDelay: 5000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,
            onConnect: () => {
                console.log('Conectado al Fight Club Broker');
                setIsConnected(true);
                setError(null);
                
                // Suscribirse al topic de la pelea
                client.subscribe(`/topic/fight.${fightId}`, (message: any) => {
                    try {
                        const payload = JSON.parse(message.body);

                        // Actualización completa del estado de la pelea (Fight)
                        // El backend envía Fight cuando: fightStateUpdate o changeFighters
                        if ("player1" in payload && "player2" in payload) {
                            setGameState(payload as Fight);
                        } 
                        // Actualización parcial del HelpButton
                        // El backend envía solo HelpButton cuando: updateHelpButton
                        // Detectamos por buttonId o status que son únicos del HelpButton
                        else if ("buttonId" in payload || ("status" in payload && !("player1" in payload))) {
                            setGameState(prev => {
                                if (!prev) return null;
                                return {
                                    ...prev,
                                    helpButton: payload as HelpButton
                                };
                            });
                        }
                    } catch (parseError) {
                        console.error('Error parseando mensaje WebSocket:', parseError);
                    }
                });
            },
            onDisconnect: () => {
                setIsConnected(false);
                console.log('Desconectado del ring');
            },
            onStompError: (frame: any) => {
                const errorMsg = frame.headers?.['message'] || 'Error STOMP desconocido';
                console.error('STOMP Error:', errorMsg);
                setError(errorMsg);
            }
        });

        client.activate();
        stompClient.current = client;

        return () => {
            if (stompClient.current) {
                stompClient.current.deactivate();
            }
        };
    }, [fightId]);

    // --- Funciones de Acción ---

    /**
     * Envía una acción del jugador al servidor via WebSocket.
     * Incluye throttling para evitar spam de acciones repetidas.
     */
    const sendAction = useCallback((action: FighterAction) => {
        if (!stompClient.current?.connected) {
            console.warn('WebSocket no conectado, no se puede enviar acción');
            return;
        }

        // Throttle: evitar enviar la misma acción muy rápido
        const now = Date.now();
        const lastAction = lastActionRef.current;
        
        if (lastAction && 
            lastAction.action === action && 
            now - lastAction.time < ACTION_THROTTLE_MS) {
            return; // Ignorar acción repetida muy rápida
        }

        lastActionRef.current = { action, time: now };

        const payload: PlayerInputDto = { userId, action };
        stompClient.current.publish({
            destination: `/fightService/fight/${fightId}/input`,
            body: JSON.stringify(payload)
        });
    }, [fightId, userId]);

    /**
     * Selecciona un personaje para el jugador actual
     * Se envía via WebSocket y el backend actualiza el Fighter correspondiente
     */
    const selectCharacter = useCallback((characterId: number) => {
        if (!stompClient.current?.connected) {
            console.warn('WebSocket no conectado, no se puede seleccionar personaje');
            return;
        }

        stompClient.current.publish({
            destination: `/fightService/fight/${fightId}/selectCharacter`,
            body: JSON.stringify({ userId: userId, characterId })
        });
    }, [fightId, userId]);

    /**
     * Pide ayuda durante la pelea (activa el HelpButton)
     */
    const askForHelp = useCallback(() => {
        if (stompClient.current?.connected) {
            stompClient.current.publish({
                destination: `/fightService/fight/${fightId}/help`,
                body: userId 
            });
        }
    }, [fightId, userId]);

    /**
     * Reclama el botón de ayuda como espectador
     */
    const claimHelp = useCallback(() => {
        if (stompClient.current?.connected) {
            stompClient.current.publish({
                destination: `/fightService/fight/${fightId}/claim`,
                body: userId
            });
        }
    }, [fightId, userId]);

    /**
     * Retoma el control después de que el helper ayudó (después de 10 segundos)
     */
    const takeBack = useCallback(() => {
        if (stompClient.current?.connected) {
            stompClient.current.publish({
                destination: `/fightService/fight/${fightId}/takeBack`,
                body: userId
            });
        }
    }, [fightId, userId]);

    /**
     * Inicia la pelea (cambia isActive a true)
     */
    const startFight = useCallback(async () => {
        try {
            setIsLoading(true);
            const updatedFight = await fightApi.startFight(fightId);
            setGameState(updatedFight);
            console.log('Pelea iniciada', updatedFight);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Error al iniciar pelea';
            setError(message);
            console.error('Fallo al iniciar:', err);
        } finally {
            setIsLoading(false);
        }
    }, [fightId]);

    return { 
        gameState, 
        isConnected,
        isLoading,
        error,
        sendAction,
        selectCharacter,
        startFight, 
        askForHelp, 
        claimHelp,
        takeBack
    };
};
