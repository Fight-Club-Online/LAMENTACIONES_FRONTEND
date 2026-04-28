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

// Estados de la room que indican que el juego ha comenzado
const GAME_STARTED_STATES = ['STARTED', 'IN_GAME', 'FIGHTING', 'IN_PROGRESS'];

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
                // Cuando roomState cambie a STARTED/IN_GAME, todos navegarán
                client.subscribe(`/room/${roomCode}`,(message)=>{
                    const updatedRoom: Room = JSON.parse(message.body);
                    hasSeenRoomRef.current = true;
                    setRoom(updatedRoom);
                    console.log('updatedRoom', updatedRoom);
                    // Si el estado indica que el juego comenzó, navegar a la pelea
                    if (GAME_STARTED_STATES.includes(updatedRoom.roomState?.toUpperCase())) {
                        navigate(`/fight/${updatedRoom.roomId}`, {
                            state: { playerType }
                        });
                    }
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
     * 2. Actualiza el roomState de la Room
     * 3. Envía la Room actualizada via WebSocket a /room/{roomCode}
     * 4. Todos los clientes detectan el cambio de roomState y navegan
     */
    const startGame = useCallback(async () => {
        if (!room || room.hostId !== userId) {
            console.warn('Solo el host puede iniciar el juego');
            return { success: false, error: 'No eres el host' };
        }

        setIsStartingGame(true);
        try {
            // Llamada HTTP que inicia el juego
            // El backend actualiza roomState y lo envía via WebSocket
            const updatedRoom = await lobbyApi.startPrivateGame(roomCode);
            // La navegación ocurre automáticamente cuando llega la actualización via WebSocket
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
