import React, { useState, type RefObject } from "react";
import { useRequestRoomState } from "../../Hooks/useRequestRoomState";
import type { Room } from "../../Types/RoomTypes";
import { error } from "three";

type props = {
    findMatch? : boolean;
    setBottomPanel: (boolean:boolean) =>void;
    formRef : RefObject<HTMLFormElement | null>;
    setRoom : (room : Room | null) => void;
}

export const InputSectionPopUp :React.FC<props> = ({findMatch, setBottomPanel,formRef,setRoom}) =>{
    const [roomCode, setRoomCode] = useState("");
    const  {room, error} = useRequestRoomState({code:roomCode})
    const MATCH_FOUND_EMOJI =   findMatch === undefined ? "search" : (!error ? "verified" : "cancel");
    const MATCH_FOUND_MESSAGE =  findMatch === undefined ? "Buscar" : (!error ? "Encontrada" : "No existe");

    const asignarRoom =  (room:Room | null)=>{
        setRoom(room);
    }

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
       e.preventDefault();
       if (room) {           
        setBottomPanel(true);
        asignarRoom(room);
    } else {
        setBottomPanel(false); 
    }
    
    };

    return(
        <div className="space-y-4 ">
            <label className="font-label text-xs font-bold tracking-[0.15em] text-on-surface-variant uppercase ">Ingresa el codigo de la sala</label>
            <div className="relative group rounded-r-[14px] md:rounded-r-[18px]">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary group-focus-within:w-2 transition-all "></div>
                <form ref={formRef} onSubmit={handleSubmit}>
                    <input value={roomCode}  onChange={(e) => setRoomCode(e.target.value)} className="w-full bg-surface-container-highest border-none text-on-surface font-label text-xl tracking-widest px-6 py-5 focus:ring-0 focus:outline-none placeholder:text-surface-container-highest/10 placeholder:opacity-30 rounded-r-[14px] md:rounded-r-[18px]" placeholder="XJ9-KINETIC-00" type="text"/>
                </form>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary" data-weight="fill">{MATCH_FOUND_EMOJI}</span>
                    <span className="font-label text-xs text-primary font-bold">{MATCH_FOUND_MESSAGE}</span>
                </div>
            </div>
        </div>
    );
}