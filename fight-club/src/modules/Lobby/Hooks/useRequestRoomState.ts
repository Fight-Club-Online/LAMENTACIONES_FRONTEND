import { useEffect, useState,useRef } from "react"
import type { Room } from "../Types/RoomTypes"
import { lobbyApi } from "../Config/axiosLobby";


type Props = {
    code: string
};

export const useRequestRoomState =({code}:Props)=>{
    const [room,setRoom] = useState<Room | null>(null);
    const [error, setError] = useState<string | null>(null);


    useEffect(()=>{
        const request = async ()=>{
            if(!code) return;

            try{
                const res = await lobbyApi.getRoomState(code)
                setRoom(res);
            }catch(error: any){
                setError("Error: " + (error.message || error));
            }
        }
        request();
    },[code])

    return {room,error}
}