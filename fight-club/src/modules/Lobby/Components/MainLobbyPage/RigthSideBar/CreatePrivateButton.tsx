import React, { useEffect } from 'react';
import { useCreationPRoom } from '../../../Hooks/useCreationPrivateRoom';




export const CreatePrivateButton: React.FC  = ()=>{
    const { createRoom, error } = useCreationPRoom();
    
   
   
    return(
        <button onClick={createRoom} className="group relative flex items-center justify-between p-6 bg-surface-container-high hover:bg-surface-container-highest transition-all duration-200 active:scale-[0.98] border-l-0 hover:border-l-[6px] border-secondary shadow-xl overflow-hidden rounded-[18px]">
            <div className="flex flex-col items-start z-10">
                <span className="font-headline text-xl font-bold uppercase tracking-tight text-on-surface">Crear sala</span>
                <span className="text-[10px] text-stone-500 font-body mt-1 uppercase tracking-widest">Crea una sala privada</span>
            </div>
            <span className="material-symbols-outlined text-stone-700 group-hover:text-secondary text-4xl transition-colors" data-icon="lock_open">lock_open</span>
            <div className="absolute inset-0 bg-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
        </button>
    );
}