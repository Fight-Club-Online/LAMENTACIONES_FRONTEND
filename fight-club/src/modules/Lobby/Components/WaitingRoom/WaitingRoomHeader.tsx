import React from 'react';
import { SpectatorsInfo } from './SpectatorsInfo';
import { useNavigate } from 'react-router-dom';


type props = {
    spectatorsNumber : number;
    leave : () => void;
}

export const WaitingRoomHeader : React.FC<props> = ({spectatorsNumber,leave}) =>{
    const navigate = useNavigate();

    const abandonar = ()=>{
        leave();
        navigate("/lobby");
    }

    return(
        <header className="bg-[#16130f] flex justify-between items-center w-full px-6 h-16 fixed top-0 z-50">
            <div className="flex items-center gap-4">
                <button onClick={abandonar} className="text-[#ffb5a1] hover:bg-stone-900 transition-all active:scale-95 text-stone-400 hover:text-orange-500 p-2">
                    <span className="material-symbols-outlined">arrow_back</span>
                </button>
                
            </div>
            <h1 className="absolute left-1/2 -translate-x-1/2 font-['Space_Grotesk'] uppercase tracking-widest text-sm font-bold text-orange-500 border-b-2 border-orange-600 pb-1">
                Lobby Privado
            </h1>
            <SpectatorsInfo spectatorsNumber={spectatorsNumber}/>

        </header>
    );
}