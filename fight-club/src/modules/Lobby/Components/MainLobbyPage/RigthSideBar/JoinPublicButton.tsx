import React from 'react';

export const JoinPublicButton: React.FC  = ()=>{
    return(
        <button className="group relative flex items-center justify-between p-6 bg-surface-container-high hover:bg-surface-container-highest transition-all duration-200 active:scale-[0.98] border-l-0 hover:border-l-[6px] border-secondary-container shadow-xl overflow-hidden rounded-[18px]">
            <div className="flex flex-col items-start z-1">
                <span className="font-headline text-xl font-bold uppercase tracking-tight text-on-surface ">Sala publica</span>
                <span className="text-[10px] text-stone-500 font-body mt-1 uppercase tracking-widest">Entra a una sala publica</span>
            </div>               
            <span className="material-symbols-outlined text-stone-700 group-hover:text-secondary text-4xl transition-colors" data-icon="planet">planet</span>
                                                       
        </button>
    );
}