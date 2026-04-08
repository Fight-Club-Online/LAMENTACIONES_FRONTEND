import { useCallback, useEffect, useState, useRef } from "react"
import { useNavigate } from "react-router-dom";
import type { Room } from "../Types/RoomTypes"
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { lobbyApi } from "../Config/axiosLobby";

type props = {
    roomCode: string;
    userId: string;
    playerType: string;
};

// Tipo para el mensaje de inicio de juego que viene del backend
type GameStartedMessage = {
    fightId: string;
    roomCode: string;
};

export const useJoinWaitingRoomg = ({roomCode,userId,playerType}:props)=>{
    const navigate = useNavigate();
    const [room,setRoom] = useState<Room | null>(null);
    const [connected,setConnected] = useState(false);
    const [error,setError] = useState<string | null>(null)
    const [roomDisbanded, setRoomDisbanded] = useState(false);
    const [isStartingGame, setIsStartingGame] = useState(false);
    const hasSeenRoomRef = useRef(false);
    const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const clientRef = useRef<Client | null>(null);
    const socketUrl = `${import.meta.env.VITE_API_LOBBY_URL}/lobbyFight`;

    useEffect(() => {
        hasSeenRoomRef.current = false;
        setRoomDisbanded(false);
    }, [roomCode]);

    const leave = useCallback(() => {
        if (clientRef.current) {
            clientRef.current.deactivate();
            setConnected(false);
        }
    }, []);


    useEffect(()=>{
  
        const client = new Client({
            webSocketFactory : ()=> new SockJS(socketUrl),
            onConnect: () =>{
                setConnected(true);
                
                // Suscribirse a actualizaciones de la room
                client.subscribe(`/room/${roomCode}`,(message)=>{
                    const roomState : Room = JSON.parse(message.body);
                    hasSeenRoomRef.current = true;
                    setRoom(roomState);
                });

                // Suscribirse al evento de inicio de juego - todos los participantes
                client.subscribe(`/room/${roomCode}/game-started`, (message) => {
                    const gameStarted: GameStartedMessage = JSON.parse(message.body);
                    // Navegar a la pelea - esto afecta a TODOS los suscriptores
                    navigate(`/fight/${gameStarted.fightId}`);
                });

                client.publish({
                    destination: "/game/join-room",
                    body: JSON.stringify({ roomCode, userId,playerType }),
                }); 
                    
            },
            onDisconnect: () => {setConnected(false)
            },     
            onStompError: (frame) => setError(frame.headers["message"]),    
        });

        client.activate();
        clientRef.current = client;

        return () => {
            client.deactivate();
        };

    },[userId,roomCode,playerType,navigate]);

    useEffect(() => {
        let cancelled = false;
        const stopPolling = () => {
            if (pollIntervalRef.current != null) {
                window.clearInterval(pollIntervalRef.current);
                pollIntervalRef.current = null;
            }
        };
        const tick = async () => {
            try {
                const fresh = await lobbyApi.getRoomState(roomCode);
                if (!cancelled) {
                    hasSeenRoomRef.current = true;
                    setRoom(fresh);
                }
            } catch {
                if (!cancelled && hasSeenRoomRef.current) {
                    stopPolling();
                    setRoomDisbanded(true);
                }
            }
        };
        void tick();
        pollIntervalRef.current = window.setInterval(tick, 2500);
        return () => {
            cancelled = true;
            stopPolling();
        };
    }, [roomCode]);

    /**
     * Inicia el juego - solo el host puede llamar esto
     * Hace la llamada HTTP al backend que:
     * 1. Crea el Fight
     * 2. Envía el mensaje game-started via WebSocket a todos los participantes
     */
    const startGame = useCallback(async () => {
        if (!room || room.hostId !== userId) {
            console.warn('Solo el host puede iniciar el juego');
            return { success: false, error: 'No eres el host' };
        }

        setIsStartingGame(true);
        try {
            // Llamada HTTP que inicia el juego
            // El backend debería enviar el mensaje a /room/{roomCode}/game-started
            const updatedRoom = await lobbyApi.startPrivateGame(roomCode);
            return { success: true, room: updatedRoom };
        } catch (err: any) {
            const errorMsg = err?.message || 'Error al iniciar el juego';
            setError(errorMsg);
            return { success: false, error: errorMsg };
        } finally {
            setIsStartingGame(false);
        }
    }, [room, userId, roomCode]);

    return { 
        room, 
        connected, 
        error, 
        leave, 
        roomDisbanded,
        startGame,
        isStartingGame,
        isHost: room?.hostId === userId
    };


}
