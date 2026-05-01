import { useEffect, useState } from "react"
import type { Room } from "../Types/RoomTypes"
import { lobbyApi } from "../Config/axiosLobby";


export const useGetPublicRooms = () =>{
    const [rooms,setRooms] = useState<Room[] | null>(null);
    const [error, setError] = useState<string | null>(null);

    const request = async ()=>{
        try{
            const res = await lobbyApi.getPublicRooms();
            console.log(res)
            setRooms(res);
        }catch(error: any){
            setError("Error: " + (error.message || error));
        }
    };
    useEffect(()=>{
       
        request();

    },[])

   
    return {rooms,error,refresh:request}

}