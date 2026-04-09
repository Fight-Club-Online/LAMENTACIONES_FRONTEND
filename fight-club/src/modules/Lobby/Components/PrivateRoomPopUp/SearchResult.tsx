import React from "react";

type props = {
    players : number;
    spectators : number;
    status : string;
}

export const SearchResultPopUp :React.FC<props> = ({players,spectators,status}) =>{
    return(
        <div className="bg-surface-container-low p-6 flex justify-between items-center">
            <div className="flex flex-col">
                <span className="font-label text-[10px] text-outline tracking-widest uppercase">Room Availability</span>
                <span className="font-display text-xl text-secondary tracking-tight uppercase"> {players}/2 Jugadores | {spectators} Espectadores</span>
            </div>
            <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-error shadow-[0_0_8px_#FF4444]"></div>
                <span className="font-label text-xs text-error font-bold uppercase tracking-widest">{status}</span>
            </div>
        </div>
    );
}