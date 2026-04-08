import { useEffect, useState, useRef, useCallback } from 'react';
import * as StompJs from '@stomp/stompjs'; 
import SockJS from 'sockjs-client';
import type { 
    Fight, 
    HelpButton, 
    FighterAction, 
    PlayerInputDto 
} from '../types/fight';

const API_URL = 'https://fightclubservice-b4bye5fxhec7hzhn.mexicocentral-01.azurewebsites.net';
const WS_ENDPOINT = `${API_URL}/fightService`; 

export const useFightWebsocket = (fightId: string, userId: string) => {
    const [gameState, setGameState] = useState<Fight | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    
    // Usamos any para evitar que TS bloquee la compilación por la librería
    const stompClient = useRef<any>(null);

    useEffect(() => {
        const socket = new SockJS(WS_ENDPOINT);
        
        // Intentamos obtener el constructor de Client de forma segura para Vite
        const StompClient = (StompJs as any).Client || (StompJs as any).CompatClient;
        
        if (!StompClient) {
            console.error("No se pudo cargar el cliente STOMP. Revisa la instalación.");
            return;
        }

        const client = new StompClient({
            webSocketFactory: () => socket,
            reconnectDelay: 5000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,
            onConnect: () => {
                console.log('⚔️ Conectado al Fight Club Broker');
                setIsConnected(true);
                
                client.subscribe(`/topic/fight.${fightId}`, (message: any) => {
                    const payload = JSON.parse(message.body);

                    if ("player1" in payload) {
                        setGameState(payload as Fight);
                    } else if ("status" in payload || "visible" in payload) {
                        setGameState(prev => {
                            if (!prev) return null;
                            return {
                                ...prev,
                                helpButton: payload as HelpButton
                            };
                        });
                    }
                });
            },
            onDisconnect: () => {
                setIsConnected(false);
                console.log('❌ Desconectado del ring');
            },
            onStompError: (frame: any) => {
                console.error('STOMP Error:', frame.headers?.['message']);
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

    const sendAction = useCallback((action: FighterAction) => {
        if (stompClient.current?.connected) {
            const payload: PlayerInputDto = { userId, action };
            stompClient.current.publish({
                destination: `/fightService/fight/${fightId}/input`,
                body: JSON.stringify(payload)
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

    const startFight = async () => {
        try {
            const response = await fetch(`${API_URL}/fight/start?fightId=${fightId}`, {
                method: 'PUT'
            });
            if (!response.ok) throw new Error('Error al iniciar');
        } catch (err) {
            console.error('Fallo al iniciar:', err);
        }
    };

    return { 
        gameState, 
        isConnected, 
        sendAction, 
        startFight, 
        askForHelp, 
        claimHelp 
    };
};