import { useState } from "react";
import { lobbyApi } from "../Config/axiosLobby";
import { getUserData } from "../Types/localUserData";
import { useNavigate } from "react-router-dom";


export const useCreationPublicRoom = () => {
    const navigate = useNavigate();
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const playerType = "PLAYER"

    const createPublicRoom = async () =>{
        const user = getUserData();
        if (!user) { setError("No hay usuario"); return; }
        setLoading(true);
        try {
            const res = await lobbyApi.createPublicRoom(user.userId);
            navigate(`/waiting-room?roomCode=${res.roomCode}`);
            navigate(`/waiting-room?roomCode=${res.roomCode}&playerType=${playerType}`); 

        } catch (error: any) {
            setError("Error: " + (error.message || error));
        } finally {
            setLoading(false);
        }
    }
    return { createPublicRoom, error, loading };
}