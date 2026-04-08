import { useCallback, useEffect, useState, useRef } from "react"
import type { Room } from "../Types/RoomTypes"
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { lobbyApi } from "../Config/axiosLobby";

type props = {
    roomCode: string;
    userId: string;
    playerType: string;
};

export const useJoinWaitingRoomg = ({roomCode,userId,playerType}:props)=>{
    const [room,setRoom] = useState<Room | null>(null);
    const [connected,setConnected] = useState(false);
    const [error,setError] = useState<string | null>(null)
    const [roomDisbanded, setRoomDisbanded] = useState(false);
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
            onConnect: () =>{setConnected(true)
                    client.subscribe(`/room/${roomCode}`,(message)=>{
                        const roomState : Room = JSON.parse(message.body);
                        hasSeenRoomRef.current = true;
                        setRoom(roomState);
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

    },[userId,roomCode,playerType]);

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

    return { room, connected, error, leave, roomDisbanded };


}