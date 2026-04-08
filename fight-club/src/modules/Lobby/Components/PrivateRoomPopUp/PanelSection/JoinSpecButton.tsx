import React from "react";
import { useNavigate } from "react-router-dom";

type prop = {
    fullRoom : boolean,
    roomCode : string
}


export const JoinSpecButton :React.FC<prop> = ({fullRoom,roomCode}) =>{
    const navigate = useNavigate();

    const Aviable = fullRoom ?  "Sala llena " : "Entrar Como Espectador"
    const playerType = "SPECTATOR"

    const JoinWaiting = ()=>{
        navigate(`/waiting-room?roomCode=${roomCode}&playerType=${playerType}`); 
    }
    return(
        <button onClick={JoinWaiting} disabled={fullRoom} className="bg-transparent border border-secondary text-secondary font-label font-bold text-xs tracking-[0.15em] uppercase h-14 hover:bg-secondary/10 transition-all flex items-center justify-center gap-2 group  active:scale-[0.98] rounded-[14px] md:rounded-[16px]">
            <span className="material-symbols-outlined group-hover:scale-110 transition-transform">visibility</span>
                {Aviable}
        </button>
    );
}