import React from "react";
import { useNavigate } from "react-router-dom";


type prop = {
    fullRoom : boolean,
    roomCode : string
}


export const JoinButtonPanelSection :React.FC<prop> = ({fullRoom,roomCode}) =>{
    const navigate = useNavigate();

    const Aviable = fullRoom ?  "Lleno" : "!!!"
    const Cursor_Block = fullRoom ?   "not-allowed" :"pointer";
    const playerType = "PLAYER"

    const JoinWaiting = ()=>{
        navigate(`/waiting-room?roomCode=${roomCode}&playerType=${playerType}`); 
    }


    return(
        <button onClick={JoinWaiting} className={`
            col-span-2 
            group 
            relative 
            overflow-hidden 
            bg-primary-container 
            h-14 
            flex 
            items-center 
            justify-center 
            transition-all 
            active:scale-[0.98] 
            cursor-${Cursor_Block} 
            w-full 
            kinetic-gradient-fuego 
            py-2 md:py-3 
            font-headline font-bold 
            text-on-primary 
            tracking-[0.15em] md:tracking-[0.2rem] 
            uppercase text-xs md:text-sm 
            shadow-[0_10px_30px_rgba(255,86,38,0.3)] 
            rounded-[14px] md:rounded-[18px]
          `}>
            <span className="relative z-10 font-label font-black text-on-primary-container text-sm tracking-[0.2em] uppercase">Unirse {Aviable}</span>
        </button>
    );
}