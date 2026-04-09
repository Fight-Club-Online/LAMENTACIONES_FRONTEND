import React, { useState } from 'react';
import { PrivateRoomPopUp } from '../../PrivateRoomPopUp/PrivateRoomPop';

export const JoinPrivateButton: React.FC  = ()=>{
    const  [isOpen, setIsOpen] = useState(false);
    
    
    return(
        <>
         <button onClick={()=>{setIsOpen(true)}} className="group relative flex items-center justify-between p-6 bg-surface-container-high hover:bg-surface-container-highest transition-all duration-200 active:scale-[0.98] border-l-0 hover:border-l-[6px] border-primary-container shadow-xl overflow-hidden rounded-[18px]" >
            <div className="flex flex-col items-start z-10">
                <span className="font-headline text-xl font-bold uppercase tracking-tight text-on-surface">Entrar sala</span>
                <span className="text-[10px] text-stone-500 font-body mt-1 uppercase tracking-widest">Entra a una sala privada con su codigo</span>
            </div>
            <span className="material-symbols-outlined text-stone-700 group-hover:text-primary-container text-4xl transition-colors" data-icon="key">key</span>
            <div className="absolute inset-0 bg-primary-container/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
        </button>

        {
           isOpen &&  <PrivateRoomPopUp onClose={() =>setIsOpen(false)}/>
        }
        
        </>
       

        
    );
}